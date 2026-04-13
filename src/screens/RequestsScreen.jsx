import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { authService } from '../services/auth.service';
import { API_URL } from '../../config';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  available: '#10b981',
  rejected: '#ef4444',
  reqColor: '#6d28d9',
};

const STATUS_CONFIG = {
  pending:  { label: '⏳ En attente', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  accepted: { label: '✅ Acceptée', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  rejected: { label: '❌ Refusée', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  default:  { label: '❓ Inconnue', color: '#6b7280', bg: '#f3f4f6', icon: '❓' },
};

const getStatus = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.default;

const getImageUri = (don) => {
  const images = Array.isArray(don?.images) ? don.images : [];
  if (images.length === 0) return null;

  const img = images[0];
  const path = typeof img === 'string'
    ? img
    : img.filename || img.path || img.url;

  return path ? `${API_URL}/uploads/${path}` : null;
};

const TABS = [
  { key: 'sent', label: '📤 Mes demandes' },
  { key: 'received', label: '📥 Demandes reçues' },
];

const RequestsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('sent');
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ================= FETCH =================
  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setIsLoading(true);
      setError(null);

      const user = await authService.getCurrentUser();

      const res = await authService.api.get(`/requests/user/${user.id}`);

      const all = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];

      const enriched = await Promise.all(
        all.map(async (req) => {
          if (!req.donationId || req.donationId === 0) return req;

          try {
            const donRes = await authService.api.get(`/dons/${req.donationId}`);
            return { ...req, don: donRes.data };
          } catch {
            return req;
          }
        })
      );

      const sent = enriched.filter(r =>
        r.userId === user.id || r.user?.id === user.id
      );

      const received = enriched.filter(r =>
        r.don?.userId === user.id || r.don?.user?.id === user.id
      );

      setSentRequests(sent);
      setReceivedRequests(received);

    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, []);

  // ================= ACTIONS =================

  // Fonction générique pour supprimer n'importe quelle demande
  const handleDeleteRequest = (request, type) => {
    Alert.alert(
      '🗑️ Supprimer la demande',
      'Cette action est irréversible. Voulez-vous vraiment supprimer cette demande ?',
      [
        { text: '❌ Non', style: 'cancel' },
        {
          text: '✅ Oui, supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.api.delete(`/requests/${request.id}`);
              
              // Mettre à jour la liste appropriée
              if (type === 'sent') {
                setSentRequests(prev => prev.filter(r => r.id !== request.id));
              } else {
                setReceivedRequests(prev => prev.filter(r => r.id !== request.id));
              }
              
              Alert.alert('✅ Succès', 'Demande supprimée avec succès');
            } catch (error) {
              Alert.alert('❌ Erreur', 'Impossible de supprimer la demande');
            }
          }
        }
      ]
    );
  };

  const handleCancel = (request) => {
    Alert.alert(
      '⏸️ Annuler la demande',
      'Êtes-vous sûr de vouloir annuler cette demande ?',
      [
        { text: '❌ Non', style: 'cancel' },
        {
          text: '✅ Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.api.delete(`/requests/${request.id}`);
              setSentRequests(prev => prev.filter(r => r.id !== request.id));
              Alert.alert('✅ Succès', 'Demande annulée avec succès');
            } catch {
              Alert.alert('❌ Erreur', 'Impossible d\'annuler la demande');
            }
          }
        }
      ]
    );
  };

  const handleAccept = async (request) => {
    Alert.alert(
      '✅ Accepter la demande',
      'Voulez-vous accepter cette demande ?',
      [
        { text: '❌ Non', style: 'cancel' },
        {
          text: '✅ Oui, accepter',
          onPress: async () => {
            try {
              await authService.api.put(`/requests/${request.id}/accept`);
              setReceivedRequests(prev =>
                prev.map(r => r.id === request.id ? { ...r, status: 'accepted' } : r)
              );
              Alert.alert('✅ Succès', 'Demande acceptée avec succès');
            } catch {
              Alert.alert('❌ Erreur', 'Impossible d\'accepter la demande');
            }
          }
        }
      ]
    );
  };

  const handleReject = async (request) => {
    Alert.alert(
      '❌ Refuser la demande',
      'Voulez-vous refuser cette demande ?',
      [
        { text: '❌ Non', style: 'cancel' },
        {
          text: '✅ Oui, refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.api.put(`/requests/${request.id}/refuse`);
              setReceivedRequests(prev =>
                prev.map(r => r.id === request.id ? { ...r, status: 'rejected' } : r)
              );
              Alert.alert('❌ Succès', 'Demande refusée');
            } catch {
              Alert.alert('❌ Erreur', 'Impossible de refuser la demande');
            }
          }
        }
      ]
    );
  };

  // ================= UI STATES =================

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des demandes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchRequests}>
          <Text style={styles.retryText}>🔄 Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const data = activeTab === 'sent' ? sentRequests : receivedRequests;
  const isEmpty = data.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Demandes</Text>
        <Text style={styles.headerSubtitle}>
          {activeTab === 'sent' ? 'Vos demandes envoyées' : 'Demandes reçues pour vos dons'}
        </Text>
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
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* EMPTY STATE */}
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {activeTab === 'sent' ? '📭' : '🎁'}
          </Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'sent' ? 'Aucune demande envoyée' : 'Aucune demande reçue'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'sent' 
              ? 'Vous n\'avez pas encore fait de demande de don' 
              : 'Personne n\'a encore fait de demande pour vos dons'}
          </Text>
        </View>
      ) : (
        /* LIST */
        <FlatList
          data={data}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} />
          }
          renderItem={({ item }) => {
            const don = item.don || {};
            const status = getStatus(item.status);
            const image = getImageUri(don);
            const isPending = item.status === 'pending';
            const isSent = activeTab === 'sent';

            return (
              <View style={styles.card}>
                {/* STATUS BANNER */}
                <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusBannerText, { color: status.color }]}>
                    {status.icon} {status.label}
                  </Text>
                </View>

                <View style={styles.cardRow}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Text style={styles.placeholderIcon}>📦</Text>
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {don.title || 'Don supprimé'}
                    </Text>

                    <Text style={styles.cardDate}>
                      🗓️ {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>

                    {don.location && (
                      <Text style={styles.cardLocation}>
                        📍 {don.location}
                      </Text>
                    )}

                    {/* Afficher le nom du demandeur/donneur */}
                    {!isSent && item.user && (
                      <Text style={styles.cardRequester}>
                        👤 Demandeur : {item.user.name || item.user.email}
                      </Text>
                    )}
                    
                    {isSent && don.user && (
                      <Text style={styles.cardRequester}>
                        👤 Donneur : {don.user.name || don.user.email}
                      </Text>
                    )}
                  </View>
                </View>

                {/* BOUTON SUPPRIMER POUR TOUTES LES DEMANDES */}
                <View style={styles.deleteButtonContainer}>
                  <TouchableOpacity
                    style={styles.deleteRequestBtn}
                    onPress={() => handleDeleteRequest(item, activeTab)}
                  >
                    <Text style={styles.deleteRequestBtnText}>
                      🗑️ Supprimer cette demande
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* SENT ACTIONS (pour demandes en attente) */}
                {isSent && isPending && (
                  <View style={styles.actionContainer}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(item)}
                    >
                      <Text style={styles.cancelBtnText}>⏸️ Annuler la demande</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* SENT COMPLETED (already accepted/rejected) */}
                {isSent && !isPending && (
                  <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                      {item.status === 'accepted' 
                        ? '✅ Cette demande a été acceptée' 
                        : '❌ Cette demande a été refusée'}
                    </Text>
                  </View>
                )}

                {/* RECEIVED ACTIONS (pour demandes en attente) */}
                {!isSent && isPending && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReject(item)}
                    >
                      <Text style={styles.rejectBtnText}>❌ Refuser</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleAccept(item)}
                    >
                      <Text style={styles.acceptBtnText}>✅ Accepter</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* RECEIVED COMPLETED */}
                {!isSent && !isPending && (
                  <View style={styles.completedContainer}>
                    <Text style={styles.completedText}>
                      {item.status === 'accepted' 
                        ? '✓ Demande acceptée - Vous pouvez contacter le demandeur' 
                        : '✗ Demande refusée'}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background ,
    paddingTop: 40

  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },

  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },

  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: 14,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },

  tabActive: {
    backgroundColor: colors.card,
  },

  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  tabText: { 
    color: colors.textLight, 
    fontWeight: '600',
    fontSize: 15,
  },

  tabTextActive: { 
    color: colors.primary, 
    fontWeight: '700',
  },

  list: { 
    padding: 16,
    paddingBottom: 20,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  statusBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },

  cardRow: { 
    flexDirection: 'row', 
    padding: 16,
    gap: 12,
  },

  cardImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 12,
  },

  cardImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },

  placeholderIcon: {
    fontSize: 32,
  },

  cardBody: { 
    flex: 1,
    justifyContent: 'center',
  },

  cardTitle: { 
    fontSize: 16, 
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },

  cardDate: { 
    fontSize: 12, 
    color: colors.textLight,
    marginBottom: 4,
  },

  cardLocation: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },

  cardRequester: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },

  deleteButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  deleteRequestBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  deleteRequestBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
  },

  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },

  actionRow: { 
    flexDirection: 'row', 
    gap: 12, 
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  acceptBtn: { 
    backgroundColor: '#d1fae5',
  },

  rejectBtn: { 
    backgroundColor: '#fee2e2',
  },

  acceptBtnText: { 
    color: '#10b981', 
    fontWeight: '700',
    fontSize: 14,
  },

  rejectBtnText: { 
    color: '#ef4444', 
    fontWeight: '700',
    fontSize: 14,
  },

  cancelBtn: {
    paddingVertical: 10,
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  cancelBtnText: { 
    color: '#ef4444', 
    fontWeight: '600',
    fontSize: 14,
  },

  infoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  infoText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },

  completedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  completedText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },

  errorText: { 
    color: '#ef4444', 
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },

  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  }
});

export default RequestsScreen;