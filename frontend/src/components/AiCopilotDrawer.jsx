import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setRawInputText,
  analyzeComplaintText,
  uploadComplaintDocument,
  autoLogFromAi,
  setActiveTab
} from '../store/aiCopilotSlice';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  CheckSquare,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

const SAMPLE_COMPLAINTS = [
  {
    title: 'Paracetamol API Discoloration',
    text: `From: qa.intake@globalformulations.com
Date: Feb 10, 2026
Subject: URGENT: Discoloration in Paracetamol API Batch BAT-2026-0811A

Dear Quality Assurance Team,
Upon opening 25kg drum #04 of Paracetamol Active Pharmaceutical Ingredient (API) batch BAT-2026-0811A, we observed yellowish specks and slight clump discoloration on the top surface layer. 
We have retained sample drum #04 in our warehouse at Controlled Room Temperature 20-25°C.
Please investigate urgently as our tableting batch is currently on QA hold.`
  },
  {
    title: 'Metformin Blister Seal Leak',
    text: `From: complaints@apexhealth.co.uk
Date: Jan 20, 2026
Subject: Defective Blister Packaging - Metformin 850mg Batch BAT-2026-0745B

Attention QA Manager,
Apex Health Distributors received 500 cartons of Metformin HCl 850mg Extended Release Tablets (Batch BAT-2026-0745B). Multiple blister strips show unsealed foil edges on pockets #4 and #5.
Tablets inside have absorbed ambient moisture, becoming soft and discolored.
Sample retains available for testing upon request.`
  },
  {
    title: 'Ceftriaxone Particulate (Critical)',
    text: `From: pharmacy.director@stjudehospital.org
Date: Feb 12, 2026
Subject: CRITICAL: Visible Foreign Particulate in Ceftriaxone 1g Injection Vial Batch BAT-2026-0888X

Urgent Attention Quality Control,
St. Jude Hospital pharmacy staff detected visible floating dark particulate in a reconstituted vial of Ceftriaxone Sodium 1g Powder for Injection (Batch BAT-2026-0888X, Exp: 2028-01-04). 
The vial was refrigerated at 2-8°C. Administration was immediately halted. Vial sample preserved for lab analysis.`
  }
];

export default function AiCopilotDrawer() {
  const dispatch = useDispatch();
  const {
    rawInputText,
    isAnalyzing,
    isAutoLogging,
    extractedFields,
    completeness,
    duplicates,
    riskAssessment,
    rcaCapa,
    executiveSummary,
    activeTab
  } = useSelector((state) => state.aiCopilot);

  const handleAnalyze = () => {
    if (!rawInputText.trim()) return;
    dispatch(analyzeComplaintText({ rawText: rawInputText, fileName: 'intake_text.txt' }));
  };

  const handleAutoLog = () => {
    if (!rawInputText.trim()) return;
    dispatch(autoLogFromAi({ rawText: rawInputText, fileName: 'intake_text.txt' }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadComplaintDocument(file));
    }
  };

  const handleSelectSample = (sampleText) => {
    dispatch(setRawInputText(sampleText));
    dispatch(analyzeComplaintText({ rawText: sampleText, fileName: 'sample_complaint.txt' }));
  };

  return (
    <div className="copilot-panel">
      {/* Header */}
      <div className="copilot-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: 'var(--accent-cyan)' }} size={20} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>AI Intake & Copilot Risk Panel</h3>
        </div>
        {completeness && (
          <span className={`badge ${completeness.is_complete ? 'badge-complete' : 'badge-incomplete'}`}>
            {completeness.score_percentage}% Complete
          </span>
        )}
      </div>

      {/* AI Intake & Document Parser Section on the Right */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>
          LOAD REALISTIC DEMO SAMPLE:
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {SAMPLE_COMPLAINTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(sample.text)}
              style={{
                fontSize: '0.7rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-highlight)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <FileText size={12} style={{ color: 'var(--accent-blue)' }} />
              {sample.title}
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          placeholder="Paste raw customer email, complaint text, or PDF content here..."
          value={rawInputText}
          onChange={(e) => dispatch(setRawInputText(e.target.value))}
          className="form-textarea"
          style={{ width: '100%', resize: 'vertical', fontSize: '0.825rem', marginBottom: '0.75rem' }}
        />

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-highlight)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}>
            <UploadCloud size={14} />
            <span>Upload Document</span>
            <input type="file" accept=".txt,.pdf,.eml,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !rawInputText.trim()}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.775rem' }}
            >
              <Sparkles size={14} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze AI'}
            </button>

            <button
              onClick={handleAutoLog}
              disabled={isAutoLogging || !rawInputText.trim()}
              className="btn btn-accent"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.775rem' }}
            >
              <CheckCircle2 size={14} />
              {isAutoLogging ? 'Logging...' : 'Auto-Log'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {extractedFields && (
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'extracted' ? 'active' : ''}`}
            onClick={() => dispatch(setActiveTab('extracted'))}
          >
            Extracted Data
          </button>
          <button
            className={`tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
            onClick={() => dispatch(setActiveTab('risk'))}
          >
            Risk & RPN
          </button>
          <button
            className={`tab-btn ${activeTab === 'duplicates' ? 'active' : ''}`}
            onClick={() => dispatch(setActiveTab('duplicates'))}
          >
            Duplicates ({duplicates?.duplicate_count || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === 'rca_capa' ? 'active' : ''}`}
            onClick={() => dispatch(setActiveTab('rca_capa'))}
          >
            RCA & CAPA
          </button>
        </div>
      )}

      {/* Tab 1: Extracted Data */}
      {activeTab === 'extracted' && extractedFields && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {completeness?.missing_fields?.length > 0 && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertTriangle size={14} /> Missing Mandatory Fields Flagged:
              </div>
              <ul style={{ fontSize: '0.8rem', paddingLeft: '1.2rem', marginTop: '0.35rem', color: 'var(--text-main)' }}>
                {completeness.missing_fields.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Product:</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{extractedFields.product_name || 'N/A'} ({extractedFields.product_type})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Batch Number:</span>
              <strong>{extractedFields.batch_number || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Defect Category:</span>
              <span>{extractedFields.defect_category || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
              <span>{extractedFields.customer_name || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reporter Email:</span>
              <span>{extractedFields.reporter_email || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sample Received:</span>
              <span>{extractedFields.sample_received ? '✅ Yes (QC Sample)' : '❌ No Sample'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Condition:</span>
              <span>{extractedFields.storage_condition || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Risk & RPN */}
      {activeTab === 'risk' && riskAssessment && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border-highlight)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.25rem' }}>
              RISK PRIORITY NUMBER (RPN)
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: riskAssessment.risk_level === 'Critical' ? 'var(--accent-rose)' : (riskAssessment.risk_level === 'Major' ? 'var(--accent-amber)' : 'var(--accent-emerald)') }}>
              {riskAssessment.rpn_score}
            </div>
            <div style={{ marginTop: '0.5rem', display: 'inline-flex', gap: '0.5rem' }}>
              <span className={`badge ${riskAssessment.risk_level === 'Critical' ? 'badge-critical' : (riskAssessment.risk_level === 'Major' ? 'badge-major' : 'badge-minor')}`}>
                <ShieldAlert size={14} /> Risk Level: {riskAssessment.risk_level}
              </span>
              {riskAssessment.regulatory_reportable && (
                <span className="badge badge-critical">
                  <AlertTriangle size={14} /> FDA 3-Day FAR Reportable
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlignment: 'center' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SEVERITY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{riskAssessment.severity_score} / 5</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PROBABILITY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{riskAssessment.probability_score} / 5</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DETECTABILITY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{riskAssessment.detectability_score} / 5</div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>AI RISK REASONING JUSTIFICATION:</h4>
            <div style={{ fontSize: '0.85rem', padding: '0.9rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-highlight)', lineHeight: '1.5' }}>
              {riskAssessment.ai_reasoning}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Duplicates */}
      {activeTab === 'duplicates' && duplicates && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            padding: '0.9rem',
            backgroundColor: duplicates.is_duplicate ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${duplicates.is_duplicate ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: duplicates.is_duplicate ? 'var(--accent-amber)' : 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={16} /> {duplicates.risk_warning}
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'var(--text-main)' }}>
              {duplicates.is_duplicate ? `Found ${duplicates.duplicate_count} matching complaint record(s) in QMS Database.` : 'No duplicate batch or product defect patterns found.'}
            </p>
          </div>

          {duplicates.matched_records?.map((m, i) => (
            <div key={i} style={{ backgroundColor: 'var(--bg-card)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-highlight)', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                <span>{m.complaint_number}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.match_type}</span>
              </div>
              <div style={{ marginTop: '0.35rem', color: 'var(--text-main)' }}>
                <strong>Batch:</strong> {m.batch_number} | <strong>Defect:</strong> {m.defect_category}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Customer: {m.customer_name} | Status: {m.status} ({m.created_at})
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: RCA & CAPA */}
      {activeTab === 'rca_capa' && rcaCapa && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-highlight)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-amber)', marginBottom: '0.25rem' }}>
              ROOT CAUSE HYPOTHESIS ({rcaCapa.root_cause_category})
            </div>
            <p style={{ lineHeight: '1.4' }}>{rcaCapa.root_cause_summary}</p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-highlight)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>
              CORRECTIVE ACTION PLAN
            </div>
            <p style={{ lineHeight: '1.4' }}>{rcaCapa.corrective_action}</p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-highlight)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '0.25rem' }}>
              PREVENTIVE ACTION PLAN
            </div>
            <p style={{ lineHeight: '1.4' }}>{rcaCapa.preventive_action}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Assigned: <strong>{rcaCapa.assigned_department}</strong></span>
            <span>Target Completion: <strong>{rcaCapa.target_completion_date}</strong></span>
          </div>

          {executiveSummary && (
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} /> EXECUTIVE QMS SUMMARY
              </div>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{executiveSummary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
