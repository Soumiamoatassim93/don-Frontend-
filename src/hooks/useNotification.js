// hooks/useNotifications.js
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerPushToken,
  clearError,
  addNotification,
  resetNotifications,
} from '../store/slices/notificationSlice';
import notificationService from '../services/notification.service';
import { Alert } from 'react-native';

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    expoPushToken,
  } = useAppSelector((state) => state.notifications);

  const getUserNotifications = useCallback((userId) => {
    return dispatch(fetchNotifications(userId)).unwrap();
  }, [dispatch]);

  const markNotificationAsRead = useCallback((notificationId) => {
    return dispatch(markAsRead(notificationId)).unwrap();
  }, [dispatch]);

  const markAllNotificationsAsRead = useCallback((userId) => {
    return dispatch(markAllAsRead(userId)).unwrap();
  }, [dispatch]);

  const removeNotification = useCallback((notificationId) => {
    return dispatch(deleteNotification(notificationId)).unwrap();
  }, [dispatch]);

  const registerPush = useCallback(() => {
    return dispatch(registerPushToken()).unwrap();
  }, [dispatch]);

  const sendPushNotification = useCallback((userId, title, body, data = {}) => {
    return notificationService.sendNotification(userId, title, body, data);
  }, []);

  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetAllNotifications = useCallback(() => {
    dispatch(resetNotifications());
  }, [dispatch]);

  // Initialiser les notifications
  useEffect(() => {
    const setupNotifications = async () => {
      notificationService.configureNotifications();
      
      try {
        await registerPush();
      } catch (error) {
        console.log('Erreur registration push:', error);
      }
    };

    setupNotifications();

    // Écouter les notifications
    notificationService.addNotificationListeners(
      (notification) => {
        // Notification reçue pendant que l'app est ouverte
        const { title, body, data } = notification.request.content;
        dispatch(addNotification({
          id: Date.now(),
          title,
          body,
          data,
          isRead: false,
          createdAt: new Date().toISOString(),
        }));
        
        // Afficher une alerte si l'app est ouverte
        Alert.alert(title, body);
      },
      (response) => {
        // Notification cliquée
        const { data } = response.notification.request.content;
        if (data?.screen) {
          // La navigation sera gérée dans App.js
          console.log('Naviguer vers:', data.screen, data.params);
        }
      }
    );

    return () => {
      notificationService.removeNotificationListeners();
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    expoPushToken,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    sendPushNotification,
    registerPush,
    clearErrors,
    resetAllNotifications,
  };
};