// services/message.service.js
import { getSocket } from './socketService'; // Ajout de l'import

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
  // Récupérer toutes les conversations (simulation)
  // Idéalement il faudrait un endpoint dédié, on va retourner une liste vide
  // et laisser l'utilisateur créer des conversations à la demande
  async getConversations() {
    // Dans un vrai système, il faudrait un appel socket 'get_conversations_list'
    // ou stocker les conversations localement. Pour l'instant, on retourne un tableau vide.
    return [];
  }

  // Créer ou récupérer une conversation (virtuelle)
  async createConversation(recipientId, donId = null) {
    // On vérifie s'il y a déjà des messages entre les deux utilisateurs
    try {
      const messages = await this.getMessagesVirtual(recipientId);
      // Créer un objet conversation virtuel
      return {
        id: `conv_${recipientId}`,
        recipientId,
        donId,
        participants: [{ id: recipientId }],
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      // Si erreur, on retourne quand même un objet
      return {
        id: `conv_${recipientId}`,
        recipientId,
        donId,
        participants: [{ id: recipientId }],
        lastMessage: null,
        unreadCount: 0,
      };
    }
  }

  // Récupérer les messages d'une conversation (virtuelle)
  async getMessages(conversationId) {
    const recipientId = conversationId.replace('conv_', '');
    return this.getMessagesVirtual(recipientId);
  }

  // Méthode interne pour récupérer les messages avec un utilisateur via WebSocket
  async getMessagesVirtual(recipientId) {
    const response = await emitWithAck('get_conversation', { withUserId: String(recipientId) });
    // response est directement le tableau de messages
    return Array.isArray(response) ? response : [];
  }

  // Envoyer un message
  async sendMessage(conversationId, content) {
    const recipientId = conversationId.replace('conv_', '');
    const response = await emitWithAck('send_message', {
      receiverId: String(recipientId),
      content,
    });
    if (response?.status === 'sent') {
      return response.message; // le message envoyé
    }
    throw new Error('Envoi échoué');
  }

  // Marquer comme lu
  async markAsRead(conversationId) {
    const recipientId = conversationId.replace('conv_', '');
    try {
      await emitWithAck('mark_read', { fromUserId: String(recipientId) });
    } catch (err) {
      console.warn('markAsRead error:', err);
    }
  }

  // Supprimer une conversation (non supporté par WebSocket, on ignore)
  async deleteConversation(conversationId) {
    // Pas d'équivalent, on pourrait supprimer localement mais côté serveur rien
    return conversationId;
  }
}

export const messageService = new MessageService();