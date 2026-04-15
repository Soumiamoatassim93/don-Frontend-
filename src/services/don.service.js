import { authService } from './auth.service';

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

  // Créer un don (pour AddDonScreen)
  createDon: async (formData) => {
    const token = await import('@react-native-async-storage/async-storage')
      .then(m => m.default.getItem('auth_token'));

    const response = await fetch(`${authService.api.defaults.baseURL}/dons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Erreur lors de la création');
    }

    return response.json();
  },

  // Modifier un don (pour EditDonScreen)
  updateDon: async (id, body) => {
    const token = await import('@react-native-async-storage/async-storage')
      .then(m => m.default.getItem('auth_token'));

    const response = await fetch(`${authService.api.defaults.baseURL}/dons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Erreur lors de la mise à jour');
    }

    return response.json();
  },
};