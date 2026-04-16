// ConversationsList.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socket.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
};

const ConversationsList = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const getConversationsKey = () => `@conversations_${user?.id}`;

  // Fonction pour enlever les doublons par otherId
  const deduplicateConversations = (convs) => {
    const map = new Map();
    for (const conv of convs) {
      const id = conv.otherId;
      if (!map.has(id) || map.get(id).updatedAt < conv.updatedAt) {
        map.set(id, conv);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  };

  const loadConversations = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const userId = user?.id;
    if (!userId) {
      setIsLoading(false);
      loadingRef.current = false;
      return;
    }
    try {
      const key = getConversationsKey();
      console.log('📥 Chargement des conversations clé:', key);
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        let allConversations = JSON.parse(stored);
        console.log('📊 Conversations brutes:', allConversations.length);
        allConversations = deduplicateConversations(allConversations);
        console.log('📊 Conversations uniques:', allConversations.length);
        setConversations(allConversations);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  const clearAllConversations = async () => {
    if (!user?.id) return;
    Alert.alert(
      'Nettoyage',
      'Supprimer toutes les conversations ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Oui, supprimer', 
          onPress: async () => {
            const key = getConversationsKey();
            await AsyncStorage.removeItem(key);
            setConversations([]); // Vide immédiatement l'UI
            loadConversations();  // Recharge (vide)
            Alert.alert('✅ Terminé', 'Toutes les conversations ont été supprimées');
          },
          style: 'destructive'
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('🔄 Écran focus, rechargement...');
        loadConversations();
      }
    }, [loadConversations, user?.id])
  );

  // Un seul listener Socket, pas de double inscription
  useEffect(() => {
    if (!user?.id) return;
    const handleNewMessage = () => {
      console.log('📨 Nouveau message, rechargement...');
      loadConversations();
    };
    const unsubscribe = socketService.onNewMessage(handleNewMessage);
    return () => unsubscribe();
  }, [user?.id, loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

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
            // Clé unique : otherId + index pour éviter tout conflit
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  clearButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    marginTop: 50,
  },
  clearButtonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  conversationItem: {
    flexDirection: 'row', padding: 16, backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center'
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  conversationInfo: { flex: 1 },
  conversationName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  lastMessage: { fontSize: 14, color: colors.textLight },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubText: { fontSize: 14, color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },
});

export default ConversationsList;