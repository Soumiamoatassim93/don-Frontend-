// services/requests.service.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';
import NotificationService from './notifications.service';

class RequestsService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });

    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getSentRequests(userId) {
    try {
      const response = await this.api.get(`/requests/sent/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getReceivedRequests(userId) {
    try {
      const response = await this.api.get(`/requests/received/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDonById(donId) {
    try {
      const response = await this.api.get(`/dons/${donId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ─── ENVOYER UNE DEMANDE ────────────────────────────────────────────────────
  // senderName  : nom de l'utilisateur qui envoie la demande
  // donTitle    : titre du don concerné
  // ownerId     : ID du propriétaire du don (qui reçoit la notif)
  async sendRequest(donId, senderId, senderName, donTitle, ownerId) {
    try {
      const response = await this.api.post(`/requests`, {
        donId,
        senderId,
      });

      // ✅ Notifier le propriétaire du don
      await NotificationService.sendNotification(
        ownerId,
        '📦 Nouvelle demande de don',
        `${senderName} souhaite obtenir votre don : "${donTitle}"`,
        {
          type: 'new_request',
          requestId: response.data?.id,
          donId,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ─── ACCEPTER UNE DEMANDE ───────────────────────────────────────────────────
  // senderId  : ID de la personne qui a fait la demande (qui reçoit la notif)
  // donTitle  : titre du don
  async acceptRequest(requestId, senderId, donTitle) {
    try {
      const response = await this.api.put(`/requests/${requestId}/accept`);

      // ✅ Notifier le demandeur que sa demande est acceptée
      await NotificationService.sendNotification(
        senderId,
        '✅ Demande acceptée !',
        `Votre demande pour le don "${donTitle}" a été acceptée. Vous pouvez maintenant contacter le propriétaire.`,
        {
          type: 'request_accepted',
          requestId,
          donTitle,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ─── REFUSER UNE DEMANDE ────────────────────────────────────────────────────
  // senderId  : ID de la personne qui a fait la demande (qui reçoit la notif)
  // donTitle  : titre du don
  async refuseRequest(requestId, senderId, donTitle) {
    try {
      const response = await this.api.put(`/requests/${requestId}/refuse`);

      // ✅ Notifier le demandeur que sa demande est refusée
      await NotificationService.sendNotification(
        senderId,
        '❌ Demande refusée',
        `Votre demande pour le don "${donTitle}" n'a pas été retenue cette fois.`,
        {
          type: 'request_refused',
          requestId,
          donTitle,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ─── ANNULER UNE DEMANDE ────────────────────────────────────────────────────
  async cancelRequest(requestId) {
    try {
      const response = await this.api.delete(`/requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || 'Une erreur est survenue';
      return new Error(message);
    }
    return new Error('Erreur de connexion au serveur');
  }
}

export const requestsService = new RequestsService();