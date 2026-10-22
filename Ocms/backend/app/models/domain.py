from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    HANDLER = "handler"
    USER = "user"

class ComplaintStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ESCALATED = "escalated"
    RESOLVED = "resolved"

class ComplaintPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.USER

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    full_name: str
    role: UserRole

class ComplaintCreate(BaseModel):
    title: str
    description: str
    department: str
    is_anonymous: bool = False
    reporter_email: Optional[EmailStr] = None

class ComplaintResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    description: str
    department: str
    status: ComplaintStatus
    priority: Optional[ComplaintPriority] = None
    ai_category: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_risk_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    resolution_text: Optional[str] = None
    assigned_to: Optional[str] = None
    is_anonymous: bool

class ResolutionDraft(BaseModel):
    draft_response: str
    recommended_actions: List[str]
    policy_references: List[str]

class AuditEvent(BaseModel):
    action: str
    complaint_id: str
    user_id: Optional[str]
    details: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
