import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { API_URL } from '../../config';

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

const isNew = (dateStr) =>
  Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

const FavoriCard = ({ don, onPress, onRemove }) => {
  const images = Array.isArray(don.images) ? don.images : [];

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(don)} activeOpacity={0.85}>
      {isNew(don.createdAt) && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>Nouveau</Text>
        </View>
      )}

      {/* Bouton retirer favori */}
      <TouchableOpacity style={styles.removeFavBtn} onPress={() => onRemove(don)}>
        <Text style={styles.removeFavIcon}>❤️</Text>
      </TouchableOpacity>

      {images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
          {images.map((img, index) => {
            const uri = typeof img === 'string'
              ? `${API_URL}/uploads/${img}`
              : `${API_URL}/uploads/${img.filename || img.path}`;
            return <Image key={index} source={{ uri }} style={styles.donImage} resizeMode="cover" />;
          })}
        </ScrollView>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>📦</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{don.title}</Text>

        {don.address ? (
          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressText} numberOfLines={1}>{don.address}</Text>
          </View>
        ) : null}

        <View style={styles.cardMeta}>
          <View style={[styles.badge, don.status !== 'disponible' && styles.badgeUnavailable]}>
            <Text style={[styles.badgeText, don.status !== 'disponible' && styles.badgeTextUnavailable]}>
              {don.status}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(don.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => onPress(don)}
        >
          <Text style={styles.detailBtnText}>Voir le don →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const FavorisScreen = ({ navigation }) => {
  const [favoris, setFavoris] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchFavoris = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setIsLoading(true);
      setError(null);
      const user = await authService.getCurrentUser(); 
      const response = await authService.api.get(`/favorites/user/${user.id}`);
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setFavoris(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFavoris(); }, []);

  const handleRemove = useCallback(async (don) => {
    try {
      await authService.api.delete(`/favorites/${don.id}`);
      setFavoris((prev) => prev.filter((f) => f.id !== don.id));
    } catch (err) {
      console.log('❌ remove favori:', err.message);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur : {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchFavoris()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoris}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchFavoris(true)} />
        }
        renderItem={({ item }) => (
          <FavoriCard
            don={item}
            onPress={(don) => navigation.navigate('DonDetail', { don })}
            onRemove={handleRemove}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🤍</Text>
            <Text style={styles.emptyText}>Aucun favori pour le moment</Text>
            <Text style={styles.emptySubText}>
              Appuyez sur ❤️ sur un don pour l'ajouter ici
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  list: { padding: 10, paddingBottom: 30 },
  row: { justifyContent: 'space-between' },
  card: { backgroundColor: colors.card, borderRadius: 12, marginBottom: 10, width: '48.5%', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  newBadge: { position: 'absolute', top: 6, left: 6, zIndex: 10, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  removeFavBtn: { position: 'absolute', top: 6, right: 6, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  removeFavIcon: { fontSize: 14 },
  imageGallery: { height: 100 },
  donImage: { width: 160, height: 100 },
  imagePlaceholder: { height: 90, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { fontSize: 28 },
  cardContent: { padding: 8 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 3 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  addressIcon: { fontSize: 10, marginRight: 2 },
  addressText: { fontSize: 10, color: colors.textLight, flex: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  badge: { backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: colors.available, fontSize: 9, fontWeight: '500' },
  badgeUnavailable: { backgroundColor: '#f3f4f6' },
  badgeTextUnavailable: { color: colors.textLight },
  cardDate: { fontSize: 9, color: colors.textLight },
  detailBtn: { backgroundColor: '#ede9fe', borderRadius: 8, paddingVertical: 5, alignItems: 'center' },
  detailBtnText: { fontSize: 11, color: colors.reqColor, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubText: { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },
  errorText: { color: 'red', marginBottom: 12 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: 'white', fontWeight: '600' },
});

export default FavorisScreen;