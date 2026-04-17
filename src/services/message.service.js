// services/message.service.js
import { getSocket } from './socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const emitWithAck = (event, data) => {
  const socket = getSocket();
  if (!socket) throw new Error('Socket non connecté');
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (response) => {
      if (response?.status === 'error') reject(new Error(response.message));
      else resolve(response);
    });
  });
};

class MessageService {
  async getStoredConversations() {
    try {
      const data = await AsyncStorage.getItem('conversations');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Erreur lecture conversations:', error);
      return [];
    }
  }

  async saveStoredConversations(conversations) {
    try {
      await AsyncStorage.setItem('conversations', JSON.stringify(conversations));
    } catch (error) {
      console.warn('Erreur sauvegarde conversations:', error);
    }
  }

  async getConversations() {
    return await this.getStoredConversations();
  }

  async createConversation(currentUser, recipient, donId = null) {
    const conversationId = `conv_${recipient.id}`;
    const existing = await this.getStoredConversations();
    const found = existing.find(c => c.id === conversationId);
    if (found) return found;

    const newConversation = {
      id: conversationId,
      participants: [
        { id: currentUser.id, nom: currentUser.nom, email: currentUser.email },
        { id: recipient.id, nom: recipient.nom, email: recipient.email }
      ],
      donId,
      lastMessage: null,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const conversations = [newConversation, ...existing];
    await this.saveStoredConversations(conversations);
    return newConversation;
  }

  async getMessages(conversationId) {
    const recipientId = conversationId.replace('conv_', '');
    return await this.getMessagesVirtual(recipientId);
  }

  async getMessagesVirtual(recipientId) {
    const response = await emitWithAck('get_conversation', { withUserId: String(recipientId) });
    return Array.isArray(response) ? response : [];
  }

  async sendMessage(conversationId, content) {
    const recipientId = conversationId.replace('conv_', '');
    const response = await emitWithAck('send_message', {
      receiverId: String(recipientId),
      content,
    });
    if (response?.status === 'sent') {
      await this.updateLastMessage(conversationId, response.message);
      return response.message;
    }
    throw new Error('Envoi échoué');
  }

  async updateLastMessage(conversationId, message) {
    const conversations = await this.getStoredConversations();
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.lastMessage = message;
      conv.updatedAt = new Date().toISOString();
      await this.saveStoredConversations(conversations);
    }
  }

  async markAsRead(conversationId) {
    const recipientId = conversationId.replace('conv_', '');
    try {
      await emitWithAck('mark_read', { fromUserId: String(recipientId) });
      const conversations = await this.getStoredConversations();
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        conv.unreadCount = 0;
        await this.saveStoredConversations(conversations);
      }
    } catch (err) {
      console.warn('markAsRead error:', err);
    }
  }

  async deleteConversation(conversationId) {
    const conversations = await this.getStoredConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    await this.saveStoredConversations(filtered);
    return conversationId;
  }
}

export const messageService = new MessageService();