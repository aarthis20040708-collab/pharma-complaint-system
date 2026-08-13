# LangGraph Prompts tailored for Pharma QMS Customer Complaint Handling

EXTRACTION_PROMPT = """
You are an expert Pharmaceutical Quality Assurance (QA) Manager specializing in cGMP (21 CFR Part 211.198) complaint logging.
Analyze the following customer complaint document/email text and extract structured QMS information into valid JSON format.

DOCUMENT TEXT:
\"\"\"
{raw_text}
\"\"\"

Return ONLY a valid JSON object matching the following keys:
{{
  "customer_name": "Name of customer, hospital, distributor, or pharmacy (or 'Unknown' if missing)",
  "customer_contact": "Phone number or contact info (or null if missing)",
  "reporter_email": "Email address of reporter (or null if missing)",
  "product_name": "Name of the drug product or API (or null if missing)",
  "product_type": "API or FDF (Infer 'API' if raw substance/powder, 'FDF' if tablet/capsule/injectable/eye drop. Default 'FDF')",
  "batch_number": "Batch or Lot number e.g. BAT-xxxx (or null if missing)",
  "manufacture_date": "YYYY-MM-DD or string (or null if missing)",
  "expiry_date": "YYYY-MM-DD or string (or null if missing)",
  "complainant_type": "Customer, Distributor, Pharmacy, Hospital, or Regulatory Body",
  "event_date": "Date defect occurred or noticed (or null if missing)",
  "defect_category": "Physical Defect / Discoloration, Out of Specification (OOS), Labelling / Packaging Defect, Contamination / Foreign Particulate, or Adverse Event",
  "complaint_description": "Detailed explanation of defect observed",
  "sample_received": true/false (true if sample sent for testing, false otherwise),
  "storage_condition": "Controlled Room Temperature 20-25°C, Refrigerated 2-8°C, or Cold Storage"
}}
"""

RISK_ASSESSMENT_PROMPT = """
You are a Senior QMS Risk Assessment Officer in pharmaceutical manufacturing.
Evaluate the following complaint for risk under ICH Q9 Quality Risk Management guidelines.

Complaint Data:
- Product: {product_name} ({product_type})
- Batch Number: {batch_number}
- Defect Category: {defect_category}
- Description: {complaint_description}
- Sample Received: {sample_received}

Calculate the Risk Priority Number (RPN = Severity x Probability x Detectability) where:
- Severity (1 to 5): 1=Negligible, 2=Minor, 3=Moderate, 4=High (Potency/Quality loss), 5=Critical (Parenteral particulate, glass, sterile failure, patient harm).
- Probability (1 to 5): 1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Frequent.
- Detectability (1 to 5): 1=Easily detectable before patient delivery, 3=Moderate, 5=Undetectable until patient use.

Determine:
1. Severity Score (1-5)
2. Probability Score (1-5)
3. Detectability Score (1-5)
4. RPN Score (Severity x Probability x Detectability)
5. Risk Level: "Critical" if RPN >= 40 or Severity=5; "Major" if RPN 16-39 or Severity=4; "Minor" if RPN < 16.
6. Patient Safety Impact: true/false.
7. Regulatory Reportable: true/false (Set true if injectable foreign particulate, sterile breach, or major safety risk requiring 3-day FDA Field Alert Report / FAR).
8. AI Reasoning: 2-3 sentences explaining the cGMP risk justification.

Return ONLY a valid JSON object:
{{
  "severity_score": 3,
  "probability_score": 2,
  "detectability_score": 3,
  "rpn_score": 18,
  "risk_level": "Major",
  "patient_safety_impact": false,
  "regulatory_reportable": false,
  "ai_reasoning": "Reasoning text here..."
}}
"""

RCA_CAPA_PROMPT = """
You are a Lead QA Root Cause & CAPA Specialist in pharmaceutical manufacturing (API & FDF).
Based on the following QMS complaint, recommend a Root Cause hypothesis and Corrective & Preventive Actions (CAPA).

Complaint Details:
- Product: {product_name} ({product_type})
- Defect Category: {defect_category}
- Description: {complaint_description}
- Risk Level: {risk_level}

Propose realistic manufacturing/packaging root cause and actionable CAPA steps:
Return ONLY a valid JSON object:
{{
  "root_cause_category": "Equipment, Operator / Human Error, Raw Material, Packaging / Sealing, Environment, or Process SOP",
  "root_cause_summary": "Detailed root cause explanation",
  "corrective_action": "Immediate containment and corrective action (e.g. quarantine batch, re-inspect retain samples)",
  "preventive_action": "Long-term preventive action (e.g. update SOP, install optical sensor, recalibrate heat sealer)",
  "assigned_department": "QA, QC, Production, Packaging, or Engineering",
  "target_completion_date": "YYYY-MM-DD (typically 30 days from today)"
}}
"""

EXECUTIVE_SUMMARY_PROMPT = """
You are a Director of Quality Assurance writing an executive QMS complaint summary for the Quality Review Board.
Summarize the following complaint details in 3 concise bullet points:

- Complaint ID / Product: {product_name} (Batch: {batch_number})
- Defect: {defect_category}
- Risk Level: {risk_level} (RPN: {rpn_score})
- Root Cause Hypothesis: {root_cause_summary}
- Key CAPA: {corrective_action}

Write a professional 3-sentence executive summary.
"""
