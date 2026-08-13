import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRawInputText, analyzeComplaintText, uploadComplaintDocument, autoLogFromAi } from '../store/aiCopilotSlice';
import { UploadCloud, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const SAMPLE_COMPLAINTS = [
  {
    title: 'Paracetamol API Discoloration (API Sample)',
    text: `From: qa.intake@globalformulations.com
Date: Feb 10, 2026
Subject: URGENT: Discoloration in Paracetamol API Batch BAT-2026-0811A

Dear Quality Assurance Team,
Upon opening 25kg drum #04 of Paracetamol Active Pharmaceutical Ingredient (API) batch BAT-2026-0811A, we observed yellowish specks and slight clump discoloration on the top surface layer. 
We have retained sample drum #04 in our warehouse at Controlled Room Temperature 20-25°C.
Please investigate urgently as our tableting batch is currently on QA hold.`
  },
  {
    title: 'Metformin Blister Seal Leak (FDF Sample)',
    text: `From: complaints@apexhealth.co.uk
Date: Jan 20, 2026
Subject: Defective Blister Packaging - Metformin 850mg Batch BAT-2026-0745B

Attention QA Manager,
Apex Health Distributors received 500 cartons of Metformin HCl 850mg Extended Release Tablets (Batch BAT-2026-0745B). Multiple blister strips show unsealed foil edges on pockets #4 and #5.
Tablets inside have absorbed ambient moisture, becoming soft and discolored.
Sample retains available for testing upon request.`
  },
  {
    title: 'Ceftriaxone Particulate Matter (Critical Injection Sample)',
    text: `From: pharmacy.director@stjudehospital.org
Date: Feb 12, 2026
Subject: CRITICAL: Visible Foreign Particulate in Ceftriaxone 1g Injection Vial Batch BAT-2026-0888X

Urgent Attention Quality Control,
St. Jude Hospital pharmacy staff detected visible floating dark particulate in a reconstituted vial of Ceftriaxone Sodium 1g Powder for Injection (Batch BAT-2026-0888X, Exp: 2028-01-04). 
The vial was refrigerated at 2-8°C. Administration was immediately halted. Vial sample preserved for lab analysis.`
  }
];

export default function DocumentDropzone() {
  const dispatch = useDispatch();
  const { rawInputText, isAnalyzing, isAutoLogging } = useSelector((state) => state.aiCopilot);

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
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: 'var(--accent-cyan)' }} size={20} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>AI Intake & Document Parser</h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Groq & LangGraph</span>
      </div>

      {/* Quick Sample Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>
          Load Realistic Demo Samples:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SAMPLE_COMPLAINTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(sample.text)}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-highlight)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <FileText size={14} style={{ color: 'var(--accent-blue)' }} />
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Text Area & File Upload Dropzone */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <textarea
          rows={5}
          placeholder="Paste raw customer email, complaint description, or PDF text here..."
          value={rawInputText}
          onChange={(e) => dispatch(setRawInputText(e.target.value))}
          className="form-textarea"
          style={{ width: '100%', resize: 'vertical' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-highlight)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}>
            <UploadCloud size={18} />
            <span>Upload Email / PDF Document</span>
            <input type="file" accept=".txt,.pdf,.eml,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !rawInputText.trim()}
              className="btn btn-primary"
            >
              <Sparkles size={16} />
              {isAnalyzing ? 'Analyzing LangGraph Graph...' : 'Analyze with AI Copilot'}
            </button>

            <button
              onClick={handleAutoLog}
              disabled={isAutoLogging || !rawInputText.trim()}
              className="btn btn-accent"
            >
              <CheckCircle2 size={16} />
              {isAutoLogging ? 'Logging to QMS...' : 'Auto-Log to QMS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
