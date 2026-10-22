from datetime import datetime
from typing import Any

from dateutil import parser as date_parser
from sqlalchemy.orm import Session

from app.agent.tools.base import ToolResult, ToolSpec, registry
from app.models import Appointment, Avatar


def run_appointment(db: Session, org_id: str, avatar_id: str, params: dict[str, Any]) -> ToolResult:
    avatar = db.query(Avatar).filter(Avatar.id == avatar_id).first()
    if not avatar:
        return ToolResult(success=False, error="avatar_not_found")

    preferred_date = params.get("preferred_date")
    preferred_time = params.get("preferred_time")
    if not preferred_date:
        return ToolResult(success=False, error="preferred_date_required")

    try:
        combined = f"{preferred_date} {preferred_time or ''}".strip()
        scheduled_time = date_parser.parse(combined, fuzzy=True, default=datetime.utcnow())
    except (ValueError, date_parser.ParserError):
        return ToolResult(success=False, error="could_not_parse_date_time")

    appointment = Appointment(
        organization_id=org_id,
        avatar_id=avatar_id,
        conversation_id=params.get("conversation_id"),
        customer_name=params.get("customer") or "guest",
        service=params.get("service") or "general consultation",
        scheduled_time=scheduled_time,
        status="confirmed",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return ToolResult(success=True, data={
        "appointment_id": appointment.id,
        "confirmed_time": appointment.scheduled_time.isoformat(),
        "status": appointment.status,
    })


registry.register(ToolSpec(
    name="schedule_appointment",
    description="Schedule an appointment, demo, property visit, or consultation for the customer",
    parameters={
        "customer": "customer name",
        "service": "what the appointment is for, e.g. product demo, property visit",
        "preferred_date": "preferred date, natural language ok, e.g. 'next Tuesday' or '2026-09-15'",
        "preferred_time": "preferred time, e.g. '3pm'",
    },
    handler=run_appointment,
))
