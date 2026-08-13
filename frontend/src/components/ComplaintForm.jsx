import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createComplaint } from '../store/complaintsSlice';
import { Sparkles, Save, ShieldAlert, Check } from 'lucide-react';

export default function ComplaintForm({ onSuccess }) {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.complaints);
  const { extractedFields, completeness } = useSelector((state) => state.aiCopilot);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_contact: '',
    reporter_email: '',
    product_id: '',
    batch_number: '',
    manufacture_date: '',
    expiry_date: '',
    complainant_type: 'Customer',
    event_date: '',
    defect_category: 'Physical Defect / Discoloration',
    complaint_description: '',
    sample_received: false,
    storage_condition: 'Controlled Room Temperature 20-25°C'
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Auto-fill form when AI Extracted fields change
  useEffect(() => {
    if (extractedFields) {
      // Find matching product_id by product_name
      let matchedProductId = products[0]?.id || 1;
      if (extractedFields.product_name) {
        const found = products.find(p => p.product_name.toLowerCase().includes(extractedFields.product_name.toLowerCase()) || extractedFields.product_name.toLowerCase().includes(p.product_name.toLowerCase()));
        if (found) matchedProductId = found.id;
      }

      setFormData((prev) => ({
        ...prev,
        customer_name: extractedFields.customer_name || prev.customer_name,
        customer_contact: extractedFields.customer_contact || prev.customer_contact,
        reporter_email: extractedFields.reporter_email || prev.reporter_email,
        product_id: matchedProductId,
        batch_number: extractedFields.batch_number || prev.batch_number,
        manufacture_date: extractedFields.manufacture_date || prev.manufacture_date,
        expiry_date: extractedFields.expiry_date || prev.expiry_date,
        complainant_type: extractedFields.complainant_type || prev.complainant_type,
        event_date: extractedFields.event_date || prev.event_date,
        defect_category: extractedFields.defect_category || prev.defect_category,
        complaint_description: extractedFields.complaint_description || prev.complaint_description,
        sample_received: extractedFields.sample_received !== undefined ? extractedFields.sample_received : prev.sample_received,
        storage_condition: extractedFields.storage_condition || prev.storage_condition
      }));
    }
  }, [extractedFields, products]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_id && products.length > 0) {
      formData.product_id = products[0].id;
    }
    dispatch(createComplaint(formData));
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      if (onSuccess) onSuccess();
    }, 1500);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Log Customer Complaint</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pharma QMS cGMP Complaint Intake Form</p>
        </div>

        {completeness && (
          <div className={`badge ${completeness.is_complete ? 'badge-complete' : 'badge-incomplete'}`}>
            <Sparkles size={12} />
            AI Completeness: {completeness.score_percentage}% ({completeness.status_badge})
          </div>
        )}
      </div>

      {submittedSuccess && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent-emerald)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}>
          <Check size={18} /> Complaint Successfully Logged to QMS Database!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Customer Name */}
          <div className="form-group">
            <label className="form-label">Customer / Hospital / Facility Name *</label>
            <input
              type="text"
              name="customer_name"
              required
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="e.g. Global Formulation Labs"
              className="form-input"
            />
          </div>

          {/* Reporter Email */}
          <div className="form-group">
            <label className="form-label">Reporter Email Address</label>
            <input
              type="email"
              name="reporter_email"
              value={formData.reporter_email}
              onChange={handleChange}
              placeholder="e.g. qa@customer.com"
              className="form-input"
            />
          </div>

          {/* Product Selection */}
          <div className="form-group">
            <label className="form-label">Pharmaceutical Product (API / FDF) *</label>
            <select
              name="product_id"
              required
              value={formData.product_id}
              onChange={handleChange}
              className="form-select"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.product_type}] {p.product_code}: {p.product_name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Number */}
          <div className="form-group">
            <label className="form-label">Batch / Lot Number *</label>
            <input
              type="text"
              name="batch_number"
              required
              value={formData.batch_number}
              onChange={handleChange}
              placeholder="e.g. BAT-2026-0811A"
              className="form-input"
            />
          </div>

          {/* Manufacture Date */}
          <div className="form-group">
            <label className="form-label">Manufacture Date</label>
            <input
              type="date"
              name="manufacture_date"
              value={formData.manufacture_date}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Expiry Date */}
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Complainant Type */}
          <div className="form-group">
            <label className="form-label">Complainant Type</label>
            <select
              name="complainant_type"
              value={formData.complainant_type}
              onChange={handleChange}
              className="form-select"
            >
              <option value="Customer">API Customer / Formulator</option>
              <option value="Distributor">Distributor / Wholesaler</option>
              <option value="Hospital">Hospital Pharmacy</option>
              <option value="Pharmacy">Retail Pharmacy</option>
              <option value="Regulatory Body">Regulatory Authority / FDA</option>
            </select>
          </div>

          {/* Defect Category */}
          <div className="form-group">
            <label className="form-label">Defect Category *</label>
            <select
              name="defect_category"
              required
              value={formData.defect_category}
              onChange={handleChange}
              className="form-select"
            >
              <option value="Physical Defect / Discoloration">Physical Defect / Discoloration</option>
              <option value="Out of Specification (OOS)">Out of Specification (OOS)</option>
              <option value="Labelling / Packaging Defect">Labelling / Packaging Defect</option>
              <option value="Contamination / Foreign Particulate">Contamination / Foreign Particulate</option>
              <option value="Side Effect / Adverse Event">Side Effect / Adverse Event</option>
            </select>
          </div>
        </div>

        {/* Complaint Description */}
        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label">Detailed Complaint Description *</label>
          <textarea
            name="complaint_description"
            required
            rows={4}
            value={formData.complaint_description}
            onChange={handleChange}
            placeholder="Detailed description of defect, package condition, batch numbers involved..."
            className="form-textarea"
          />
        </div>

        {/* Storage & Sample Switches */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Storage Condition</label>
            <input
              type="text"
              name="storage_condition"
              value={formData.storage_condition}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.8rem' }}>
            <input
              type="checkbox"
              id="sample_received"
              name="sample_received"
              checked={formData.sample_received}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="sample_received" style={{ fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
              Physical Sample Received for QC Testing
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> Save & Create QMS Complaint Record
          </button>
        </div>
      </form>
    </div>
  );
}
