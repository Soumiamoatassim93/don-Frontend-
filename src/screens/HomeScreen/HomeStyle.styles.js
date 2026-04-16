import { StyleSheet } from 'react-native';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  available: '#10b981',
  favBg: '#fff1f2',
  favColor: '#e11d48',
  reqBg: '#ede9fe',
  reqColor: '#6d28d9',
};
export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  header: { 
    backgroundColor: colors.card, 
    paddingHorizontal: 16, 
    paddingTop: 20, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  menuBtn: { 
    marginRight: 10 
  },
  menuIcon: { 
    fontSize: 24, 
    color: colors.primary 
  },
  greeting: { 
    flex: 1, 
    fontSize: 17, 
    fontWeight: '600', 
    color: colors.text 
  },
  msgBtn: { 
    marginLeft: 8 
  },
  msgIcon: { 
    fontSize: 22 
  },
  subtitle: { 
    fontSize: 12, 
    color: colors.textLight, 
    marginBottom: 10 
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f3f4f6', 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    marginBottom: 10 
  },
  searchIcon: { 
    fontSize: 14, 
    marginRight: 8 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 13, 
    color: colors.text, 
    padding: 0 
  },
  categoryScroll: { 
    marginBottom: 4 
  },
  categoryContent: { 
    gap: 6, 
    paddingBottom: 4 
  },
  catChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    backgroundColor: colors.card 
  },
  catChipActive: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  catText: { 
    fontSize: 12, 
    fontWeight: '500', 
    color: colors.textLight 
  },
  catTextActive: { 
    color: '#fff' 
  },
  list: { 
    padding: 10, 
    paddingBottom: 80 
  },
  row: { 
    justifyContent: 'space-between' 
  },
  card: { 
    backgroundColor: colors.card, 
    borderRadius: 12, 
    marginBottom: 10, 
    width: '48.5%', 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.07, 
    shadowRadius: 4, 
    elevation: 2 
  },
  newBadge: { 
    position: 'absolute', 
    top: 6, 
    left: 6, 
    zIndex: 10, 
    backgroundColor: colors.primary, 
    borderRadius: 10, 
    paddingHorizontal: 6, 
    paddingVertical: 2 
  },
  newBadgeText: { 
    color: '#fff', 
    fontSize: 9, 
    fontWeight: '600' 
  },
  imageGallery: { 
    height: 100 
  },
  donImage: { 
    width: 160, 
    height: 100 
  },
  imagePlaceholder: { 
    height: 90, 
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imagePlaceholderText: { 
    fontSize: 28 
  },
  cardContent: { 
    padding: 8 
  },
  cardTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: colors.text, 
    marginBottom: 3 
  },
  addressRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  addressIcon: { 
    fontSize: 10, 
    marginRight: 2 
  },
  addressText: { 
    fontSize: 10, 
    color: colors.textLight, 
    flex: 1 
  },
  cardMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 6 
  },
  badge: { 
    backgroundColor: '#d1fae5', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 10 
  },
  badgeText: { 
    color: colors.available, 
    fontSize: 9, 
    fontWeight: '500' 
  },
  cardDate: { 
    fontSize: 9, 
    color: colors.textLight 
  },
  cardActions: { 
    flexDirection: 'row', 
    gap: 5 
  },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 3, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  favBtn: { 
    backgroundColor: '#fff1f2', 
    borderWidth: 1, 
    borderColor: '#fecdd3' 
  },
  reqBtn: { 
    backgroundColor: '#ede9fe', 
    borderWidth: 1, 
    borderColor: '#ddd6fe' 
  },
  actionText: { 
    fontSize: 10, 
    fontWeight: '500' 
  },
  errorText: { 
    color: 'red', 
    marginBottom: 12 
  },
  retryBtn: { 
    backgroundColor: colors.primary, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  retryText: { 
    color: 'white', 
    fontWeight: '600' 
  },
  emptyText: { 
    color: colors.textLight, 
    fontSize: 15 
  },
  fab: { 
    position: 'absolute', 
    bottom: 24, 
    right: 20, 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 6 
  },
  fabText: { 
    color: 'white', 
    fontSize: 26, 
    fontWeight: 'bold', 
    lineHeight: 28 
  },

// screens/HomeScreen/HomeStyle.styles.js
// Ajoutez ces styles à votre fichier existant

badge: {
  position: 'absolute',
  top: -5,
  right: -8,
  backgroundColor: '#ef4444',
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 4,
},
badgeText: {
  color: '#fff',
  fontSize: 10,
  fontWeight: 'bold',
},
// screens/HomeScreen/HomeStyle.styles.js
// Ajoutez ces styles à votre fichier existant

headerIcons: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},

notifBadge: {
  position: 'absolute',
  top: -5,
  right: -8,
  backgroundColor: '#ef4444',
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 4,
},

notifBadgeText: {
  color: '#fff',
  fontSize: 10,
  fontWeight: 'bold',
},
});
