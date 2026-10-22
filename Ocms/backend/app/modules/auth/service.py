import jwt
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from passlib.context import CryptContext
from fastapi import HTTPException, status

logger = logging.getLogger("AuthService")

SECRET_KEY = "PROACT_RESOLVE_AI_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    """
    Enterprise Auth Service.
    Handles JWT generation, RBAC roles, and secure hashing.
    """
    def __init__(self):
        # Initializing the Master Enterprise Directory
        self.users = {
            "reporter@example.com": {"id": "1", "name": "John Doe", "role": "Reporter", "tenant_id": "TENANT_ALPHA"},
            "handler@example.com": {"id": "2", "name": "Sarah Handler", "role": "Case Handler", "tenant_id": "TENANT_ALPHA"},
            "supervisor@example.com": {"id": "3", "name": "Mike Supervisor", "role": "Department Supervisor", "tenant_id": "TENANT_ALPHA"},
            "compliance@example.com": {"id": "4", "name": "Elena Compliance", "role": "Compliance Officer", "tenant_id": "TENANT_ALPHA"},
            "escalation@example.com": {"id": "5", "name": "Director Authority", "role": "Escalation Authority", "tenant_id": "TENANT_ALPHA"},
            "auditor@example.com": {"id": "6", "name": "Audit Team", "role": "System Auditor", "tenant_id": "TENANT_ALPHA"},
            "admin@example.com": {"id": "7", "name": "System Root", "role": "System Administrator", "tenant_id": "TENANT_ALPHA"}
        }

    def generate_token(self, user_data: dict) -> str:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = user_data.copy()
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    def verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    def get_user_by_credentials(self, email: str) -> Optional[dict]:
        return self.users.get(email)

    def register_user(self, name: str, email: str, password: str, role: str, tenant_id: str) -> dict:
        if email in self.users:
            raise HTTPException(status_code=400, detail="Identity already registered.")
        
        new_id = str(len(self.users) + 1)
        user = {"id": new_id, "name": name, "role": role, "tenant_id": tenant_id}
        self.users[email] = user
        return user

auth_service = AuthService()
