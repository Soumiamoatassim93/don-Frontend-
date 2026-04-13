import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import SideMenu from '../components/SideMenu';
import { authService } from '../services/auth.service';

const API_URL = 'http://192.168.1.8:3000';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  available: '#10b981',
};

const DonCard = ({ don, onPress }) => {
  const images = Array.isArray(don.images) ? don.images : [];

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(don)}>
      {/* Galerie d'images */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
        >
          {images.map((img, index) => {
            const uri = typeof img === 'string'
              ? `${API_URL}/uploads/${img}`
              : `${API_URL}/uploads/${img.filename || img.path}`;
            return (
              <Image
                key={index}
                source={{ uri }}
                style={styles.donImage}
                resizeMode="cover"
              />
            );
          })}
        </ScrollView>
      )}

      {/* Contenu */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{don.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{don.status}</Text>
          </View>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {don.description}
        </Text>

        {/* Adresse */}
        {don.address ? (
          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {don.address}
            </Text>
          </View>
        ) : null}

        <Text style={styles.cardDate}>
          {new Date(don.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const [dons, setDons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const { user } = useAuth();

  const fetchDons = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setIsLoading(true);
      setError(null);
      const response = await authService.api.get('/dons/available');
      setDons(response.data);
    } catch (err) {
      console.log('❌ Erreur fetchDons:', err.response?.status, err.message);
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDons();
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
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDons()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initiale = user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.greeting}>Bonjour 👋 {initiale}</Text>
        </View>
        <Text style={styles.subtitle}>{dons.length} don(s) disponible(s)</Text>
      </View>

      <FlatList
        data={dons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DonCard
            don={item}
            onPress={(don) => navigation.navigate('DonDetail', { don })}
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDon')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <SideMenu
        navigation={navigation}
        isVisible={menuVisible}
        closeMenu={() => setMenuVisible(false)}
        activeScreen="Home"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 24, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  menuIcon: { fontSize: 28, color: colors.primary, marginRight: 12 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textLight },
  list: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: colors.card, borderRadius: 12, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    overflow: 'hidden',
  },
  imageGallery: { height: 180 },
  donImage: { width: 280, height: 180, marginRight: 2 },
  cardContent: { padding: 16 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  badge: {
    backgroundColor: '#d1fae5', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 20,
  },
  badgeText: { color: colors.available, fontSize: 12, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: colors.textLight, lineHeight: 20 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  addressIcon: { fontSize: 12, marginRight: 4 },
  addressText: { fontSize: 12, color: colors.textLight, flex: 1 },
  cardDate: { fontSize: 12, color: colors.textLight, marginTop: 6 },
  errorText: { color: 'red', marginBottom: 12 },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: 'white', fontWeight: '600' },
  emptyText: { color: colors.textLight, fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
  },
  fabText: { color: 'white', fontSize: 28, fontWeight: 'bold', lineHeight: 30 },
});

export default HomeScreen;