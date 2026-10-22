from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List
from app.schemas.domain import ComplaintCreate, ComplaintResponse, StatusUpdate, MemoCreate
from app.modules.incidents.service import incident_service
from app.infrastructure.event_bus import bus

router = APIRouter()

from app.infrastructure.real_time import rt_manager

# Hook the Event Bus to the Real-Time Manager
# We broadcast events only to the appropriate tenant
async def handle_agent_tick(data: dict):
    # Agent ticks should ideally carry tenant_id. 
    # For now, we broadcast to 'TENANT_ALPHA' or extract from context.
    tenant_id = data.get("tenant_id", "TENANT_ALPHA")
    await rt_manager.broadcast_to_tenant(tenant_id, data)

bus.subscribe("AGENT_TICK", handle_agent_tick)
bus.subscribe("INCIDENT_CREATED", lambda d: rt_manager.broadcast_to_tenant(d.get("tenant_id", "TENANT_ALPHA"), {"event": "NEW_INCIDENT", "data": d, "agent": "System", "message": f"New Case: {d.get('title')}"}))
bus.subscribe("INCIDENT_ESCALATED", lambda d: rt_manager.broadcast_to_tenant(d.get("tenant_id", "TENANT_ALPHA"), {"event": "ESCALATION", "data": d, "agent": "Security", "message": d.get("message")}))
bus.subscribe("NOTIFICATION_SENT", lambda d: rt_manager.broadcast_to_tenant(d.get("tenant_id", "TENANT_ALPHA"), {"event": "MAIL_SENT", "data": d, "agent": "Postmaster", "message": f"Dispatch: {d.get('type')} to {d.get('recipient')}"}))
bus.subscribe("INCIDENT_MEMO_ADDED", lambda d: rt_manager.broadcast_to_tenant(d.get("tenant_id", "TENANT_ALPHA"), {"event": "MEMO_ADDED", "data": d, "agent": "Collaboration", "message": f"New memo added to case {d.get('incident_id')[:8]}"}))
bus.subscribe("INCIDENT_MEMO_UPDATED", lambda d: rt_manager.broadcast_to_tenant(d.get("tenant_id", "TENANT_ALPHA"), {"event": "MEMO_UPDATED", "data": d, "agent": "Collaboration", "message": f"Interaction on case {d.get('incident_id')[:8]}"}))

from app.core.security import TenantContext, get_current_tenant, rbac_required

# Role Clusters (Spec Alignment)
ALL_ROLES = ["Reporter", "Case Handler", "Department Supervisor", "Compliance Officer", "Escalation Authority", "System Auditor", "System Administrator", "Legal Counsel"]
INVESTIGATORY_ROLES = ["Case Handler", "Department Supervisor", "Compliance Officer", "Escalation Authority", "System Auditor", "System Administrator", "Legal Counsel"]
STATE_AUTHORITIES = ["Case Handler", "Department Supervisor", "Compliance Officer", "Escalation Authority", "System Administrator", "Legal Counsel"]

@router.post("/", response_model=ComplaintResponse)
async def create_incident(
    data: ComplaintCreate, 
    ctx: TenantContext = Depends(rbac_required(ALL_ROLES))
):
    return await incident_service.create(data, ctx)

@router.get("/track/{tracking_id}")
async def track_incident(
    tracking_id: str
):
    """
    Public-facing tracking for anonymous or non-authenticated status verification.
    """
    record = incident_service.store.get_by_id("TENANT_ALPHA", tracking_id)
    if not record:
        raise HTTPException(status_code=404, detail="Tracking ID not found.")
    
    return {
        "id": record["id"],
        "title": record["title"],
        "status": record["status"],
        "priority": record["priority"],
        "created_at": record["created_at"],
        "timeline": [t for t in record["timeline"] if "STATUS_CHANGED" in t["action"] or "INCIDENT_REPORTED" in t["action"]]
    }

@router.get("/{incident_id}", response_model=ComplaintResponse)
async def get_incident(
    incident_id: str,
    ctx: TenantContext = Depends(rbac_required(ALL_ROLES))
):
    incident = await incident_service.get_by_id(incident_id, ctx)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found or unauthorized access.")
    return incident

@router.get("/", response_model=List[ComplaintResponse])
async def list_incidents(
    ctx: TenantContext = Depends(rbac_required(ALL_ROLES))
):
    # Incident Service handles filtering: Reporters see own, Others see all available.
    return await incident_service.get_all(ctx)

@router.patch("/{incident_id}/status", response_model=ComplaintResponse)
async def transition_incident(
    incident_id: str,
    update: StatusUpdate,
    ctx: TenantContext = Depends(rbac_required(STATE_AUTHORITIES))
):
    # Final check: Auditors cannot transition state (Read-only)
    result = await incident_service.update_status(incident_id, update.status, update.note or "", ctx, update.escalate_to)
    if not result:
        raise HTTPException(status_code=404, detail="Incident not found in your tenant.")
    return result
    
@router.post("/{incident_id}/memos", response_model=ComplaintResponse)
async def add_incident_memo(
    incident_id: str,
    data: MemoCreate,
    ctx: TenantContext = Depends(rbac_required(INVESTIGATORY_ROLES))
):
    result = await incident_service.add_memo(incident_id, data, ctx)
    if not result:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return result

@router.post("/{incident_id}/memos/{memo_id}/like", response_model=ComplaintResponse)
async def toggle_memo_like_endpoint(
    incident_id: str,
    memo_id: str,
    ctx: TenantContext = Depends(rbac_required(INVESTIGATORY_ROLES))
):
    result = await incident_service.toggle_memo_like(incident_id, memo_id, ctx)
    if not result:
        raise HTTPException(status_code=404, detail="Memo or Incident not found.")
    return result

@router.post("/{incident_id}/memos/{memo_id}/replies", response_model=ComplaintResponse)
async def add_memo_reply_endpoint(
    incident_id: str,
    memo_id: str,
    data: MemoCreate,
    ctx: TenantContext = Depends(rbac_required(INVESTIGATORY_ROLES))
):
    result = await incident_service.add_memo_reply(incident_id, memo_id, data, ctx)
    if not result:
        raise HTTPException(status_code=404, detail="Memo or Incident not found.")
    return result


