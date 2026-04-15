import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { donsService } from '../../services/don.service';

// ─── THUNKS ───────────────────────────────────────────────────────────────────

export const fetchMyDons = createAsyncThunk(
  'dons/fetchMyDons',
  async (_, { rejectWithValue }) => {
    try {
      return await donsService.getMyDons();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteDon = createAsyncThunk(
  'dons/deleteDon',
  async (id, { rejectWithValue }) => {
    try {
      await donsService.deleteDon(id);
      return id; // On retourne l'id pour le retirer du state
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAvailableDons = createAsyncThunk(
  'dons/fetchAvailableDons',
  async (_, { rejectWithValue }) => {
    try {
      return await donsService.getAvailableDons();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createDon = createAsyncThunk(
  'dons/createDon',
  async (formData, { rejectWithValue }) => {
    try {
      return await donsService.createDon(formData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateDon = createAsyncThunk(
  'dons/updateDon',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await donsService.updateDon(id, body);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── SLICE ────────────────────────────────────────────────────────────────────

const donsSlice = createSlice({
  name: 'dons',
  initialState: {
    // Dons de l'utilisateur connecté
    myDons: [],
    myDonsLoading: false,
    myDonsError: null,

    // Dons disponibles (HomeScreen)
    availableDons: [],
    availableDonsLoading: false,
    availableDonsError: null,

    // États des actions
    deleteLoading: false,
    deleteError: null,

    createLoading: false,
    createError: null,
    createSuccess: false,

    updateLoading: false,
    updateError: null,
    updateSuccess: false,
  },
  reducers: {
    // Réinitialiser les flags de succès/erreur après usage
    resetCreateStatus: (state) => {
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
    },
    resetUpdateStatus: (state) => {
      state.updateLoading = false;
      state.updateError = null;
      state.updateSuccess = false;
    },
    resetDeleteError: (state) => {
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchMyDons ────────────────────────────────
    builder
      .addCase(fetchMyDons.pending, (state) => {
        state.myDonsLoading = true;
        state.myDonsError = null;
      })
      .addCase(fetchMyDons.fulfilled, (state, action) => {
        state.myDonsLoading = false;
        // Trier par date décroissante
        state.myDons = [...action.payload].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      })
      .addCase(fetchMyDons.rejected, (state, action) => {
        state.myDonsLoading = false;
        state.myDonsError = action.payload;
      });

    // ── deleteDon ──────────────────────────────────
    builder
      .addCase(deleteDon.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteDon.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Retirer le don supprimé des deux listes
        state.myDons = state.myDons.filter((d) => d.id !== action.payload);
        state.availableDons = state.availableDons.filter((d) => d.id !== action.payload);
      })
      .addCase(deleteDon.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });

    // ── fetchAvailableDons ─────────────────────────
    builder
      .addCase(fetchAvailableDons.pending, (state) => {
        state.availableDonsLoading = true;
        state.availableDonsError = null;
      })
      .addCase(fetchAvailableDons.fulfilled, (state, action) => {
        state.availableDonsLoading = false;
        state.availableDons = [...action.payload].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      })
      .addCase(fetchAvailableDons.rejected, (state, action) => {
        state.availableDonsLoading = false;
        state.availableDonsError = action.payload;
      });

    // ── createDon ──────────────────────────────────
    builder
      .addCase(createDon.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createDon.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createSuccess = true;
        // Ajouter le nouveau don en tête de liste
        state.myDons = [action.payload, ...state.myDons];
      })
      .addCase(createDon.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      });

    // ── updateDon ──────────────────────────────────
    builder
      .addCase(updateDon.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateDon.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;
        // Mettre à jour le don modifié dans myDons
        const idx = state.myDons.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.myDons[idx] = action.payload;
        // Mettre à jour dans availableDons aussi
        const idx2 = state.availableDons.findIndex((d) => d.id === action.payload.id);
        if (idx2 !== -1) state.availableDons[idx2] = action.payload;
      })
      .addCase(updateDon.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      });
  },
});

export const { resetCreateStatus, resetUpdateStatus, resetDeleteError } = donsSlice.actions;
export default donsSlice.reducer;