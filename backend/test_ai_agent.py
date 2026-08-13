import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

sample_complaint_email = """
From: qa.intake@globalformulations.com
Date: Feb 10, 2026
Subject: URGENT: Discoloration in Paracetamol API Batch BAT-2026-0811A

Dear Quality Assurance Team,

Upon opening 25kg drum #04 of Paracetamol Active Pharmaceutical Ingredient (API) batch BAT-2026-0811A, 
we observed yellowish specks and slight clump discoloration on the top surface layer. 
We have retained sample drum #04 in our warehouse at Controlled Room Temperature 20-25°C.
Please investigate urgently as our tableting batch is currently on QA hold.

Best regards,
Quality Assurance Lead
Global Formulation Labs
"""

def test_ai_agent():
    print("Testing POST /api/complaints/analyze with LangGraph workflow...")
    res = client.post("/api/complaints/analyze", json={
        "raw_text": sample_complaint_email,
        "file_name": "customer_complaint_email.txt"
    })
    
    assert res.status_code == 200, f"Analysis failed: {res.text}"
    data = res.json()
    
    print("\n--- Extracted Fields ---")
    print(data.get("extracted_fields"))

    print("\n--- Completeness Check ---")
    print(data.get("completeness"))

    print("\n--- Duplicate Detection ---")
    print(data.get("duplicates"))

    print("\n--- Risk Assessment (RPN & Level) ---")
    print(data.get("risk_assessment"))

    print("\n--- RCA & CAPA Recommendation ---")
    print(data.get("rca_capa"))

    print("\n--- Executive QMS Summary ---")
    print(data.get("executive_summary"))

    print("\nLANGGRAPH MULTI-NODE AI AGENT PIPELINE VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_ai_agent()
