from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Complaint, Product, RiskAssessment, CapaRecord
from app.schemas import ComplaintCreate, ComplaintResponse

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    product_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all QMS complaints with optional search and filters."""
    query = db.query(Complaint).order_by(desc(Complaint.created_at))

    if status:
        query = query.filter(Complaint.status == status)
    
    if risk_level:
        query = query.join(RiskAssessment).filter(RiskAssessment.risk_level == risk_level)

    if product_type:
        query = query.join(Product).filter(Product.product_type == product_type)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Complaint.complaint_number.ilike(search_fmt)) |
            (Complaint.customer_name.ilike(search_fmt)) |
            (Complaint.batch_number.ilike(search_fmt)) |
            (Complaint.defect_category.ilike(search_fmt))
        )

    complaints = query.all()
    return complaints

@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Fetch high-level QMS dashboard KPIs and metrics."""
    total_complaints = db.query(Complaint).count()
    
    critical_count = db.query(RiskAssessment).filter(RiskAssessment.risk_level == "Critical").count()
    major_count = db.query(RiskAssessment).filter(RiskAssessment.risk_level == "Major").count()
    minor_count = db.query(RiskAssessment).filter(RiskAssessment.risk_level == "Minor").count()
    
    open_capas = db.query(CapaRecord).count()
    far_reportable = db.query(RiskAssessment).filter(RiskAssessment.regulatory_reportable == True).count()
    
    api_complaints = db.query(Complaint).join(Product).filter(Product.product_type == "API").count()
    fdf_complaints = db.query(Complaint).join(Product).filter(Product.product_type == "FDF").count()

    return {
        "total_complaints": total_complaints,
        "critical_risk": critical_count,
        "major_risk": major_count,
        "minor_risk": minor_count,
        "open_capas": open_capas,
        "far_reportable_count": far_reportable,
        "product_type_breakdown": {
            "API": api_complaints,
            "FDF": fdf_complaints
        }
    }

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Fetch full details for a single complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.post("", response_model=ComplaintResponse)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """Create a new QMS Customer Complaint record."""
    # Generate unique complaint number (e.g., CMP-2026-004)
    year = datetime.now().year
    count = db.query(Complaint).count() + 1
    complaint_number = f"CMP-{year}-{count:03d}"

    # Verify product exists
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=400, detail="Invalid Product ID")

    new_complaint = Complaint(
        complaint_number=complaint_number,
        customer_name=payload.customer_name,
        customer_contact=payload.customer_contact,
        reporter_email=payload.reporter_email,
        product_id=payload.product_id,
        batch_number=payload.batch_number,
        manufacture_date=payload.manufacture_date,
        expiry_date=payload.expiry_date,
        complainant_type=payload.complainant_type,
        event_date=payload.event_date,
        defect_category=payload.defect_category,
        complaint_description=payload.complaint_description,
        sample_received=payload.sample_received,
        storage_condition=payload.storage_condition,
        status="New"
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@router.put("/{complaint_id}/status")
def update_complaint_status(complaint_id: int, status: str, db: Session = Depends(get_db)):
    """Update status of a complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.status = status
    db.commit()
    return {"message": "Status updated successfully", "complaint_number": complaint.complaint_number, "status": status}
