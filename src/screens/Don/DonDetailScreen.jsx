import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, Dimensions, TouchableOpacity, Alert, ActivityIndicator
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
  const { don } = route.params;
  const [donDetails, setDonDetails] = useState(don);
  const [donateur, setDonateur] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);

  const images = Array.isArray(donDetails.images) ? donDetails.images : [];

  // 🔥 Charger les détails du don ET le donateur
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Charger les détails complets du don
        const donResponse = await authService.api.get(`/dons/${don.id}`);
        const donData = donResponse.data;
        setDonDetails(donData);
        
        // 2. Charger les infos du donateur (user)
        if (donData.userId) {
          try {
            const userResponse = await authService.api.get(`/users/${donData.userId}`);
            setDonateur(userResponse.data);
            console.log('👤 Donateur chargé:', userResponse.data);
          } catch (userErr) {
            console.log('Erreur chargement donateur:', userErr);
          }
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [don.id]);

  // Vérifier les favoris
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
        await authService.api.post('/favorites', { userId: user.id, donId: don.id });
        setIsFavorite(true);
        Alert.alert('Succès', 'Ajouté aux favoris');
      }
    } catch (err) {
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
      Alert.alert('Erreur', 'Impossible d’envoyer la demande');
    } finally {
      setLoadingRequest(false);
    }
  }, [don.id, requestSent, loadingRequest]);

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

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
            <Text style={styles.title}>{donDetails.title}</Text>
            <View style={styles.titleRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{donDetails.status || 'Disponible'}</Text>
              </View>
              <TouchableOpacity style={styles.favIconBtn} onPress={handleFavorite}>
                <Text style={styles.favIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {donDetails.address ? (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>📍</Text>
              <Text style={styles.rowText}>{donDetails.address}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={styles.rowIcon}>📅</Text>
            <Text style={styles.rowText}>
              {new Date(donDetails.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>

          {donDetails.category ? (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>🏷️</Text>
              <Text style={styles.rowText}>{donDetails.category}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{donDetails.description || 'Aucune description fournie'}</Text>

          {/* 🔥 SECTION DONATEUR - MAINTENANT AVEC LES DONNÉES CHARGÉES */}
          {donateur && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Donateur</Text>
              <View style={styles.donateurRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {donateur.name?.[0]?.toUpperCase() || donateur.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.donateurName}>{donateur.name || 'Anonyme'}</Text>
                  <Text style={styles.donateurEmail}>{donateur.email}</Text>
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
      // Utilisation directe de l'userId
      const recipientId = donDetails.userId;
      
      console.log('📤 Contacter - userId:', recipientId);
      
      if (!recipientId) {
        Alert.alert('Erreur', 'Donateur non trouvé');
        return;
      }
      
      navigation.navigate('MessagerieDrawer', {
        screen: 'ChatRoom',
        params: {
          recipient: {
            id: recipientId,
            name: `Donateur #${recipientId}`,
            email: `donateur${recipientId}@email.com`
          }
        }
      });
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