// src/services/socketService.js
import { io } from 'socket.io-client';
import { API_URL } from '../../config';

let socket = null;
let dispatch = null; // sera injecté plus tard

// Fonction pour injecter la fonction dispatch de Redux
export const setDispatch = (dispatchFn) => {
  dispatch = dispatchFn;
};

export const initSocket = (token) => {
  if (socket) return socket;

  socket = io(`${API_URL}/messaging`, {
    transports: ['websocket'],
    auth: { token },
  });

  socket.on('connect', () => console.log('🔌 Socket connecté'));
  socket.on('disconnect', () => console.log('🔌 Socket déconnecté'));

  socket.on('new_message', (message) => {
    if (dispatch) {
      // Utiliser l'action importée dynamiquement pour éviter l'import statique
      import('../store/slices/messageSlice').then(({ receiveNewMessage }) => {
        dispatch(receiveNewMessage(message));
      }).catch(err => console.warn('Erreur chargement action:', err));
    } else {
      console.warn('Dispatch non disponible');
    }
  });

  socket.on('messages_read', ({ by: userId, conversationId }) => {
    if (dispatch) {
      import('../store/slices/messageSlice').then(({ updateUnreadCount }) => {
        dispatch(updateUnreadCount({ conversationId, unreadCount: 0 }));
      }).catch(err => console.warn('Erreur chargement action:', err));
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};