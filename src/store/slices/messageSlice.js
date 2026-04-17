// store/slices/messageSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageService } from '../../services/message.service';

// ─── THUNKS ───────────────────────────────────────────────────────────────

export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await messageService.getConversations();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Modifié : attend { recipient, donId } avec recipient = { id, nom, email }
export const fetchOrCreateConversation = createAsyncThunk(
  'messages/fetchOrCreateConversation',
  async ({ recipient, donId }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentUser = state.auth?.user;
      if (!currentUser) throw new Error('Utilisateur non connecté');
      return await messageService.createConversation(currentUser, recipient, donId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const messages = await messageService.getMessages(conversationId);
      return { conversationId, messages };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, content, tempId }, { rejectWithValue }) => {
    try {
      const message = await messageService.sendMessage(conversationId, content);
      return { conversationId, message, tempId };
    } catch (err) {
      return rejectWithValue({ tempId, error: err.message });
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      await messageService.markAsRead(conversationId);
      return conversationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'messages/deleteConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await messageService.deleteConversation(conversationId);
      return conversationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── SLICE ─────────────────────────────────────────────────────────────────

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    conversations: [],
    currentConversation: null,
    messages: [],
    isLoading: false,
    error: null,
    sendingMessage: false,
    sendError: null,
    pollingInterval: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.sendError = null;
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    addOptimisticMessage: (state, action) => {
      const { tempId, content, userId, createdAt } = action.payload;
      state.messages.push({
        id: tempId,
        content,
        senderId: userId,
        createdAt,
        pending: true,
      });
    },
    updateOptimisticMessage: (state, action) => {
      const { tempId, message } = action.payload;
      const index = state.messages.findIndex(m => m.id === tempId);
      if (index !== -1) state.messages[index] = message;
    },
    markMessageFailed: (state, action) => {
      const { tempId } = action.payload;
      const index = state.messages.findIndex(m => m.id === tempId);
      if (index !== -1) {
        state.messages[index].failed = true;
        state.messages[index].pending = false;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentConversation = null;
    },
    updateUnreadCount: (state, action) => {
      const { conversationId, unreadCount } = action.payload;
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) conversation.unreadCount = unreadCount;
    },
    setPollingInterval: (state, action) => {
      state.pollingInterval = action.payload;
    },
    clearPollingInterval: (state) => {
      if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
      }
    },
    resetMessages: (state) => {
      state.messages = [];
      state.currentConversation = null;
      state.error = null;
      state.sendError = null;
    },
    receiveNewMessage: (state, action) => {
      const message = action.payload;
      const senderId = String(message.senderId);
      const convId = `conv_${senderId}`;
      
      let conversation = state.conversations.find(c => c.id === convId);
      if (!conversation) {
        const senderNom = message.senderNom || 'Utilisateur';
        const senderEmail = message.senderEmail || '';
        conversation = {
          id: convId,
          participants: [
            { id: senderId, nom: senderNom, email: senderEmail },
          ],
          lastMessage: message,
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.conversations.unshift(conversation);
      } else {
        conversation.lastMessage = message;
        conversation.updatedAt = new Date().toISOString();
      }
      
      if (!state.currentConversation || state.currentConversation.id !== convId) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
      
      if (state.currentConversation && state.currentConversation.id === convId) {
        if (!state.messages.some(m => m.id === message.id)) {
          state.messages.push(message);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrCreateConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrCreateConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentConversation = action.payload;
        const exists = state.conversations.some(c => c.id === action.payload.id);
        if (!exists) state.conversations.unshift(action.payload);
      })
      .addCase(fetchOrCreateConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.sendError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { tempId, message, conversationId } = action.payload;
        const index = state.messages.findIndex(m => m.id === tempId);
        if (index !== -1) state.messages[index] = message;
        else state.messages.push(message);
        
        const conv = state.conversations.find(c => c.id === conversationId);
        if (conv) {
          conv.lastMessage = message;
          conv.updatedAt = new Date().toISOString();
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.sendError = action.payload.error;
      })
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) conversation.unreadCount = 0;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(c => c.id !== action.payload);
        if (state.currentConversation?.id === action.payload) {
          state.currentConversation = null;
          state.messages = [];
        }
      });
  },
});

export const {
  clearError,
  setCurrentConversation,
  addOptimisticMessage,
  updateOptimisticMessage,
  markMessageFailed,
  clearMessages,
  updateUnreadCount,
  setPollingInterval,
  clearPollingInterval,
  resetMessages,
  receiveNewMessage,
} = messageSlice.actions;

export default messageSlice.reducer;