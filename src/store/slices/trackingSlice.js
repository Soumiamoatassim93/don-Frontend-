// store/slices/trackingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import LocationService from '../../services/LocationService';
import { authService } from '../../services/auth.service';

// ─── THUNKS ───────────────────────────────────────────────────────────────────

// Récupérer la position du don (utilise l'endpoint GET /dons/:id)
export const getDonationLocation = createAsyncThunk(
  'tracking/getDonationLocation',
  async (donationId, { rejectWithValue }) => {
    try {
      console.log('🔍 Récupération du don ID:', donationId);
      const response = await authService.api.get(`/dons/${donationId}`);
      const donation = response.data;
      
      console.log('✅ Don récupéré:', donation.title);
      console.log('📍 Position:', donation.latitude, donation.longitude);
      
      return {
        latitude: donation.latitude,
        longitude: donation.longitude,
        address: donation.address,
        title: donation.title
      };
    } catch (err) {
      console.error('❌ Erreur:', err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Démarrer le tracking de position
export const startTracking = createAsyncThunk(
  'tracking/startTracking',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('🚀 Démarrage tracking pour user:', userId);
      await LocationService.startTracking(userId);
      const status = LocationService.getTrackingStatus();
      console.log('✅ Tracking démarré:', status);
      return status;
    } catch (err) {
      console.error('❌ Erreur démarrage tracking:', err.message);
      return rejectWithValue(err.message);
    }
  }
);

// Arrêter le tracking de position
export const stopTracking = createAsyncThunk(
  'tracking/stopTracking',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🛑 Arrêt du tracking');
      await LocationService.stopTracking();
      return { isTracking: false, userId: null, socketConnected: false };
    } catch (err) {
      console.error('❌ Erreur arrêt tracking:', err.message);
      return rejectWithValue(err.message);
    }
  }
);

// Obtenir le statut actuel du tracking
export const getTrackingStatus = createAsyncThunk(
  'tracking/getTrackingStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = LocationService.getTrackingStatus();
      console.log('📊 Statut tracking:', status);
      return status;
    } catch (err) {
      console.error('❌ Erreur getTrackingStatus:', err.message);
      return rejectWithValue(err.message);
    }
  }
);

// Redémarrer le tracking si nécessaire (après fermeture app)
export const restartTrackingIfNeeded = createAsyncThunk(
  'tracking/restartTrackingIfNeeded',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Redémarrage tracking si nécessaire');
      await LocationService.restartTrackingIfNeeded();
      const status = LocationService.getTrackingStatus();
      return status;
    } catch (err) {
      console.error('❌ Erreur restartTracking:', err.message);
      return rejectWithValue(err.message);
    }
  }
);

// Envoyer la position manuellement
export const sendCurrentPosition = createAsyncThunk(
  'tracking/sendCurrentPosition',
  async (_, { rejectWithValue }) => {
    try {
      LocationService.sendCurrentPosition();
      return { success: true };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── SLICE ────────────────────────────────────────────────────────────────────

const trackingSlice = createSlice({
  name: 'tracking',
  initialState: {
    // Positions
    donationLocation: null,     // Position du don { latitude, longitude, address }
    currentLocation: null,      // Position actuelle de l'utilisateur
    
    // État du tracking
    isLocationActive: false,    // Le tracking est-il actif ?
    isLoading: false,           // Chargement en cours ?
    error: null,                // Erreur éventuelle
    
    // Infos tracking
    trackingUserId: null,       // ID de l'utilisateur qui track
    socketConnected: false,     // WebSocket connecté ?
  },
  reducers: {
    // Effacer les erreurs
    clearError: (state) => {
      state.error = null;
    },
    
    // Activer/désactiver manuellement la localisation
    setLocationActive: (state, action) => {
      state.isLocationActive = action.payload;
    },
    
    // Mettre à jour la position actuelle
    updateCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    
    // Réinitialiser tout l'état
    resetTracking: (state) => {
      state.donationLocation = null;
      state.currentLocation = null;
      state.isLocationActive = false;
      state.error = null;
      state.trackingUserId = null;
      state.socketConnected = false;
      state.isLoading = false;
    },
    
    // Mettre à jour le statut socket
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── getDonationLocation ─────────────────────────
    builder
      .addCase(getDonationLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDonationLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.donationLocation = action.payload;
      })
      .addCase(getDonationLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── startTracking ───────────────────────────────
    builder
      .addCase(startTracking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startTracking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLocationActive = action.payload.isTracking;
        state.trackingUserId = action.payload.userId;
        state.socketConnected = action.payload.socketConnected;
      })
      .addCase(startTracking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isLocationActive = false;
      });

    // ── stopTracking ────────────────────────────────
    builder
      .addCase(stopTracking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(stopTracking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLocationActive = action.payload.isTracking;
        state.trackingUserId = action.payload.userId;
        state.socketConnected = action.payload.socketConnected;
      })
      .addCase(stopTracking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── getTrackingStatus ───────────────────────────
    builder
      .addCase(getTrackingStatus.fulfilled, (state, action) => {
        state.isLocationActive = action.payload.isTracking;
        state.trackingUserId = action.payload.userId;
        state.socketConnected = action.payload.socketConnected;
      });

    // ── restartTrackingIfNeeded ─────────────────────
    builder
      .addCase(restartTrackingIfNeeded.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restartTrackingIfNeeded.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLocationActive = action.payload.isTracking;
        state.trackingUserId = action.payload.userId;
        state.socketConnected = action.payload.socketConnected;
      })
      .addCase(restartTrackingIfNeeded.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export des actions
export const {
  clearError,
  setLocationActive,
  updateCurrentLocation,
  resetTracking,
  setSocketConnected,
} = trackingSlice.actions;

// Export du reducer
export default trackingSlice.reducer;