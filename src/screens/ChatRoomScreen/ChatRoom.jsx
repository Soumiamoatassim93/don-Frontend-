// screens/ChatRoomScreen/ChatRoom.jsx
import React from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, Platform, ActivityIndicator,
  KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatRoom } from '../../hooks/useChatRoom';
import { styles, colors } from './Style';

const ChatRoom = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 60;

  const {
    messages,
    input,
    isLoading,
    sending,
    safeUser,
    flatListRef,
    setInput,
    sendMessage,
  } = useChatRoom(route, navigation);

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

export default ChatRoom;