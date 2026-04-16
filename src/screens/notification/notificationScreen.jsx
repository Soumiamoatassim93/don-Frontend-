// src/screens/NotificationsScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth.service';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../store/slices/notificationSlice';
import { notificationsStyles as styles, colors } from './notification.style';

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading, error } = useSelector(
    (state) => state.notifications
  );
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      dispatch(fetchNotifications(user.id));
    }
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }

    if (notification.data?.screen) {
      navigation.navigate(notification.data.screen, notification.data);
    }
  };

  const handleLongPress = (notification) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => dispatch(deleteNotification(notification.id)),
        },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    Alert.alert(
      'Tout marquer comme lu',
      `Marquer les ${unreadCount} notifications non lues comme lues ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const user = await authService.getCurrentUser();
            dispatch(markAllAsRead(user.id));
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'decision':
        return 'notifications';
      case 'new_request':
        return 'mail';
      case 'proximity':
        return 'location';
      case 'tracking_started':
        return 'navigate';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type, isAccepted) => {
    if (type === 'decision') {
      return isAccepted ? colors.success : colors.error;
    }
    return colors.primary;
  };

  if (isLoading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadNotifications}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unread]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getNotificationIcon(item.data?.type)}
          size={24}
          color={getNotificationColor(item.data?.type, item.data?.isAccepted)}
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleString('fr-FR')}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Aucune notification</Text>
            <Text style={styles.emptySubtext}>
              Les notifications apparaîtront ici
            </Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 && styles.emptyList}
      />
    </View>
  );
};

export default NotificationsScreen;