import logging
from datetime import datetime
from typing import Any, Dict, List
from app.infrastructure.event_bus import bus

logger = logging.getLogger("AuditService")

class AuditService:
    """
    Append-only Enterprise Audit Logging System.
    Ensures every action is recorded with tenant and user context.
    """
    def __init__(self):
        self._audit_log: List[Dict[str, Any]] = []

    async def log_action(
        self, 
        tenant_id: str, 
        user_id: str, 
        action: str, 
        entity_type: str, 
        entity_id: str, 
        payload: Dict[str, Any]
    ):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "tenant_id": tenant_id,
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "payload": payload
        }
        self._audit_log.append(entry)
        logger.info(f"AUDIT [{tenant_id}] User {user_id} performed {action} on {entity_type}:{entity_id}")
        
        # Broadcast for real-time observability
        await bus.emit("AUDIT_LOG_CREATED", entry)

    def get_tenant_logs(self, tenant_id: str) -> List[Dict[str, Any]]:
        return [log for log in self._audit_log if log["tenant_id"] == tenant_id]

# Singleton Global Audit
audit_service = AuditService()
