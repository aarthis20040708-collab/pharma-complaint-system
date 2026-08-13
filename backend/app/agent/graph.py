from langgraph.graph import StateGraph, END
from app.agent.nodes import (
    QMSAgentState,
    node_intake_extraction,
    node_completeness_check,
    node_duplicate_detection,
    node_risk_classification,
    node_rca_capa_generator,
    node_summary_generator
)

def create_qms_complaint_graph():
    """Build and compile the multi-node LangGraph QMS complaint pipeline."""
    workflow = StateGraph(QMSAgentState)

    # Add pipeline nodes
    workflow.add_node("intake_extraction", node_intake_extraction)
    workflow.add_node("completeness_check", node_completeness_check)
    workflow.add_node("duplicate_detection", node_duplicate_detection)
    workflow.add_node("risk_classification", node_risk_classification)
    workflow.add_node("rca_capa_generator", node_rca_capa_generator)
    workflow.add_node("summary_generator", node_summary_generator)

    # Define linear execution flow
    workflow.set_entry_point("intake_extraction")
    workflow.add_edge("intake_extraction", "completeness_check")
    workflow.add_edge("completeness_check", "duplicate_detection")
    workflow.add_edge("duplicate_detection", "risk_classification")
    workflow.add_edge("risk_classification", "rca_capa_generator")
    workflow.add_edge("rca_capa_generator", "summary_generator")
    workflow.add_edge("summary_generator", END)

    # Compile Graph
    return workflow.compile()

# Global compiled instance
qms_agent_app = create_qms_complaint_graph()

def run_qms_ai_analysis(raw_text: str, file_name: str = None) -> dict:
    """Helper function to invoke the compiled LangGraph workflow with input state."""
    initial_state: QMSAgentState = {
        "raw_text": raw_text,
        "file_name": file_name,
        "extracted_fields": {},
        "completeness": {},
        "duplicates": {},
        "risk_assessment": {},
        "rca_capa": {},
        "executive_summary": "",
        "errors": []
    }
    
    result_state = qms_agent_app.invoke(initial_state)
    return result_state
