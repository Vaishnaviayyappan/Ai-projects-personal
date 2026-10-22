from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Body
from typing import List, Dict, Any
from app.models.domain import ComplaintCreate, ComplaintResponse, ComplaintStatus, ComplaintPriority
from app.db.database import get_db
import asyncio
from datetime import datetime
from bson import ObjectId

# Import the Meta-Agent Orchestrator
from app.agents.council import agent_council_orchestrator

router = APIRouter()

# Global WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

def serialize_complaint(complaint: dict):
    complaint["_id"] = str(complaint["_id"])
    return complaint

@router.post("/", response_model=ComplaintResponse)
async def create_complaint(complaint: ComplaintCreate, db = Depends(get_db)):
    collection = db["complaints"]
    
    async def broadcast_trace(agent: str, msg: str):
        await manager.broadcast({"event": "AGENT_TRACE", "agent": agent, "message": msg})

    # Send payload entirely to the Agent Council with real-time tracing enabled
    council_result = await agent_council_orchestrator(complaint.dict(), on_trace=broadcast_trace)
    
    new_complaint = {
        "title": complaint.title,
        "description": complaint.description,
        "department": council_result["department"],
        "status": ComplaintStatus.OPEN.value,
        "priority": ComplaintPriority(council_result["priority"]),
        "ai_category": council_result.get("department", "General"),
        "ai_summary": council_result["resolution"],
        "ai_risk_score": 0.9 if council_result["priority"] == "urgent" else 0.5,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_anonymous": complaint.is_anonymous,
        "assigned_to": None,
        "resolution_text": council_result["resolution"]
    }
    
    result = await collection.insert_one(new_complaint)
    inserted_id = result.inserted_id
    
    saved_complaint = await collection.find_one({"_id": inserted_id})
    serial_doc = serialize_complaint(saved_complaint)
    
    # Broadcast to Kanban dashboard
    await manager.broadcast({"event": "NEW_COMPLAINT", "data": serial_doc})
    
    return serial_doc

@router.get("/", response_model=list[ComplaintResponse])
async def list_complaints(db = Depends(get_db)):
    collection = db["complaints"]
    complaints = await collection.find().to_list(1000)
    return [serialize_complaint(c) for c in complaints]

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(complaint_id: str, db = Depends(get_db)):
    collection = db["complaints"]
    complaint = await collection.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return serialize_complaint(complaint)

@router.patch("/{complaint_id}/status")
async def update_status(complaint_id: str, status: ComplaintStatus = Body(..., embed=True), db = Depends(get_db)):
    collection = db["complaints"]
    result = await collection.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {"status": status.value, "updated_at": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    from app.services.websocket_manager import manager
    await manager.broadcast({
        "event": "STATUS_UPDATE",
        "data": {
            "complaint_id": complaint_id,
            "status": status.value
        }
    })
    
    return {"message": "Status updated successfully"}
