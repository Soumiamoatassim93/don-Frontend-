// utils/openStreetMap.js
import { Linking, Alert, Platform } from 'react-native';

export const openOpenStreetMap = (latitude, longitude, title = 'Position') => {
  if (!latitude || !longitude) {
    Alert.alert('Erreur', 'Position non disponible');
    return;
  }

  // URL OpenStreetMap (gratuit, sans clé API)
  const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
  
  Linking.openURL(url).catch(() => {
    Alert.alert('Erreur', 'Impossible d\'ouvrir la carte');
  });
};

export const openDirections = (fromLat, fromLng, toLat, toLng) => {
  const url = `https://www.openstreetmap.org/directions?from=${fromLat},${fromLng}&to=${toLat},${toLng}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Erreur', 'Impossible d\'ouvrir l\'itinéraire');
  });
};