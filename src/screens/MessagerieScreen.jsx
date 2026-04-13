import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { API_URL } from '../../config';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  myBubble: '#6366f1',
  otherBubble: '#e5e7eb',
};

const POLL_INTERVAL = 4000; // polling toutes les 4s (remplacer par WebSocket si dispo)

// ─── Composant : liste des conversations ───────────────────────────────────
const ConversationList = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await authService.api.get('/conversations');
        setConversations(res.data);
      } catch (e) {
        console.log('❌ conversations:', e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messagerie</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const other = item.participants?.find((p) => p.id !== user?.id);
          const lastMsg = item.lastMessage;
          const unread = item.unreadCount > 0;

          return (
            <TouchableOpacity
              style={styles.convItem}
              onPress={() => navigation.navigate('Chat', { conversation: item, recipient: other })}
            >
              <View style={styles.convAvatar}>
                <Text style={styles.convAvatarText}>
                  {other?.name?.[0]?.toUpperCase() || other?.email?.[0]?.toUpperCase() || '?'}
                </Text>
                {unread && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.convBody}>
                <View style={styles.convTopRow}>
                  <Text style={[styles.convName, unread && styles.convNameBold]}>
                    {other?.name || other?.email || 'Utilisateur'}
                  </Text>
                  <Text style={styles.convTime}>
                    {lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString('fr-FR') : ''}
                  </Text>
                </View>
                <View style={styles.convBottomRow}>
                  <Text
                    style={[styles.convPreview, unread && styles.convPreviewBold]}
                    numberOfLines={1}
                  >
                    {lastMsg
                      ? (lastMsg.senderId === user?.id ? 'Vous : ' : '') + lastMsg.content
                      : 'Démarrer la conversation'}
                  </Text>
                  {unread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Aucune conversation</Text>
            <Text style={styles.emptySubText}>
              Contactez un donateur depuis la page d'un don
            </Text>
          </View>
        }
      />
    </View>
  );
};

// ─── Composant : chat d'une conversation ──────────────────────────────────
const ChatScreen = ({ route, navigation }) => {
  const { conversation, recipient, don } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(conversation?.id || null);

  const flatListRef = useRef(null);
  const pollRef = useRef(null);

  // Charge ou crée la conversation, puis charge les messages
  const initConversation = useCallback(async () => {
    try {
      let convId = conversationId;

      if (!convId && recipient?.id) {
        // Crée ou retrouve la conversation avec ce recipient (+ don optionnel)
        const res = await authService.api.post('/conversations', {
          recipientId: recipient.id,
          donId: don?.id || null,
        });
        convId = res.data.id;
        setConversationId(convId);
      }

      if (convId) {
        const res = await authService.api.get(`/conversations/${convId}/messages`);
        setMessages(res.data);
        // Marquer comme lu
        await authService.api.patch(`/conversations/${convId}/read`).catch(() => {});
      }
    } catch (e) {
      console.log('❌ initConversation:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, recipient, don]);

  // Polling des nouveaux messages
  const pollMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await authService.api.get(`/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (e) {
      console.log('❌ poll:', e.message);
    }
  }, [conversationId]);

  useEffect(() => {
    initConversation();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    pollRef.current = setInterval(pollMessages, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [conversationId, pollMessages]);

  // Titre du header
  useEffect(() => {
    navigation.setOptions({
      title: recipient?.name || recipient?.email || 'Chat',
      headerStyle: { backgroundColor: colors.card },
      headerTintColor: colors.primary,
    });
  }, [recipient]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      content: text,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await authService.api.post(`/conversations/${conversationId}/messages`, {
        content: text,
      });
      // Remplace le message optimiste par le vrai
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.data : m))
      );
    } catch (e) {
      // Marque le message comme échoué
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, failed: true, pending: false } : m))
      );
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {recipient?.name?.[0]?.toUpperCase() || '?'}
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Aperçu du don si disponible */}
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
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendBtnIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Export principal : MessagerieScreen gère les deux vues ────────────────
const MessagerieScreen = ({ route, navigation }) => {
  // Si on arrive avec un recipient (depuis DonDetail), on va directement au chat
  if (route?.params?.recipient || route?.params?.conversation) {
    return <ChatScreen route={route} navigation={navigation} />;
  }
  return <ConversationList navigation={navigation} />;
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header liste
  header: { backgroundColor: colors.card, padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },

  // Conversation item
  convItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  convAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  convAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', borderWidth: 2, borderColor: colors.card },
  convBody: { flex: 1 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 15, color: colors.text },
  convNameBold: { fontWeight: '700' },
  convTime: { fontSize: 12, color: colors.textLight },
  convBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convPreview: { fontSize: 13, color: colors.textLight, flex: 1 },
  convPreviewBold: { color: colors.text, fontWeight: '600' },
  unreadBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubText: { fontSize: 14, color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },

  // Don banner
  donBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ede9fe', padding: 10, paddingHorizontal: 16, gap: 8 },
  donBannerIcon: { fontSize: 16 },
  donBannerText: { fontSize: 13, color: colors.reqColor, fontWeight: '500', flex: 1 },

  // Messages
  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  msgAvatarText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bubble: { maxWidth: '75%', padding: 10, paddingHorizontal: 14, borderRadius: 18 },
  bubbleMe: { backgroundColor: colors.myBubble, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.otherBubble, borderBottomLeftRadius: 4 },
  bubbleFailed: { opacity: 0.6 },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: colors.textLight, marginTop: 3, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },

  // Input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnIcon: { color: '#fff', fontSize: 16 },

  // Empty chat
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: 15, color: colors.textLight },
});

export default MessagerieScreen;