// store/slices/requestsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';
import { requestsService } from '../../services/requests.service';

// ─── THUNKS ───────────────────────────────────────────────────────────────────

export const sendRequest = createAsyncThunk(
  'requests/sendRequest',
  async ({ userId, donationId, status = 'en_cours' }, { rejectWithValue }) => {
    try {
      const response = await authService.api.post('/requests', {
        userId,
        donationId,
        status,
      });
      return { donationId, data: response.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSentRequests = createAsyncThunk(
  'requests/fetchSentRequests',
  async (userId, { rejectWithValue }) => {
    try {
      const sentRequests = await requestsService.getSentRequests(userId);
      
      // Enrichir avec les détails des dons
      const enrichedRequests = await Promise.all(
        sentRequests.map(async (req) => {
          try {
            const don = await requestsService.getDonById(req.donationId);
            return { ...req, don };
          } catch (error) {
            return req;
          }
        })
      );
      
      return enrichedRequests;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchReceivedRequests = createAsyncThunk(
  'requests/fetchReceivedRequests',
  async (userId, { rejectWithValue }) => {
    try {
      const receivedRequests = await requestsService.getReceivedRequests(userId);
      
      // Enrichir avec les détails des dons
      const enrichedRequests = await Promise.all(
        receivedRequests.map(async (req) => {
          try {
            const don = await requestsService.getDonById(req.donationId);
            return { ...req, don };
          } catch (error) {
            return req;
          }
        })
      );
      
      return enrichedRequests;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// store/slices/requestsSlice.js
// ... (gardez tous les imports)

// ✅ CORRIGÉ : acceptRequest ne prend plus que requestId
export const acceptRequest = createAsyncThunk(
  'requests/acceptRequest',
  async ({ requestId }, { rejectWithValue }) => {
    try {
      await requestsService.acceptRequest(requestId);
      return { requestId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ✅ CORRIGÉ : refuseRequest ne prend plus que requestId
export const refuseRequest = createAsyncThunk(
  'requests/refuseRequest',
  async ({ requestId }, { rejectWithValue }) => {
    try {
      await requestsService.refuseRequest(requestId);
      return { requestId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Le reste du slice reste identique...

export const cancelRequest = createAsyncThunk(
  'requests/cancelRequest',
  async ({ requestId, isSent }, { rejectWithValue }) => {
    try {
      await requestsService.cancelRequest(requestId);
      return { requestId, isSent };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── SLICE ────────────────────────────────────────────────────────────────────

const requestsSlice = createSlice({
  name: 'requests',
  initialState: {
    // IDs des dons pour lesquels une demande a été envoyée
    sentRequestIds: [],
    
    // Demandes complètes
    sentRequests: [],
    receivedRequests: [],
    
    // États de chargement
    sendLoading: false,
    sendError: null,
    
    fetchLoading: false,
    fetchError: null,
    
    actionLoading: false,
    actionError: null,
  },
  reducers: {
    resetRequestError: (state) => {
      state.sendError = null;
      state.fetchError = null;
      state.actionError = null;
    },
    resetRequests: (state) => {
      state.sentRequests = [];
      state.receivedRequests = [];
      state.sentRequestIds = [];
      state.fetchError = null;
    },
    addSentRequestId: (state, action) => {
      const donationId = action.payload;
      if (!state.sentRequestIds.includes(donationId)) {
        state.sentRequestIds.push(donationId);
      }
    },
  },
  extraReducers: (builder) => {
    // ── sendRequest ────────────────────────────────
    builder
      .addCase(sendRequest.pending, (state) => {
        state.sendLoading = true;
        state.sendError = null;
      })
      .addCase(sendRequest.fulfilled, (state, action) => {
        state.sendLoading = false;
        const { donationId } = action.payload;
        if (!state.sentRequestIds.includes(donationId)) {
          state.sentRequestIds.push(donationId);
        }
      })
      .addCase(sendRequest.rejected, (state, action) => {
        state.sendLoading = false;
        state.sendError = action.payload;
      });

    // ── fetchSentRequests ──────────────────────────
    builder
      .addCase(fetchSentRequests.pending, (state) => {
        state.fetchLoading = true;
        state.fetchError = null;
      })
      .addCase(fetchSentRequests.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.sentRequests = action.payload;
        // Mettre à jour sentRequestIds
        state.sentRequestIds = action.payload.map(req => req.donationId);
      })
      .addCase(fetchSentRequests.rejected, (state, action) => {
        state.fetchLoading = false;
        state.fetchError = action.payload;
      });

    // ── fetchReceivedRequests ───────────────────────
    builder
      .addCase(fetchReceivedRequests.pending, (state) => {
        state.fetchLoading = true;
        state.fetchError = null;
      })
      .addCase(fetchReceivedRequests.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.receivedRequests = action.payload;
      })
      .addCase(fetchReceivedRequests.rejected, (state, action) => {
        state.fetchLoading = false;
        state.fetchError = action.payload;
      });

    // ── acceptRequest ───────────────────────────────
    builder
      .addCase(acceptRequest.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(acceptRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Mettre à jour le statut dans receivedRequests
        const index = state.receivedRequests.findIndex(
          (req) => req.id === action.payload.requestId
        );
        if (index !== -1) {
          state.receivedRequests[index].status = 'accepte';
        }
      })
      .addCase(acceptRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // ── refuseRequest ───────────────────────────────
    builder
      .addCase(refuseRequest.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(refuseRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Mettre à jour le statut dans receivedRequests
        const index = state.receivedRequests.findIndex(
          (req) => req.id === action.payload.requestId
        );
        if (index !== -1) {
          state.receivedRequests[index].status = 'refuse';
        }
      })
      .addCase(refuseRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });

    // ── cancelRequest ───────────────────────────────
    builder
      .addCase(cancelRequest.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(cancelRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Supprimer la demande de la liste appropriée
        if (action.payload.isSent) {
          state.sentRequests = state.sentRequests.filter(
            (req) => req.id !== action.payload.requestId
          );
          // Mettre à jour sentRequestIds
          const cancelledRequest = state.sentRequests.find(
            (req) => req.id === action.payload.requestId
          );
          if (cancelledRequest) {
            state.sentRequestIds = state.sentRequestIds.filter(
              id => id !== cancelledRequest.donationId
            );
          }
        } else {
          state.receivedRequests = state.receivedRequests.filter(
            (req) => req.id !== action.payload.requestId
          );
        }
      })
      .addCase(cancelRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { resetRequestError, resetRequests, addSentRequestId } = requestsSlice.actions;
export default requestsSlice.reducer;