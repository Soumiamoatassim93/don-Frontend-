// services/notification.service.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './auth.service';
import Constants from 'expo-constants'; // 👈 AJOUTE CET IMPORT

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Configuration des notifications
  configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  // Demander la permission et récupérer le token
  async registerForPushNotifications() {
    // Configuration Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    // Demander la permission
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
    
    // ✅ CORRECTION ICI - Récupère le projectId depuis app.json
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    
    console.log('Expo Push Token:', token.data);
    this.expoPushToken = token.data;
    
    // Sauvegarder sur le serveur
    await this.saveTokenToServer(token.data);
    
    return token;
  }

  // Sauvegarder le token sur le serveur
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

  // Envoyer une notification
  async sendNotification(userId, title, body, data = {}) {
    try {
      const response = await authService.api.post('/notifications/send', {
        userId,
        title,
        body,
        data,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
    }
  }

  // Écouter les notifications
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

  // Supprimer les listeners
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Annuler toutes les notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();