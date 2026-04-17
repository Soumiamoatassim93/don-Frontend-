// screens/Messagerie/ConversationList.jsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { styles } from './MessagerieStyles';

const ConversationList = ({ navigation }) => {
  const { user } = useAuth();
  const { conversations, isLoading, getConversations } = useMessages();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messagerie</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => {
          const other = item.participants?.find((p) => p.id !== user?.id);
          const lastMsg = item.lastMessage;
          const unread = item.unreadCount > 0;

          // ✅ Récupération du nom (priorité à 'nom', puis 'name', puis email)
          const displayName = other?.nom || other?.name || other?.email || 'Utilisateur';
          const initial = (other?.nom?.[0] || other?.name?.[0] || other?.email?.[0] || '?').toUpperCase();

          return (
            <TouchableOpacity
              style={styles.convItem}
              onPress={() => navigation.navigate('Chat', { conversation: item, recipient: other })}
            >
              <View style={styles.convAvatar}>
                <Text style={styles.convAvatarText}>{initial}</Text>
                {unread && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.convBody}>
                <View style={styles.convTopRow}>
                  <Text style={[styles.convName, unread && styles.convNameBold]}>
                    {displayName}
                  </Text>
                  <Text style={styles.convTime}>
                    {lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString('fr-FR') : ''}
                  </Text>
                </View>
                <View style={styles.convBottomRow}>
                  <Text
                    style={[styles.convPreview, unread && styles.convPreviewBold]}
                    numberOfLines={1}
                  >
                    {lastMsg
                      ? (lastMsg.senderId === user?.id ? 'Vous : ' : '') + lastMsg.content
                      : 'Démarrer la conversation'}
                  </Text>
                  {unread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Aucune conversation</Text>
            <Text style={styles.emptySubText}>
              Contactez un donateur depuis la page d'un don
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default ConversationList;