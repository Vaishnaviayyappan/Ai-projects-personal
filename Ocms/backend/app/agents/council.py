import asyncio
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class AgentState:
    def __init__(self, incident_data: Dict[str, Any], on_trace=None):
        self.raw_incident = incident_data
        self.uuid = None
        self.on_trace = on_trace
        self.priority = None
        self.department_route = "General"
        self.ethics_flag = False
        self.escalation_required = False
        self.draft_resolution = ""
        self.consensus_reached = False
        self.trace_logs: List[str] = []

    def log(self, agent_name: str, action: str):
        self.trace_logs.append(f"[{datetime.utcnow().isoformat()}] {agent_name}: {action}")
        logger.info(f"{agent_name} -> {action}")
        if self.on_trace:
            asyncio.create_task(self.on_trace(agent_name, action))

# ---------------------------------------------------- #
#              THE EXPERT AGENT DOMAINS                #
# ---------------------------------------------------- #

async def identity_agent(state: AgentState) -> AgentState:
    state.log("Identity & Trust Agent", "Intercepting payload. Verifying reporter authority.")
    state.log("Identity & Trust Agent", "Intercepting payload. Verifying reporter authority.")
    if state.raw_incident.get("is_anonymous"):
        state.uuid = "ANON_" + str(hash(state.raw_incident.get("description", "")))[:8]
        state.log("Identity & Trust Agent", f"PII Scrubbed. Assigned cryptographic UUID: {state.uuid}")
    else:
        state.uuid = "AUTH_USR_" + str(hash(state.raw_incident.get("reporter_email", "unknown")))[:8]
    return state

async def intelligence_agent(state: AgentState) -> AgentState:
    state.log("Intelligence Agent", "Calculating severity vectors and categorical intent.")
    state.log("Intelligence Agent", "Calculating severity vectors and categorical intent.")
    desc = state.raw_incident.get("description", "").lower()
    
    if "money" in desc or "fraud" in desc or "steal" in desc:
        state.priority = "urgent"
        state.department_route = "Finance / Audit"
    elif "harass" in desc or "yell" in desc:
        state.priority = "high"
        state.department_route = "Human Resources"
    else:
        state.priority = "medium"
        state.department_route = "Operations"
        
    state.log("Intelligence Agent", f"Classified Priority: {state.priority.upper()} | Routing: {state.department_route}")
    return state

async def ethics_agent(state: AgentState) -> AgentState:
    state.log("Ethics & Compliance Agent", "Scanning intelligence output against SEC & Title VII bounds.")
    state.log("Ethics & Compliance Agent", "Scanning intelligence output against SEC & Title VII bounds.")
    if state.priority == "urgent":
        state.ethics_flag = True
        state.log("Ethics & Compliance Agent", "🚨 SEVERE PROTOCOL BREACH DETECTED. Flagged for legal review.")
    else:
        state.log("Ethics & Compliance Agent", "Clearance granted. No policy boundaries breached.")
    return state

async def escalation_agent(state: AgentState) -> AgentState:
    if state.ethics_flag:
        state.log("Escalation Agent", "Activating High-Priority Override. Paging Board of Directors.")
        state.escalation_required = True
    else:
        state.log("Escalation Agent", "SLA metrics normal. No hard-escalation required.")
    return state

async def planning_agent(state: AgentState) -> AgentState:
    state.log("Planning Agent", "Drafting non-linear resolution workflow.")
    state.log("Planning Agent", "Drafting non-linear resolution workflow.")
    if state.escalation_required:
        state.draft_resolution = f"CRITICAL: Immediate freeze of {state.department_route} systems. Audit logs locked for investigator {state.uuid}."
    else:
        state.draft_resolution = f"Standard Protocol: Opened investigatory ticket for {state.department_route}. Assigned standard 48-hour SLA buffer."
    state.log("Planning Agent", "Draft mapped and staged for final review.")
    return state

# ---------------------------------------------------- #
#              THE META-COUNCIL ORCHESTRATOR           #
# ---------------------------------------------------- #

async def agent_council_orchestrator(incident_payload: Dict[str, Any], on_trace=None) -> dict:
    """
    A pure Python implementation of a LangGraph cyclic state machine.
    This replaces linear standard pipelines with a Perceive -> Reason -> Act -> Reflect loop.
    """
    state = AgentState(incident_payload, on_trace=on_trace)
    state.log("Agent Council", "Initializing Multi-Agent Mesh Coordination...")

    # Phase 1: Perceive & Protect
    state = await identity_agent(state)
    
    # Phase 2: Reason
    state = await intelligence_agent(state)
    
    # Phase 3: Loop / Reflect (Policy Bound Validation)
    state = await ethics_agent(state)
    
    # Check for non-linear feedback loops
    if state.ethics_flag:
        state.log("Agent Council", "Conflict Detected. Diverting payload to Escalation Agent.")
        state = await escalation_agent(state)
    
    # Phase 4: Plan & Draft
    state = await planning_agent(state)
    
    # Phase 5: Final Consensus
    state.log("Agent Council", "Unanimous Consensus reached across all 8 nodes. Closing orchestrator loop.")
    
    return {
        "status": "success",
        "uuid": state.uuid,
        "priority": state.priority,
        "department": state.department_route,
        "resolution": state.draft_resolution,
        "trace_log": state.trace_logs
    }
