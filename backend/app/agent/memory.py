from sqlalchemy.orm import Session

from app.models import Message, Conversation, Lead


def get_short_term_history(db: Session, conversation_id: str, max_messages: int = 12) -> list[dict[str, str]]:
    """Recent turns of the current conversation, oldest first."""
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(max_messages)
        .all()
    )
    messages.reverse()
    history = []
    for m in messages:
        if m.role in ("user", "assistant"):
            history.append({"role": m.role, "content": m.content})
    return history


def get_long_term_profile(db: Session, org_id: str, user_identifier: str) -> dict:
    """Cross-conversation memory: prior requirements/preferences for a returning user."""
    if not user_identifier or user_identifier == "anonymous":
        return {}

    past_conversations = (
        db.query(Conversation)
        .filter(Conversation.organization_id == org_id, Conversation.user_identifier == user_identifier)
        .order_by(Conversation.started_at.desc())
        .limit(5)
        .all()
    )
    past_leads = (
        db.query(Lead)
        .filter(Lead.organization_id == org_id, Lead.contact == user_identifier)
        .order_by(Lead.created_at.desc())
        .limit(3)
        .all()
    )

    summaries = [c.summary for c in past_conversations if c.summary]
    requirements = [l.requirements for l in past_leads if l.requirements]

    if not summaries and not requirements:
        return {}

    return {
        "returning_user": True,
        "past_conversation_summaries": summaries,
        "past_requirements": requirements,
    }
