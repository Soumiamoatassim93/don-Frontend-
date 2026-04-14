// services/category.service.js
import { authService } from './auth.service';

export const categoryService = {
  async getCategories() {
    try {
      const response = await authService.api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }
};