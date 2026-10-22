from fastapi import APIRouter, Depends, HTTPException, Body
from app.db.database import get_db
from app.agents.resolution_agent import ResolutionAgent
from app.agents.llm_client import get_llm_response
from bson import ObjectId

router = APIRouter()

@router.post("/{complaint_id}/suggest-resolution")
async def suggest_resolution(complaint_id: str, db = Depends(get_db)):
    collection = db["complaints"]
    complaint = await collection.find_one({"_id": ObjectId(complaint_id)})
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    suggestion = await ResolutionAgent.suggest_resolution(
        complaint_text=complaint.get("description", ""),
        category=complaint.get("ai_category", "General")
    )
    return suggestion.model_dump()

@router.post("/ask-assistant")
async def ask_assistant(question: str = Body(..., embed=True), context: str = Body("", embed=True)):
    system_prompt = "You are an AI Handler Assistant helping a compliance officer resolve an issue."
    prompt = f"Context:\n{context}\n\nQuestion:\n{question}"
    
    response = await get_llm_response(prompt=prompt, system_message=system_prompt, model="gpt-4o-mini")
    return {"response": response}
