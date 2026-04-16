// screens/ConversationsList/ConversationsList.jsx
import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useConversations } from '../../hooks/useConversations';
import { styles, colors } from './ConversationsList.style';

const ConversationsList = ({ navigation }) => {
  const {
    conversations,
    isLoading,
    refreshing,
    clearAllConversations,
    onRefresh,
  } = useConversations();

  const openChat = (recipient) => {
    navigation.navigate('ChatRoom', { recipient });
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={clearAllConversations} style={styles.clearButton}>
        <Text style={styles.clearButtonText}>🗑️ Effacer toutes les conversations</Text>
      </TouchableOpacity>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>Aucune conversation</Text>
          <Text style={styles.emptySubText}>
            Contactez un donateur depuis la page d'un don
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => {
            if (item.otherId != null) {
              return `${item.otherId}_${index}`;
            }
            return `fallback_${index}`;
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.conversationItem} onPress={() => openChat(item.recipient)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.recipient?.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.conversationInfo}>
                <Text style={styles.conversationName}>
                  {item.recipient?.name || `Utilisateur ${item.otherId}`}
                </Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default ConversationsList;