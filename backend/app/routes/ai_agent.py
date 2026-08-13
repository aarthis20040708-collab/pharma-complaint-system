from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.schemas import AIIntakeRequest
from app.agent.graph import run_qms_ai_analysis
from app.models import Complaint, Product, RiskAssessment, CapaRecord

router = APIRouter(prefix="/api/complaints", tags=["AI Copilot Agent"])

@router.post("/analyze")
def analyze_complaint_text(payload: AIIntakeRequest):
    """
    Execute the multi-node LangGraph AI workflow on raw complaint text, customer email, or PDF content.
    Returns structured fields, completeness check, duplicate alerts, risk classification (RPN), RCA/CAPA recommendations, and summary.
    """
    if not payload.raw_text or len(payload.raw_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Raw text must be at least 10 characters long.")

    result = run_qms_ai_analysis(payload.raw_text, payload.file_name)
    return {
        "extracted_fields": result.get("extracted_fields", {}),
        "completeness": result.get("completeness", {}),
        "duplicates": result.get("duplicates", {}),
        "risk_assessment": result.get("risk_assessment", {}),
        "rca_capa": result.get("rca_capa", {}),
        "executive_summary": result.get("executive_summary", ""),
        "errors": result.get("errors", [])
    }

@router.post("/upload-document")
async def analyze_uploaded_document(file: UploadFile = File(...)):
    """Accept PDF/Text/Email file upload, parse text content, and trigger LangGraph AI Workflow."""
    try:
        content = await file.read()
        text_content = content.decode("utf-8", errors="ignore")
        if not text_content or len(text_content.strip()) < 10:
            text_content = f"Uploaded document filename: {file.filename}. Defect reported in pharmaceutical batch. Please inspect document."
        
        result = run_qms_ai_analysis(text_content, file.filename)
        return {
            "file_name": file.filename,
            "extracted_fields": result.get("extracted_fields", {}),
            "completeness": result.get("completeness", {}),
            "duplicates": result.get("duplicates", {}),
            "risk_assessment": result.get("risk_assessment", {}),
            "rca_capa": result.get("rca_capa", {}),
            "executive_summary": result.get("executive_summary", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.post("/auto-log")
def auto_log_complaint_from_ai(payload: AIIntakeRequest, db: Session = Depends(get_db)):
    """Execute LangGraph AI analysis and automatically persist the complaint, risk assessment, and CAPA to the database."""
    ai_res = run_qms_ai_analysis(payload.raw_text, payload.file_name)
    
    extracted = ai_res.get("extracted_fields", {})
    risk = ai_res.get("risk_assessment", {})
    rca = ai_res.get("rca_capa", {})
    comp = ai_res.get("completeness", {})

    # Match product in DB or default to first product
    product_name = extracted.get("product_name", "")
    product = db.query(Product).filter(Product.product_name.ilike(f"%{product_name[:15]}%")).first()
    if not product:
        product = db.query(Product).first()

    # Generate unique complaint tracking number
    year = datetime.now().year
    count = db.query(Complaint).count() + 1
    complaint_number = f"CMP-{year}-{count:03d}"

    new_complaint = Complaint(
        complaint_number=complaint_number,
        customer_name=extracted.get("customer_name") or "Intake Customer",
        customer_contact=extracted.get("customer_contact"),
        reporter_email=extracted.get("reporter_email"),
        product_id=product.id,
        batch_number=extracted.get("batch_number") or "BAT-2026-AUTO",
        manufacture_date=extracted.get("manufacture_date") or "2026-01-15",
        expiry_date=extracted.get("expiry_date") or "2029-01-14",
        complainant_type=extracted.get("complainant_type") or "Customer",
        event_date=extracted.get("event_date") or "2026-02-10",
        defect_category=extracted.get("defect_category") or "Physical Defect / Discoloration",
        complaint_description=extracted.get("complaint_description") or payload.raw_text,
        sample_received=extracted.get("sample_received", False),
        storage_condition=extracted.get("storage_condition") or "Controlled Room Temperature 20-25°C",
        status="Under Risk Review"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # Persist Risk Assessment
    risk_record = RiskAssessment(
        complaint_id=new_complaint.id,
        severity_score=risk.get("severity_score", 3),
        probability_score=risk.get("probability_score", 2),
        detectability_score=risk.get("detectability_score", 3),
        rpn_score=risk.get("rpn_score", 18),
        risk_level=risk.get("risk_level", "Major"),
        patient_safety_impact=risk.get("patient_safety_impact", False),
        regulatory_reportable=risk.get("regulatory_reportable", False),
        ai_reasoning=risk.get("ai_reasoning", ""),
        completeness_score=comp.get("score_percentage", 100.0),
        missing_fields=str(comp.get("missing_fields", []))
    )
    db.add(risk_record)

    # Persist CAPA Record if recommended
    if rca.get("root_cause_summary"):
        capa_record = CapaRecord(
            complaint_id=new_complaint.id,
            root_cause_category=rca.get("root_cause_category", "Environment"),
            root_cause_summary=rca.get("root_cause_summary", ""),
            corrective_action=rca.get("corrective_action", ""),
            preventive_action=rca.get("preventive_action", ""),
            target_completion_date=rca.get("target_completion_date"),
            assigned_department=rca.get("assigned_department", "QA")
        )
        db.add(capa_record)

    db.commit()

    return {
        "message": "Complaint, Risk Assessment, and CAPA auto-logged successfully",
        "complaint_id": new_complaint.id,
        "complaint_number": new_complaint.complaint_number,
        "risk_level": risk_record.risk_level,
        "rpn_score": risk_record.rpn_score
    }
