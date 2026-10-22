from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api import deps
from app.models.user import User
from app.core import security
from datetime import timedelta
from app.core.config import settings

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "farmer"
    location: Optional[str] = "Punjab" # Default if not provided

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/signup", response_model=Token)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(deps.get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Create new user
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Automatically create a Farmer Profile
    from app.models.user import FarmerProfile
    profile = FarmerProfile(
        user_id=user.id,
        location=user_in.location,
        land_size="Unknown",      # Placeholder until they update profile
        primary_crops="General",  # Placeholder
        soil_type="Mixed",        # Placeholder
        irrigation_source="Rainfed"
    )
    db.add(profile)
    await db.commit()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_name": user.full_name,
        "user_email": user.email
    }

@router.post("/login/access-token", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_name": user.full_name,
        "user_email": user.email
    }
