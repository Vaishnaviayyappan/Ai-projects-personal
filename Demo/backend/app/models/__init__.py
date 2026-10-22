import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Text, JSON, Enum
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_id() -> str:
    return uuid.uuid4().hex


class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    AGENT = "agent"
    VIEWER = "viewer"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    industry = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    avatars = relationship("Avatar", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.ADMIN)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")


class Avatar(Base):
    __tablename__ = "avatars"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    role = Column(String, nullable=False)
    appearance_image_url = Column(String, nullable=True)
    voice_id = Column(String, default="default")
    face_image_path = Column(String, nullable=True)  # local face photo for the open-source Wav2Lip provider
    personality = Column(Text, default="Friendly, confident, professional")
    speaking_style = Column(String, default="conversational")
    languages = Column(JSON, default=lambda: ["en"])
    greeting = Column(Text, default="Hi! How can I help you today?")
    system_instructions = Column(Text, default="")
    escalation_rules = Column(JSON, default=lambda: {
        "low_confidence_threshold": 0.55,
        "keywords": ["human", "agent", "representative", "complaint"],
    })
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="avatars")
    configurations = relationship("AvatarConfiguration", back_populates="avatar", cascade="all, delete-orphan")
    tool_configurations = relationship("ToolConfiguration", back_populates="avatar", cascade="all, delete-orphan")
    knowledge_sources = relationship("KnowledgeSource", back_populates="avatar", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="avatar", cascade="all, delete-orphan")


class AvatarConfiguration(Base):
    """Versioned snapshot of an avatar's configuration, written on every update."""
    __tablename__ = "avatar_configurations"

    id = Column(String, primary_key=True, default=gen_id)
    avatar_id = Column(String, ForeignKey("avatars.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    config_json = Column(JSON, nullable=False)
    updated_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    avatar = relationship("Avatar", back_populates="configurations")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    avatar_id = Column(String, ForeignKey("avatars.id"), nullable=False, index=True)
    user_identifier = Column(String, default="anonymous")
    channel = Column(String, default="text")  # text | voice
    status = Column(String, default="active")  # active | ended | escalated
    summary = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    avatar = relationship("Avatar", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    tool_executions = relationship("ToolExecution", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=gen_id)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # user | assistant | system | tool
    content = Column(Text, nullable=False)
    intent = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    tool_calls_json = Column(JSON, nullable=True)
    sources_json = Column(JSON, nullable=True)
    latency_ms = Column(Integer, nullable=True)  # assistant messages only: real end-to-end turn time
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class KnowledgeSource(Base):
    __tablename__ = "knowledge_sources"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    avatar_id = Column(String, ForeignKey("avatars.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False)  # pdf | docx | text | faq | url
    status = Column(String, default="processing")  # processing | ready | failed
    chunk_count = Column(Integer, default=0)
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    avatar = relationship("Avatar", back_populates="knowledge_sources")
    chunks = relationship("KnowledgeChunk", back_populates="source", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(String, primary_key=True, default=gen_id)
    source_id = Column(String, ForeignKey("knowledge_sources.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    vector_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("KnowledgeSource", back_populates="chunks")


class ToolConfiguration(Base):
    __tablename__ = "tool_configurations"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    avatar_id = Column(String, ForeignKey("avatars.id"), nullable=False, index=True)
    tool_name = Column(String, nullable=False)
    is_enabled = Column(Boolean, default=True)
    permissions_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    avatar = relationship("Avatar", back_populates="tool_configurations")


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id = Column(String, primary_key=True, default=gen_id)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    tool_name = Column(String, nullable=False)
    input_json = Column(JSON, nullable=True)
    output_json = Column(JSON, nullable=True)
    status = Column(String, default="success")  # success | failure | denied
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="tool_executions")


class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    reason = Column(String, nullable=False)
    detected_intent = Column(String, nullable=True)
    transcript_summary = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending | in_progress | resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    avatar_id = Column(String, ForeignKey("avatars.id"), nullable=False, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=True)
    name = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    requirements = Column(Text, nullable=True)
    conversation_summary = Column(Text, nullable=True)
    lead_score = Column(Integer, default=50)
    status = Column(String, default="new")  # new | qualified | contacted | converted | lost
    created_at = Column(DateTime, default=datetime.utcnow)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    avatar_id = Column(String, ForeignKey("avatars.id"), nullable=False, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=True)
    customer_name = Column(String, nullable=True)
    service = Column(String, nullable=True)
    scheduled_time = Column(DateTime, nullable=False)
    status = Column(String, default="confirmed")  # confirmed | cancelled | completed
    created_at = Column(DateTime, default=datetime.utcnow)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    avatar_id = Column(String, ForeignKey("avatars.id"), nullable=True, index=True)
    event_type = Column(String, nullable=False)
    value_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_id)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
