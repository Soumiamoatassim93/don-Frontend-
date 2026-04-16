// services/dons.service.js
import { authService } from './auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const donsService = {
  // Récupérer mes dons
  getMyDons: async () => {
    const response = await authService.api.get('/dons/my-dons');
    return response.data;
  },

  // Supprimer un don
  deleteDon: async (id) => {
    const response = await authService.api.delete(`/dons/${id}`);
    return response.data;
  },

  // Récupérer les dons disponibles (pour HomeScreen)
  getAvailableDons: async () => {
    const response = await authService.api.get('/dons/available');
    return response.data;
  },

  // Créer un don (pour AddDonScreen) - VERSION CORRIGÉE
  createDon: async (formData) => {
    try {
      // Récupérer le token
      const token = await AsyncStorage.getItem('auth_token');
      
      console.log('🔑 Token présent:', !!token);
      console.log('📦 Envoi du FormData...');
      
      // Debug: Afficher le contenu du FormData
      if (formData._parts) {
        for (let i = 0; i < formData._parts.length; i++) {
          const pair = formData._parts[i];
          if (pair[1] && typeof pair[1] === 'object' && pair[1].uri) {
            console.log(`  ${pair[0]}: ${pair[1].name} (${pair[1].type})`);
          } else {
            console.log(`  ${pair[0]}: ${pair[1]}`);
          }
        }
      }
      
      // Utiliser axios au lieu de fetch pour éviter les problèmes de headers
      const response = await authService.api.post('/dons', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Réponse:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur création don:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création');
    }
  },

  // Modifier un don (pour EditDonScreen)
  updateDon: async (id, body) => {
    const response = await authService.api.put(`/dons/${id}`, body);
    return response.data;
  },
};