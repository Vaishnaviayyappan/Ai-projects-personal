from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Appointment, Lead, User
from app.schemas import AppointmentOut, LeadOut
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["crm"])


@router.get("/leads", response_model=list[LeadOut])
def list_leads(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Lead).filter(Lead.organization_id == user.organization_id)
        .order_by(Lead.created_at.desc()).limit(200).all()
    )


@router.get("/appointments", response_model=list[AppointmentOut])
def list_appointments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Appointment).filter(Appointment.organization_id == user.organization_id)
        .order_by(Appointment.scheduled_time.desc()).limit(200).all()
    )
