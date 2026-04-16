// screens/TrackingScreen/TrackingScreen.jsx (version sans WebView)
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTracking } from '../../hooks/useTracking';
import { styles } from './TrackingScreen.styles';
import { openOpenStreetMap, openDirections } from '../../utils/openStreetMap';

const TrackingScreen = ({ route, navigation }) => {
  const { request, donation, sender } = route.params;
  const { user } = useAuth();
  const {
    senderLocation,
    isLoading,
    socketConnected,
    error,
    fetchSenderLocation,
    clearErrors,
  } = useTracking();

  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const donationLocation = donation?.latitude && donation?.longitude ? {
    latitude: typeof donation.latitude === 'string' ? parseFloat(donation.latitude) : donation.latitude,
    longitude: typeof donation.longitude === 'string' ? parseFloat(donation.longitude) : donation.longitude,
  } : null;

  useEffect(() => {
    if (sender?.id) {
      fetchSenderLocation(sender.id);
    }
  }, [sender?.id, fetchSenderLocation]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearErrors();
    }
  }, [error, clearErrors]);

  useEffect(() => {
    if (sender?.id && socketConnected) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        fetchSenderLocation(sender.id);
        setLastUpdate(new Date());
      }, 10000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [sender?.id, socketConnected, fetchSenderLocation]);

  const handleOpenSenderLocation = () => {
    if (senderLocation?.latitude && senderLocation?.longitude) {
      openOpenStreetMap(senderLocation.latitude, senderLocation.longitude, 'Position du demandeur');
    } else {
      Alert.alert('Info', 'Position non disponible');
    }
  };

  const handleOpenDonationLocation = () => {
    if (donationLocation) {
      openOpenStreetMap(donationLocation.latitude, donationLocation.longitude, donation?.title);
    } else {
      Alert.alert('Info', 'Position du don non disponible');
    }
  };

  const handleGetDirections = () => {
    if (senderLocation?.latitude && senderLocation?.longitude && donationLocation) {
      openDirections(
        senderLocation.latitude, senderLocation.longitude,
        donationLocation.latitude, donationLocation.longitude
      );
    } else {
      Alert.alert('Info', 'Positions non disponibles pour l\'itinéraire');
    }
  };

  if (isLoading && !senderLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Chargement de la position...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Suivi du demandeur</Text>
          <Text style={styles.headerSubtitle}>
            {sender?.name || `Utilisateur ${sender?.id}`}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statusBar}>
          <View style={styles.statusIndicator}>
            <View style={[styles.dot, socketConnected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.statusText}>
              {socketConnected ? 'Connecté' : 'Déconnecté'}
            </Text>
          </View>
          {lastUpdate && (
            <Text style={styles.lastUpdate}>
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </View>

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
          {senderLocation && (
            <Text style={styles.coordinatesText}>
              📍 Demandeur: {senderLocation.latitude.toFixed(6)}, {senderLocation.longitude.toFixed(6)}
            </Text>
          )}
          {donationLocation && (
            <Text style={styles.coordinatesText}>
              🎁 Don: {donationLocation.latitude.toFixed(6)}, {donationLocation.longitude.toFixed(6)}
            </Text>
          )}
          <Text style={styles.mapPlaceholderText}>
            Cliquez sur un bouton ci-dessous pour voir sur OpenStreetMap
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.navigateBtn, !senderLocation && styles.disabledBtn]} 
            onPress={handleOpenSenderLocation}
            disabled={!senderLocation}
          >
            <Text style={styles.navigateBtnText}>
              {senderLocation ? '🗺️ Voir position du demandeur' : '⏳ Position non disponible'}
            </Text>
          </TouchableOpacity>

          {donationLocation && (
            <TouchableOpacity 
              style={styles.donationBtn} 
              onPress={handleOpenDonationLocation}
            >
              <Text style={styles.donationBtnText}>
                📍 Voir la position du don
              </Text>
            </TouchableOpacity>
          )}

          {senderLocation && donationLocation && (
            <TouchableOpacity 
              style={styles.directionsBtn} 
              onPress={handleGetDirections}
            >
              <Text style={styles.directionsBtnText}>
                🧭 Itinéraire du demandeur vers le don
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📌 Informations</Text>
          <Text style={styles.infoText}>
            • Le demandeur partage sa position en temps réel{'\n'}
            • La position se met à jour automatiquement{'\n'}
            • Cliquez sur un bouton pour voir sur OpenStreetMap
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrackingScreen;