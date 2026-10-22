import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.schemas.domain import ComplaintStatus, ComplaintPriority

logger = logging.getLogger("PolicyEngine")

class PolicyRule:
    def __init__(self, tenant_id: str):
        # Default Enterprise Policy (Mocking Data-driven storage)
        self.config = {
            "TENANT_ALPHA": {
                "SLA": {
                    "urgent": 4, # hours
                    "high": 24,
                    "medium": 48,
                    "low": 72
                },
                "AUTO_ESCALATION": [
                    {"category": "Fraud", "threshold": "any"},
                    {"category": "Harassment", "threshold": "any"}
                ]
            }
        }.get(tenant_id, {
            "SLA": {"urgent": 24, "high": 48, "medium": 72, "low": 120},
            "AUTO_ESCALATION": []
        })

class PolicyService:
    """
    PHASE 6 Deterministic Policy & SLA Engine.
    Encapsulates rules for escalation and timeline governance.
    """
    def get_sla_deadline(self, tenant_id: str, priority: ComplaintPriority, start_time: datetime) -> datetime:
        config = PolicyRule(tenant_id).config
        hours = config["SLA"].get(priority, 48)
        return start_time + timedelta(hours=hours)

    def evaluate_escalation(self, tenant_id: str, incident: Dict[str, Any]) -> bool:
        """
        Policy Reasoning: Does this case meet auto-escalation criteria?
        """
        config = PolicyRule(tenant_id).config
        for rule in config["AUTO_ESCALATION"]:
            if rule["category"].lower() in incident.get("ai_category", "").lower():
                return True
        return False

# Global Policy Service
policy_service = PolicyService()
