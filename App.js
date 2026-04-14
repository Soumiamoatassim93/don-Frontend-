// App.js
import React, { useEffect } from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LocationService from './src/services/LocationService';

export default function App() {
  useEffect(() => {
    // Redémarrer le tracking si nécessaire
    LocationService.restartTrackingIfNeeded();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}