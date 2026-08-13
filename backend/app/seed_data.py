import os
import sys

# Ensure parent directory is in sys.path for direct script execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import Product, Complaint, RiskAssessment, CapaRecord
from datetime import datetime, timedelta

def init_db():
    # Create all database tables
    Base.metadata.create_all(bind=engine)

def seed_pharma_data():
    db: Session = SessionLocal()
    try:
        # Check if products already exist
        if db.query(Product).count() > 0:
            print("Database already contains seeded data. Skipping seed.")
            return

        print("Seeding Pharmaceutical API & FDF products...")
        products = [
            Product(
                product_code="PRD-API-001",
                product_name="Paracetamol Active Pharmaceutical Ingredient (API)",
                product_type="API",
                dosage_form="Micronized Powder",
                strength_spec="99.8% Purity Grade"
            ),
            Product(
                product_code="PRD-API-002",
                product_name="Amoxicillin Trihydrate API",
                product_type="API",
                dosage_form="Compacted Powder",
                strength_spec="Ph. Eur. / USP Grade"
            ),
            Product(
                product_code="PRD-FDF-101",
                product_name="Metformin HCl 850mg Extended Release Tablets",
                product_type="FDF",
                dosage_form="Oral Tablet",
                strength_spec="850 mg"
            ),
            Product(
                product_code="PRD-FDF-102",
                product_name="Atorvastatin Calcium 20mg Film-Coated Tablets",
                product_type="FDF",
                dosage_form="Film-Coated Tablet",
                strength_spec="20 mg"
            ),
            Product(
                product_code="PRD-FDF-103",
                product_name="Ciprofloxacin 0.3% Ophthalmic Solution",
                product_type="FDF",
                dosage_form="Ophthalmic Drop",
                strength_spec="0.3% w/v"
            ),
            Product(
                product_code="PRD-FDF-104",
                product_name="Ceftriaxone Sodium 1g Powder for Injection",
                product_type="FDF",
                dosage_form="Sterile Lyophilized Vial",
                strength_spec="1 g per Vial"
            )
        ]
        
        db.add_all(products)
        db.commit()

        # Query products to link IDs
        p_paracetamol = db.query(Product).filter_by(product_code="PRD-API-001").first()
        p_metformin = db.query(Product).filter_by(product_code="PRD-FDF-101").first()
        p_amoxicillin = db.query(Product).filter_by(product_code="PRD-API-002").first()
        p_ceftriaxone = db.query(Product).filter_by(product_code="PRD-FDF-104").first()

        print("Seeding Historical QMS Customer Complaints & Risk Assessments...")

        # Complaint 1: Paracetamol Discoloration
        cmp1 = Complaint(
            complaint_number="CMP-2026-001",
            customer_name="Global Formulation Labs Ltd",
            customer_contact="+1 (555) 234-8900",
            reporter_email="qa.intake@globalformulations.com",
            product_id=p_paracetamol.id,
            batch_number="BAT-2026-0811A",
            manufacture_date="2026-01-15",
            expiry_date="2029-01-14",
            complainant_type="API Customer",
            event_date="2026-02-01",
            defect_category="Physical Defect / Discoloration",
            complaint_description="Upon opening 25kg drum #04 of Paracetamol API batch BAT-2026-0811A, yellowish specks and slight clump discoloration were observed on the top surface layer.",
            sample_received=True,
            storage_condition="Controlled Room Temperature 20-25°C",
            status="In Investigation"
        )
        db.add(cmp1)
        db.commit()

        risk1 = RiskAssessment(
            complaint_id=cmp1.id,
            severity_score=3,
            probability_score=3,
            detectability_score=2,
            rpn_score=18,
            risk_level="Major",
            patient_safety_impact=False,
            regulatory_reportable=False,
            ai_reasoning="Discoloration indicates potential thermal degradation or localized humidity exposure during drum filling. Low direct patient risk as API undergoes formulation screening, but requires batch QA hold.",
            completeness_score=100.0
        )
        db.add(risk1)

        capa1 = CapaRecord(
            complaint_id=cmp1.id,
            root_cause_category="Environment / Packaging",
            root_cause_summary="Desiccant pouch missing in drum #04 line sealing station during high-humidity packaging shift.",
            corrective_action="Quarantine remaining 12 drums from batch BAT-2026-0811A for re-testing and assay verification.",
            preventive_action="Upgrade drum sealing station with automated desiccant optical detection sensor (SOP-PKG-089).",
            target_completion_date="2026-03-15",
            assigned_department="Packaging QA"
        )
        db.add(capa1)

        # Complaint 2: Metformin Blister Seal Leak
        cmp2 = Complaint(
            complaint_number="CMP-2026-002",
            customer_name="Apex Health Distributors",
            customer_contact="+44 20 7946 0912",
            reporter_email="complaints@apexhealth.co.uk",
            product_id=p_metformin.id,
            batch_number="BAT-2026-0745B",
            manufacture_date="2025-11-10",
            expiry_date="2028-11-09",
            complainant_type="Distributor",
            event_date="2026-01-20",
            defect_category="Labelling / Packaging Defect",
            complaint_description="Multiple blister strips in carton 88 show unsealed edges on pocket #4 and #5. Tablets appear soft and discolored due to moisture ingress.",
            sample_received=True,
            storage_condition="Controlled Room Temperature 20-25°C",
            status="CAPA Initiated"
        )
        db.add(cmp2)
        db.commit()

        risk2 = RiskAssessment(
            complaint_id=cmp2.id,
            severity_score=4,
            probability_score=3,
            detectability_score=3,
            rpn_score=36,
            risk_level="Major",
            patient_safety_impact=True,
            regulatory_reportable=False,
            ai_reasoning="Defective blister seals compromise moisture barrier, causing potency loss of Metformin. Potential therapeutic under-dosing if consumed.",
            completeness_score=100.0
        )
        db.add(risk2)

        # Complaint 3: Ceftriaxone Particulate Matter (Critical)
        cmp3 = Complaint(
            complaint_number="CMP-2026-003",
            customer_name="St. Jude Memorial Hospital Pharmacy",
            customer_contact="+1 (555) 987-6543",
            reporter_email="pharmacy.director@stjudehospital.org",
            product_id=p_ceftriaxone.id,
            batch_number="BAT-2026-0888X",
            manufacture_date="2026-01-05",
            expiry_date="2028-01-04",
            complainant_type="Hospital Pharmacy",
            event_date="2026-02-10",
            defect_category="Contamination / Foreign Particulate",
            complaint_description="Hospital pharmacist detected visible dark particulate floating in reconstituted solution of Ceftriaxone 1g vial prior to patient administration.",
            sample_received=True,
            storage_condition="Refrigerated 2-8°C",
            status="Under Risk Review"
        )
        db.add(cmp3)
        db.commit()

        risk3 = RiskAssessment(
            complaint_id=cmp3.id,
            severity_score=5,
            probability_score=2,
            detectability_score=4,
            rpn_score=40,
            risk_level="Critical",
            patient_safety_impact=True,
            regulatory_reportable=True, # FAR reportable!
            ai_reasoning="CRITICAL PATIENT RISK: Injectable particulate matter poses risk of vascular occlusion or systemic embolic reaction. Requires urgent 3-day FDA Field Alert Report (FAR) notification.",
            completeness_score=100.0
        )
        db.add(risk3)

        db.commit()
        print("Pre-seeded Pharma QMS dataset successfully initialized!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed_pharma_data()
