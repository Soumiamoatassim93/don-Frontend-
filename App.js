import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LocationService from './src/services/LocationService';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store/store';
import { authService } from './src/services/auth.service';
import { initSocket, closeSocket, setDispatch } from './src/services/socketService';
import { useAuth } from './src/hooks/useAuth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Composant pour gérer la socket et injecter le dispatch
const SocketManager = () => {
  const { user, isAuthenticated, token } = useAuth(); // ← utilise le hook useAuth
  const dispatch = useDispatch();

  useEffect(() => {
    setDispatch(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && token) {
      initSocket(token);
    } else {
      closeSocket();
    }
    return () => closeSocket();
  }, [isAuthenticated, token]);

  return null;
};

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    LocationService.restartTrackingIfNeeded();
    setupNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('❌ Permission notifications non accordée');
        return;
      }
      console.log('✅ Permission notifications accordée');

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '99fd3b60-2c3c-4e58-81ac-fea81980531b',
        });
        console.log('📱 Expo Push Token:', token.data);
        const user = await authService.getCurrentUser();
        if (user && token.data) {
          await authService.api.post('/notifications/register-token', {
            userId: user.id,
            token: token.data,
            deviceType: Platform.OS,
          });
          console.log('✅ Token enregistré pour user:', user.id);
        }
      } catch (tokenError) {
        console.warn('⚠️ Push token non disponible:', tokenError.message);
      }

      notificationListener.current = Notifications.addNotificationReceivedListener(
        notification => console.log('🔔 Notification reçue:', notification)
      );
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        response => console.log('🔔 Notification cliquée:', response)
      );
    } catch (error) {
      console.error('❌ Erreur setup notifications:', error);
    }
  };

  return (
    <Provider store={store}>
      <AuthProvider>
        <SocketManager />
        <AppNavigator />
      </AuthProvider>
    </Provider>
  );
}