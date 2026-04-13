import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { API_URL } from '../../config';
import { authService } from '../services/auth.service';
import { useCallback } from 'react';

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
  const path = typeof img === 'string' ? img : img.url;
  if (!path) return null;
  return `${API_URL}/uploads/${path}`;
};

const DonDetailScreen = ({ route, navigation }) => {
  const { don } = route.params;
  const images = Array.isArray(don.images) ? don.images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);

const handleFavorite = useCallback(async (don) => {
  try {
    const user = await authService.getCurrentUser();

    await authService.api.post('/favorites', {
      userId: user.id,
      donId: don.id,
    });

    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(don.id) ? next.delete(don.id) : next.add(don.id);
      return next;
    });

  } catch (err) {
    console.log('❌ favorite error:', err.response?.data || err.message);
  }
}, []);

const handleRequest = useCallback(async (don) => {
  try {
    const user = await authService.getCurrentUser();

    await authService.api.post('/requests', {
      userId: user.id,
      donationId: don.id,
      status: 'pending',
    });

    // navigation ou feedback
    Alert.alert('Succès', 'Demande envoyée ✔️');

  } catch (err) {
    console.log('❌ request error:', err.response?.data || err.message);
    Alert.alert('Erreur', 'Impossible d’envoyer la demande');
  }
}, []);

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
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: getImageUri(img) }}
                  style={styles.fullImage}
                  resizeMode="cover"
                />
              ))}
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
                <Text style={styles.badgeText}>{don.status}</Text>
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
          <Text style={styles.description}>{don.description}</Text>

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
          <Text style={styles.bottomBtnText}>💬 Contacter</Text>
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

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  fullImage: { width, height: 280 },
  noImage: { height: 180, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 16, color: colors.textLight },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d1d5db', marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, flex: 1, marginRight: 8 },
  titleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: colors.available, fontSize: 12, fontWeight: '600' },
  favIconBtn: { padding: 4 },
  favIcon: { fontSize: 22 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowIcon: { fontSize: 14, marginRight: 6 },
  rowText: { fontSize: 14, color: colors.textLight, flex: 1 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  description: { fontSize: 15, color: colors.text, lineHeight: 24 },
  donateurRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  donateurName: { fontSize: 15, fontWeight: '600', color: colors.text },
  donateurEmail: { fontSize: 13, color: colors.textLight },
  bottomBar: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  bottomBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  msgBtn: { backgroundColor: '#ede9fe' },
  reqBtn: { backgroundColor: colors.primary },
  reqBtnSent: { backgroundColor: colors.available },
  reqBtnLoading: { opacity: 0.7 },
  bottomBtnText: { color: colors.card, fontSize: 15, fontWeight: '600' },
});

export default DonDetailScreen;