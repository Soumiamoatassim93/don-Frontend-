import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  danger: '#ef4444',
};

// CustomDrawerContent.jsx — ajouter dans menuItems
const menuItems = [
  { name: 'Home',            label: 'Accueil',       icon: '🏠' },
  { name: 'MesDons',         label: 'Mes Dons',      icon: '📦' },
  { name: 'Favoris',         label: 'Mes Favoris',   icon: '❤️' },
  { name: 'Requests',        label: 'Demandes',      icon: '📨' },
  { name: 'MessagerieDrawer',label: 'Messagerie',    icon: '💬' },
  { name: 'Profile',         label: 'Mon Profil',    icon: '👤' },
];

const CustomDrawerContent = (props) => {
  const { navigation, state } = props;
  const { user, logout } = useAuth();
  const activeRouteName = state.routeNames[state.index];

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      {/* Profil */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.menuItems}>
        {menuItems.map((item) => {
          const isActive = activeRouteName === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.name)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  profileSection: { padding: 20, paddingTop: 40, alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  userEmail: { fontSize: 13, color: colors.textLight },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16, marginVertical: 8 },
  menuItems: { paddingHorizontal: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2, position: 'relative' },
  menuItemActive: { backgroundColor: '#ede9fe' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  menuLabelActive: { color: colors.primary, fontWeight: '700' },
  activeIndicator: { position: 'absolute', right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 14, borderRadius: 10, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3' },
  logoutIcon: { fontSize: 18, marginRight: 10 },
  logoutText: { fontSize: 15, color: colors.danger, fontWeight: '600' },
});

export default CustomDrawerContent;