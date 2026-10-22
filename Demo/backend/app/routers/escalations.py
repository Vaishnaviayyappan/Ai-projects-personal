from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Conversation, Escalation, Message, User
from app.schemas import EscalationOut
from app.security import get_current_user

router = APIRouter(prefix="/api/escalations", tags=["escalations"])


@router.get("", response_model=list[EscalationOut])
def list_escalations(status_filter: str | None = None, db: Session = Depends(get_db),
                      user: User = Depends(get_current_user)):
    query = db.query(Escalation).filter(Escalation.organization_id == user.organization_id)
    if status_filter:
        query = query.filter(Escalation.status == status_filter)
    return query.order_by(Escalation.created_at.desc()).all()


@router.get("/{escalation_id}/detail")
def get_escalation_detail(escalation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    escalation = db.query(Escalation).filter(
        Escalation.id == escalation_id, Escalation.organization_id == user.organization_id
    ).first()
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")

    conversation = db.query(Conversation).filter(Conversation.id == escalation.conversation_id).first()
    messages = (
        db.query(Message).filter(Message.conversation_id == escalation.conversation_id)
        .order_by(Message.created_at).all()
    )
    return {
        "escalation": EscalationOut.model_validate(escalation),
        "conversation": {
            "id": conversation.id, "user_identifier": conversation.user_identifier,
            "channel": conversation.channel, "avatar_id": conversation.avatar_id,
        },
        "messages": [{"role": m.role, "content": m.content, "intent": m.intent, "tool_calls": m.tool_calls_json,
                       "created_at": m.created_at} for m in messages],
    }


@router.post("/{escalation_id}/resolve", response_model=EscalationOut)
def resolve_escalation(escalation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    escalation = db.query(Escalation).filter(
        Escalation.id == escalation_id, Escalation.organization_id == user.organization_id
    ).first()
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
    escalation.status = "resolved"
    escalation.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(escalation)
    return escalation
