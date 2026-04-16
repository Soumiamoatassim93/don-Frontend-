// hooks/useConversations.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import socketService from '../services/socket.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const getConversationsKey = () => `@conversations_${user?.id}`;

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
    return new Promise((resolve) => {
      Alert.alert(
        'Nettoyage',
        'Supprimer toutes les conversations ?',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Oui, supprimer',
            onPress: async () => {
              const key = getConversationsKey();
              await AsyncStorage.removeItem(key);
              setConversations([]);
              await loadConversations();
              resolve(true);
            },
            style: 'destructive'
          }
        ]
      );
    });
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('🔄 Écran focus, rechargement...');
        loadConversations();
      }
    }, [loadConversations, user?.id])
  );

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

  return {
    conversations,
    isLoading,
    refreshing,
    loadConversations,
    clearAllConversations,
    onRefresh,
  };
};