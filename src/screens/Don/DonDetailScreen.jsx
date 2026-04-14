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
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  available: '#10b981',
  favColor: '#e11d48',
  reqColor: '#6d28d9',
};

// Fonction corrigée pour obtenir l'URL de l'image
const getImageUri = (img) => {
  if (!img) return null;
  
  // Si c'est une chaîne de caractères
  if (typeof img === 'string') {
    if (img.startsWith('http')) return img;
    // Supprimer le préfixe /uploads/ s'il existe déjà
    const cleanPath = img.replace(/^\/?uploads\//, '');
    return `${API_URL}/uploads/${cleanPath}`;
  }
  
  // Si c'est un objet avec une propriété url
  if (img.url) {
    if (img.url.startsWith('http')) return img.url;
    // Supprimer le préfixe /uploads/ s'il existe déjà
    const cleanPath = img.url.replace(/^\/?uploads\//, '');
    return `${API_URL}/uploads/${cleanPath}`;
  }
  
  // Si c'est un objet avec filename ou path
  if (img.filename) {
    return `${API_URL}/uploads/${img.filename}`;
  }
  if (img.path) {
    return `${API_URL}/uploads/${img.path}`;
  }
  
  return null;
};

const DonDetailScreen = ({ route, navigation }) => {
  const { don } = route.params;
  const images = Array.isArray(don.images) ? don.images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // Vérifier si le don est déjà en favori au chargement
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
        // Supprimer des favoris
        await authService.api.delete(`/favorites/${user.id}/${don.id}`);
        setIsFavorite(false);
        Alert.alert('Succès', 'Retiré des favoris');
      } else {
        // Ajouter aux favoris
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
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveIndex(index);
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
                    onLoad={() => console.log(`Image ${index} chargée: ${imageUri}`)}
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
          {/* Titre + badge + favori */}
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

          {/* Catégorie si disponible */}
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
          {don.user && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Donateur</Text>
              <View style={styles.donateurRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {don.user.name?.[0]?.toUpperCase() || don.user.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.donateurName}>{don.user.name || 'Anonyme'}</Text>
                  <Text style={styles.donateurEmail}>{don.user.email}</Text>
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
          onPress={() => navigation.navigate('Messagerie', { don, recipient: don.user })}
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