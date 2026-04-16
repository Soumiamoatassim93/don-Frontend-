// hooks/useChatRoom.js
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';
import socketService from '../services/socket.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper pour la clé de stockage
const getConversationsKey = (userId) => `@conversations_${userId}`;

// Sauvegarde d'une conversation dans AsyncStorage
const saveConversationToStorage = async (userId, recipient, message) => {
  try {
    const key = getConversationsKey(userId);
    const stored = await AsyncStorage.getItem(key);
    let conversations = stored ? JSON.parse(stored) : [];
    const existing = conversations.find(c => c.otherId === recipient.id);
    if (existing) {
      conversations = conversations.map(c =>
        c.otherId === recipient.id
          ? { ...c, lastMessage: message, recipient, updatedAt: Date.now() }
          : c
      );
    } else {
      conversations.push({
        otherId: recipient.id,
        recipient,
        lastMessage: message,
        updatedAt: Date.now()
      });
    }
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    await AsyncStorage.setItem(key, JSON.stringify(conversations));
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
  }
};

export const useChatRoom = (route, navigation) => {
  const { recipient } = route.params || {};
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const loadingMessagesRef = useRef(false);

  const safeRecipient = useMemo(() => 
    recipient ? { ...recipient, id: String(recipient.id) } : null,
    [recipient]
  );
  const safeUser = useMemo(() => 
    user ? { ...user, id: String(user.id) } : null,
    [user]
  );

  const loadMessages = useCallback(async () => {
    if (!safeRecipient || !safeUser) return;
    if (loadingMessagesRef.current) return;
    loadingMessagesRef.current = true;
    try {
      const conversation = await socketService.getConversation(safeRecipient.id);
      const normalized = (conversation || []).map(msg => ({
        ...msg,
        id: String(msg.id),
        senderId: String(msg.senderId),
        receiverId: String(msg.receiverId)
      }));
      setMessages(prev => {
        const newMessages = [...prev];
        normalized.forEach(msg => {
          if (!newMessages.some(m => String(m.id) === String(msg.id))) {
            newMessages.push(msg);
          }
        });
        newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return newMessages;
      });
      socketService.markRead(safeRecipient.id);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setIsLoading(false);
      loadingMessagesRef.current = false;
    }
  }, [safeRecipient, safeUser]);

  // Chargement initial et au focus
  useEffect(() => {
    if (safeRecipient && safeUser) loadMessages();
  }, [safeRecipient, safeUser, loadMessages]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      loadMessages();
    });
    return unsubscribeFocus;
  }, [navigation, loadMessages]);

  // Écoute des nouveaux messages (un seul listener)
  useEffect(() => {
    if (!safeRecipient || !safeUser) return;

    const handleNewMessage = (newMessage) => {
      const msgSenderId = String(newMessage.senderId);
      const msgReceiverId = String(newMessage.receiverId);
      const isForThisChat =
        (msgSenderId === safeRecipient.id && msgReceiverId === safeUser.id) ||
        (msgSenderId === safeUser.id && msgReceiverId === safeRecipient.id);
      if (!isForThisChat) return;

      setMessages(prev => {
        if (prev.some(m => String(m.id) === String(newMessage.id))) return prev;
        return [...prev, { ...newMessage, id: String(newMessage.id), senderId: msgSenderId, receiverId: msgReceiverId }];
      });
      saveConversationToStorage(safeUser.id, safeRecipient, newMessage.content);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const unsubscribe = socketService.onNewMessage(handleNewMessage);
    return () => unsubscribe();
  }, [safeRecipient, safeUser]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMsg = {
      id: tempId,
      content: text,
      senderId: safeUser.id,
      receiverId: safeRecipient.id,
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');
    setSending(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const sentMessage = await socketService.sendMessage(safeRecipient.id, text);
      const normalizedSent = {
        ...sentMessage,
        id: String(sentMessage.id),
        senderId: String(sentMessage.senderId),
        receiverId: String(sentMessage.receiverId)
      };

      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempId);
        if (filtered.some(m => String(m.id) === normalizedSent.id)) {
          return filtered;
        }
        return filtered.concat({ ...normalizedSent, pending: false });
      });
      await saveConversationToStorage(safeUser.id, safeRecipient, text);
    } catch (error) {
      setMessages(prev =>
        prev.map(msg => (msg.id === tempId ? { ...msg, failed: true, pending: false } : msg))
      );
      Alert.alert('Erreur', "Le message n'a pas pu être envoyé");
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    input,
    isLoading,
    sending,
    safeUser,
    flatListRef,
    setInput,
    sendMessage,
  };
};