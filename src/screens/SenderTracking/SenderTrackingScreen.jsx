// screens/SenderTracking/SenderTrackingScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTracking } from '../../hooks/useTracking';
import { styles } from './SenderTracking';
import { openOpenStreetMap } from '../../utils/openStreetMap';

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
    latitude: typeof donation.latitude === 'string' ? parseFloat(donation.latitude) : donation.latitude,
    longitude: typeof donation.longitude === 'string' ? parseFloat(donation.longitude) : donation.longitude,
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

  const handleOpenDonationLocation = () => {
    if (donationLocation) {
      openOpenStreetMap(donationLocation.latitude, donationLocation.longitude, donation?.title);
    } else {
      Alert.alert('Erreur', 'Position du don non disponible');
    }
  };

  const handleOpenMyLocation = () => {
    if (currentLocation) {
      openOpenStreetMap(currentLocation.latitude, currentLocation.longitude, 'Ma position');
    } else {
      Alert.alert('Erreur', 'Votre position n\'est pas disponible');
    }
  };

 
const navigateToChat = () => {
  // Vérifier que nous avons les données nécessaires
  if (!donation?.userId) {
    Alert.alert('Erreur', 'Impossible de contacter le propriétaire');
    return;
  }

  console.log('Navigation vers Chat avec:', {
    recipient: donation.userId,
    don: donation.id
  });

  // Navigation directe vers l'écran Chat dans HomeStack
  navigation.navigate('Chat', {
    recipient: {
      id: donation.userId,
      name: 'Propriétaire',
    },
    don: {
      id: donation.id,
      title: donation.title,
    },
  });
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
        <View style={styles.wsStatusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>📡 WebSocket:</Text>
            <View style={[styles.statusDot, socketConnected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.statusText}>
              {socketConnected ? 'Connecté' : 'Déconnecté'}
            </Text>
          </View>
        </View>

        {/* Carte simplifiée (placeholder) */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>📍 Position du don</Text>
          
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
            
            {donationLocation && (
              <Text style={styles.coordinatesText}>
                📍 Don: {donationLocation.latitude.toFixed(6)}, {donationLocation.longitude.toFixed(6)}
              </Text>
            )}
            
            {currentLocation && isLocationActive && (
              <Text style={styles.coordinatesText}>
                📍 Vous: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            )}
            
            <Text style={styles.mapPlaceholderText}>
              Cliquez sur un bouton ci-dessous pour voir sur OpenStreetMap
            </Text>
          </View>
        </View>

        {/* Boutons carte */}
        <View style={styles.mapButtonsContainer}>
          {donationLocation && (
            <TouchableOpacity 
              style={styles.donationMapBtn} 
              onPress={handleOpenDonationLocation}
            >
              <Text style={styles.donationMapBtnText}>
                📍 Voir la position du don sur la carte
              </Text>
            </TouchableOpacity>
          )}
          
          {currentLocation && isLocationActive && (
            <TouchableOpacity 
              style={styles.myLocationMapBtn} 
              onPress={handleOpenMyLocation}
            >
              <Text style={styles.myLocationMapBtnText}>
                📍 Voir ma position sur la carte
              </Text>
            </TouchableOpacity>
          )}
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
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📌 Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Activez votre localisation ci-dessus{'\n'}
            2. Votre position est partagée automatiquement{'\n'}
            3. Le propriétaire peut vous suivre en temps réel
          </Text>
        </View>

        {/* Bouton Contacter le propriétaire - VERSION CORRIGÉE */}
        <TouchableOpacity 
          style={styles.messageBtn}
          onPress={navigateToChat}
        >
          <Text style={styles.messageBtnText}>💬 Contacter le propriétaire</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SenderTrackingScreen;