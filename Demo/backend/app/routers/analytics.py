from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Appointment, Conversation, Escalation, Lead, Message, ToolExecution, User,
)
from app.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def analytics_overview(avatar_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = user.organization_id

    conv_query = db.query(Conversation).filter(Conversation.organization_id == org_id)
    if avatar_id:
        conv_query = conv_query.filter(Conversation.avatar_id == avatar_id)
    conversations = conv_query.all()
    total_conversations = len(conversations)
    active_users = len({c.user_identifier for c in conversations})
    escalated = sum(1 for c in conversations if c.status == "escalated")
    ended = sum(1 for c in conversations if c.status in ("ended", "escalated"))
    resolution_rate = round(((ended - escalated) / ended) * 100, 1) if ended else 0.0
    escalation_rate = round((escalated / total_conversations) * 100, 1) if total_conversations else 0.0

    conv_ids = [c.id for c in conversations]
    avg_latency_ms = 0.0
    intents = Counter()
    if conv_ids:
        messages = db.query(Message).filter(Message.conversation_id.in_(conv_ids)).all()
        latencies = []
        for m in messages:
            if m.intent:
                intents[m.intent] += 1
            if m.role == "assistant" and m.latency_ms is not None:
                latencies.append(m.latency_ms)
        avg_latency_ms = round(sum(latencies) / len(latencies), 0) if latencies else 0.0

    tool_query = db.query(ToolExecution).join(Conversation, Conversation.id == ToolExecution.conversation_id).filter(
        Conversation.organization_id == org_id
    )
    if avatar_id:
        tool_query = tool_query.filter(Conversation.avatar_id == avatar_id)
    tool_executions = tool_query.all()
    tool_usage = Counter(t.tool_name for t in tool_executions)
    tool_success = Counter(t.tool_name for t in tool_executions if t.status == "success")
    tool_failure_points = Counter(f"{t.tool_name}:{t.status}" for t in tool_executions if t.status != "success")

    lead_query = db.query(Lead).filter(Lead.organization_id == org_id)
    if avatar_id:
        lead_query = lead_query.filter(Lead.avatar_id == avatar_id)
    leads = lead_query.all()
    lead_conversion_rate = round((sum(1 for l in leads if l.status == "converted") / len(leads)) * 100, 1) if leads else 0.0

    appt_query = db.query(Appointment).filter(Appointment.organization_id == org_id)
    if avatar_id:
        appt_query = appt_query.filter(Appointment.avatar_id == avatar_id)
    appointments = appt_query.all()
    appointment_conversion_rate = round((len(appointments) / total_conversations) * 100, 1) if total_conversations else 0.0

    return {
        "total_conversations": total_conversations,
        "active_users": active_users,
        "resolution_rate_pct": resolution_rate,
        "escalation_rate_pct": escalation_rate,
        "avg_response_latency_ms": avg_latency_ms,
        "lead_conversion_rate_pct": lead_conversion_rate,
        "appointment_conversion_rate_pct": appointment_conversion_rate,
        "total_leads": len(leads),
        "total_appointments": len(appointments),
        "tool_usage": dict(tool_usage),
        "tool_success_rate": {
            name: round((tool_success.get(name, 0) / count) * 100, 1) for name, count in tool_usage.items()
        },
        "most_common_failure_points": dict(tool_failure_points.most_common(5)),
        "most_common_intents": dict(intents.most_common(8)),
    }
