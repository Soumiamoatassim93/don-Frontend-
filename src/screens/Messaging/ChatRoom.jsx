import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socket.service';
import { API_URL } from '../../../config';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  myBubble: '#6366f1',
  otherBubble: '#e5e7eb',
};

const ChatRoom = ({ route, navigation }) => {
  // Récupérer le destinataire passé en paramètre
  const { recipient } = route.params || {};
  const { user, token } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Vérifier qu'on a un destinataire
  useEffect(() => {
    if (!recipient) {
      navigation.goBack();
    } else {
      navigation.setOptions({ title: recipient.name || recipient.email || 'Chat' });
      loadMessages();
    }
  }, [recipient]);

  // Charger l'historique des messages
  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/messaging/history/${recipient.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Écouter les nouveaux messages (WebSocket)
  useEffect(() => {
    if (!recipient) return;

    const unsubscribe = socketService.onNewMessage((newMessage) => {
      // Si le message concerne cette conversation
      if (newMessage.senderId === recipient.id || newMessage.receiverId === recipient.id) {
        setMessages(prev => [...prev, newMessage]);
        socketService.markRead(recipient.id);
      }
    });

    return () => unsubscribe();
  }, [recipient]);

  // Envoyer un message
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      content: text,
      senderId: user.id,
      receiverId: recipient.id,
      createdAt: new Date().toISOString(),
      pending: true
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');
    setSending(true);
    flatListRef.current?.scrollToEnd();

    try {
      const sentMessage = await socketService.sendMessage(recipient.id, text);
      setMessages(prev => prev.map(msg => msg.id === tempId ? sentMessage : msg));
    } catch (error) {
      console.error('Erreur envoi:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, failed: true } : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>
            {item.content}
          </Text>
          <Text style={styles.time}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {item.pending && ' ⏳'}
            {item.failed && ' ❌'}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.textLight}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!input.trim() || sending) && styles.disabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageRow: { marginBottom: 12, flexDirection: 'row' },
  myMessage: { justifyContent: 'flex-end' },
  theirMessage: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', padding: 10, paddingHorizontal: 14, borderRadius: 18 },
  myBubble: { backgroundColor: colors.myBubble, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: colors.otherBubble, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, color: colors.text },
  myMessageText: { color: '#fff' },
  time: { fontSize: 10, color: colors.textLight, marginTop: 4, textAlign: 'right' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontSize: 18 },
});

export default ChatRoom;