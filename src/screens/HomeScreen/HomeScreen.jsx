import React, { useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
} from 'react-native';
import { useAuth }   from '../../contexts/AuthContext';
import { useHome }   from '../../hooks/useHome';
import { API_URL }   from '../../../config';
import { styles }    from './HomeStyle.styles';

const colors = {
  text: '#111827', textLight: '#6b7280',
  primary: '#6366f1', favColor: '#ef4444', reqColor: '#10b981',
};

const isNew = (dateStr) =>
  Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

const HeartIcon = ({ filled }) => (
  <Text style={{ fontSize: 13, color: colors.favColor }}>{filled ? '❤️' : '🤍'}</Text>
);

const getImageUrls = (images) => {
  if (!images || !Array.isArray(images)) return [];
  return images.map((img) => {
    if (img?.url)               return img.url.startsWith('http') ? img.url : `${API_URL}${img.url}`;
    if (typeof img === 'string') return img.startsWith('http')    ? img      : `${API_URL}/uploads/${img}`;
    if (img?.filename || img?.path) return `${API_URL}/uploads/${img.filename || img.path}`;
    return null;
  }).filter(Boolean);
};

const DonCard = ({ don, onPress, onFavorite, onRequest, isFavorite }) => {
  const imageUrls = getImageUrls(don.images);
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(don)} activeOpacity={0.85}>
      {isNew(don.createdAt) && (
        <View style={styles.newBadge}><Text style={styles.newBadgeText}>Nouveau</Text></View>
      )}
      {imageUrls.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
          {imageUrls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.donImage} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>📦</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{don.title}</Text>
        {don.address && (
          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressText} numberOfLines={1}>{don.address}</Text>
          </View>
        )}
        <View style={styles.cardMeta}>
          <View style={styles.badge}><Text style={styles.badgeText}>{don.status}</Text></View>
          <Text style={styles.cardDate}>{new Date(don.createdAt).toLocaleDateString('fr-FR')}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.actionBtn, styles.favBtn]} onPress={() => onFavorite(don)}>
            <HeartIcon filled={isFavorite} />
            <Text style={[styles.actionText, { color: colors.favColor }]}>Favori</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.reqBtn]} onPress={() => onRequest(don)}>
            <Text style={{ fontSize: 13 }}>📨</Text>
            <Text style={[styles.actionText, { color: colors.reqColor }]}>Demander</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const { user }                           = useAuth();
  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  const {
    filteredDons, categories,
    donsLoading, donsError,
    favoriteIds, handleFavorite, handleRequest,
    refresh, refreshing,
  } = useHome(user, search, activeCategory);

  const initiale = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  if (donsLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textLight }}>Chargement...</Text>
      </View>
    );
  }

  if (donsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur : {donsError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}
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
            isFavorite={favoriteIds.includes(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
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