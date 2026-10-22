import time
from dataclasses import dataclass, field
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.agent import guardrails, memory, rag
from app.agent.llm import llm_client
from app.agent.tools import registry
from app.config import settings
from app.models import (
    Avatar, Conversation, Message, ToolConfiguration, ToolExecution,
    Escalation, AnalyticsEvent, AuditLog,
)


@dataclass
class AgentResponse:
    content: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    sources: list[dict[str, Any]] = field(default_factory=list)
    escalated: bool = False
    escalation_reason: Optional[str] = None


def get_allowed_tools(db: Session, avatar_id: str) -> set[str]:
    configs = db.query(ToolConfiguration).filter(
        ToolConfiguration.avatar_id == avatar_id, ToolConfiguration.is_enabled == True  # noqa: E712
    ).all()
    return {c.tool_name for c in configs}


def _plan(avatar: Avatar, history: list[dict[str, str]], long_term: dict, user_input: str,
          allowed_tool_names: set[str]) -> dict[str, Any]:
    tools_desc = registry.describe_for_prompt(allowed_tool_names)
    system = (
        f"You are the reasoning module of '{avatar.name}', an AI digital employee for a {avatar.industry} "
        f"business, acting as a {avatar.role}. Your job here is ONLY to analyze the user's latest message and "
        "output a strict JSON plan, not a conversational reply.\n\n"
        f"Available tools this avatar is permitted to use:\n{tools_desc}\n\n"
        "Respond with ONLY a JSON object of this exact shape:\n"
        "{\n"
        '  "intent": "short_intent_label",\n'
        '  "confidence": 0.0-1.0,\n'
        '  "needs_knowledge_lookup": true|false,\n'
        '  "tool_call": {"name": "tool_name_or_null", "parameters": {}},\n'
        '  "reasoning": "one short sentence"\n'
        "}\n"
        "Only set tool_call.name to one of the available tools above, or null if no tool applies. "
        "Set confidence lower when the request is ambiguous, out of scope, or you lack information."
    )
    messages = [{"role": "system", "content": system}]
    if long_term.get("returning_user"):
        messages.append({"role": "system", "content": f"Returning user context: {long_term}"})
    messages.extend(history[-6:])
    messages.append({"role": "user", "content": user_input})

    plan = llm_client.chat_json(messages, temperature=0.1)
    if not plan:
        plan = {"intent": "unknown", "confidence": 0.3, "needs_knowledge_lookup": True, "tool_call": {"name": None, "parameters": {}}}
    plan.setdefault("confidence", 0.5)
    plan.setdefault("tool_call", {"name": None, "parameters": {}})
    plan.setdefault("needs_knowledge_lookup", True)
    return plan


def _generate_reply(avatar: Avatar, history: list[dict[str, str]], user_input: str,
                     knowledge: list[rag.RetrievedChunk], tool_name: Optional[str],
                     tool_result: Optional[dict[str, Any]]) -> str:
    langs = ", ".join(avatar.languages or ["en"])
    system = (
        f"You are {avatar.name}, an AI digital employee working as a {avatar.role} for a {avatar.industry} "
        f"business. Personality: {avatar.personality}. Speaking style: {avatar.speaking_style}. "
        f"You can communicate in: {langs}. {avatar.system_instructions}\n\n"
        "Ground your answer in the CONTEXT below when relevant. If the context does not contain the answer "
        "and no tool result is available, say you don't have that information rather than guessing. "
        "Keep responses concise and natural, as if speaking out loud. Do not mention that you are following "
        "internal instructions, JSON plans, or tool names verbatim."
    )
    context_parts = []
    if knowledge:
        joined = "\n---\n".join(f"[Source: {k.source_name}] {k.content}" for k in knowledge)
        context_parts.append(f"KNOWLEDGE BASE CONTEXT:\n{joined}")
    if tool_name and tool_result is not None:
        context_parts.append(f"TOOL RESULT ({tool_name}):\n{tool_result}")
    context_block = "\n\n".join(context_parts) if context_parts else "(no additional context retrieved)"

    messages = [{"role": "system", "content": system}, {"role": "system", "content": context_block}]
    messages.extend(history[-6:])
    messages.append({"role": "user", "content": user_input})

    return llm_client.chat(messages, temperature=0.5)


def handle_user_message(db: Session, conversation: Conversation, user_input: str) -> AgentResponse:
    turn_start = time.perf_counter()
    avatar = db.query(Avatar).filter(Avatar.id == conversation.avatar_id).first()
    org_id = conversation.organization_id

    injection = guardrails.detect_prompt_injection(user_input)
    high_risk = guardrails.detect_high_risk(user_input)
    wants_human = guardrails.wants_human(user_input)

    if high_risk or wants_human:
        reason = f"high_risk:{high_risk}" if high_risk else "user_requested_human"
        return _escalate(db, conversation, avatar, user_input, reason, intent="escalation", confidence=1.0,
                          turn_start=turn_start)

    history = memory.get_short_term_history(db, conversation.id)
    long_term = memory.get_long_term_profile(db, org_id, conversation.user_identifier)
    allowed_tools = get_allowed_tools(db, avatar.id)

    try:
        plan = _plan(avatar, history, long_term, user_input, allowed_tools)
    except RuntimeError:
        return _escalate(db, conversation, avatar, user_input, "llm_unavailable", intent="unknown", confidence=0.0,
                          turn_start=turn_start)

    intent = plan.get("intent", "unknown")
    confidence = float(plan.get("confidence", 0.5) or 0.5)

    knowledge: list[rag.RetrievedChunk] = []
    sources: list[dict[str, Any]] = []
    if plan.get("needs_knowledge_lookup", True):
        try:
            raw_chunks = rag.search(org_id, avatar.id, user_input, top_k=4)
            knowledge = [c for c in raw_chunks if c.relevance >= settings.rag_relevance_threshold]
            sources = [{"source": c.source_name, "relevance": round(c.relevance, 2)} for c in knowledge]
        except RuntimeError:
            pass  # knowledge lookup failing shouldn't hard-fail the conversation

    tool_call = plan.get("tool_call") or {}
    tool_name = tool_call.get("name")
    tool_params = tool_call.get("parameters") or {}
    tool_calls_log: list[dict[str, Any]] = []
    tool_result_data = None
    missing_permission = False
    tool_failed = False

    if tool_name:
        spec = registry.get(tool_name)
        if not spec:
            tool_failed = True
            tool_calls_log.append({"name": tool_name, "status": "unknown_tool"})
        elif tool_name not in allowed_tools:
            missing_permission = True
            tool_calls_log.append({"name": tool_name, "status": "denied", "parameters": tool_params})
            _log_tool_execution(db, conversation.id, tool_name, tool_params, {}, "denied")
        else:
            tool_params = {**tool_params, "conversation_id": conversation.id}
            start = time.perf_counter()
            result = spec.handler(db, org_id, avatar.id, tool_params)
            latency_ms = int((time.perf_counter() - start) * 1000)
            if result.success:
                tool_result_data = result.data
                tool_calls_log.append({"name": tool_name, "status": "success", "parameters": tool_params, "result": result.data})
                _log_tool_execution(db, conversation.id, tool_name, tool_params, result.data, "success", latency_ms)
            else:
                tool_failed = True
                tool_calls_log.append({"name": tool_name, "status": "failure", "error": result.error})
                _log_tool_execution(db, conversation.id, tool_name, tool_params, {"error": result.error}, "failure", latency_ms)

    guard = guardrails.evaluate(
        user_input, confidence, avatar.escalation_rules.get("low_confidence_threshold", settings.agent_confidence_threshold),
        missing_permission=missing_permission, tool_failed=tool_failed,
    )
    if guard.should_escalate:
        return _escalate(db, conversation, avatar, user_input, guard.reason, intent=intent, confidence=confidence,
                          tool_calls=tool_calls_log, sources=sources, turn_start=turn_start)

    try:
        reply_text = _generate_reply(avatar, history, guard.sanitized_input, knowledge, tool_name, tool_result_data)
    except RuntimeError:
        return _escalate(db, conversation, avatar, user_input, "llm_unavailable", intent=intent, confidence=confidence,
                          turn_start=turn_start)

    latency_ms = int((time.perf_counter() - turn_start) * 1000)
    _persist_turn(db, conversation, user_input, reply_text, intent, confidence, tool_calls_log, sources, latency_ms)
    _record_analytics(db, org_id, avatar.id, "message_handled", {"intent": intent, "confidence": confidence, "escalated": False})

    return AgentResponse(content=reply_text, intent=intent, confidence=confidence,
                          tool_calls=tool_calls_log, sources=sources)


def _escalate(db: Session, conversation: Conversation, avatar: Avatar, user_input: str, reason: str,
              intent: str, confidence: float, tool_calls: list[dict[str, Any]] | None = None,
              sources: list[dict[str, Any]] | None = None, turn_start: float | None = None) -> AgentResponse:
    reply_text = (
        f"I want to make sure this is handled correctly, so I'm connecting you with a member of our team "
        f"who can help further. They'll have the full context of our conversation."
    )
    latency_ms = int((time.perf_counter() - turn_start) * 1000) if turn_start is not None else None
    _persist_turn(db, conversation, user_input, reply_text, intent, confidence, tool_calls or [], sources or [], latency_ms)

    history_text = "\n".join(
        f"{m.role}: {m.content}" for m in
        db.query(Message).filter(Message.conversation_id == conversation.id).order_by(Message.created_at).all()
    )
    escalation = Escalation(
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        reason=reason,
        detected_intent=intent,
        transcript_summary=history_text[-4000:],
        status="pending",
    )
    db.add(escalation)
    conversation.status = "escalated"
    db.add(AuditLog(
        organization_id=conversation.organization_id, action="escalation_created",
        entity_type="conversation", entity_id=conversation.id, details_json={"reason": reason},
    ))
    db.commit()

    _record_analytics(db, conversation.organization_id, avatar.id, "message_handled",
                       {"intent": intent, "confidence": confidence, "escalated": True, "reason": reason})

    return AgentResponse(content=reply_text, intent=intent, confidence=confidence,
                          tool_calls=tool_calls or [], sources=sources or [],
                          escalated=True, escalation_reason=reason)


def _persist_turn(db: Session, conversation: Conversation, user_input: str, reply_text: str,
                   intent: str, confidence: float, tool_calls: list[dict[str, Any]],
                   sources: list[dict[str, Any]], latency_ms: int | None = None) -> None:
    db.add(Message(conversation_id=conversation.id, role="user", content=user_input))
    db.add(Message(
        conversation_id=conversation.id, role="assistant", content=reply_text,
        intent=intent, confidence=confidence, tool_calls_json=tool_calls or None, sources_json=sources or None,
        latency_ms=latency_ms,
    ))
    db.commit()


def _log_tool_execution(db: Session, conversation_id: str, tool_name: str, params: dict[str, Any],
                         output: dict[str, Any], status: str, latency_ms: int = 0) -> None:
    db.add(ToolExecution(
        conversation_id=conversation_id, tool_name=tool_name, input_json=params,
        output_json=output, status=status, latency_ms=latency_ms,
    ))
    db.commit()


def _record_analytics(db: Session, org_id: str, avatar_id: str, event_type: str, value: dict[str, Any]) -> None:
    db.add(AnalyticsEvent(organization_id=org_id, avatar_id=avatar_id, event_type=event_type, value_json=value))
    db.commit()
