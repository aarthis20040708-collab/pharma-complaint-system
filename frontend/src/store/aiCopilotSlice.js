import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchComplaints, fetchDashboardStats } from './complaintsSlice';

export const analyzeComplaintText = createAsyncThunk(
  'aiCopilot/analyzeText',
  async ({ rawText, fileName }) => {
    const res = await fetch('/api/complaints/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, file_name: fileName })
    });
    if (!res.ok) throw new Error('AI Analysis failed');
    return await res.json();
  }
);

export const uploadComplaintDocument = createAsyncThunk(
  'aiCopilot/uploadDocument',
  async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/complaints/upload-document', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Document processing failed');
    return await res.json();
  }
);

export const autoLogFromAi = createAsyncThunk(
  'aiCopilot/autoLog',
  async ({ rawText, fileName }, { dispatch }) => {
    const res = await fetch('/api/complaints/auto-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, file_name: fileName })
    });
    if (!res.ok) throw new Error('Auto-log failed');
    const data = await res.json();
    dispatch(fetchComplaints());
    dispatch(fetchDashboardStats());
    return data;
  }
);

const initialState = {
  isAnalyzing: false,
  isAutoLogging: false,
  extractedFields: null,
  completeness: null,
  duplicates: null,
  riskAssessment: null,
  rcaCapa: null,
  executiveSummary: '',
  rawInputText: '',
  activeTab: 'extracted', // 'extracted', 'risk', 'duplicates', 'rca_capa'
  error: null
};

const aiCopilotSlice = createSlice({
  name: 'aiCopilot',
  initialState,
  reducers: {
    setRawInputText: (state, action) => {
      state.rawInputText = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    updateExtractedField: (state, action) => {
      const { field, value } = action.payload;
      if (state.extractedFields) {
        state.extractedFields[field] = value;
      }
    },
    resetAiCopilot: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // analyzeComplaintText
      .addCase(analyzeComplaintText.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(analyzeComplaintText.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.extractedFields = action.payload.extracted_fields;
        state.completeness = action.payload.completeness;
        state.duplicates = action.payload.duplicates;
        state.riskAssessment = action.payload.risk_assessment;
        state.rcaCapa = action.payload.rca_capa;
        state.executiveSummary = action.payload.executive_summary;
      })
      .addCase(analyzeComplaintText.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.error.message;
      })
      // uploadComplaintDocument
      .addCase(uploadComplaintDocument.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(uploadComplaintDocument.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.extractedFields = action.payload.extracted_fields;
        state.completeness = action.payload.completeness;
        state.duplicates = action.payload.duplicates;
        state.riskAssessment = action.payload.risk_assessment;
        state.rcaCapa = action.payload.rca_capa;
        state.executiveSummary = action.payload.executive_summary;
      })
      .addCase(uploadComplaintDocument.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.error.message;
      })
      // autoLogFromAi
      .addCase(autoLogFromAi.pending, (state) => {
        state.isAutoLogging = true;
      })
      .addCase(autoLogFromAi.fulfilled, (state) => {
        state.isAutoLogging = false;
      })
      .addCase(autoLogFromAi.rejected, (state, action) => {
        state.isAutoLogging = false;
        state.error = action.error.message;
      });
  }
});

export const {
  setRawInputText,
  setActiveTab,
  updateExtractedField,
  resetAiCopilot
} = aiCopilotSlice.actions;

export default aiCopilotSlice.reducer;
