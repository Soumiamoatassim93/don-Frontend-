// screens/TrackingScreen/TrackingScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../../hooks/useAuth';
import { useTracking } from '../../hooks/useTracking';
import { styles } from './TrackingScreen.styles';

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

  // Charger la position initiale du sender
  useEffect(() => {
    if (sender?.id) {
      fetchSenderLocation(sender.id);
    }
  }, [sender?.id, fetchSenderLocation]);

  // Afficher les erreurs
  useEffect(() => {
    if (error) {
      console.error('Erreur tracking:', error);
      clearErrors();
    }
  }, [error, clearErrors]);

  // Simuler des mises à jour (à remplacer par WebSocket si besoin)
  useEffect(() => {
    const interval = setInterval(() => {
      if (sender?.id) {
        fetchSenderLocation(sender.id);
        setLastUpdate(new Date());
      }
    }, 10000); // Toutes les 10 secondes

    return () => clearInterval(interval);
  }, [sender?.id, fetchSenderLocation]);

  const openGoogleMaps = () => {
    if (senderLocation?.latitude && senderLocation?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${senderLocation.latitude},${senderLocation.longitude}`;
      Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Chargement...</Text>
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

      <View style={styles.mapContainer}>
        <Text style={styles.sectionTitle}>
          {senderLocation ? '📍 Position du demandeur' : '⏳ En attente de position...'}
        </Text>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: senderLocation?.latitude || donation?.latitude || 33.5731,
            longitude: senderLocation?.longitude || donation?.longitude || -7.5898,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {senderLocation && (
            <Marker
              coordinate={senderLocation}
              title={sender?.name || 'Demandeur'}
              description="Position actuelle"
              pinColor="#6366f1"
            />
          )}
          {donation?.latitude && donation?.longitude && (
            <Marker
              coordinate={{
                latitude: parseFloat(donation.latitude),
                longitude: parseFloat(donation.longitude),
              }}
              title={donation?.title}
              description="Position du don"
              pinColor="#ef4444"
            />
          )}
        </MapView>
      </View>

      <TouchableOpacity 
        style={[styles.navigateBtn, !senderLocation && styles.disabledBtn]} 
        onPress={openGoogleMaps}
        disabled={!senderLocation}
      >
        <Text style={styles.navigateBtnText}>
          {senderLocation ? '🗺️ Ouvrir dans Google Maps' : '⏳ Position non disponible'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default TrackingScreen;