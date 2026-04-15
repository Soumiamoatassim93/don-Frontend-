import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../../config';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
};

const ConversationsList = ({ navigation }) => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = (recipient) => {
    navigation.navigate('ChatRoom', { recipient });
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messagerie</Text>
      </View>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const otherUser = item.participants?.find(p => p.id !== user?.id);
          const lastMessage = item.lastMessage;
          
          return (
            <TouchableOpacity 
              style={styles.conversationItem}
              onPress={() => openChat(otherUser)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {otherUser?.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.conversationInfo}>
                <Text style={styles.conversationName}>
                  {otherUser?.name || otherUser?.email || 'Utilisateur'}
                </Text>
                {lastMessage && (
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {lastMessage.content}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Aucune conversation</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingTop: 60, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  conversationItem: { flexDirection: 'row', padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  conversationInfo: { flex: 1 },
  conversationName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  lastMessage: { fontSize: 14, color: colors.textLight },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
});

export default ConversationsList;