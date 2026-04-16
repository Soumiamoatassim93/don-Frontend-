// src/components/NotificationBadge.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchNotifications } from '../store/slices/notificationSlice';
import { authService } from '../services/auth.service';
import { badgeStyles as styles } from './notificationBadge.style';

const NotificationBadge = ({ navigation }) => {
  const dispatch = useDispatch();
  const { unreadCount } = useSelector((state) => state.notifications);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      dispatch(fetchNotifications(user.id));
    }
  };

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      style={styles.container}
    >
      <Ionicons name="notifications-outline" size={24} color="#111827" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationBadge;