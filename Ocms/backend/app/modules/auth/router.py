from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.modules.auth.service import auth_service

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "Reporter"
    tenant_id: str = "TENANT_ALPHA"

@router.post("/signup")
async def signup(data: UserSignup):
    return auth_service.register_user(data.name, data.email, data.password, data.role, data.tenant_id)

@router.post("/login")
async def login(data: LoginRequest):
    user = auth_service.get_user_by_credentials(data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # In a real system, we'd verify the password hash here
    # For this demo, we accept any password for the mock accounts
    
    # Generate Enterprise Token with Tenant ID
    token_data = {
        "sub": user["id"],
        "name": user["name"],
        "role": user["role"],
        "tenant_id": user.get("tenant_id", "GLOBAL_CORP")
    }
    
    token = auth_service.generate_token(token_data)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }
