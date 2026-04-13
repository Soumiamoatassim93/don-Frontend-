import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';

const colors = {
  background: '#fff',
  overlay: 'rgba(0,0,0,0.3)',
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = SCREEN_WIDTH * 0.65;

const SideMenu = ({ isVisible, closeMenu, navigation, activeScreen }) => {
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -MENU_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const navigateTo = (screen) => {
    closeMenu();
    if (screen !== activeScreen) {
      navigation.navigate(screen);
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      {/* fond sombre */}
      <TouchableOpacity style={styles.overlayTouchable} onPress={closeMenu} />
      
      {/* menu glissant depuis la gauche */}
      <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
        <Text style={styles.title}>Menu</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Home')}>
          <Text style={[styles.menuText, activeScreen === 'Home' && styles.activeText]}>Accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('MesDons')}>
          <Text style={[styles.menuText, activeScreen === 'MesDons' && styles.activeText]}>Mes Dons</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('AddDon')}>
          <Text style={[styles.menuText, activeScreen === 'AddDon' && styles.activeText]}>Ajouter Don</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Profile')}>
          <Text style={[styles.menuText, activeScreen === 'Profile' && styles.activeText]}>Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={closeMenu}>
          <Text style={[styles.menuText, styles.closeText]}>Fermer</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1000,
  },
  overlayTouchable: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  menu: {
    position: 'absolute',  // Position absolue importante
    left: 0,               // Collé au bord gauche
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 30,
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  menuText: {
    fontSize: 18,
    color: colors.text,
  },
  activeText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  closeText: {
    color: 'red',
  },
});

export default SideMenu;