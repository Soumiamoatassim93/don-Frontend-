import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LocationService from './src/services/LocationService';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { authService } from './src/services/auth.service';

// Handler de notifications (app au premier plan)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
      // 1. Demander la permission
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

      // 2. Canal de notification Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      // 3. Obtenir le token Push (protégé contre les erreurs émulateur)
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '99fd3b60-2c3c-4e58-81ac-fea81980531b',
        });
        console.log('📱 Expo Push Token:', token.data);

        // 4. Enregistrer le token sur le backend
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
        // Ne pas crasher si token indisponible (émulateur sans Google Services)
        console.warn('⚠️ Push token non disponible:', tokenError.message);
      }

      // 5. Écouter les notifications reçues (app au premier plan)
      notificationListener.current = Notifications.addNotificationReceivedListener(
        notification => {
          console.log('🔔 Notification reçue:', notification);
        }
      );

      // 6. Écouter les clics sur notifications
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        response => {
          console.log('🔔 Notification cliquée:', response);
          const data = response.notification.request.content.data;
          if (data?.screen) {
            // Navigation gérée par le composant concerné
          }
        }
      );

    } catch (error) {
      console.error('❌ Erreur setup notifications:', error);
    }
  };

  return (
    <Provider store={store}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </Provider>
  );
}