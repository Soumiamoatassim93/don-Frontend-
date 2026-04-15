// screens/SenderTracking/SenderTrackingScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../../hooks/useAuth';
import { useTracking } from '../../hooks/useTracking';
import { styles } from './SenderTracking';

const SenderTrackingScreen = ({ route, navigation }) => {
  const { request: requestData, donation } = route.params;
  const { user } = useAuth();
  const {
    currentLocation,
    isLocationActive,
    isLoading,
    socketConnected,
    error,
    startUserTracking,
    stopUserTracking,
    clearErrors,
    setLocationActive,
  } = useTracking();

  const [isActivating, setIsActivating] = useState(false);

  // Utiliser directement les coordonnées du don depuis les paramètres
  const donationLocation = donation?.latitude && donation?.longitude ? {
    latitude: parseFloat(donation.latitude),
    longitude: parseFloat(donation.longitude),
  } : null;

  // Nettoyer le tracking à la fermeture
  useEffect(() => {
    return () => {
      if (isLocationActive) {
        stopUserTracking();
      }
    };
  }, [isLocationActive, stopUserTracking]);

  // Afficher les erreurs
  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearErrors();
    }
  }, [error, clearErrors]);

  const activateLocation = async () => {
    try {
      setIsActivating(true);
      await startUserTracking(user.id);
      setLocationActive(true);
      Alert.alert('Succès', 'Votre position est maintenant partagée avec le propriétaire');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'activer la localisation');
    } finally {
      setIsActivating(false);
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

  const initialRegion = {
    latitude: donationLocation?.latitude || 33.5731,
    longitude: donationLocation?.longitude || -7.5898,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

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
        <View style={styles.wsStatusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>📡 WebSocket:</Text>
            <View style={[styles.statusDot, socketConnected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.statusText}>
              {socketConnected ? 'Connecté' : 'Déconnecté'}
            </Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>📍 Position du don</Text>
          <MapView style={styles.map} initialRegion={initialRegion}>
            {donationLocation && (
              <Marker
                coordinate={donationLocation}
                title={donation?.title}
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

        <View style={styles.activationCard}>
          <Text style={styles.cardTitle}>📍 Partager ma position</Text>
          <Text style={styles.cardDescription}>
            Activez la localisation pour que le propriétaire puisse vous suivre
          </Text>
          
          <TouchableOpacity 
            style={[styles.activateBtn, isLocationActive && styles.activateBtnActive]} 
            onPress={activateLocation}
            disabled={isLocationActive || isActivating}
          >
            <Text style={styles.activateBtnText}>
              {isActivating ? 'Activation...' : 
               isLocationActive ? '✓ Localisation activée' : '📡 Activer la localisation'}
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

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📦 Informations du don</Text>
          <Text style={styles.donTitle}>{donation?.title}</Text>
          <Text style={styles.donDescription}>{donation?.description}</Text>
          {donation?.address && (
            <Text style={styles.donAddress}>📍 {donation.address}</Text>
          )}
          
          <TouchableOpacity style={styles.navigateBtn} onPress={openGoogleMaps}>
            <Text style={styles.navigateBtnText}>🗺️ Ouvrir la navigation</Text>
          </TouchableOpacity>
        </View>

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
              receiverId: donation?.userId,
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