import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';

// ─── THUNKS ───────────────────────────────────────────────────────────────────

export const checkFavorite = createAsyncThunk(
  'favorites/checkFavorite',
  async ({ userId, donId }, { rejectWithValue }) => {
    try {
      const response = await authService.api.get(
        `/favorites/check?userId=${userId}&donId=${donId}`
      );
      return { donId, isFavorite: response.data.isFavorite };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async ({ userId, donId, isFavorite }, { rejectWithValue }) => {
    try {
      if (isFavorite) {
        await authService.api.delete(`/favorites/${userId}/${donId}`);
      } else {
        await authService.api.post('/favorites', { userId, donationId: donId });
      }
      return { donId, isFavorite: !isFavorite };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── SLICE ────────────────────────────────────────────────────────────────────

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    // Set sérialisé en tableau : [donId1, donId2, ...]
    favoriteIds: [],
    toggleLoading: false,
    toggleError: null,
  },
  reducers: {
    resetFavoriteError: (state) => {
      state.toggleError = null;
    },
  },
  extraReducers: (builder) => {
    // ── checkFavorite ──────────────────────────────
    builder
      .addCase(checkFavorite.fulfilled, (state, action) => {
        const { donId, isFavorite } = action.payload;
        if (isFavorite && !state.favoriteIds.includes(donId)) {
          state.favoriteIds.push(donId);
        } else if (!isFavorite) {
          state.favoriteIds = state.favoriteIds.filter((id) => id !== donId);
        }
      });

    // ── toggleFavorite ─────────────────────────────
    builder
      .addCase(toggleFavorite.pending, (state) => {
        state.toggleLoading = true;
        state.toggleError = null;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        state.toggleLoading = false;
        const { donId, isFavorite } = action.payload;
        if (isFavorite) {
          if (!state.favoriteIds.includes(donId)) state.favoriteIds.push(donId);
        } else {
          state.favoriteIds = state.favoriteIds.filter((id) => id !== donId);
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.toggleLoading = false;
        state.toggleError = action.payload;
      });
  },
});

export const { resetFavoriteError } = favoritesSlice.actions;
export default favoritesSlice.reducer;