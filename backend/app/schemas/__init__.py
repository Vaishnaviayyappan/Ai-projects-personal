from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr


# ---- Auth ----

class RegisterRequest(BaseModel):
    organization_name: str
    industry: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    organization_id: str
    role: str


# ---- Avatar ----

class AvatarCreate(BaseModel):
    name: str
    industry: str
    role: str
    appearance_image_url: Optional[str] = None
    voice_id: str = "default"
    face_image_path: Optional[str] = None
    personality: str = "Friendly, confident, professional"
    speaking_style: str = "conversational"
    languages: list[str] = ["en"]
    greeting: str = "Hi! How can I help you today?"
    system_instructions: str = ""
    escalation_rules: dict[str, Any] = {}


class AvatarUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    appearance_image_url: Optional[str] = None
    voice_id: Optional[str] = None
    face_image_path: Optional[str] = None
    personality: Optional[str] = None
    speaking_style: Optional[str] = None
    languages: Optional[list[str]] = None
    greeting: Optional[str] = None
    system_instructions: Optional[str] = None
    escalation_rules: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None


class AvatarOut(BaseModel):
    id: str
    organization_id: str
    name: str
    industry: str
    role: str
    appearance_image_url: Optional[str]
    voice_id: str
    face_image_path: Optional[str] = None
    personality: str
    speaking_style: str
    languages: list[str]
    greeting: str
    system_instructions: str
    escalation_rules: dict[str, Any]
    is_active: bool

    class Config:
        from_attributes = True


# ---- Conversation ----

class StartConversationRequest(BaseModel):
    avatar_id: str
    user_identifier: Optional[str] = "anonymous"
    channel: str = "text"


class SendMessageRequest(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    tool_calls_json: Optional[Any] = None
    sources_json: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    avatar_id: str
    user_identifier: str
    channel: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AgentReplyOut(BaseModel):
    conversation_id: str
    message: MessageOut
    escalated: bool = False
    escalation_reason: Optional[str] = None
    avatar_audio_or_video: Optional[dict[str, Any]] = None


# ---- Knowledge ----

class KnowledgeSourceOut(BaseModel):
    id: str
    avatar_id: Optional[str]
    name: str
    source_type: str
    status: str
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgeTextUpload(BaseModel):
    avatar_id: Optional[str] = None
    name: str
    content: str


# ---- Tools ----

class ToolConfigurationOut(BaseModel):
    id: str
    avatar_id: str
    tool_name: str
    is_enabled: bool
    permissions_json: dict[str, Any]

    class Config:
        from_attributes = True


class ToolConfigurationUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    permissions_json: Optional[dict[str, Any]] = None


# ---- Escalation ----

class EscalationOut(BaseModel):
    id: str
    conversation_id: str
    reason: str
    detected_intent: Optional[str]
    transcript_summary: Optional[str]
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---- Leads / Appointments ----

class LeadOut(BaseModel):
    id: str
    avatar_id: str
    name: Optional[str]
    contact: Optional[str]
    requirements: Optional[str]
    lead_score: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentOut(BaseModel):
    id: str
    avatar_id: str
    customer_name: Optional[str]
    service: Optional[str]
    scheduled_time: datetime
    status: str

    class Config:
        from_attributes = True
