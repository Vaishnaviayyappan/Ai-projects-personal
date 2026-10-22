from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.db.database import get_db
from app.models.domain import ComplaintStatus

router = APIRouter()

class AnalyticsSummary(BaseModel):
    total_open: int
    total_resolved: int
    avg_resolution_time_days: float
    high_risk_count: int
    chart_data: list

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics(db = Depends(get_db)):
    collection = db["complaints"]
    
    total_open = await collection.count_documents({"status": {"$in": [ComplaintStatus.OPEN.value, ComplaintStatus.IN_PROGRESS.value]}})
    total_resolved = await collection.count_documents({"status": ComplaintStatus.RESOLVED.value})
    high_risk = await collection.count_documents({"priority": "urgent"})
    
    # Simple semantic grouping pipeline for the chart
    pipeline = [
        {"$group": {
            "_id": "$ai_category",
            "count": {"$sum": 1}
        }}
    ]
    cursor = collection.aggregate(pipeline)
    groups = await cursor.to_list(100)
    
    # Format for recharts
    fraud_count = sum([g["count"] for g in groups if "Fraud" in g["_id"] or "Ethics" in g["_id"]])
    hr_count = sum([g["count"] for g in groups if "Harassment" in g["_id"] or "HR" in g["_id"]])
    other_count = sum([g["count"] for g in groups if g["_id"] not in ["Fraud", "Harassment"]])
    
    chart_data = [
        {"name": 'Current', "fraud": fraud_count, "hr": hr_count, "other": other_count}
    ]
    
    return AnalyticsSummary(
        total_open=total_open,
        total_resolved=total_resolved,
        avg_resolution_time_days=1.2, # Placeholder computation
        high_risk_count=high_risk,
        chart_data=chart_data
    )
