// screens/Messagerie/ChatScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { styles } from './MessagerieStyles';

const ChatScreen = ({ route, navigation }) => {
  const { recipient, don } = route.params;
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    sendingMessage,
    getOrCreateConversation,
    getMessages,
    sendNewMessage,
    markAsRead,
    addOptimisticMsg,
    updateOptimisticMsg,
    markMsgFailed,
    setCurrentConv,
  } = useMessages();

  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [initError, setInitError] = useState(null);
  const flatListRef = useRef(null);

  // Initialisation de la conversation
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (!recipient?.id) throw new Error('Destinataire invalide');
        const conv = await getOrCreateConversation(recipient.id, don?.id);
        if (mounted) {
          setConversationId(conv.id);
          setCurrentConv(conv);
          await getMessages(conv.id);
          await markAsRead(conv.id);
        }
      } catch (err) {
        if (mounted) setInitError(err.message);
      }
    };
    init();
    return () => { mounted = false; };
  }, [recipient?.id]);

  // Titre du header (pas de nom si absent)
  useEffect(() => {
    navigation.setOptions({
      title: recipient?.name || 'Chat',
    });
  }, [recipient]);

  // Auto-scroll
  useEffect(() => {
    if (flatListRef.current && messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Envoi d'un message
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sendingMessage || !conversationId) return;

    const tempId = Date.now();
    addOptimisticMsg(tempId, text, user?.id, new Date().toISOString());
    setInput('');

    try {
      const message = await sendNewMessage(conversationId, text, tempId);
      updateOptimisticMsg(tempId, message);
    } catch (error) {
      markMsgFailed(tempId);
      Alert.alert('Erreur', "Le message n'a pas pu être envoyé");
    }
  };

  // Rendu d'un message
  const renderItem = ({ item }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {/* Avatar uniquement si le destinataire a un nom */}
        {!isMe && recipient?.name && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {recipient.name[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleOther,
          item.failed && styles.bubbleFailed
        ]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {item.pending && ' ⏳'}
            {item.failed && ' ❌'}
          </Text>
        </View>
      </View>
    );
  };

  if (initError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', marginBottom: 10 }}>Erreur : {initError}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: styles.primary }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Bannière du don (optionnelle) */}
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
        renderItem={renderItem}
        contentContainerStyle={styles.msgList}
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
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || sendingMessage) && styles.sendBtnDisabled
          ]}
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