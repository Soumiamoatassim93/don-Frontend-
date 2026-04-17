import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image,
  Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { API_URL } from '../../../config';
import { useDonDetail } from '../../hooks/useDonDetail';
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
    return `${API_URL}/uploads/${img.replace(/^\/?uploads\//, '')}`;
  }
  if (img.url) {
    if (img.url.startsWith('http')) return img.url;
    return `${API_URL}/uploads/${img.url.replace(/^\/?uploads\//, '')}`;
  }
  if (img.filename) return `${API_URL}/uploads/${img.filename}`;
  if (img.path) return `${API_URL}/uploads/${img.path}`;
  return null;
};

const DonDetailScreen = ({ route, navigation }) => {
  const { don } = route.params;
  const images = Array.isArray(don.images) ? don.images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const {
    isFavorite, requestSent, sendLoading,
    handleFavorite, handleRequest,
  } = useDonDetail(don);

  // Construction du destinataire pour le chat
  const handleContact = () => {
    if (!don.userId) {
      Alert.alert('Erreur', 'Impossible d\'identifier le destinataire');
      return;
    }
    const recipient = {
      id: don.userId,
      name: don.user?.nom || don.user?.name || `Utilisateur ${don.userId}`,
      email: don.user?.email || '',
    };
    navigation.navigate('Chat', { recipient, don });
  };

  // Récupération du nom du donateur (priorité à 'nom' puis 'name')
  const donorName = don.user?.nom || don.user?.name || 'Anonyme';
  const donorPhone = don.user?.telephone || null;

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
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
                    key={index} source={{ uri: imageUri }}
                    style={styles.fullImage} resizeMode="cover"
                    onError={() => setImageErrors((p) => ({ ...p, [index]: true }))}
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

          {don.address && (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>📍</Text>
              <Text style={styles.rowText}>{don.address}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowIcon}>📅</Text>
            <Text style={styles.rowText}>
              {new Date(don.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
          {don.category && (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>🏷️</Text>
              <Text style={styles.rowText}>{don.category}</Text>
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{don.description || 'Aucune description fournie'}</Text>

          {don.user && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Donateur</Text>
              <View style={styles.donateurRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {donorName[0]?.toUpperCase() || don.user.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.donateurName}>{donorName}</Text>
                  <Text style={styles.donateurEmail}>{don.user.email}</Text>
                  {donorPhone ? (
                    <Text style={styles.donateurPhone}>📞 {donorPhone}</Text>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.msgBtn]}
          onPress={handleContact}
        >
          <Text style={[styles.bottomBtnText, { color: colors.reqColor }]}>💬 Contacter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.bottomBtn, styles.reqBtn,
            requestSent && styles.reqBtnSent,
            sendLoading && styles.reqBtnLoading,
          ]}
          onPress={handleRequest}
          disabled={requestSent || sendLoading}
        >
          <Text style={styles.bottomBtnText}>
            {sendLoading ? '⏳ Envoi...' : requestSent ? '✅ Demande envoyée' : '📨 Demander'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DonDetailScreen;