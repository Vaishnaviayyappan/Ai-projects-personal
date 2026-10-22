from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agent.tools import registry
from app.database import get_db
from app.models import Avatar, ToolConfiguration, ToolExecution, User
from app.schemas import ToolConfigurationOut, ToolConfigurationUpdate
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["tools"])


@router.get("/tools/available")
def list_available_tools():
    return [{"name": t.name, "description": t.description, "parameters": t.parameters} for t in registry.all()]


@router.get("/avatars/{avatar_id}/tools", response_model=list[ToolConfigurationOut])
def list_avatar_tools(avatar_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _get_org_avatar(db, avatar_id, user.organization_id)
    return db.query(ToolConfiguration).filter(ToolConfiguration.avatar_id == avatar_id).all()


@router.put("/avatars/{avatar_id}/tools/{tool_name}", response_model=ToolConfigurationOut)
def update_avatar_tool(avatar_id: str, tool_name: str, payload: ToolConfigurationUpdate,
                        db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _get_org_avatar(db, avatar_id, user.organization_id)
    config = db.query(ToolConfiguration).filter(
        ToolConfiguration.avatar_id == avatar_id, ToolConfiguration.tool_name == tool_name
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Tool configuration not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(config, key, value)
    db.commit()
    db.refresh(config)
    return config


@router.get("/avatars/{avatar_id}/tool-executions")
def list_tool_executions(avatar_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _get_org_avatar(db, avatar_id, user.organization_id)
    from app.models import Conversation
    executions = (
        db.query(ToolExecution)
        .join(Conversation, Conversation.id == ToolExecution.conversation_id)
        .filter(Conversation.avatar_id == avatar_id)
        .order_by(ToolExecution.created_at.desc())
        .limit(100)
        .all()
    )
    return [{
        "id": e.id, "tool_name": e.tool_name, "status": e.status, "input": e.input_json,
        "output": e.output_json, "latency_ms": e.latency_ms, "created_at": e.created_at,
    } for e in executions]


def _get_org_avatar(db: Session, avatar_id: str, org_id: str) -> Avatar:
    avatar = db.query(Avatar).filter(Avatar.id == avatar_id, Avatar.organization_id == org_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return avatar
