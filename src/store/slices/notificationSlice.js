// store/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';
import notificationService from '../../services/notifications.service';

// Récupérer les notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await authService.api.get(`/notifications/user/${userId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Marquer comme lue
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await authService.api.put(`/notifications/${notificationId}/read`);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Marquer toutes comme lues
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId, { rejectWithValue }) => {
    try {
      await authService.api.put(`/notifications/user/${userId}/read-all`);
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Supprimer une notification
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await authService.api.delete(`/notifications/${notificationId}`);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Enregistrer le token
export const registerPushToken = createAsyncThunk(
  'notifications/registerPushToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = await notificationService.registerForPushNotifications();
      return token;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    expoPushToken: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    resetNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount -= 1;
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.isRead = true);
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
      })
      .addCase(registerPushToken.fulfilled, (state, action) => {
        state.expoPushToken = action.payload?.data || null;
      });
  },
});

export const { clearError, addNotification, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;