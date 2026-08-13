from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(50), unique=True, index=True, nullable=False)
    product_name = Column(String(200), nullable=False)
    product_type = Column(String(20), nullable=False) # 'API' or 'FDF'
    dosage_form = Column(String(100), nullable=False) # e.g. Powder, Tablet, Capsule, Injectable
    strength_spec = Column(String(100), nullable=True) # e.g. 500mg, 99.5% purity
    
    complaints = relationship("Complaint", back_populates="product")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_name = Column(String(200), nullable=False)
    customer_contact = Column(String(100), nullable=True)
    reporter_email = Column(String(100), nullable=True)
    
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_number = Column(String(100), index=True, nullable=False)
    manufacture_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    
    complainant_type = Column(String(50), nullable=False, default="Customer")
    event_date = Column(String(50), nullable=True)
    defect_category = Column(String(100), nullable=False)
    complaint_description = Column(Text, nullable=False)
    
    sample_received = Column(Boolean, default=False)
    storage_condition = Column(String(100), nullable=True, default="Controlled Room Temperature 20-25°C")
    status = Column(String(50), default="New") # New, In Investigation, Risk Reviewed, CAPA Initiated, Closed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="complaints")
    risk_assessment = relationship("RiskAssessment", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    capa_records = relationship("CapaRecord", back_populates="complaint", cascade="all, delete-orphan")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, unique=True)
    
    severity_score = Column(Integer, nullable=False) # 1 (Low) - 5 (Critical)
    probability_score = Column(Integer, nullable=False) # 1 (Rare) - 5 (Frequent)
    detectability_score = Column(Integer, nullable=False) # 1 (Easy) - 5 (Hard)
    rpn_score = Column(Integer, nullable=False) # Severity x Probability x Detectability
    risk_level = Column(String(20), nullable=False) # Critical, Major, Minor
    
    patient_safety_impact = Column(Boolean, default=False)
    regulatory_reportable = Column(Boolean, default=False) # e.g. FDA Field Alert Report (FAR)
    ai_reasoning = Column(Text, nullable=True)
    completeness_score = Column(Float, default=100.0) # Percentage completeness
    missing_fields = Column(Text, nullable=True) # JSON list string of missing fields
    
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="risk_assessment")

class CapaRecord(Base):
    __tablename__ = "capa_records"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    
    root_cause_category = Column(String(100), nullable=False) # Equipment, Operator, Raw Material, Environment, SOP
    root_cause_summary = Column(Text, nullable=False)
    corrective_action = Column(Text, nullable=False)
    preventive_action = Column(Text, nullable=False)
    target_completion_date = Column(String(50), nullable=True)
    assigned_department = Column(String(100), default="QA")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="capa_records")
