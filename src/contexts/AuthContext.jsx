import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import socketService from '../services/socket.service'; // ← AJOUTE CETTE LIGNE

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // 🔥 AJOUTE CETTE LIGNE - Connecter le socket
          socketService.connect(token, parsedUser.id || parsedUser.sub);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login({ email, password });
      
      setUser(response.user);
      
      // 🔥 AJOUTE CETTE LIGNE - Connecter le socket après login
      const token = await AsyncStorage.getItem('auth_token');
      if (token && response.user) {
        socketService.connect(token, response.user.id || response.user.sub);
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, name = '') => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.register({ email, password, name });
      
      setUser(response.user);
      
      //  Connecter le socket après inscription
      const token = await AsyncStorage.getItem('auth_token');
      if (token && response.user) {
        socketService.connect(token, response.user.id || response.user.sub);
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      //  - Déconnecter le socket
      socketService.disconnect();
      
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};