// services/locationService.js
import io from 'socket.io-client';
import * as Location from 'expo-location';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

class LocationService {
  constructor() {
    this.socket = null;
    this.watchSubscription = null;
    this.isTracking = false;
    this.userId = null;
    this.appState = AppState.currentState;
    this.locationUpdateCallback = null;
  }

  async requestLocationPermission() {
    try {
      // Demander la permission foreground
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('Permission de localisation foreground refusée');
        return false;
      }

      // Pour Android, demander aussi la permission background
      if (Platform.OS === 'android') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.log('Permission background refusée, tracking seulement au premier plan');
        }
      }

      return true;
    } catch (err) {
      console.error('Erreur permission:', err);
      return false;
    }
  }

  async startTracking(userId, onLocationUpdate = null) {
    // Vérifier si déjà en train de tracker pour ce user
    if (this.isTracking && this.userId === userId) {
      console.log('Tracking déjà actif pour user:', userId);
      return;
    }

    // Arrêter le tracking précédent si nécessaire
    if (this.isTracking) {
      await this.stopTracking();
    }

    this.userId = userId;
    this.locationUpdateCallback = onLocationUpdate;
    
    // Sauvegarder que le tracking est actif
    await AsyncStorage.setItem(`tracking_active_${userId}`, 'true');
    await AsyncStorage.setItem(`tracking_user_${userId}`, userId.toString());
    
    // Demander la permission
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      console.log('Permission de localisation refusée');
      return false;
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
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
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

    return true;
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' && this.isTracking) {
      console.log('App en arrière-plan, tracking continue...');
    } else if (nextAppState === 'active' && this.isTracking) {
      console.log('App au premier plan, tracking actif');
      // Forcer l'envoi d'une position
      this.sendCurrentPosition();
    }
  };

  async sendCurrentPosition() {
    if (!this.isTracking || !this.userId) return;
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      console.log(`📍 Envoi position: ${latitude}, ${longitude}`);
      
      this.socket?.emit('updateUserLocation', {
        userId: this.userId,
        latitude: latitude,
        longitude: longitude,
      });

      // Callback optionnel pour le composant
      if (this.locationUpdateCallback) {
        this.locationUpdateCallback({ latitude, longitude });
      }
    } catch (error) {
      console.log('Erreur géolocalisation:', error);
    }
  }

  async startSendingLocation() {
    // Envoyer une position immédiatement
    await this.sendCurrentPosition();
    
    // Configuration du tracking en continu avec watchPositionAsync
    try {
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 secondes
          distanceInterval: 10, // 10 mètres
        },
        async (location) => {
          if (!this.isTracking) return;
          
          const { latitude, longitude } = location.coords;
          console.log(`📍 Position mise à jour: ${latitude}, ${longitude}`);
          
          this.socket?.emit('updateUserLocation', {
            userId: this.userId,
            latitude: latitude,
            longitude: longitude,
          });

          if (this.locationUpdateCallback) {
            this.locationUpdateCallback({ latitude, longitude });
          }
        }
      );
    } catch (error) {
      console.log('Erreur watchPositionAsync:', error);
      // Fallback: utiliser setInterval si watchPositionAsync échoue
      this.startFallbackInterval();
    }
  }

  startFallbackInterval() {
    // Fallback: envoyer la position toutes les 60 secondes
    this.intervalId = setInterval(async () => {
      if (!this.isTracking) return;
      await this.sendCurrentPosition();
    }, 60000);
  }

  async stopTracking() {
    console.log('🛑 Arrêt du tracking');
    this.isTracking = false;
    
    if (this.userId) {
      await AsyncStorage.removeItem(`tracking_active_${this.userId}`);
    }
    
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.userId = null;
    this.locationUpdateCallback = null;
  }

  async restartTrackingIfNeeded() {
    // Vérifier si un tracking était actif avant la fermeture de l'app
    try {
      const keys = await AsyncStorage.getAllKeys();
      const trackingKeys = keys.filter(key => key.startsWith('tracking_active_'));
      
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
      watchActive: this.watchSubscription !== null,
    };
  }


  // services/LocationService.js
// ... dans la classe LocationService

// ✅ AJOUTE CETTE MÉTHODE
async getUserLastLocation(userId) {
  if (this.socket && this.socket.connected) {
    return new Promise((resolve, reject) => {
      this.socket.emit('getUserLastLocation', { userId }, (response) => {
        if (response && response.status === 'success') {
          resolve(response.location);
        } else {
          reject(new Error('Position non trouvée'));
        }
      });
    });
  }
  return null;
}
}



export default new LocationService();