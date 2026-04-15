import { configureStore } from '@reduxjs/toolkit';
import donsReducer      from './slices/donsSlice';
import favoritesReducer from './slices/favoritesSlice';
import requestsReducer  from './slices/RequestsSlice';
import categoriesReducer from './slices/categoriesSlice';
import authReducer from './slices/authSlice';
import trackingReducer from './slices/trackingSlice';
import notificationReducer from './slices/notificationSlice';
export const store = configureStore({
  reducer: {
    dons:       donsReducer,
    favorites:  favoritesReducer,
    requests:   requestsReducer,
    categories: categoriesReducer,
    auth: authReducer,
    tracking: trackingReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Nécessaire pour FormData
    }),
});