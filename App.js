// App.js
import React, { useEffect } from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import  LocationService  from './src/services/LocationService';
import { Provider } from 'react-redux';
import { store } from './src/store/store';

export default function App() {
  useEffect(() => {
    // Redémarrer le tracking si nécessaire
    LocationService.restartTrackingIfNeeded();
  }, []);

  return (
   <Provider store={store}> 
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
    </Provider>
  );
}