// ChatRoom.js
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Platform, ActivityIndicator,
  KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Alert
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socket.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  myBubble: '#6366f1',
  otherBubble: '#e5e7eb',
};

const getConversationsKey = (userId) => `@conversations_${userId}`;

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

const ChatRoom = ({ route, navigation }) => {
  const { recipient } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const loadingMessagesRef = useRef(false);

  const TAB_BAR_HEIGHT = 60;

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
        // Évite les doublons en comparant les IDs
        const newMessages = [...prev];
        normalized.forEach(msg => {
          if (!newMessages.some(m => String(m.id) === String(msg.id))) {
            newMessages.push(msg);
          }
        });
        // Tri par date
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

  // Gestion des nouveaux messages via socket (UN SEUL LISTENER)
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
    // Pas de réinscription sur 'connect' pour éviter les doublons
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
        // Supprimer le message temporaire
        const filtered = prev.filter(msg => msg.id !== tempId);
        // Ajouter le vrai message seulement s'il n'existe pas déjà
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

  const renderMessage = ({ item, index }) => {
    const isMe = String(item.senderId) === safeUser?.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.content}</Text>
          <Text style={styles.time}>
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
            {item.pending && ' ⏳'}
            {item.failed && ' ❌'}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={TAB_BAR_HEIGHT + (Platform.OS === 'ios' ? insets.top : 0)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => {
                // Clé unique : id + index en sécurité
                if (item.id) return `${item.id}_${index}`;
                if (item.tempId) return item.tempId;
                return `msg_${index}_${Date.now()}`;
              }}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              onLayout={() => flatListRef.current?.scrollToEnd()}
              ListEmptyComponent={<View style={styles.emptyMessages}><Text>💬 Aucun message</Text></View>}
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Message..."
                multiline
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                style={[styles.sendButton, !input.trim() && styles.disabled]}
                onPress={sendMessage}
                disabled={!input.trim() || sending}
              >
                <Text style={styles.sendText}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom:50, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  keyboardView: { flex: 1 },
  innerContainer: { flex: 1 },
  messagesList: { padding: 16 ,paddingBottom: 88},
  messageRow: { marginBottom: 12, flexDirection: 'row' },
  myMessage: { justifyContent: 'flex-end' },
  theirMessage: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 18 },
  myBubble: { backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15 },
  myMessageText: { color: '#fff' },
  time: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  inputContainer: {
    flexDirection: 'row', padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb'
  },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center'
  },
  disabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontSize: 18 },
  emptyMessages: { padding: 40, alignItems: 'center' },
});

export default ChatRoom;