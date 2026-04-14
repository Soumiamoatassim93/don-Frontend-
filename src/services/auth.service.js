import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

class AuthService {
  constructor() {
    this.api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "bypass-tunnel-reminder": "true"
  },
});

    // Interceptor requête — injecte le token
    this.api.interceptors.request.use((config) => {
  return AsyncStorage.getItem('auth_token').then((token) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
});

    // Interceptor réponse — déconnecte si token invalide
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.multiRemove(['auth_token', 'user']);
        }
        return Promise.reject(error);
      }
    );
  }
async getCurrentUser() {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
 async login(credentials) {
  try {
    const response = await this.api.post('/auth/login', credentials);

    console.log("RESPONSE:", response.data);

    const access_token = response.data?.access_token;
    const user = response.data?.user ?? null;

    if (!access_token) {
      throw new Error("Token manquant");
    }

    await AsyncStorage.setItem('auth_token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    return response.data;

  } catch (error) {
    console.log("ERROR LOGIN:", error.response?.data || error.message);
    throw this.handleError(error);
  }
}

  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return { access_token, user };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProfile() {
    try {
      const response = await this.api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    await AsyncStorage.multiRemove(['auth_token', 'user']);
  }

  async isAuthenticated() {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data.message || 'Une erreur est survenue';
      return new Error(message);
    }
    return new Error('Erreur de connexion au serveur');
  }
}

export const authService = new AuthService();