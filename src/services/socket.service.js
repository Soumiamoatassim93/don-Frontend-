import io from 'socket.io-client';
import { API_URL } from '../../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.messageCallbacks = new Set();
    this.readReceiptCallbacks = new Set();
  }

  connect(token, userId) {
    if (this.socket?.connected) {
      console.log('Socket déjà connecté');
      return;
    }

    if (!token || !userId) {
      console.error('Token ou userId manquant');
      return;
    }

    console.log('🔌 Connexion socket...', `${API_URL}/messaging`);
    
    this.socket = io(`${API_URL}/messaging`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connecté');
      this.userId = userId;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket déconnecté');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur socket:', error.message);
    });

    this.socket.on('new_message', (message) => {
      console.log('📨 Nouveau message reçu:', message);
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('messages_read', (data) => {
      console.log('👀 Messages lus par:', data.by);
      this.readReceiptCallbacks.forEach(callback => callback(data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageCallbacks.clear();
    this.readReceiptCallbacks.clear();
  }

  sendMessage(receiverId, content, type = 'text') {
    if (!this.socket?.connected) {
      console.error('Socket non connecté');
      return Promise.reject('Socket non connecté');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('send_message', 
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
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onMessagesRead(callback) {
    this.readReceiptCallbacks.add(callback);
    return () => this.readReceiptCallbacks.delete(callback);
  }
}

export default new SocketService();