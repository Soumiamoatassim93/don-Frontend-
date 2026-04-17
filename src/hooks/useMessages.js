// hooks/useMessages.js
import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConversations,
  fetchOrCreateConversation,
  fetchMessages,
  sendMessage,
  markConversationAsRead,
  deleteConversation,
  clearError,
  setCurrentConversation,
  addOptimisticMessage,
  updateOptimisticMessage,
  markMessageFailed,
  clearMessages,
  clearPollingInterval,
  resetMessages,
} from '../store/slices/messageSlice';

const POLL_INTERVAL = 4000;

export const useMessages = () => {
  const dispatch = useAppDispatch();
  const pollingRef = useRef(null);
  
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    sendingMessage,
    sendError,
  } = useAppSelector((state) => state.messages);

  // Récupérer toutes les conversations
  const getConversations = useCallback(() => {
    return dispatch(fetchConversations()).unwrap();
  }, [dispatch]);

  // Créer ou récupérer une conversation
  const getOrCreateConversation = useCallback((recipientId, donId = null) => {
    return dispatch(fetchOrCreateConversation({ recipientId, donId })).unwrap();
  }, [dispatch]);

  // Récupérer les messages d'une conversation
  const getMessages = useCallback((conversationId) => {
    return dispatch(fetchMessages(conversationId)).unwrap();
  }, [dispatch]);

  // Envoyer un message
  const sendNewMessage = useCallback((conversationId, content, tempId) => {
    return dispatch(sendMessage({ conversationId, content, tempId })).unwrap();
  }, [dispatch]);

  // Marquer comme lu
  const markAsRead = useCallback((conversationId) => {
    return dispatch(markConversationAsRead(conversationId)).unwrap();
  }, [dispatch]);

  // Supprimer une conversation
  const removeConversation = useCallback((conversationId) => {
    return dispatch(deleteConversation(conversationId)).unwrap();
  }, [dispatch]);

  // Optimistic message
  const addOptimisticMsg = useCallback((tempId, content, userId, createdAt) => {
    dispatch(addOptimisticMessage({ tempId, content, userId, createdAt }));
  }, [dispatch]);

  const updateOptimisticMsg = useCallback((tempId, message) => {
    dispatch(updateOptimisticMessage({ tempId, message }));
  }, [dispatch]);

  const markMsgFailed = useCallback((tempId) => {
    dispatch(markMessageFailed({ tempId }));
  }, [dispatch]);

  const setCurrentConv = useCallback((conversation) => {
    dispatch(setCurrentConversation(conversation));
  }, [dispatch]);

  const clearMsgError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetAllMessages = useCallback(() => {
    dispatch(resetMessages());
  }, [dispatch]);

  const clearAllMessages = useCallback(() => {
    dispatch(clearMessages());
  }, [dispatch]);

  // Démarrer le polling pour une conversation
  const startPolling = useCallback((conversationId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    pollingRef.current = setInterval(async () => {
      if (conversationId) {
        try {
          await dispatch(fetchMessages(conversationId)).unwrap();
        } catch (error) {
          console.log('Polling error:', error);
        }
      }
    }, POLL_INTERVAL);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [dispatch]);

  // Arrêter le polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    // États
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    sendingMessage,
    sendError,
    
    // Actions
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendNewMessage,
    markAsRead,
    removeConversation,
    addOptimisticMsg,
    updateOptimisticMsg,
    markMsgFailed,
    setCurrentConv,
    clearMsgError,
    resetAllMessages,
    clearAllMessages,
    startPolling,
    stopPolling,
  };
};