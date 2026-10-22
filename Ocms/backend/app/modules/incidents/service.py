import logging, uuid, asyncio, os
from typing import List, Optional
from datetime import datetime
from app.schemas.domain import ComplaintCreate, ComplaintResponse, ComplaintStatus, ComplaintPriority, MemoCreate
from app.modules.agents.engine import AgentEngine
from app.modules.agents.memory import memory_service
from app.modules.policy.service import policy_service

# Phase 12 Architecture Integrity: Explicit Dependency Injection
orchestrator = AgentEngine(memory_service, policy_service)
from fastapi import HTTPException
from app.core.security import TenantContext
from app.infrastructure.event_bus import bus
from app.infrastructure.persistence import db_engine

# Directional Escalation Hierarchy
AUTHORITY_HIERARCHY = {
    "Case Handler": 1,
    "Department Supervisor": 2,
    "Compliance Officer": 3,
    "Escalation Authority": 4,
    "System Administrator": 5
}
from app.core.audit import audit_service
from app.core.outbox import outbox
from app.core.compliance import RBACMasker
from app.infrastructure.email import email_service

logger = logging.getLogger("IncidentService")

class IncidentService:
    def __init__(self):
        self.store = db_engine

    async def create(self, data: ComplaintCreate, ctx: TenantContext) -> ComplaintResponse:
        logger.info(f"[{ctx.tenant_id}] Ingesting incident: {data.title}")
        
        # 1. AI Orchestration
        matrix = await orchestrator.orchestrate(data.dict(), ctx.tenant_id)
        new_id = str(uuid.uuid4())

        # 2. Map to Domain Model
        status = matrix.get("status_override", ComplaintStatus.OPEN)
        
        incident = ComplaintResponse(
            id=new_id,
            title=data.title,
            description=data.description,
            status=status,
            priority=ComplaintPriority(matrix['priority']),
            ai_category=matrix['category'],
            ai_summary=matrix['resolution_draft'],
            ai_risk_score=0.9 if matrix['priority'] == 'urgent' else 0.4,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            is_anonymous=data.is_anonymous,
            reporter_id=ctx.user_id,
            reporter_email=data.reporter_email if not data.is_anonymous else None,
            resolution_text=matrix['resolution_draft'],
            timeline=[]
        )
        
        incident.timeline.append({
            "action": "INCIDENT_REPORTED",
            "actor": ctx.user_id,
            "note": "Initial intake processed."
        })

        # 3. Secure Persistence (Phase 11 Pattern)
        record = incident.dict()
        self.store.save_incident(ctx.tenant_id, new_id, record)

        # 4. Mandatory: Audit & Outbox
        await audit_service.log_action(
            tenant_id=ctx.tenant_id,
            user_id=ctx.user_id,
            action="INCIDENT_SUBMITTED",
            entity_type="INCIDENT",
            entity_id=new_id,
            payload={"status": status}
        )
        
        outbox.add_event("INCIDENT_CREATED", record)

        # 5. Dispatch Confirmation Emails (Background)
        # To Reporter
        if not data.is_anonymous and data.reporter_email:
            email_body = (
                f"Hello,\n\n"
                f"Your report regarding '{data.title}' has been successfully logged with our AI Ethics Council.\n\n"
                f"------------------------------------------\n"
                f" TRACKING ID: {new_id}\n"
                f"------------------------------------------\n\n"
                f"Please keep this ID safe as you will need it to check progress.\n"
                f"You can track your case status here: http://localhost:5173/track\n\n"
                f"Current Status: {status.upper()}\n"
                f"Priority: {incident.priority.upper()}\n\n"
                f"Thank you for helping us maintain organizational integrity."
            )
            asyncio.create_task(email_service.send_email(
                recipient=data.reporter_email,
                subject=f"Confirmation: {data.title} [ID: {new_id[:8]}]",
                body=email_body
            ))
            
        # To Admin (Alert)
        admin_email = os.getenv("ADMIN_EMAIL")
        if admin_email:
            asyncio.create_task(email_service.send_email(
                recipient=admin_email,
                subject=f"New Incident Alert: {data.title}",
                body=f"A new incident has been reported.\n\nTitle: {data.title}\nPriority: {incident.priority}\nCategory: {incident.ai_category}\n\nReview the case here: http://localhost:5173/dashboard"
            ))

        return incident

    async def update_status(self, incident_id: str, new_status: str, note: str, ctx: TenantContext, escalate_to: Optional[str] = None) -> Optional[ComplaintResponse]:
        record = self.store.get_by_id(ctx.tenant_id, incident_id)
        if record:
            # Directional Escalation Guard
            if new_status == "escalated" and escalate_to:
                current_authority_lv = AUTHORITY_HIERARCHY.get(record.get("escalated_to"), 0)
                new_authority_lv = AUTHORITY_HIERARCHY.get(escalate_to, 0)
                
                if new_authority_lv <= current_authority_lv:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Protocol Breach: Cannot escalate to {escalate_to} (LV {new_authority_lv}) from current level {record.get('escalated_to') or 'None'} (LV {current_authority_lv}). Intelligence dictates movements must be upward only."
                    )
                record["escalated_to"] = escalate_to

            old_status = record["status"]
            record["status"] = new_status
            record["updated_at"] = datetime.utcnow()
            record["timeline"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "action": f"STATUS_CHANGED: {old_status} -> {new_status}" + (f" (Target: {escalate_to})" if escalate_to else ""),
                "actor": ctx.user_id,
                "note": note
            })
            
            # Persist Update
            self.store.save_incident(ctx.tenant_id, incident_id, record)
            
            # Audit & Memory
            await audit_service.log_action(ctx.tenant_id, ctx.user_id, "STATUS_TRANSITION", "INCIDENT", incident_id, {"to": new_status})
            if new_status in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
                await memory_service.index_incident(record)
            
            # Notify Stakeholders
            # To Reporter
            if record.get("reporter_email"):
                await email_service.send_email(
                    recipient=record["reporter_email"],
                    subject=f"Update on Case {incident_id}",
                    body=f"The status of your report '{record.get('title')}' has been updated to: {new_status}.\n\nNote: {note}"
                )
                await self.bus.emit("NOTIFICATION_SENT", {"type": "EMAIL", "recipient": record["reporter_email"]})
            
            # To Admin (on Escalation)
            if new_status == "escalated":
                admin_email = os.getenv("ADMIN_EMAIL")
                if admin_email:
                    asyncio.create_task(email_service.send_email(
                        recipient=admin_email,
                        subject=f"CRITICAL: Case Escalated - {incident_id}",
                        body=f"Case '{record.get('title')}' has been officially ESCALATED.\n\nNote: {note}\nPriority: {record.get('priority')}\n\nInvestigate immediately: http://localhost:5173/dashboard"
                    ))
                
                # Emit High-Priority Signal for Real-time Notification
                await self.bus.emit("INCIDENT_ESCALATED", {
                    "tenant_id": ctx.tenant_id,
                    "incident_id": incident_id,
                    "title": record.get("title"),
                    "status": new_status,
                    "message": f"CRITICAL: Case {incident_id[:8]} has been ESCALATED."
                })
            
            # Emit General Status Update for UI synchronization
            await self.bus.emit("INCIDENT_STATUS_UPDATED", {
                "tenant_id": ctx.tenant_id,
                "complaint_id": incident_id,
                "status": new_status
            })
            
            return ComplaintResponse(**record)
        return None
    
    async def add_memo(self, incident_id: str, data: MemoCreate, ctx: TenantContext) -> Optional[ComplaintResponse]:
        record = self.store.get_by_id(ctx.tenant_id, incident_id)
        if record:
            if "memos" not in record:
                record["memos"] = []
            
            memo = {
                "id": str(uuid.uuid4()),
                "author": ctx.user_id,
                "author_name": data.author_name,
                "content": data.content,
                "timestamp": datetime.utcnow().isoformat(),
                "likes": [],
                "replies": []
            }
            record["memos"].append(memo)
            
            timeline_event = {
                "timestamp": memo["timestamp"],
                "action": "INTERNAL_NOTE_POSTED",
                "actor": data.author_name,
                "note": data.content[:100] + ("..." if len(data.content) > 100 else "")
            }
            record["timeline"].append(timeline_event)

            record["updated_at"] = datetime.utcnow()
            
            # Persist Update
            self.store.save_incident(ctx.tenant_id, incident_id, record)
            
            # Audit & Notify
            await audit_service.log_action(ctx.tenant_id, ctx.user_id, "MEMO_ADDED", "INCIDENT", incident_id, {"memo_id": memo["id"]})
            
            # Emit Real-time Update
            await bus.emit("INCIDENT_MEMO_ADDED", {
                "tenant_id": ctx.tenant_id,
                "incident_id": incident_id,
                "memo": memo,
                "timeline_event": timeline_event
            })
            
            return ComplaintResponse(**record)
        return None

    async def toggle_memo_like(self, incident_id: str, memo_id: str, ctx: TenantContext) -> Optional[ComplaintResponse]:
        record = self.store.get_by_id(ctx.tenant_id, incident_id)
        if record:
            for memo in record.get("memos", []):
                if memo["id"] == memo_id:
                    if "likes" not in memo: memo["likes"] = []
                    if ctx.user_id in memo["likes"]:
                        memo["likes"].remove(ctx.user_id)
                    else:
                        memo["likes"].append(ctx.user_id)
                    
                    self.store.save_incident(ctx.tenant_id, incident_id, record)

                    # Emit Update
                    await bus.emit("INCIDENT_MEMO_UPDATED", {
                        "tenant_id": ctx.tenant_id,
                        "incident_id": incident_id,
                        "memo_id": memo_id,
                        "likes": memo["likes"]
                    })

                    return ComplaintResponse(**record)
        return None

    async def add_memo_reply(self, incident_id: str, memo_id: str, data: MemoCreate, ctx: TenantContext) -> Optional[ComplaintResponse]:
        record = self.store.get_by_id(ctx.tenant_id, incident_id)
        if record:
            for memo in record.get("memos", []):
                if memo["id"] == memo_id:
                    if "replies" not in memo: memo["replies"] = []
                    reply = {
                        "id": str(uuid.uuid4()),
                        "author": ctx.user_id,
                        "author_name": data.author_name,
                        "content": data.content,
                        "timestamp": datetime.utcnow().isoformat(),
                        "likes": [],
                        "replies": []
                    }
                    memo["replies"].append(reply)
                    self.store.save_incident(ctx.tenant_id, incident_id, record)
                    
                    # Emit Update
                    await bus.emit("INCIDENT_MEMO_UPDATED", {
                        "tenant_id": ctx.tenant_id,
                        "incident_id": incident_id,
                        "memo_id": memo_id,
                        "reply": reply
                    })
                    
                    return ComplaintResponse(**record)
        return None

    async def get_all(self, ctx: TenantContext) -> List[ComplaintResponse]:
        raw_items = self.store.get_tenant_data(ctx.tenant_id)
        
        # Role-Based Data Isolation
        if ctx.role == "Reporter":
            raw_items = [i for i in raw_items if i.get("reporter_id") == ctx.user_id]
            
        return [ComplaintResponse(**RBACMasker.mask_incident(i, ctx.role)) for i in raw_items]

    async def get_by_id(self, incident_id: str, ctx: TenantContext) -> Optional[ComplaintResponse]:
        record = self.store.get_by_id(ctx.tenant_id, incident_id)
        if record:
            if ctx.role == "Reporter" and record.get("reporter_id") != ctx.user_id:
                return None
            return ComplaintResponse(**RBACMasker.mask_incident(record, ctx.role))
        return None

# Singleton Service
incident_service = IncidentService()
