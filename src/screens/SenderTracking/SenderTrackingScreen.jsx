// screens/SenderTrackingScreen.jsx (Version complète avec WebSocket)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import { authService } from '../../services/auth.service';
import { API_URL } from '../../../config';

const SenderTrackingScreen = ({ route, navigation }) => {
  const { request: requestData, donation } = route.params;
  const [donationLocation, setDonationLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Initialiser WebSocket
  useEffect(() => {
    const initSocket = async () => {
      const newSocket = io(`${API_URL}/tracking-user`, {
        transports: ['websocket'],
        reconnection: true,
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket sender connecté');
        setIsSocketConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket sender déconnecté');
        setIsSocketConnected(false);
      });

      setSocket(newSocket);
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (donation && donation.latitude && donation.longitude) {
      setDonationLocation({
        latitude: parseFloat(donation.latitude),
        longitude: parseFloat(donation.longitude),
      });
    }
    setIsLoading(false);
  }, [donation]);

  const activateLocation = async () => {
    try {
      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Vous devez activer la localisation pour partager votre position'
        );
        return;
      }

      setIsLocationActive(true);

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const user = await authService.getCurrentUser();
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Envoyer la première position
      if (socket && isSocketConnected && user) {
        socket.emit('updateUserLocation', {
          userId: user.id,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('📍 Première position envoyée');
      }

      // Démarrer le suivi en temps réel
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // toutes les 5 secondes
          distanceInterval: 10, // ou si déplacement > 10m
        },
        async (newLocation) => {
          console.log('📍 Nouvelle position:', newLocation.coords.latitude, newLocation.coords.longitude);
          
          setCurrentLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
          
          // Envoyer la position via WebSocket
          const user = await authService.getCurrentUser();
          if (socket && isSocketConnected && user) {
            socket.emit('updateUserLocation', {
              userId: user.id,
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            console.log('📤 Position envoyée au serveur');
          } else {
            console.log('⚠️ Socket non connecté, impossible d\'envoyer la position');
          }
        }
      );

      setLocationSubscription(subscription);

      Alert.alert(
        'Succès',
        'Votre position est maintenant partagée avec le propriétaire'
      );
    } catch (error) {
      console.error('Erreur localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'activer la localisation');
    }
  };

  const openGoogleMaps = () => {
    if (donationLocation) {
      const url = `https://www.google.com/maps/search/?api=1&query=${donationLocation.latitude},${donationLocation.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Erreur', 'Position du don non disponible');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Position du don</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status WebSocket */}
        <View style={styles.wsStatusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>📡 WebSocket:</Text>
            <View style={[styles.statusDot, isSocketConnected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.statusText}>
              {isSocketConnected ? 'Connecté' : 'Déconnecté'}
            </Text>
          </View>
        </View>

        {/* Carte */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>📍 Position du don</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: donationLocation?.latitude || 33.5731,
              longitude: donationLocation?.longitude || -7.5898,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {donationLocation && (
              <Marker
                coordinate={donationLocation}
                title={donation.title}
                description="Position du don"
                pinColor="#ef4444"
              />
            )}
            {currentLocation && isLocationActive && (
              <Marker
                coordinate={currentLocation}
                title="Ma position"
                description="Votre position actuelle"
                pinColor="#10b981"
              />
            )}
          </MapView>
        </View>

        {/* Activation localisation */}
        <View style={styles.activationCard}>
          <Text style={styles.cardTitle}>📍 Partager ma position</Text>
          <Text style={styles.cardDescription}>
            Activez la localisation pour que le propriétaire puisse vous suivre
          </Text>
          
          <TouchableOpacity 
            style={[styles.activateBtn, isLocationActive && styles.activateBtnActive]} 
            onPress={activateLocation}
            disabled={isLocationActive}
          >
            <Text style={styles.activateBtnText}>
              {isLocationActive ? '✓ Localisation activée' : '📡 Activer la localisation'}
            </Text>
          </TouchableOpacity>
          
          {isLocationActive && currentLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 Position partagée en temps réel
              </Text>
              <Text style={styles.locationCoords}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Infos don */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📦 Informations du don</Text>
          <Text style={styles.donTitle}>{donation.title}</Text>
          <Text style={styles.donDescription}>{donation.description}</Text>
          {donation.address && (
            <Text style={styles.donAddress}>📍 {donation.address}</Text>
          )}
          
          <TouchableOpacity style={styles.navigateBtn} onPress={openGoogleMaps}>
            <Text style={styles.navigateBtnText}>🗺️ Ouvrir la navigation</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📌 Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Activez votre localisation ci-dessus{'\n'}
            2. Votre position est partagée automatiquement{'\n'}
            3. Le propriétaire peut vous suivre en temps réel
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.messageBtn}
          onPress={() => {
            navigation.navigate('Messagerie', {
              receiverId: donation.userId,
              receiverName: 'Propriétaire',
            });
          }}
        >
          <Text style={styles.messageBtnText}>💬 Contacter le propriétaire</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SenderTrackingScreen;