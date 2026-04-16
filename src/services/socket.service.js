// socket.service.js
import io from 'socket.io-client';
import { API_URL } from '../../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.messageCallbacks = [];
    this.userId = null;
  }

  connect(token, userId) {
    console.log('=========================================');
    console.log('🔌 CONNEXION SOCKET');
    console.log(`   UserId: ${userId}`);
    console.log(`   URL: ${API_URL}/messaging`);
    console.log('=========================================');

    if (this.socket?.connected) {
      console.log('⚠️ Socket déjà connecté, fermeture...');
      this.socket.disconnect();
    }

    if (!token || !userId) {
      console.error('❌ Token ou userId manquant:', { token: !!token, userId });
      return;
    }

    // ✅ FIX 1: Assigner userId IMMÉDIATEMENT, pas dans le callback async
    // Avant, this.userId était null quand les premiers messages arrivaient
    this.userId = userId;

    this.socket = io(`${API_URL}/messaging`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ SOCKET CONNECTÉ! ID:', this.socket.id);
      // userId déjà assigné ci-dessus, pas besoin de le réassigner ici
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`❌ SOCKET DÉCONNECTÉ - Raison: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ ERREUR CONNEXION SOCKET:', error.message);
    });

    this.socket.on('new_message', (message) => {
      console.log('=========================================');
      console.log('📨 NOUVEAU MESSAGE REÇU');
      console.log(`   Sender: ${message.senderId} | Receiver: ${message.receiverId}`);
      console.log(`   User actuel: ${this.userId}`);
      console.log(`   Callbacks enregistrés: ${this.messageCallbacks.length}`);
      console.log('=========================================');

      // Appeler tous les callbacks enregistrés
      this.messageCallbacks.forEach((callback, index) => {
        try {
          callback(message);
        } catch (err) {
          console.error(`❌ Erreur callback ${index}:`, err);
        }
      });
    });

    this.socket.on('messages_read', (data) => {
      console.log('👀 MESSAGES LUS par:', data.by);
    });
  }

  disconnect() {
    console.log('🔌 Déconnexion socket manuelle');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    // ✅ FIX 2: Ne PAS vider messageCallbacks ici
    // Avant, disconnect() vidait les callbacks, donc après une reconnexion
    // automatique, ChatRoom n'avait plus de listener actif
    // this.messageCallbacks = [];  ← SUPPRIMÉ
    this.userId = null;
  }

  sendMessage(receiverId, content, type = 'text') {
    if (!this.socket?.connected) {
      console.error('❌ Socket non connecté');
      return Promise.reject('Socket non connecté');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit(
        'send_message',
        { receiverId, content, type },
        (response) => {
          if (response?.status === 'sent') {
            resolve(response.message);
          } else {
            reject(response || { error: 'Erreur inconnue' });
          }
        }
      );
    });
  }

  getConversation(withUserId) {
    if (!this.socket?.connected) {
      return Promise.reject('Socket non connecté');
    }

    return new Promise((resolve) => {
      this.socket.emit('get_conversation', { withUserId }, (conversation) => {
        resolve(conversation || []);
      });
    });
  }

  markRead(fromUserId) {
    if (!this.socket?.connected) return;
    this.socket.emit('mark_read', { fromUserId });
  }

  onNewMessage(callback) {
    if (typeof callback !== 'function') {
      console.error('❌ onNewMessage: callback doit être une fonction');
      return () => {};
    }
    this.messageCallbacks.push(callback);
    console.log(`🎧 Callback ajouté. Total: ${this.messageCallbacks.length}`);

    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
      console.log(`🧹 Callback retiré. Restant: ${this.messageCallbacks.length}`);
    };
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();