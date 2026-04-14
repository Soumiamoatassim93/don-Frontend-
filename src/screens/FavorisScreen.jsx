import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView,
  Alert, StatusBar, SafeAreaView,
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

const isNew = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < 24 * 60 * 60 * 1000;
};

const getImageUrl = (img) => {
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
  
  if (img.filename) {
    return `${API_URL}/uploads/${img.filename}`;
  }
  if (img.path) {
    return `${API_URL}/uploads/${img.path}`;
  }
  
  return null;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Date inconnue';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Date inconnue';
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const FavoriCard = ({ don, onPress, onRemove }) => {
  const images = Array.isArray(don.images) ? don.images : [];
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  if (!don || !don.id) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(don)} activeOpacity={0.85}>
      {isNew(don.createdAt) && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>Nouveau</Text>
        </View>
      )}

      <TouchableOpacity style={styles.removeFavBtn} onPress={() => onRemove(don)}>
        <Text style={styles.removeFavIcon}>❤️</Text>
      </TouchableOpacity>

      {images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
          {images.map((img, index) => {
            if (imageErrors[index]) {
              return (
                <View key={index} style={[styles.donImage, styles.imageErrorContainer]}>
                  <Text style={styles.imageErrorText}>📷</Text>
                </View>
              );
            }
            
            const imageUrl = getImageUrl(img);
            if (!imageUrl) {
              return (
                <View key={index} style={[styles.donImage, styles.imageErrorContainer]}>
                  <Text style={styles.imageErrorText}>📷</Text>
                </View>
              );
            }
            
            return (
              <Image 
                key={index} 
                source={{ uri: imageUrl }} 
                style={styles.donImage} 
                resizeMode="cover"
                onError={() => handleImageError(index)}
              />
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>📦</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{don.title || 'Sans titre'}</Text>

        {don.address ? (
          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressText} numberOfLines={1}>{don.address}</Text>
          </View>
        ) : null}

        <View style={styles.cardMeta}>
          <View style={[styles.badge, don.status !== 'disponible' && styles.badgeUnavailable]}>
            <Text style={[styles.badgeText, don.status !== 'disponible' && styles.badgeTextUnavailable]}>
              {don.status || 'Disponible'}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            {formatDate(don.createdAt)}
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

  const cleanupInvalidFavorites = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      const response = await authService.api.get(`/favorites/user/${user.id}`);
      let favoritesList = [];
      
      if (Array.isArray(response.data)) {
        favoritesList = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        favoritesList = response.data.data;
      }
      
      const invalidFavorites = favoritesList.filter(fav => !fav.donationId || fav.donationId === 0);
      
      for (const fav of invalidFavorites) {
        console.log(`Suppression du favori invalide ${fav.id}`);
        await authService.api.delete(`/favorites/${fav.id}`);
      }
      
      if (invalidFavorites.length > 0) {
        console.log(`${invalidFavorites.length} favoris invalides supprimés`);
      }
    } catch (err) {
      console.error('Erreur nettoyage:', err);
    }
  }, []);

  const fetchFavoris = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setIsLoading(true);
      setError(null);
      
      await cleanupInvalidFavorites();
      
      const user = await authService.getCurrentUser(); 
      const response = await authService.api.get(`/favorites/user/${user.id}`);
      let favoritesList = [];
      
      if (Array.isArray(response.data)) {
        favoritesList = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        favoritesList = response.data.data;
      }
      
      const validFavorites = favoritesList.filter(fav => fav.donationId && fav.donationId !== 0);
      
      if (validFavorites.length === 0) {
        setFavoris([]);
        return;
      }
      
      const favoritesWithDetails = await Promise.all(
        validFavorites.map(async (favorite) => {
          try {
            const donResponse = await authService.api.get(`/dons/${favorite.donationId}`);
            return donResponse.data;
          } catch (err) {
            console.log(`Erreur chargement don ${favorite.donationId}:`, err.message);
            if (err.response?.status === 404) {
              await authService.api.delete(`/favorites/${favorite.id}`);
            }
            return null;
          }
        })
      );
      
      const validDons = favoritesWithDetails.filter(don => don && don.id);
      setFavoris(validDons);
      
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [cleanupInvalidFavorites]);

  useEffect(() => { 
    fetchFavoris(); 
  }, []);

  const handleRemove = useCallback(async (don) => {
    try {
      const user = await authService.getCurrentUser();
      const response = await authService.api.get(`/favorites/user/${user.id}`);
      let favoritesList = [];
      
      if (Array.isArray(response.data)) {
        favoritesList = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        favoritesList = response.data.data;
      }
      
      const favorite = favoritesList.find(fav => fav.donationId === don.id);
      
      if (favorite) {
        await authService.api.delete(`/favorites/${favorite.id}`);
        setFavoris((prev) => prev.filter((f) => f.id !== don.id));
        Alert.alert('Succès', 'Retiré des favoris');
      }
    } catch (err) {
      console.log('❌ remove favori:', err.message);
      Alert.alert('Erreur', 'Impossible de retirer des favoris');
    }
  }, []);

  // CORRECTION ICI - Navigation vers DonDetail dans le HomeStack
  const handlePressDon = useCallback((don) => {
    if (don && don.id) {
      // Naviguer vers DonDetail dans le HomeStack (qui est dans l'écran Home du Drawer)
      navigation.navigate('Home', {
        screen: 'DonDetail',
        params: { don }
      });
    } else {
      Alert.alert('Erreur', 'Ce don n\'est plus disponible');
    }
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textLight }}>Chargement des favoris...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <Text style={styles.errorText}>Erreur : {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchFavoris()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Favoris</Text>
          <Text style={styles.headerSubtitle}>
            {favoris.length} don(s) enregistré(s)
          </Text>
        </View>
        
        <FlatList
          data={favoris}
          keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchFavoris(true)} />
          }
          renderItem={({ item }) => {
            if (!item || !item.id) return null;
            return (
              <FavoriCard
                don={item}
                onPress={handlePressDon}
                onRemove={handleRemove}
              />
            );
          }}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: colors.background,
  },
  list: { 
    padding: 10, 
    paddingBottom: 30,
  },
  row: { 
    justifyContent: 'space-between' 
  },
  card: { 
    backgroundColor: colors.card, 
    borderRadius: 12, 
    marginBottom: 10, 
    width: '48.5%', 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.07, 
    shadowRadius: 4, 
    elevation: 2 
  },
  newBadge: { 
    position: 'absolute', 
    top: 6, 
    left: 6, 
    zIndex: 10, 
    backgroundColor: colors.primary, 
    borderRadius: 10, 
    paddingHorizontal: 6, 
    paddingVertical: 2 
  },
  newBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  removeFavBtn: { 
    position: 'absolute', 
    top: 6, 
    right: 6, 
    zIndex: 10, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 14, 
    width: 28, 
    height: 28, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  removeFavIcon: { fontSize: 14 },
  imageGallery: { height: 100 },
  donImage: { width: 160, height: 100 },
  imageErrorContainer: { 
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imageErrorText: { fontSize: 32 },
  imagePlaceholder: { 
    height: 90, 
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
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
  empty: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 100 
  },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubText: { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },
  errorText: { color: 'red', marginBottom: 12 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: 'white', fontWeight: '600' },
});

export default FavorisScreen;