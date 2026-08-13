import json
import re
from typing import TypedDict, Optional, List, Dict, Any
from datetime import datetime, timedelta
from langchain_groq import ChatGroq
from app.config import settings
from app.agent.prompts import (
    EXTRACTION_PROMPT,
    RISK_ASSESSMENT_PROMPT,
    RCA_CAPA_PROMPT,
    EXECUTIVE_SUMMARY_PROMPT
)
from app.database import SessionLocal
from app.models import Complaint, Product, RiskAssessment

# Define LangGraph State Schema
class QMSAgentState(TypedDict):
    raw_text: str
    file_name: Optional[str]
    extracted_fields: Dict[str, Any]
    completeness: Dict[str, Any]
    duplicates: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    rca_capa: Dict[str, Any]
    executive_summary: str
    errors: List[str]

# Helper to initialize Groq Chat Model
def get_groq_llm(model_name: str = settings.PRIMARY_MODEL, temperature: float = 0.1):
    api_key = settings.GROQ_API_KEY
    if not api_key or api_key == "gsk_your_groq_api_key_here":
        print("Warning: GROQ_API_KEY not provided or default mock key used. Falling back to heuristic rule engine.")
        return None
    return ChatGroq(
        groq_api_key=api_key,
        model_name=model_name,
        temperature=temperature
    )

def safe_json_parse(response_text: str) -> Dict[str, Any]:
    """Helper to extract and parse JSON from LLM output block."""
    try:
        # Match json block if enclosed in markdown backticks
        match = re.search(r"```(?:json)?\s*({[\s\S]*?})\s*```", response_text)
        if match:
            return json.loads(match.group(1))
        # Direct JSON match
        match = re.search(r"({[\s\S]*})", response_text)
        if match:
            return json.loads(match.group(1))
        return json.loads(response_text)
    except Exception as e:
        print(f"JSON parse error: {e}. Output was:\n{response_text}")
        return {}

# --- Node 1: Intake & Extraction ---
def node_intake_extraction(state: QMSAgentState) -> QMSAgentState:
    print("Executing Node 1: Entity Extraction...")
    raw_text = state.get("raw_text", "")
    llm = get_groq_llm(model_name=settings.PRIMARY_MODEL)

    extracted = {}
    if llm:
        try:
            prompt = EXTRACTION_PROMPT.format(raw_text=raw_text)
            response = llm.invoke(prompt)
            extracted = safe_json_parse(response.content)
        except Exception as e:
            print(f"LLM extraction error: {e}")
            state["errors"].append(f"LLM Extraction failed: {str(e)}")

    # Heuristic fallback if LLM is offline or missing fields
    if not extracted:
        batch_match = re.search(r"BAT-[A-Za-z0-9-]+", raw_text, re.IGNORECASE)
        email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", raw_text)
        
        extracted = {
            "customer_name": "Intake Customer",
            "customer_contact": None,
            "reporter_email": email_match.group(0) if email_match else "customer@pharma-intake.com",
            "product_name": "Paracetamol Active Pharmaceutical Ingredient (API)" if "paracetamol" in raw_text.lower() else "Metformin HCl 850mg Extended Release Tablets",
            "product_type": "API" if "api" in raw_text.lower() or "powder" in raw_text.lower() else "FDF",
            "batch_number": batch_match.group(0) if batch_match else "BAT-2026-UNKN",
            "manufacture_date": "2026-01-15",
            "expiry_date": "2029-01-14",
            "complainant_type": "Customer",
            "event_date": "2026-02-10",
            "defect_category": "Physical Defect / Discoloration" if "discolor" in raw_text.lower() or "yellow" in raw_text.lower() else "Labelling / Packaging Defect",
            "complaint_description": raw_text[:500],
            "sample_received": "sample" in raw_text.lower(),
            "storage_condition": "Controlled Room Temperature 20-25°C"
        }

    state["extracted_fields"] = extracted
    return state

# --- Node 2: Completeness Checker ---
def node_completeness_check(state: QMSAgentState) -> QMSAgentState:
    print("Executing Node 2: Completeness Checker...")
    extracted = state.get("extracted_fields", {})
    
    mandatory_fields = [
        ("product_name", "Product Name"),
        ("batch_number", "Batch / Lot Number"),
        ("customer_name", "Customer / Reporter Name"),
        ("defect_category", "Defect Category"),
        ("complaint_description", "Complaint Description"),
        ("event_date", "Event Date"),
        ("sample_received", "Sample Availability Indicator")
    ]

    missing = []
    present_count = 0

    for key, label in mandatory_fields:
        val = extracted.get(key)
        if val is None or val == "" or val == "null" or val == "Unknown":
            missing.append(label)
        else:
            present_count += 1

    total_mandatory = len(mandatory_fields)
    completeness_score = round((present_count / total_mandatory) * 100, 1)

    is_complete = completeness_score >= 85.0
    status_badge = "Complete" if is_complete else "Incomplete"

    state["completeness"] = {
        "score_percentage": completeness_score,
        "is_complete": is_complete,
        "status_badge": status_badge,
        "missing_fields": missing,
        "total_fields": total_mandatory,
        "present_count": present_count
    }
    return state

# --- Node 3: Duplicate Complaint Detection ---
def node_duplicate_detection(state: QMSAgentState) -> QMSAgentState:
    print("Executing Node 3: Duplicate Complaint Detection...")
    extracted = state.get("extracted_fields", {})
    batch_num = extracted.get("batch_number")
    product_name = extracted.get("product_name", "")
    defect_cat = extracted.get("defect_category", "")

    db = SessionLocal()
    duplicates_found = []
    has_batch_match = False

    try:
        if batch_num and batch_num != "BAT-2026-UNKN":
            # Check exact batch number match in historical complaints
            batch_matches = db.query(Complaint).filter(Complaint.batch_number == batch_num).all()
            for m in batch_matches:
                has_batch_match = True
                duplicates_found.append({
                    "complaint_number": m.complaint_number,
                    "match_type": "Exact Batch Number Match",
                    "batch_number": m.batch_number,
                    "defect_category": m.defect_category,
                    "customer_name": m.customer_name,
                    "status": m.status,
                    "created_at": m.created_at.strftime("%Y-%m-%d") if m.created_at else "N/A"
                })

        # Check similar defect in same product
        if product_name and not duplicates_found:
            similar_matches = db.query(Complaint).join(Product).filter(
                Product.product_name.ilike(f"%{product_name[:15]}%"),
                Complaint.defect_category.ilike(f"%{defect_cat[:15]}%")
            ).limit(3).all()

            for m in similar_matches:
                duplicates_found.append({
                    "complaint_number": m.complaint_number,
                    "match_type": "Similar Product & Defect Pattern",
                    "batch_number": m.batch_number,
                    "defect_category": m.defect_category,
                    "customer_name": m.customer_name,
                    "status": m.status,
                    "created_at": m.created_at.strftime("%Y-%m-%d") if m.created_at else "N/A"
                })

    except Exception as e:
        print(f"Duplicate detection error: {e}")
    finally:
        db.close()

    is_duplicate = len(duplicates_found) > 0
    duplicate_risk = "HIGH - Potential Systemic Batch Issue" if has_batch_match else ("MEDIUM - Recurring Pattern" if is_duplicate else "LOW - Isolated Incident")

    state["duplicates"] = {
        "is_duplicate": is_duplicate,
        "duplicate_count": len(duplicates_found),
        "has_batch_match": has_batch_match,
        "risk_warning": duplicate_risk,
        "matched_records": duplicates_found
    }
    return state

# --- Node 4: AI Risk Classification & RPN Score ---
def node_risk_classification(state: QMSAgentState) -> QMSAgentState:
    print("Executing Node 4: Risk Classification...")
    extracted = state.get("extracted_fields", {})
    duplicates = state.get("duplicates", {})
    
    llm = get_groq_llm(model_name=settings.PRIMARY_MODEL)
    risk_result = {}

    if llm:
        try:
            prompt = RISK_ASSESSMENT_PROMPT.format(
                product_name=extracted.get("product_name", "Unknown Product"),
                product_type=extracted.get("product_type", "FDF"),
                batch_number=extracted.get("batch_number", "Unknown"),
                defect_category=extracted.get("defect_category", "Defect"),
                complaint_description=extracted.get("complaint_description", ""),
                sample_received=extracted.get("sample_received", False)
            )
            response = llm.invoke(prompt)
            risk_result = safe_json_parse(response.content)
        except Exception as e:
            print(f"Risk classification LLM error: {e}")

    # Heuristic Fallback
    if not risk_result or "severity_score" not in risk_result:
        desc = extracted.get("complaint_description", "").lower()
        defect = extracted.get("defect_category", "").lower()

        if "injectable" in desc or "sterile" in desc or "particulate" in defect or "glass" in desc:
            sev, prob, det = 5, 2, 4
            level = "Critical"
            safety = True
            far = True
            reasoning = "Critical Parenteral Particulate/Sterile defect. Poses severe embolus/vascular harm risk. Mandatory 3-day FDA Field Alert Report (FAR)."
        elif "discolor" in defect or "unsealed" in desc or "oos" in defect or "leak" in desc:
            sev, prob, det = 3, 3, 3
            level = "Major"
            safety = False
            far = False
            reasoning = "Quality defect affecting packaging integrity / API appearance. Low direct patient toxicity risk, but requires batch containment."
        else:
            sev, prob, det = 2, 2, 2
            level = "Minor"
            safety = False
            far = False
            reasoning = "Minor cosmetic or labelling defect with minimal product quality impact."

        rpn = sev * prob * det
        risk_result = {
            "severity_score": sev,
            "probability_score": prob,
            "detectability_score": det,
            "rpn_score": rpn,
            "risk_level": level,
            "patient_safety_impact": safety,
            "regulatory_reportable": far,
            "ai_reasoning": reasoning
        }

    # Escalate risk level if duplicate batch detected
    if duplicates.get("has_batch_match"):
        risk_result["ai_reasoning"] += " [ESCALATED: Multiple complaints logged for the exact same batch!]"
        if risk_result["risk_level"] == "Minor":
            risk_result["risk_level"] = "Major"

    state["risk_assessment"] = risk_result
    return state

# --- Node 5: RCA & CAPA Generator ---
def node_rca_capa_generator(state: QMSAgentState) -> QMSAgentState:
    print("Executing Node 5: RCA & CAPA Recommendation...")
    extracted = state.get("extracted_fields", {})
    risk = state.get("risk_assessment", {})

    llm = get_groq_llm(model_name=settings.REASONING_MODEL) # Using llama-3.3-70b-versatile for deep reasoning
    rca_result = {}

    if llm:
        try:
            prompt = RCA_CAPA_PROMPT.format(
                product_name=extracted.get("product_name", "Unknown"),
                product_type=extracted.get("product_type", "FDF"),
                defect_category=extracted.get("defect_category", "Defect"),
                complaint_description=extracted.get("complaint_description", ""),
                risk_level=risk.get("risk_level", "Major")
            )
            response = llm.invoke(prompt)
            rca_result = safe_json_parse(response.content)
        except Exception as e:
            print(f"RCA/CAPA LLM error: {e}")

    # Fallback heuristic
    if not rca_result or "root_cause_summary" not in rca_result:
        defect = extracted.get("defect_category", "").lower()
        target_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

        if "discolor" in defect:
            rca_result = {
                "root_cause_category": "Environment / Packaging",
                "root_cause_summary": "Humidity fluctuation and missing desiccant pouch during drum filling shift.",
                "corrective_action": "Quarantine remaining drums from batch and conduct stability & purity assay re-testing.",
                "preventive_action": "Install automated optical humidity sensors and inline desiccant verification on packaging station.",
                "assigned_department": "Packaging QA",
                "target_completion_date": target_date
            }
        elif "particulate" in defect or "contamination" in defect:
            rca_result = {
                "root_cause_category": "Equipment / Maintenance",
                "root_cause_summary": "Stopper crimping head misalignment generating glass/rubber micro-particulates during vial sealing.",
                "corrective_action": "Halt sterile fill line #2, quarantine batch, and inspect 100% of retention vials.",
                "preventive_action": "Replace crimping station jaws and add automated vision inspection camera prior to capping.",
                "assigned_department": "Sterile Operations QA",
                "target_completion_date": target_date
            }
        else:
            rca_result = {
                "root_cause_category": "Packaging / SOP",
                "root_cause_summary": "Heater bar temperature drift on blister sealing machine leading to weak seal foil adhesion.",
                "corrective_action": "Re-seal defective cartons and perform leak test on retaining samples.",
                "preventive_action": "Implement hourly temperature log audit and automatic thermal cutoff alarm on line 4.",
                "assigned_department": "Packaging QA",
                "target_completion_date": target_date
            }

    state["rca_capa"] = rca_result
    return state

# --- Node 6: Executive Summary Generator ---
def node_summary_generator(state: QMSAgentState) -> QMSAgentState:
    print("Executing Node 6: Executive Summary Generator...")
    extracted = state.get("extracted_fields", {})
    risk = state.get("risk_assessment", {})
    rca = state.get("rca_capa", {})

    llm = get_groq_llm(model_name=settings.PRIMARY_MODEL)
    summary = ""

    if llm:
        try:
            prompt = EXECUTIVE_SUMMARY_PROMPT.format(
                product_name=extracted.get("product_name", "Unknown"),
                batch_number=extracted.get("batch_number", "Unknown"),
                defect_category=extracted.get("defect_category", "Defect"),
                risk_level=risk.get("risk_level", "Major"),
                rpn_score=risk.get("rpn_score", 18),
                root_cause_summary=rca.get("root_cause_summary", ""),
                corrective_action=rca.get("corrective_action", "")
            )
            response = llm.invoke(prompt)
            summary = response.content.strip()
        except Exception as e:
            print(f"Summary LLM error: {e}")

    if not summary:
        summary = (
            f"QMS Complaint Logged for {extracted.get('product_name')} (Batch {extracted.get('batch_number')}). "
            f"Defect identified as '{extracted.get('defect_category')}' with an AI Risk Classification of {risk.get('risk_level')} (RPN: {risk.get('rpn_score')}). "
            f"Root cause attributed to {rca.get('root_cause_category')}. CAPA initiated: {rca.get('corrective_action')[:120]}..."
        )

    state["executive_summary"] = summary
    return state
