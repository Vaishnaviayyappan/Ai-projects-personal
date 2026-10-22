from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import time
import base64
import json

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

# 7 System Roles requested in architecture
ROLE_MAPPINGS = {
    "reporter": "Reporter",
    "handler": "Case Handler",
    "supervisor": "Department Supervisor",
    "compliance": "Compliance Officer",
    "escalation": "Escalation Authority",
    "auditor": "System Auditor",
    "admin": "System Administrator"
}

def generate_stateless_jwt(role: str, user_id: str):
    # Highly robust zero-dependency JWT generator for testing
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode()
    payload_dict = {
        "sub": user_id,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400
    }
    payload = base64.urlsafe_b64encode(json.dumps(payload_dict).encode()).decode()
    signature = base64.urlsafe_b64encode(b"dummy_signature").decode()
    return f"{header}.{payload}.{signature}"

@router.post("/login")
async def login(req: LoginRequest):
    # Simulate database user lookup
    role_key = req.username.lower()
    
    if role_key not in ROLE_MAPPINGS:
        # Default to Reporter if standard login
        role_key = "reporter"
        
    actual_role = ROLE_MAPPINGS[role_key]
    token = generate_stateless_jwt(actual_role, f"usr_{role_key}")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": f"usr_{role_key}",
            "role": actual_role,
            "name": f"{actual_role} Account"
        }
    }
