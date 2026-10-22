from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agent.llm import llm_client
from app.agent.orchestrator import handle_user_message
from app.database import get_db
from app.models import Avatar, Conversation, Message, User
from app.schemas import (
    AgentReplyOut, ConversationOut, MessageOut, SendMessageRequest, StartConversationRequest,
)
from app.security import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.post("", response_model=ConversationOut)
def start_conversation(payload: StartConversationRequest, db: Session = Depends(get_db)):
    avatar = db.query(Avatar).filter(Avatar.id == payload.avatar_id, Avatar.is_active == True).first()  # noqa: E712
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found or inactive")

    conversation = Conversation(
        organization_id=avatar.organization_id, avatar_id=avatar.id,
        user_identifier=payload.user_identifier or "anonymous", channel=payload.channel,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    db.add(Message(conversation_id=conversation.id, role="assistant", content=avatar.greeting))
    db.commit()
    return conversation


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()


@router.post("/{conversation_id}/messages", response_model=AgentReplyOut)
def send_message(conversation_id: str, payload: SendMessageRequest, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.status != "active":
        raise HTTPException(status_code=400, detail=f"Conversation is {conversation.status}, cannot accept new messages")

    result = handle_user_message(db, conversation, payload.content)

    message = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id, Message.role == "assistant")
        .order_by(Message.created_at.desc())
        .first()
    )
    return AgentReplyOut(
        conversation_id=conversation_id,
        message=MessageOut.model_validate(message),
        escalated=result.escalated,
        escalation_reason=result.escalation_reason,
    )


@router.post("/{conversation_id}/end", response_model=ConversationOut)
def end_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.status == "active":
        conversation.status = "ended"
    conversation.ended_at = datetime.utcnow()

    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()
    transcript = "\n".join(f"{m.role}: {m.content}" for m in messages)
    if transcript:
        try:
            summary = llm_client.chat([
                {"role": "system", "content": "Summarize this customer conversation in 1-2 sentences for a CRM record."},
                {"role": "user", "content": transcript[-4000:]},
            ])
            conversation.summary = summary
        except RuntimeError:
            pass

    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Conversation)
        .filter(Conversation.organization_id == user.organization_id)
        .order_by(Conversation.started_at.desc())
        .limit(200)
        .all()
    )
