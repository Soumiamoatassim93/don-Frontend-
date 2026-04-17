// services/message.service.js
import { authService } from './auth.service';

class MessageService {
  constructor() {
    this.api = authService.api;
  }

  // Récupérer toutes les conversations de l'utilisateur
  async getConversations() {
    const response = await this.api.get('/conversations');
    return response.data;
  }

  // Créer ou récupérer une conversation
  async createConversation(recipientId, donId = null) {
    const response = await this.api.post('/conversations', {
      recipientId,
      donId,
    });
    return response.data;
  }

  // Récupérer les messages d'une conversation
  async getMessages(conversationId) {
    const response = await this.api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  }

  // Envoyer un message
  async sendMessage(conversationId, content) {
    const response = await this.api.post(`/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  }

  // Marquer les messages comme lus
  async markAsRead(conversationId) {
    const response = await this.api.patch(`/conversations/${conversationId}/read`);
    return response.data;
  }

  // Supprimer une conversation
  async deleteConversation(conversationId) {
    const response = await this.api.delete(`/conversations/${conversationId}`);
    return response.data;
  }
}

export const messageService = new MessageService();