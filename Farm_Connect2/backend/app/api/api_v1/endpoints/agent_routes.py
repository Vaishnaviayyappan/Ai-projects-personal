from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.agents.orchestrator import app as agent_app # LangGraph app
from langchain_core.messages import HumanMessage
from app.api import deps
from app.models.features import Expert
from app.services.ollama_service import query_ollama

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_id: str = "guest"
    location: str = None
    expert_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    action: Optional[str] = None
    agent_steps: Optional[list] = []

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Unified endpoint for chatting with the Multi-Agent system.
    Routes to Distress, Market, Weather, etc. based on intent.
    If expert_id is provided, chats directly with that Expert persona.
    """
    try:
        # 1. Direct Expert Chat Bypass
        if request.expert_id:
            result = await db.execute(select(Expert).filter(Expert.id == request.expert_id))
            expert = result.scalars().first()
            
            # Fallback for hardcoded experts if not in DB
            if not expert:
                fallbacks = {
                    1: {"name": "Dr. Rajesh Kumar", "specialization": "Crop Pathologist", "qualification": "PhD (IARI)", "experience": "15 Years"},
                    2: {"name": "Priya Sharma", "specialization": "Soil Scientist", "qualification": "MSc Agriculture", "experience": "8 Years"},
                    3: {"name": "Dr. Anil Gupta", "specialization": "Veterinarian", "qualification": "BVSc & AH", "experience": "12 Years"},
                    4: {"name": "Suresh Patel", "specialization": "Organic Farming", "qualification": "Certified Expert", "experience": "20 Years"}
                }
                expert_data = fallbacks.get(request.expert_id)
                if expert_data:
                    from types import SimpleNamespace
                    expert = SimpleNamespace(**expert_data)

            if expert:
                # Construct a persona prompt
                system_prompt = f"You are {expert.name}, a {expert.specialization} with {expert.qualification} and {expert.experience} of experience. Answer the farmer's question in a helpful, professional, and empathetic manner. keep responses concise."
                
                # Use llama3.2 for more capable expert personas
                response = await query_ollama("llama3.2:latest", request.message, system_prompt=system_prompt)
                return ChatResponse(response=response)

        # 2. Fetch User Profile for Personalization
        from app.models.user import User, FarmerProfile
        from sqlalchemy.orm import selectinload
        
        user_profile = {}
        if request.user_id != "guest":
            try:
                # Try to get by email or ID (Demo uses email for easy testing)
                stmt = select(User).options(selectinload(User.profile))
                if "@" in request.user_id:
                    stmt = stmt.filter(User.email == request.user_id)
                else:
                    stmt = stmt.filter(User.id == int(request.user_id))
                
                res = await db.execute(stmt)
                user = res.scalars().first()
                if user and user.profile:
                    user_profile = {
                        "name": user.full_name,
                        "location": user.profile.location,
                        "land_size": user.profile.land_size,
                        "primary_crops": user.profile.primary_crops,
                        "soil_type": user.profile.soil_type,
                        "irrigation": user.profile.irrigation_source
                    }
            except:
                pass

        # 3. Standard Autonomous Multi-Agent Routing
        inputs = {
            "messages": [HumanMessage(content=request.message)],
            "user_location": request.location or user_profile.get("location") or "Punjab",
            "intelligence_gathered": {},
            "steps_taken": [],
            "user_profile": user_profile,
            "max_loops": 3
        }
        
        # Invoke LangGraph Autonomous Loop
        result = await agent_app.ainvoke(inputs)
        
        last_message = result.get("messages", [])[-1].content if result.get("messages") else "I've processed your request but have no response."
        steps = result.get("steps_taken", [])
        
        return ChatResponse(response=last_message, agent_steps=steps)
        
    except Exception as e:
        print(f"Chat Error: {e}")
        # Return a fallback message instead of 500 to keep UI alive
        return ChatResponse(response="I'm facing some connectivity issues. Please try again in a moment.")

@router.post("/distress")
async def distress_signal(request: ChatRequest, db: AsyncSession = Depends(deps.get_db)):
    """
    Dedicated endpoint for high-priority distress signals
    """
    # Logic to prioritize this message
    return await chat_with_agent(request, db)
