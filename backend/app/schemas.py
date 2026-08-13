from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Product Schemas ---
class ProductBase(BaseModel):
    product_code: str
    product_name: str
    product_type: str # 'API' or 'FDF'
    dosage_form: str
    strength_spec: Optional[str] = None

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

# --- Risk Assessment Schemas ---
class RiskAssessmentBase(BaseModel):
    severity_score: int = Field(ge=1, le=5)
    probability_score: int = Field(ge=1, le=5)
    detectability_score: int = Field(ge=1, le=5)
    rpn_score: int
    risk_level: str # 'Critical', 'Major', 'Minor'
    patient_safety_impact: bool
    regulatory_reportable: bool
    ai_reasoning: Optional[str] = None
    completeness_score: Optional[float] = 100.0
    missing_fields: Optional[str] = None

class RiskAssessmentResponse(RiskAssessmentBase):
    id: int
    complaint_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- CAPA Schemas ---
class CapaBase(BaseModel):
    root_cause_category: str
    root_cause_summary: str
    corrective_action: str
    preventive_action: str
    target_completion_date: Optional[str] = None
    assigned_department: Optional[str] = "QA"

class CapaResponse(CapaBase):
    id: int
    complaint_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Complaint Schemas ---
class ComplaintCreate(BaseModel):
    customer_name: str
    customer_contact: Optional[str] = None
    reporter_email: Optional[str] = None
    product_id: int
    batch_number: str
    manufacture_date: Optional[str] = None
    expiry_date: Optional[str] = None
    complainant_type: str = "Customer"
    event_date: Optional[str] = None
    defect_category: str
    complaint_description: str
    sample_received: bool = False
    storage_condition: Optional[str] = "Controlled Room Temperature 20-25°C"

class ComplaintResponse(BaseModel):
    id: int
    complaint_number: str
    customer_name: str
    customer_contact: Optional[str] = None
    reporter_email: Optional[str] = None
    product_id: int
    batch_number: str
    manufacture_date: Optional[str] = None
    expiry_date: Optional[str] = None
    complainant_type: str
    event_date: Optional[str] = None
    defect_category: str
    complaint_description: str
    sample_received: bool
    storage_condition: Optional[str] = None
    status: str
    created_at: datetime
    product: Optional[ProductResponse] = None
    risk_assessment: Optional[RiskAssessmentResponse] = None
    capa_records: Optional[List[CapaResponse]] = []

    class Config:
        from_attributes = True

# --- AI Intake Request Schema ---
class AIIntakeRequest(BaseModel):
    raw_text: str # Text extracted from customer email, PDF, or complaint description
    file_name: Optional[str] = None

class AIIntakeResponse(BaseModel):
    extracted_fields: dict
    completeness_check: dict
    risk_assessment: dict
    duplicate_detection: dict
    rca_capa_recommendations: dict
    executive_summary: str
