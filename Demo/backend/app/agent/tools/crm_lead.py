from typing import Any

from sqlalchemy.orm import Session

from app.agent.tools.base import ToolResult, ToolSpec, registry
from app.models import Lead


def run_crm_lead(db: Session, org_id: str, avatar_id: str, params: dict[str, Any]) -> ToolResult:
    try:
        lead_score = int(params.get("lead_score", 50))
    except (TypeError, ValueError):
        lead_score = 50
    lead_score = max(0, min(100, lead_score))

    lead = Lead(
        organization_id=org_id,
        avatar_id=avatar_id,
        conversation_id=params.get("conversation_id"),
        name=params.get("name"),
        contact=params.get("contact"),
        requirements=params.get("requirements"),
        conversation_summary=params.get("conversation_summary"),
        lead_score=lead_score,
        status="qualified" if lead_score >= 60 else "new",
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    return ToolResult(success=True, data={"lead_id": lead.id, "status": lead.status, "lead_score": lead.lead_score})


registry.register(ToolSpec(
    name="create_crm_lead",
    description="Create a CRM lead once the customer's identity and requirements are known, for handoff to a human sales/service team",
    parameters={
        "name": "customer name",
        "contact": "phone or email",
        "requirements": "summary of what the customer is looking for",
        "conversation_summary": "brief summary of the conversation so far",
        "lead_score": "0-100 estimate of how qualified/ready-to-buy the lead is",
    },
    handler=run_crm_lead,
))
