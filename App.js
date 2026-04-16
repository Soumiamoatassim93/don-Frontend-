// App.js
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LocationService from './src/services/LocationService';
import socketService from './src/services/socket.service';

// Composant interne pour utiliser le contexte
function AppContent() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      console.log('🔌 Connexion socket depuis App');
      socketService.connect(token, user.id);
    }
  }, [token, user]);

  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    LocationService.restartTrackingIfNeeded();
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}