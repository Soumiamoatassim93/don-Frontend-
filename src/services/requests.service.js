// services/requests.service.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

class RequestsService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });

    // Interceptor pour injecter le token
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

  async acceptRequest(requestId) {
    try {
      const response = await this.api.put(`/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refuseRequest(requestId) {
    try {
      const response = await this.api.put(`/requests/${requestId}/refuse`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

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