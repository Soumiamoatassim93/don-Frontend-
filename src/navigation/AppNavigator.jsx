// AppNavigator.js - Version complète
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

const LoadingSpinner = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
    <ActivityIndicator size="large" color="#6366f1" />
    <Text style={{ marginTop: 10, color: '#6b7280' }}>Chargement...</Text>
  </View>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    checkAuthStatus();
  }, []);

  console.log('AppNavigator - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) return <LoadingSpinner />;

  return (
    <NavigationContainer key={isAuthenticated ? 'auth' : 'guest'}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;