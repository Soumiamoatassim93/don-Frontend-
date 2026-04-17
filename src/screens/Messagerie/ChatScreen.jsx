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

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (!recipient?.id) {
          throw new Error('Destinataire invalide (pas d\'ID)');
        }
        console.log('Initialisation conversation avec recipient:', recipient);
        
        // Appel pour créer/récupérer la conversation
        const conv = await getOrCreateConversation(recipient, don?.id);
        console.log('Conversation reçue:', conv);
        
        if (!conv || !conv.id) {
          throw new Error('La conversation retournée n\'a pas d\'ID');
        }
        
        if (mounted) {
          setConversationId(conv.id);
          setCurrentConv(conv);
          await getMessages(conv.id);
          await markAsRead(conv.id);
        }
      } catch (err) {
        console.error('Erreur init conversation:', err);
        if (mounted) setInitError(err.message);
      }
    };
    init();
    return () => { mounted = false; };
  }, [recipient?.id]); // seulement si l'ID change

  // Titre du header
  useEffect(() => {
    const title = recipient?.nom || recipient?.name || 'Chat';
    navigation.setOptions({ title });
  }, [recipient, navigation]);

  // Auto-scroll
  useEffect(() => {
    if (flatListRef.current && messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    if (sendingMessage) return;
    if (!conversationId) {
      Alert.alert('Erreur', 'Conversation non initialisée. Réessayez.');
      return;
    }

    const tempId = Date.now();
    addOptimisticMsg(tempId, text, user?.id, new Date().toISOString());
    setInput('');

    try {
      const message = await sendNewMessage(conversationId, text, tempId);
      updateOptimisticMsg(tempId, message);
    } catch (error) {
      console.error('Send error:', error);
      markMsgFailed(tempId);
      Alert.alert('Erreur', "Le message n'a pas pu être envoyé");
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === user?.id;
    const avatarLetter = (recipient?.nom || recipient?.name || '?')[0].toUpperCase();
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>{avatarLetter}</Text>
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
          <Text style={{ color: '#6366f1' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Tant que conversationId n'est pas défini, on affiche le chargement
  if (!conversationId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 10 }}>Chargement de la conversation...</Text>
      </View>
    );
  }

  const isSendDisabled = !input.trim() || sendingMessage;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
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
          style={[styles.sendBtn, isSendDisabled && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={isSendDisabled}
        >
          <Text style={styles.sendBtnIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;