import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Header from './components/Header';
import ComplaintDashboard from './components/ComplaintDashboard';
import ComplaintForm from './components/ComplaintForm';
import AiCopilotDrawer from './components/AiCopilotDrawer';
import { clearActiveComplaint } from './store/complaintsSlice';
import { X, ShieldAlert, FileText } from 'lucide-react';

function App() {
  const dispatch = useDispatch();
  const [currentView, setCurrentView] = useState('dashboard');
  const { activeComplaint } = useSelector((state) => state.complaints);

  return (
    <div className="app-container">
      {/* Top Navbar Header */}
      <Header currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content Layout */}
      <div className="main-content">
        {/* Main Left View Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {currentView === 'dashboard' ? (
            <ComplaintDashboard onOpenNewComplaint={() => setCurrentView('new_complaint')} />
          ) : (
            <div style={{ padding: '1.5rem', flex: 1 }}>
              <ComplaintForm onSuccess={() => setCurrentView('dashboard')} />
            </div>
          )}
        </div>

        {/* Right Sidebar: AI Intake, Document Parser, and Copilot Intelligence Drawer */}
        <AiCopilotDrawer />
      </div>

      {/* Active Complaint Detail Modal */}
      {activeComplaint && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            position: 'relative'
          }}>
            <button
              onClick={() => dispatch(clearActiveComplaint())}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                  Complaint Details: {activeComplaint.complaint_number}
                </h2>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Status: <strong style={{ color: 'var(--accent-cyan)' }}>{activeComplaint.status}</strong> | Created: {new Date(activeComplaint.created_at).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <div><strong>Product:</strong> {activeComplaint.product?.product_name}</div>
              <div><strong>Type:</strong> [{activeComplaint.product?.product_type}] {activeComplaint.product?.product_code}</div>
              <div><strong>Batch Number:</strong> {activeComplaint.batch_number}</div>
              <div><strong>Defect Category:</strong> {activeComplaint.defect_category}</div>
              <div><strong>Customer Name:</strong> {activeComplaint.customer_name}</div>
              <div><strong>Reporter Email:</strong> {activeComplaint.reporter_email || 'N/A'}</div>
              <div><strong>Sample Received:</strong> {activeComplaint.sample_received ? 'Yes' : 'No'}</div>
              <div><strong>Storage Condition:</strong> {activeComplaint.storage_condition}</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>COMPLAINT DESCRIPTION:</strong>
              <p style={{ marginTop: '0.35rem', fontSize: '0.875rem', lineHeight: '1.5' }}>{activeComplaint.complaint_description}</p>
            </div>

            {/* Risk Assessment Summary if available */}
            {activeComplaint.risk_assessment && (
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className={`badge ${activeComplaint.risk_assessment.risk_level === 'Critical' ? 'badge-critical' : 'badge-major'}`}>
                    <ShieldAlert size={14} /> Risk Level: {activeComplaint.risk_assessment.risk_level} (RPN: {activeComplaint.risk_assessment.rpn_score})
                  </span>
                  {activeComplaint.risk_assessment.regulatory_reportable && (
                    <span className="badge badge-critical">FDA 3-Day FAR Reportable</span>
                  )}
                </div>
                <p style={{ fontSize: '0.825rem', lineHeight: '1.4' }}>{activeComplaint.risk_assessment.ai_reasoning}</p>
              </div>
            )}

            {/* Linked CAPAs if available */}
            {activeComplaint.capa_records && activeComplaint.capa_records.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Initiated CAPA Actions</h4>
                {activeComplaint.capa_records.map((capa, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', fontSize: '0.825rem' }}>
                    <div><strong>Root Cause:</strong> {capa.root_cause_summary}</div>
                    <div style={{ marginTop: '0.25rem' }}><strong>Corrective Action:</strong> {capa.corrective_action}</div>
                    <div style={{ marginTop: '0.25rem' }}><strong>Preventive Action:</strong> {capa.preventive_action}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
