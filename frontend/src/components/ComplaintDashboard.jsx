import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchComplaints,
  fetchProducts,
  fetchDashboardStats,
  setActiveComplaint,
  setFilter,
  updateComplaintStatus
} from '../store/complaintsSlice';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  FileCheck2,
  PlusCircle,
  Eye,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function ComplaintDashboard({ onOpenNewComplaint }) {
  const dispatch = useDispatch();
  const { items, stats, loading, filters } = useSelector((state) => state.complaints);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchComplaints(filters));
    dispatch(fetchDashboardStats());
  }, [dispatch, filters]);

  const handleSearchChange = (e) => {
    dispatch(setFilter({ search: e.target.value }));
  };

  const handleStatusFilter = (e) => {
    dispatch(setFilter({ status: e.target.value }));
  };

  const handleRiskFilter = (e) => {
    dispatch(setFilter({ riskLevel: e.target.value }));
  };

  const handleProductTypeFilter = (e) => {
    dispatch(setFilter({ productType: e.target.value }));
  };

  const handleStatusUpdate = (complaintId, newStatus) => {
    dispatch(updateComplaintStatus({ complaintId, status: newStatus }));
  };

  return (
    <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Total QMS Complaints</span>
            <FileCheck2 size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="stat-value">{stats.total_complaints}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            API ({stats.product_type_breakdown?.API || 0}) | FDF ({stats.product_type_breakdown?.FDF || 0})
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Critical Risk Cases</span>
            <ShieldAlert size={18} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>
            {stats.critical_risk}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
            Requires Priority QA Hold
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>FDA 3-Day FAR Reportable</span>
            <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {stats.far_reportable_count}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
            Field Alert Report Required
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Active CAPAs Initiated</span>
            <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {stats.open_capas}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Targeted Dept Assigned
          </span>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Complaint #, Batch, Defect, Customer..."
              value={filters.search}
              onChange={handleSearchChange}
              className="form-input"
              style={{ paddingLeft: '2.2rem', width: '100%' }}
            />
          </div>

          {/* Risk Level Filter */}
          <select value={filters.riskLevel} onChange={handleRiskFilter} className="form-select">
            <option value="">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
          </select>

          {/* Product Type Filter */}
          <select value={filters.productType} onChange={handleProductTypeFilter} className="form-select">
            <option value="">All Product Types (API & FDF)</option>
            <option value="API">API (Active Ingredients)</option>
            <option value="FDF">FDF (Finished Dosage Form)</option>
          </select>

          {/* Status Filter */}
          <select value={filters.status} onChange={handleStatusFilter} className="form-select">
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In Investigation">In Investigation</option>
            <option value="Under Risk Review">Under Risk Review</option>
            <option value="CAPA Initiated">CAPA Initiated</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <button onClick={onOpenNewComplaint} className="btn btn-primary">
          <PlusCircle size={16} /> Log New Complaint
        </button>
      </div>

      {/* Complaints Data Table */}
      <div className="table-wrapper">
        <table className="qms-table">
          <thead>
            <tr>
              <th>Tracking #</th>
              <th>Product Name</th>
              <th>Batch #</th>
              <th>Defect Category</th>
              <th>Risk Level & RPN</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading QMS Complaints...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No complaint records match your search filter criteria.
                </td>
              </tr>
            ) : (
              items.map((c) => {
                const risk = c.risk_assessment;
                const riskLevel = risk?.risk_level || 'Major';
                return (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{c.complaint_number}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{c.product?.product_name || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        [{c.product?.product_type}] {c.product?.product_code}
                      </div>
                    </td>
                    <td>
                      <code style={{ padding: '0.2rem 0.4rem', backgroundColor: 'var(--bg-card)', borderRadius: '4px' }}>
                        {c.batch_number}
                      </code>
                    </td>
                    <td>{c.defect_category}</td>
                    <td>
                      <span className={`badge ${riskLevel === 'Critical' ? 'badge-critical' : (riskLevel === 'Major' ? 'badge-major' : 'badge-minor')}`}>
                        {riskLevel} {risk?.rpn_score ? `(RPN ${risk.rpn_score})` : ''}
                      </span>
                      {risk?.regulatory_reportable && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', fontWeight: '600', marginTop: '0.2rem' }}>
                          FAR Reportable
                        </div>
                      )}
                    </td>
                    <td>{c.customer_name}</td>
                    <td>
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusUpdate(c.id, e.target.value)}
                        className="form-select"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.775rem' }}
                      >
                        <option value="New">New</option>
                        <option value="In Investigation">In Investigation</option>
                        <option value="Under Risk Review">Under Risk Review</option>
                        <option value="CAPA Initiated">CAPA Initiated</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => dispatch(setActiveComplaint(c))}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
