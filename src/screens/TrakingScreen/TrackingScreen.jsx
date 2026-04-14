// TrackingScreen.jsx - Côté owner
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import io from 'socket.io-client';
import { API_URL } from '../../../config';
import { styles } from './TrackingScreen.styles';
const TrackingScreen = ({ route, navigation }) => {
  const { request, donation, sender } = route.params;
  const [socket, setSocket] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
const colors = {  primary: '#6366f1',  text: '#111827'};
  useEffect(() => {
    let isMounted = true;
    
    console.log('🔌 Owner: Connexion au WebSocket...');
    console.log('📱 Owner attend positions de user:', sender.id);
    
    const newSocket = io(`${API_URL}/tracking-user`, {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Owner: Socket connecté !');
      setIsConnected(true);
      
      // Demander l'historique des positions du sender
      newSocket.emit('getUserLocations', {
        userId: sender.id,
        limit: 50,
      });
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Owner: Erreur connexion:', error.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', () => {
      console.log('⚠️ Owner: Socket déconnecté');
      setIsConnected(false);
    });

    // ÉCOUTER LES POSITIONS EN TEMPS RÉEL
    newSocket.on('userLocationUpdated', (location) => {
      console.log('📍 Owner: Position reçue en temps réel:', location);
      
      if (isMounted && location && location.userId === sender.id) {
        console.log('✅ Owner: Position du sender mise à jour');
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        setLastUpdate(new Date());
        setIsLoading(false);
      }
    });

    // RÉPONSE HISTORIQUE
    newSocket.on('getUserLocations', (locations) => {
      console.log(`📜 Owner: Historique reçu: ${locations?.length || 0} positions`);
      
      if (isMounted && locations && locations.length > 0) {
        const lastLocation = locations[locations.length - 1];
        setUserLocation({
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
        });
        setLastUpdate(new Date(lastLocation.createdAt));
      }
      setIsLoading(false);
    });

    setSocket(newSocket);

    return () => {
      isMounted = false;
      newSocket.disconnect();
    };
  }, [sender.id]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Connexion au serveur...</Text>
        <Text style={styles.loadingSubText}>
          {isConnected ? 'Connecté, attente des positions...' : 'Tentative de connexion...'}
        </Text>
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
            {sender.name || `Utilisateur ${sender.id}`}
          </Text>
        </View>
      </View>

      <View style={styles.statusBar}>
        <View style={styles.statusIndicator}>
          <View style={[styles.dot, isConnected ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connecté' : 'Déconnecté'}
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
          {userLocation ? '📍 Position du demandeur' : '⏳ En attente de position...'}
        </Text>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation?.latitude || donation?.latitude || 33.5731,
            longitude: userLocation?.longitude || donation?.longitude || -7.5898,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title={sender.name || 'Demandeur'}
              description="Position actuelle"
              pinColor="#6366f1"
            />
          )}
        </MapView>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>📦 Informations</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Don:</Text>
          <Text style={styles.infoValue}>{donation?.title}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut:</Text>
          <Text style={[styles.infoValue, styles.statusAccepted]}>Accepté</Text>
        </View>
        {userLocation && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Latitude:</Text>
              <Text style={styles.infoValue}>{userLocation.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Longitude:</Text>
              <Text style={styles.infoValue}>{userLocation.longitude.toFixed(6)}</Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.navigateBtn, !userLocation && styles.disabledBtn]} 
        onPress={() => {
          if (userLocation) {
            const url = `https://www.google.com/maps/search/?api=1&query=${userLocation.latitude},${userLocation.longitude}`;
            Linking.openURL(url);
          }
        }}
        disabled={!userLocation}
      >
        <Text style={styles.navigateBtnText}>
          {userLocation ? '🗺️ Ouvrir dans Google Maps' : '⏳ Position non disponible'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default TrackingScreen;