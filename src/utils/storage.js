import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async setToken(token) {
    await AsyncStorage.setItem('auth_token', token);
  },
  
  async getToken() {
    return await AsyncStorage.getItem('auth_token');
  },
  
  async removeToken() {
    await AsyncStorage.removeItem('auth_token');
  },
  
  async setUser(user) {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  
  async getUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  async clear() {
    await AsyncStorage.multiRemove(['auth_token', 'user']);
  },
};