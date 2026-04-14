import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  ScrollView, TextInput, Alert
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { categoryService } from '../../services/category.service';
import { API_URL } from '../../../config';
import { styles } from './HomeStyle.styles';


const DEFAULT_CATEGORIES = ['Tous'];
const colors = {
  text: '#111827',
  textLight: '#6b7280', 
  primary: '#6366f1',
  favColor: '#ef4444',
  reqColor: '#10b981',
};  
const isNew = (dateStr) =>
  Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

const HeartIcon = ({ filled }) => (
  <Text style={{ fontSize: 13, color: colors.favColor }}>{filled ? '❤️' : '🤍'}</Text>
);

const SendIcon = () => <Text style={{ fontSize: 13 }}>📨</Text>;

const DonCard = ({ don, onPress, onFavorite, onRequest, isFavorite }) => {
  // Extraction des URLs d'images
  const getImageUrls = () => {
    if (!don.images || !Array.isArray(don.images)) return [];
    
    return don.images
      .map(img => {
        // Cas 1: img est un objet avec url
        if (img && img.url) {
          return img.url.startsWith('http') ? img.url : `${API_URL}${img.url}`;
        }
        // Cas 2: img est une chaîne de caractères
        if (typeof img === 'string') {
          return img.startsWith('http') ? img : `${API_URL}/uploads/${img}`;
        }
        // Cas 3: img a filename ou path
        if (img && (img.filename || img.path)) {
          const filename = img.filename || img.path;
          return `${API_URL}/uploads/${filename}`;
        }
        return null;
      })
      .filter(url => url !== null);
  };

  const imageUrls = getImageUrls();

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(don)} activeOpacity={0.85}>
      {isNew(don.createdAt) && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>Nouveau</Text>
        </View>
      )}

      {imageUrls.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
          {imageUrls.map((url, index) => (
            <Image 
              key={index} 
              source={{ uri: url }} 
              style={styles.donImage} 
              resizeMode="cover"
              onError={(e) => console.log(`Erreur chargement image ${index}:`, e.nativeEvent.error)}
            />
          ))}
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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{don.status}</Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(don.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.actionBtn, styles.favBtn]} onPress={() => onFavorite(don)}>
            <HeartIcon filled={isFavorite} />
            <Text style={[styles.actionText, { color: colors.favColor }]}>Favori</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.reqBtn]} onPress={() => onRequest(don)}>
            <SendIcon />
            <Text style={[styles.actionText, { color: colors.reqColor }]}>Demander</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const [dons, setDons] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [favorites, setFavorites] = useState(new Set());
  const [requests, setRequests] = useState(new Set());
  const { user } = useAuth();

  // Récupérer les catégories depuis la BDD
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      const categoryNames = categoriesData.map(cat => cat.name);
      setCategories(['Tous', ...categoryNames]);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  const fetchDons = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setIsLoading(true);
      setError(null);
      const response = await authService.api.get('/dons/available');
      const sorted = (Array.isArray(response.data) ? response.data : []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setDons(sorted);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchDons(),
        fetchCategories()
      ]);
    };
    loadData();
  }, [fetchDons, fetchCategories]);

  const filteredDons = dons.filter((don) => {
    const isOwn = don.userId === user?.id || don.user?.id === user?.id;
    if (isOwn) return false;
    const matchSearch =
      don.title?.toLowerCase().includes(search.toLowerCase()) ||
      don.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'Tous' || don.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const handleFavorite = useCallback(async (don) => {
  try {
    const currentUser = await authService.getCurrentUser();
    
    console.log('Ajout favori - Don ID:', don.id); // Debug
    
    await authService.api.post('/favorites', {
      userId: currentUser.id,
      donationId: don.id,  // Assurez-vous que c'est donationId et pas donId
    });
    
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(don.id)) {
        next.delete(don.id);
      } else {
        next.add(don.id);
      }
      return next;
    });
    
    Alert.alert('Succès', favorites.has(don.id) ? 'Retiré des favoris' : 'Ajouté aux favoris');
  } catch (err) {
    console.log('❌ favorite error:', err.response?.data || err.message);
    Alert.alert('Erreur', 'Impossible de modifier les favoris');
  }
}, [favorites]);

  const handleRequest = useCallback(async (don) => {
    try {
      const currentUser = await authService.getCurrentUser();
      
      await authService.api.post('/requests', {
        userId: currentUser.id,
        donationId: don.id,
        status: 'en_cours',
      });
      setRequests((prev) => new Set(prev).add(don.id));
      Alert.alert('Succès', 'Demande envoyée ✔️');
    } catch (err) {
      console.log('❌ request error:', err.response?.data || err.message);
      Alert.alert('Erreur', 'Impossible d’envoyer la demande');
    }
  }, [requests]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textLight }}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur : {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDons()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initiale = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Bonjour 👋 {initiale}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MessagerieDrawer')}
            style={styles.msgBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.msgIcon}>💬</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>{filteredDons.length} don(s) disponible(s)</Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un don..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: colors.textLight, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDons}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <DonCard
            don={item}
            onPress={(don) => navigation.navigate('DonDetail', { don })}
            onFavorite={handleFavorite}
            onRequest={handleRequest}
            isFavorite={favorites.has(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchDons(true)} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucun don disponible pour le moment</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddDon')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};


export default HomeScreen;