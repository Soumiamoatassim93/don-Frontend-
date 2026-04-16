// screens/DonDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { API_URL } from '../../../config';
import { authService } from '../../services/auth.service';
import { styles } from './styles/DonDetail';

const { width } = Dimensions.get('window');

const colors = {
  primary: '#6366f1', text: '#111827', textLight: '#6b7280',
  background: '#f9fafb', card: '#ffffff',
  available: '#10b981', favColor: '#e11d48', reqColor: '#6d28d9',
};

const getImageUri = (img) => {
  if (!img) return null;
  if (typeof img === 'string') {
    if (img.startsWith('http')) return img;
    const cleanPath = img.replace(/^\/?uploads\//, '');
    return `${API_URL}/uploads/${cleanPath}`;
  }
  if (img.url) {
    if (img.url.startsWith('http')) return img.url;
    const cleanPath = img.url.replace(/^\/?uploads\//, '');
    return `${API_URL}/uploads/${cleanPath}`;
  }
  if (img.filename) return `${API_URL}/uploads/${img.filename}`;
  if (img.path) return `${API_URL}/uploads/${img.path}`;
  return null;
};

const DonDetailScreen = ({ route, navigation }) => {
  const { don } = route.params;  // don contient toutes les infos du don
  const images = Array.isArray(don.images) ? don.images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // Vérifier si le don est déjà en favori
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const user = await authService.getCurrentUser();
        const response = await authService.api.get(`/favorites/check?userId=${user.id}&donId=${don.id}`);
        setIsFavorite(response.data.isFavorite);
      } catch (err) {
        console.log('Erreur vérification favori:', err);
      }
    };
    checkFavorite();
  }, [don.id]);

  const handleFavorite = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (isFavorite) {
        await authService.api.delete(`/favorites/${user.id}/${don.id}`);
        setIsFavorite(false);
        Alert.alert('Succès', 'Retiré des favoris');
      } else {
        await authService.api.post('/favorites', {
          userId: user.id,
          donId: don.id,
        });
        setIsFavorite(true);
        Alert.alert('Succès', 'Ajouté aux favoris');
      }
    } catch (err) {
      console.log('❌ favorite error:', err.response?.data || err.message);
      Alert.alert('Erreur', 'Impossible de modifier les favoris');
    }
  }, [isFavorite, don.id]);

  const handleRequest = useCallback(async () => {
    if (requestSent || loadingRequest) return;
    setLoadingRequest(true);
    try {
      const user = await authService.getCurrentUser();
      await authService.api.post('/requests', {
        userId: user.id,
        donationId: don.id,
        status: 'pending',
      });
      setRequestSent(true);
      Alert.alert('Succès', 'Demande envoyée ✔️');
    } catch (err) {
      console.log('❌ request error:', err.response?.data || err.message);
      Alert.alert('Erreur', 'Impossible d’envoyer la demande');
    } finally {
      setLoadingRequest(false);
    }
  }, [don.id, requestSent, loadingRequest]);

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Infos du donateur
  const donor = don.user || {};

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Images */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
              }}
            >
              {images.map((img, index) => {
                const imageUri = getImageUri(img);
                if (imageErrors[index] || !imageUri) {
                  return (
                    <View key={index} style={[styles.fullImage, styles.imageErrorContainer]}>
                      <Text style={styles.imageErrorText}>📷</Text>
                      <Text style={styles.imageErrorSubtext}>Image non disponible</Text>
                    </View>
                  );
                }
                return (
                  <Image
                    key={index}
                    source={{ uri: imageUri }}
                    style={styles.fullImage}
                    resizeMode="cover"
                    onError={() => handleImageError(index)}
                  />
                );
              })}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>📦 Pas de photo</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{don.title}</Text>
            <View style={styles.titleRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{don.status || 'Disponible'}</Text>
              </View>
              <TouchableOpacity style={styles.favIconBtn} onPress={handleFavorite}>
                <Text style={styles.favIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Adresse */}
          {don.address ? (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>📍</Text>
              <Text style={styles.rowText}>{don.address}</Text>
            </View>
          ) : null}

          {/* Date */}
          <View style={styles.row}>
            <Text style={styles.rowIcon}>📅</Text>
            <Text style={styles.rowText}>
              {new Date(don.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>

          {/* Catégorie */}
          {don.category ? (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>🏷️</Text>
              <Text style={styles.rowText}>{don.category}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{don.description || 'Aucune description fournie'}</Text>

          {/* Donateur */}
          {donor.id && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Donateur</Text>
              <View style={styles.donateurRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(donor.name?.[0] || donor.email?.[0] || '?').toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.donateurName}>{donor.name || 'Anonyme'}</Text>
                  <Text style={styles.donateurEmail}>{donor.email}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Barre d'actions fixe en bas */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.msgBtn]}
          onPress={() => {
            // Navigue vers l'écran de messagerie avec les infos du donateur
            navigation.navigate('ChatRoom', { recipient: donor });
          }}
        >
          <Text style={[styles.bottomBtnText, { color: colors.reqColor }]}>💬 Contacter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.bottomBtn,
            styles.reqBtn,
            requestSent && styles.reqBtnSent,
            loadingRequest && styles.reqBtnLoading,
          ]}
          onPress={handleRequest}
          disabled={requestSent || loadingRequest}
        >
          <Text style={styles.bottomBtnText}>
            {loadingRequest ? '⏳ Envoi...' : requestSent ? '✅ Demande envoyée' : '📨 Demander'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DonDetailScreen;