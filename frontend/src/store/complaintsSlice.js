import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async Thunks for API Calls
export const fetchComplaints = createAsyncThunk(
  'complaints/fetchComplaints',
  async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.riskLevel) params.append('risk_level', filters.riskLevel);
    if (filters.productType) params.append('product_type', filters.productType);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`/api/complaints?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return await res.json();
  }
);

export const fetchProducts = createAsyncThunk(
  'complaints/fetchProducts',
  async () => {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'complaints/fetchDashboardStats',
  async () => {
    const res = await fetch('/api/complaints/dashboard/stats');
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return await res.json();
  }
);

export const createComplaint = createAsyncThunk(
  'complaints/createComplaint',
  async (complaintData, { dispatch }) => {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintData)
    });
    if (!res.ok) throw new Error('Failed to log complaint');
    const created = await res.json();
    dispatch(fetchComplaints());
    dispatch(fetchDashboardStats());
    return created;
  }
);

export const updateComplaintStatus = createAsyncThunk(
  'complaints/updateStatus',
  async ({ complaintId, status }, { dispatch }) => {
    const res = await fetch(`/api/complaints/${complaintId}/status?status=${encodeURIComponent(status)}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to update status');
    dispatch(fetchComplaints());
    dispatch(fetchDashboardStats());
    return await res.json();
  }
);

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState: {
    items: [],
    products: [],
    stats: {
      total_complaints: 0,
      critical_risk: 0,
      major_risk: 0,
      minor_risk: 0,
      open_capas: 0,
      far_reportable_count: 0,
      product_type_breakdown: { API: 0, FDF: 0 }
    },
    activeComplaint: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      riskLevel: '',
      status: '',
      productType: ''
    }
  },
  reducers: {
    setActiveComplaint: (state, action) => {
      state.activeComplaint = action.payload;
    },
    clearActiveComplaint: (state) => {
      state.activeComplaint = null;
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { search: '', riskLevel: '', status: '', productType: '' };
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchComplaints
      .addCase(fetchComplaints.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchProducts
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      // fetchDashboardStats
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  }
});

export const { setActiveComplaint, clearActiveComplaint, setFilter, resetFilters } = complaintsSlice.actions;
export default complaintsSlice.reducer;
