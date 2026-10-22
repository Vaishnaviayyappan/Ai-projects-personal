import logging
from typing import Dict, Any, List
from app.modules.incidents.service import incident_service
from app.core.security import TenantContext

logger = logging.getLogger("AnalyticsService")

class AnalyticsService:
    """
    PHASE 7 Enterprise Analytics & Aggregated Read Models.
    Computes KPIs and distribution metrics with strict tenant isolation.
    """
    async def get_kpis(self, ctx: TenantContext) -> Dict[str, Any]:
        incidents = await incident_service.get_all(ctx)
        total = len(incidents)
        resolved = len([i for i in incidents if i.status == "resolved"])
        escalated = len([i for i in incidents if i.status == "escalated"])
        
        return {
            "total_volume": total,
            "resolution_rate": f"{(resolved / total * 100):.1f}%" if total > 0 else "0%",
            "escalation_rate": f"{(escalated / total * 100):.1f}%" if total > 0 else "0%",
            "active_investigations": len([i for i in incidents if i.status == "investigating" or i.status == "open"])
        }

    async def get_status_distribution(self, ctx: TenantContext) -> List[Dict[str, Any]]:
        incidents = await incident_service.get_all(ctx)
        dist = {}
        for i in incidents:
            dist[i.status] = dist.get(i.status, 0) + 1
            
        return [{"name": s.upper(), "value": v} for s, v in dist.items()]

    async def get_priority_trends(self, ctx: TenantContext) -> List[Dict[str, Any]]:
        incidents = await incident_service.get_all(ctx)
        # Mock trend by mapping created_at to days (simplified)
        # In production, we would use a GROUP BY in SQL
        return [
            {"name": "Urgent", "count": len([i for i in incidents if i.priority == "urgent"])},
            {"name": "High", "count": len([i for i in incidents if i.priority == "high"])},
            {"name": "Medium", "count": len([i for i in incidents if i.priority == "medium"])},
            {"name": "Low", "count": len([i for i in incidents if i.priority == "low"])},
        ]

# Singleton Analytics Service
analytics_service = AnalyticsService()
