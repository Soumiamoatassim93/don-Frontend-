import AsyncStorage from '@react-native-async-storage/async-storage';

class ConversationService {
  // Sauvegarder les messages localement
  async saveMessage(message) {
    try {
      const key = `conversation_${message.senderId}_${message.receiverId}`;
      const existing = await this.getMessages(message.senderId, message.receiverId);
      existing.push(message);
      await AsyncStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Erreur sauvegarde message:', error);
    }
  }

  // Récupérer les messages entre deux utilisateurs
  async getMessages(userId, otherId) {
    try {
      const key = `conversation_${userId}_${otherId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      return [];
    }
  }

  // Récupérer toutes les conversations d'un utilisateur
  async getUserConversations(userId) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const conversationKeys = keys.filter(key => key.startsWith(`conversation_${userId}_`) || key.includes(`_${userId}`));
      
      const conversations = [];
      for (const key of conversationKeys) {
        const messages = await AsyncStorage.getItem(key);
        if (messages) {
          const parsed = JSON.parse(messages);
          if (parsed.length > 0) {
            const otherId = key.split('_')[2];
            conversations.push({
              userId: otherId,
              lastMessage: parsed[parsed.length - 1].content,
              recipient: { id: otherId, name: `Utilisateur ${otherId}` }
            });
          }
        }
      }
      return conversations;
    } catch (error) {
      console.error('Erreur récupération conversations:', error);
      return [];
    }
  }
}

export default new ConversationService();