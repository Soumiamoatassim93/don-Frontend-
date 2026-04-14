import React, { useEffect, useState, useCallback } from 'react';
import {
   View, Text, FlatList, StyleSheet,
  Image, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { authService } from '../../services/auth.service';
import { API_URL } from '../../../config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './RequestStyle';
const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  available: '#10b981',
  rejected: '#ef4444',
};

// ✅ STATUS CORRIGÉ (backend)
const STATUS_CONFIG = {
  en_cours: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  accepte: { label: 'Acceptée', color: '#10b981', bg: '#d1fae5' },
  refuse: { label: 'Refusée', color: '#ef4444', bg: '#fee2e2' },
  default: { label: 'Inconnue', color: '#6b7280', bg: '#f3f4f6' },
};

const getStatus = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.default;

// ✅ IMAGE FIX
const getImageUri = (don) => {
  if (!don || !Array.isArray(don.images) || don.images.length === 0) {
    return null;
  }

  const img = don.images[0];

  if (img.url) return `${API_URL}${img.url}`;
  if (img.filename) return `${API_URL}/uploads/${img.filename}`;

  return null;
};

const TABS = [
  { key: 'sent', label: 'Mes demandes' },
  { key: 'received', label: 'Demandes reçues' },
];

/// ── CARD ─────────────────────────────────────────
const RequestCard = ({
  item, activeTab, onCancel, onAccept, onReject, onDelete,onTrack,onViewDonLocation
}) => {
  const don = item.don || {};
  const status = getStatus(item.status);
  const image = getImageUri(don);

  const isPending = item.status === 'en_cours';
  const isAccepted = item.status === 'accepte';
  const isRefused = item.status === 'refuse';
  const isSent = activeTab === 'sent';

  const sender = item.userId || {};

  return (
    <View style={styles.card}>
      {/* IMAGE */}
      {image ? (
        <Image source={{ uri: image }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.placeholderText}>Pas de photo</Text>
        </View>
      )}

      {/* STATUS */}
      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusBadgeText, { color: status.color }]}>
          {status.label}
        </Text>
      </View>

      {/* CONTENT */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {don.title || 'Don supprimé'}
        </Text>

        {don.address && (
          <Text style={styles.cardAddress}>{don.address}</Text>
        )}

        {/* Afficher le demandeur uniquement pour les demandes reçues */}
        {!isSent && (sender?.name || sender?.email) && (
          <View style={styles.senderRow}>
            <View style={styles.senderAvatar}>
              <Text style={styles.senderAvatarText}>
                {sender.name?.[0]?.toUpperCase() ||
                  sender.email?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.senderName}>
              {sender.name || sender.email}
            </Text>
          </View>
        )}

        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>

        {/* ACTIONS POUR DEMANDES ENVOYÉES */}
        {isSent && (
  <>
    {/* Si la demande est en attente, afficher Annuler */}
    {isPending && (
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => onCancel(item)}
      >
        <Text style={styles.cancelBtnText}>Annuler</Text>
      </TouchableOpacity>
    )}
    
    {/* Si la demande est acceptée */}
    {isAccepted && (
      <>
        <View style={styles.statusMessageContainer}>
          <Text style={[styles.statusMessage, styles.acceptedMessage]}>
            ✓ Demande acceptée
          </Text>
        </View>
        
        {/* Bouton pour voir la position du don */}
        <TouchableOpacity
          style={styles.viewDonBtn}
          onPress={() => onViewDonLocation(item)}
        >
          <Text style={styles.viewDonBtnText}>📍 Voir la position du don</Text>
        </TouchableOpacity>
      </>
    )}
    
    {/* Si la demande est refusée */}
    {isRefused && (
      <View style={styles.statusMessageContainer}>
        <Text style={[styles.statusMessage, styles.refusedMessage]}>
          ✗ Demande refusée
        </Text>
      </View>
    )}
  </>
)}
         

        {/* ACTIONS POUR DEMANDES REÇUES */}
        {!isSent && (
          <>
            {/* Si la demande est en attente, afficher Accepter/Refuser */}
            {isPending && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => onReject(item)}
                >
                  <Text style={styles.rejectBtnText}>Refuser</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => onAccept(item)}
                >
                  <Text style={styles.acceptBtnText}>Accepter</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Si la demande est déjà traitée, afficher seulement le statut */}
            {(isAccepted || isRefused) && (
              <View style={styles.statusMessageContainer}>
                <Text style={[
                  styles.statusMessage,
                  isAccepted ? styles.acceptedMessage : styles.refusedMessage
                ]}>
                  {!isSent && isAccepted && (
  <TouchableOpacity
    style={styles.trackBtn}
    onPress={() => onTrack(item)}
  >
    <Text style={styles.trackBtnText}>📍 Suivre la position</Text>
  </TouchableOpacity>
)}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
};

// ── SCREEN ─────────────────────────────────────────
const RequestsScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState('sent');
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

const fetchRequests = useCallback(async () => {
  try {
    const user = await authService.getCurrentUser();
    console.log('Current user:', user);
    
    // Récupérer les demandes envoyées
    const sentRes = await authService.api.get(`/requests/sent/${user.id}`);
    const sentData = sentRes.data || [];
    console.log('Sent requests:', sentData);
    
    // Récupérer les demandes reçues
    const receivedRes = await authService.api.get(`/requests/received/${user.id}`);
    const receivedData = receivedRes.data || [];
    console.log('Received requests:', receivedData);
    
    // Enrichir avec les détails des dons
    const enrichedSent = await Promise.all(
      sentData.map(async (req) => {
        try {
          const donRes = await authService.api.get(`/dons/${req.donationId}`);
          return { ...req, don: donRes.data };
        } catch (error) {
          console.error(`Error fetching don ${req.donationId}:`, error);
          return req;
        }
      })
    );
    
    const enrichedReceived = await Promise.all(
      receivedData.map(async (req) => {
        try {
          const donRes = await authService.api.get(`/dons/${req.donationId}`);
          return { ...req, don: donRes.data };
        } catch (error) {
          console.error(`Error fetching don ${req.donationId}:`, error);
          return req;
        }
      })
    );
    
    setSentRequests(enrichedSent);
    setReceivedRequests(enrichedReceived);
    
  } catch (error) {
    console.error('Error fetching requests:', error);
    Alert.alert('Erreur', 'Impossible de charger les demandes');
  } finally {
    setIsLoading(false);
    setRefreshing(false);
  }
}, []);

  // Rafraîchissement manuel
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => { 
    fetchRequests(); 
    
    // Ajouter un focus listener pour rafraîchir quand l'écran revient au premier plan
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRequests();
    });
    
    return unsubscribe;
  }, [fetchRequests, navigation]);

  // ACTIONS avec rafraîchissement automatique
  const handleAccept = async (request) => {
    try {
      await authService.api.put(`/requests/${request.id}/accept`);
      // Rafraîchir les données
      await fetchRequests();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accepter la demande');
    }
  };


const handleViewDonLocation = (request) => {
  console.log('Voir position du don:', request);
  
  // Utiliser l'écran SenderTracking existant
  navigation.navigate('SenderTracking', {
    request: request,
    donation: request.don,
  });
};
  const handleReject = async (request) => {
    try {
      await authService.api.put(`/requests/${request.id}/refuse`);
      // Rafraîchir les données
      await fetchRequests();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de refuser la demande');
    }
  };

  const handleCancel = async (request) => {
    try {
      await authService.api.delete(`/requests/${request.id}`);
      // Rafraîchir les données
      await fetchRequests();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'annuler la demande');
    }
  };

  const handleDelete = async (request, type) => {
    try {
      await authService.api.delete(`/requests/${request.id}`);
      // Rafraîchir les données
      await fetchRequests();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer la demande');
    }
  };

  // Dans RequestsScreen, ajoutez la fonction handleTrack
const handleTrack = (request) => {
  const sender = {
    id: request.userId,
    name: request.user?.name,
    email: request.user?.email,
  };
  
  navigation.navigate('Tracking', {
    request: request,
    donation: request.don,
    sender: sender,
  });
};

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const data = activeTab === 'sent' ? sentRequests : receivedRequests;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes demandes</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST avec RefreshControl */}
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            activeTab={activeTab}
            onCancel={handleCancel}
            onAccept={handleAccept}
            onReject={handleReject}
            onDelete={handleDelete}
            onTrack={handleTrack}
            onViewDonLocation={handleViewDonLocation}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucune demande trouvée</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};


export default RequestsScreen;