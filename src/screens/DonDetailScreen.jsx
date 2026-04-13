import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, Dimensions, TouchableOpacity,
} from 'react-native';

const API_URL = 'http://192.168.1.8:3000';
const { width } = Dimensions.get('window');

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  available: '#10b981',
};

const DonDetailScreen = ({ route, navigation }) => {
  const { don } = route.params;
  const images = Array.isArray(don.images) ? don.images : [];
  const [activeIndex, setActiveIndex] = useState(0);

  const getImageUri = (img) => {
    if (typeof img === 'string') return `${API_URL}/uploads/${img}`;
    return `${API_URL}/uploads/${img.filename || img.path || img}`;
  };

  return (
    <ScrollView style={styles.container}>

      {/* Galerie plein écran */}
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
          {/* Indicateurs */}
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>📦 Pas de photo</Text>
        </View>
      )}

      {/* Contenu */}
      <View style={styles.content}>
        {/* Titre + statut */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{don.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{don.status}</Text>
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

        {/* Séparateur */}
        <View style={styles.divider} />

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{don.description}</Text>

        {/* Bouton contacter */}
        <TouchableOpacity style={styles.contactBtn}>
          <Text style={styles.contactBtnText}>💬 Contacter le donateur</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  fullImage: { width, height: 280 },
  noImage: {
    height: 180, backgroundColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center',
  },
  noImageText: { fontSize: 16, color: colors.textLight },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d1d5db', marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, flex: 1 },
  badge: { backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: colors.available, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowIcon: { fontSize: 14, marginRight: 6 },
  rowText: { fontSize: 14, color: colors.textLight, flex: 1 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  description: { fontSize: 15, color: colors.text, lineHeight: 24 },
  contactBtn: {
    backgroundColor: colors.primary, padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 24,
  },
  contactBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default DonDetailScreen;