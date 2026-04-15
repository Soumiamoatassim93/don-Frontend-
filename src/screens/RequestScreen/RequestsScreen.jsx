// screens/RequestScreen/RequestsScreen.js - Version avec le hook complet
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useRequests } from '../../hooks/useRequests';
import { API_URL } from '../../../config';
import { styles } from './RequestStyle';

const colors = {
  primary: '#6366f1',
};

const STATUS_CONFIG = {
  en_cours: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  accepte: { label: 'Acceptée', color: '#10b981', bg: '#d1fae5' },
  refuse: { label: 'Refusée', color: '#ef4444', bg: '#fee2e2' },
  default: { label: 'Inconnue', color: '#6b7280', bg: '#f3f4f6' },
};

const getStatus = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.default;

const getImageUri = (don) => {
  if (!don?.images?.length) return null;
  const img = don.images[0];
  if (img.url) return `${API_URL}${img.url}`;
  if (img.filename) return `${API_URL}/uploads/${img.filename}`;
  return null;
};

const TABS = [
  { key: 'sent', label: 'Mes demandes' },
  { key: 'received', label: 'Demandes reçues' },
];

const RequestCard = ({ item, activeTab, onCancel, onAccept, onReject, onTrack, onViewDonLocation }) => {
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
      {image ? (
        <Image source={{ uri: image }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.placeholderText}>Pas de photo</Text>
        </View>
      )}

      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusBadgeText, { color: status.color }]}>
          {status.label}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {don.title || 'Don supprimé'}
        </Text>

        {don.address && <Text style={styles.cardAddress}>{don.address}</Text>}

        {!isSent && (sender?.name || sender?.email) && (
          <View style={styles.senderRow}>
            <View style={styles.senderAvatar}>
              <Text style={styles.senderAvatarText}>
                {sender.name?.[0]?.toUpperCase() || sender.email?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.senderName}>{sender.name || sender.email}</Text>
          </View>
        )}

        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>

        {/* Actions pour demandes envoyées */}
        {isSent && isPending && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(item)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        )}
        
        {isSent && isAccepted && (
          <>
            <View style={styles.statusMessageContainer}>
              <Text style={[styles.statusMessage, styles.acceptedMessage]}>
                ✓ Demande acceptée
              </Text>
            </View>
            <TouchableOpacity style={styles.viewDonBtn} onPress={() => onViewDonLocation(item)}>
              <Text style={styles.viewDonBtnText}>📍 Voir la position du don</Text>
            </TouchableOpacity>
          </>
        )}
        
        {isSent && isRefused && (
          <View style={styles.statusMessageContainer}>
            <Text style={[styles.statusMessage, styles.refusedMessage]}>
              ✗ Demande refusée
            </Text>
          </View>
        )}

        {/* Actions pour demandes reçues */}
        {!isSent && isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => onReject(item)}>
              <Text style={styles.rejectBtnText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => onAccept(item)}>
              <Text style={styles.acceptBtnText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!isSent && isAccepted && (
          <TouchableOpacity style={styles.trackBtn} onPress={() => onTrack(item)}>
            <Text style={styles.trackBtnText}>📍 Suivre la position</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const RequestsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('sent');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const {
    sentRequests,
    receivedRequests,
    fetchLoading,
    actionLoading,
    getSentRequests,
    getReceivedRequests,
    accept,
    refuse,
    cancel,
    clearErrors,
  } = useRequests();

  const fetchAllRequests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await Promise.all([
        getSentRequests(user.id),
        getReceivedRequests(user.id),
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les demandes');
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, getSentRequests, getReceivedRequests]);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllRequests();
    });
    return unsubscribe;
  }, [navigation, fetchAllRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllRequests();
  }, [fetchAllRequests]);

  const handleAccept = async (request) => {
    try {
      await accept(request.id, request);
      Alert.alert('Succès', 'Demande acceptée');
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'accepter la demande");
    }
  };

  const handleReject = async (request) => {
    try {
      await refuse(request.id, request);
      Alert.alert('Succès', 'Demande refusée');
    } catch (error) {
      Alert.alert('Erreur', "Impossible de refuser la demande");
    }
  };

  const handleCancel = (request) => {
    Alert.alert(
      'Annuler la demande',
      'Voulez-vous vraiment annuler cette demande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel(request.id, true);
              Alert.alert('Succès', 'Demande annulée');
            } catch (error) {
              Alert.alert('Erreur', "Impossible d'annuler la demande");
            }
          },
        },
      ]
    );
  };

  const handleViewDonLocation = (request) => {
    navigation.navigate('SenderTracking', {
      request: request,
      donation: request.don,
    });
  };

  const handleTrack = (request) => {
    navigation.navigate('Tracking', {
      request: request,
      donation: request.don,
      sender: { id: request.userId, name: request.user?.name, email: request.user?.email },
    });
  };

  if (fetchLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const data = activeTab === 'sent' ? sentRequests : receivedRequests;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes demandes</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
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