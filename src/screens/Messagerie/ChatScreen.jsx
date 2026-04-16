// screens/Messagerie/ChatScreen.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { styles } from './MessagerieStyles';

const ChatScreen = ({ route, navigation }) => {
  const { conversation: initialConversation, recipient, don } = route.params;
  const { user } = useAuth();
  const {
    currentConversation,
    messages,
    isLoading,
    sendingMessage,
    sendError,
    getOrCreateConversation,
    getMessages,
    sendNewMessage,
    markAsRead,
    addOptimisticMsg,
    updateOptimisticMsg,
    markMsgFailed,
    setCurrentConv,
    startPolling,
    stopPolling,
  } = useMessages();

  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(initialConversation?.id || null);
  const flatListRef = useRef(null);

  // Initialiser la conversation
  useEffect(() => {
    const initConversation = async () => {
      try {
        let convId = conversationId;
        
        if (!convId && recipient?.id) {
          const conv = await getOrCreateConversation(recipient.id, don?.id || null);
          convId = conv.id;
          setConversationId(convId);
          setCurrentConv(conv);
        }
        
        if (convId) {
          await getMessages(convId);
          await markAsRead(convId);
          // Démarrer le polling
          startPolling(convId);
        }
      } catch (error) {
        console.log('Erreur initialisation:', error);
      }
    };
    
    initConversation();
    
    return () => {
      stopPolling();
    };
  }, [recipient?.id, don?.id]);

  // Titre du header
  useEffect(() => {
    const other = currentConversation?.participants?.find(p => p.id !== user?.id);
    navigation.setOptions({
      title: recipient?.name || recipient?.email || other?.name || other?.email || 'Chat',
      headerStyle: { backgroundColor: styles.card },
      headerTintColor: '#6366f1',
    });
  }, [recipient, currentConversation, user]);

  // Auto-scroll
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sendingMessage || !conversationId) return;

    const tempId = Date.now();
    const createdAt = new Date().toISOString();
    
    // Ajouter message optimiste
    addOptimisticMsg(tempId, text, user?.id, createdAt);
    setInput('');
    
    try {
      const message = await sendNewMessage(conversationId, text, tempId);
      updateOptimisticMsg(tempId, message);
    } catch (error) {
      markMsgFailed(tempId);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.id;
    const other = currentConversation?.participants?.find(p => p.id !== user?.id);
    
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {other?.name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, item.failed && styles.bubbleFailed]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {item.pending && ' ⏳'}
            {item.failed && ' ❌'}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading && !conversationId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Aperçu du don */}
      {don && (
        <View style={styles.donBanner}>
          <Text style={styles.donBannerIcon}>📦</Text>
          <Text style={styles.donBannerText} numberOfLines={1}>
            À propos de : {don.title}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>Commencez la conversation 👋</Text>
          </View>
        }
      />

      {/* Zone de saisie */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Écrire un message..."
          placeholderTextColor="#6b7280"
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sendingMessage) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sendingMessage}
        >
          <Text style={styles.sendBtnIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;