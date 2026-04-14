// services/locationService.js
import io from 'socket.io-client';
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

class LocationService {
  constructor() {
    this.socket = null;
    this.intervalId = null;
    this.isTracking = false;
    this.userId = null;
    this.appState = AppState.currentState;
  }

  async requestLocationPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message: 'Cette application a besoin de votre position pour le suivi des dons',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  async startTracking(userId) {
    // Vérifier si déjà en train de tracker pour ce user
    if (this.isTracking && this.userId === userId) {
      console.log('Tracking déjà actif pour user:', userId);
      return;
    }

    // Arrêter le tracking précédent si nécessaire
    if (this.isTracking) {
      this.stopTracking();
    }

    this.userId = userId;
    
    // Sauvegarder que le tracking est actif
    await AsyncStorage.setItem(`tracking_active_${userId}`, 'true');
    await AsyncStorage.setItem(`tracking_user_${userId}`, userId.toString());
    
    // Demander la permission
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      console.log('Permission de localisation refusée');
      return;
    }

    // Connexion WebSocket
    console.log('Connexion WebSocket pour tracking...');
    this.socket = io(`${API_URL}/tracking-user`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket tracking connecté pour user:', this.userId);
      this.isTracking = true;
      this.startSendingLocation();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket tracking déconnecté');
      this.isTracking = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.log('Erreur connexion socket:', error);
      // Tentative de reconnexion automatique
      setTimeout(() => {
        if (!this.socket?.connected) {
          console.log('Tentative de reconnexion...');
          this.socket?.connect();
        }
      }, 5000);
    });

    // Écouter les changements d'état de l'app
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' && this.isTracking) {
      console.log('App en arrière-plan, tracking continue...');
      // Le tracking continue normalement
    } else if (nextAppState === 'active' && this.isTracking) {
      console.log('App au premier plan, tracking actif');
      // Forcer l'envoi d'une position
      this.sendCurrentPosition();
    }
  };

  sendCurrentPosition() {
    if (!this.isTracking) return;
    
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Envoi position manuelle: ${latitude}, ${longitude}`);
        
        this.socket?.emit('updateUserLocation', {
          userId: this.userId,
          latitude: latitude,
          longitude: longitude,
        });
      },
      (error) => {
        console.log('Erreur géolocalisation:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  }

  startSendingLocation() {
    // Envoyer une position immédiatement
    this.sendCurrentPosition();
    
    // Envoyer la position toutes les 5 secondes
    this.intervalId = setInterval(() => {
      if (!this.isTracking) return;

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`📍 Envoi position périodique: ${latitude}, ${longitude}`);
          
          this.socket?.emit('updateUserLocation', {
            userId: this.userId,
            latitude: latitude,
            longitude: longitude,
          });
        },
        (error) => {
          console.log('Erreur géolocalisation:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    }, 60000); // Toutes les 60 secondes
  }

  async stopTracking() {
    console.log('🛑 Arrêt du tracking');
    this.isTracking = false;
    
    if (this.userId) {
      await AsyncStorage.removeItem(`tracking_active_${this.userId}`);
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  async restartTrackingIfNeeded() {
    // Vérifier si un tracking était actif avant la fermeture de l'app
    try {
      const users = await AsyncStorage.getAllKeys();
      const trackingKeys = users.filter(key => key.startsWith('tracking_active_'));
      
      for (const key of trackingKeys) {
        const isActive = await AsyncStorage.getItem(key);
        if (isActive === 'true') {
          const userId = key.split('_')[2];
          if (userId) {
            console.log('🔄 Redémarrage tracking pour user:', userId);
            await this.startTracking(parseInt(userId));
          }
        }
      }
    } catch (error) {
      console.log('Erreur redémarrage tracking:', error);
    }
  }

  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      userId: this.userId,
      socketConnected: this.socket?.connected || false,
    };
  }
}

export default new LocationService();