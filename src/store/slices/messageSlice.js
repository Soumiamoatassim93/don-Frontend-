// store/slices/messageSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageService } from '../../services/message.service';

// ─── THUNKS ───────────────────────────────────────────────────────────────────

// Récupérer toutes les conversations
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

// Créer ou récupérer une conversation
export const fetchOrCreateConversation = createAsyncThunk(
  'messages/fetchOrCreateConversation',
  async ({ recipientId, donId }, { rejectWithValue }) => {
    try {
      return await messageService.createConversation(recipientId, donId);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Récupérer les messages d'une conversation
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

// Envoyer un message
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, content, tempId }, { rejectWithValue }) => {
    try {
      const message = await messageService.sendMessage(conversationId, content);
      return { conversationId, message, tempId };
    } catch (err) {
      return rejectWithValue({ tempId, error: err.response?.data?.message || err.message });
    }
  }
);

// Marquer comme lu
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

// Supprimer une conversation
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

// ─── SLICE ────────────────────────────────────────────────────────────────────

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
      if (index !== -1) {
        state.messages[index] = message;
      }
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
      if (conversation) {
        conversation.unreadCount = unreadCount;
      }
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
  },
  extraReducers: (builder) => {
    // ── fetchConversations ─────────────────────────
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
      });

    // ── fetchOrCreateConversation ───────────────────
    builder
      .addCase(fetchOrCreateConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrCreateConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchOrCreateConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── fetchMessages ───────────────────────────────
    builder
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
      });

    // ── sendMessage ─────────────────────────────────
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.sendError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { tempId, message } = action.payload;
        const index = state.messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
          state.messages[index] = message;
        } else {
          state.messages.push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.sendError = action.payload.error;
      });

    // ── markConversationAsRead ──────────────────────
    builder
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) {
          conversation.unreadCount = 0;
        }
      });

    // ── deleteConversation ──────────────────────────
    builder
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
} = messageSlice.actions;

export default messageSlice.reducer;