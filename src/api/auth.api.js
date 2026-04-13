import { authService } from '../services/auth.service';

export const authAPI = {
  login: async (email, password) => {
    return await authService.login({ email, password });
  },
  
  register: async (email, password, name = '') => {
    return await authService.register({ email, password, name });
  },
  
  getProfile: async () => {
    return await authService.getProfile();
  },
  
  logout: async () => {
    return await authService.logout();
  },
  
  isAuthenticated: async () => {
    return await authService.isAuthenticated();
  },
};