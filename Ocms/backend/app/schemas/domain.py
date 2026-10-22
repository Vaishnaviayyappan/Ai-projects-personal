import uuid
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class ComplaintStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"

class ComplaintPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TimelineEvent(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: str
    actor: str
    note: Optional[str] = None

class MemoEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author: str
    author_name: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    likes: List[str] = []
    replies: List['MemoEntry'] = []

MemoEntry.update_forward_refs()

class MemoCreate(BaseModel):
    content: str
    author_name: str

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20)
    department: str = "General"
    is_anonymous: bool = True
    reporter_email: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: str
    title: str
    description: str
    status: ComplaintStatus
    priority: ComplaintPriority
    ai_category: str
    ai_summary: Optional[str]
    ai_risk_score: float
    created_at: datetime
    updated_at: datetime
    is_anonymous: bool
    reporter_id: Optional[str] = None
    reporter_email: Optional[str] = None
    resolution_text: Optional[str] = None
    assigned_to: Optional[str] = None
    timeline: List[TimelineEvent] = []
    memos: List[MemoEntry] = []
    closing_note: Optional[str] = None
    escalated_to: Optional[str] = None

class StatusUpdate(BaseModel):
    status: ComplaintStatus
    note: Optional[str] = None
    escalate_to: Optional[str] = None

class AgentActivitySchema(BaseModel):
    agent_name: str
    action_type: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    incident_id: Optional[str] = None
