from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.modules.analytics.service import analytics_service
from app.core.security import TenantContext, get_current_tenant, rbac_required

router = APIRouter()

# Oversight Role Cluster
OVERSIGHT_ROLES = ["Department Supervisor", "Compliance Officer", "Escalation Authority", "System Auditor", "System Administrator"]

@router.get("/summary")
async def get_analytics_summary(ctx: TenantContext = Depends(rbac_required(OVERSIGHT_ROLES))):
    """
    Returns high-level KPIs for the enterprise dashboard.
    """
    return await analytics_service.get_kpis(ctx)

@router.get("/distribution")
async def get_status_distribution(ctx: TenantContext = Depends(rbac_required(OVERSIGHT_ROLES))):
    """
    Returns data for status charts.
    """
    return await analytics_service.get_status_distribution(ctx)

@router.get("/trends")
async def get_priority_trends(ctx: TenantContext = Depends(rbac_required(OVERSIGHT_ROLES))):
    """
    Returns data for trend charts.
    """
    return await analytics_service.get_priority_trends(ctx)
