// services/notification.service.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authService } from './auth.service';
import Constants from 'expo-constants';

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async registerForPushNotifications() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission refusée pour les notifications');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    console.log('Expo Push Token:', token.data);
    this.expoPushToken = token.data;

    await this.saveTokenToServer(token.data);

    return token;
  }

  async saveTokenToServer(token) {
    try {
      const user = await authService.getCurrentUser();
      if (user && user.id) {
        await authService.api.post('/notifications/register-token', {
          userId: user.id,
          token: token,
          deviceType: Platform.OS,
        });
        console.log('✅ Token sauvegardé');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde token:', error);
    }
  }

  async sendNotification(userId, title, body, data = {}) {
    try {
      const response = await authService.api.post('/notifications/send', {
        userId,
        title,
        body,
        data,
      });
      console.log(`✅ Notification envoyée à user ${userId}:`, title);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
    }
  }

  addNotificationListeners(onNotification, onNotificationResponse) {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification reçue:', notification);
        if (onNotification) onNotification(notification);
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification cliquée:', response);
        if (onNotificationResponse) onNotificationResponse(response);
      }
    );
  }

  // ✅ CORRECTION : Utiliser .remove() directement
  removeNotificationListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    
    console.log('✅ Listeners de notifications supprimés');
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();