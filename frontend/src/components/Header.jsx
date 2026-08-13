import React from 'react';
import { Pill, Sparkles, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function Header({ currentView, setCurrentView }) {
  return (
    <header className="qms-navbar">
      <div className="brand-section">
        <Pill size={24} style={{ color: 'var(--accent-cyan)' }} />
        <div>
          <h1 className="brand-title">AIVOA Pharma QMS</h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            AI-Powered Customer Complaint & Risk Management System
          </div>
        </div>
        <span className="brand-badge">Groq LangGraph AI Engine</span>
      </div>

      <div className="nav-controls">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <LayoutDashboard size={16} /> QMS Dashboard
        </button>

        <button
          onClick={() => setCurrentView('new_complaint')}
          className={`btn ${currentView === 'new_complaint' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <PlusCircle size={16} /> Log Customer Complaint
        </button>
      </div>
    </header>
  );
}
