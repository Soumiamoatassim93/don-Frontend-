
import {StyleSheet} from 'react-native';
const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#fff'
};
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: colors.background,
  },
  list: { 
    padding: 10, 
    paddingBottom: 30,
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
  newBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  removeFavBtn: { 
    position: 'absolute', 
    top: 6, 
    right: 6, 
    zIndex: 10, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 14, 
    width: 28, 
    height: 28, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  removeFavIcon: { fontSize: 14 },
  imageGallery: { height: 100 },
  donImage: { width: 160, height: 100 },
  imageErrorContainer: { 
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imageErrorText: { fontSize: 32 },
  imagePlaceholder: { 
    height: 90, 
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imagePlaceholderText: { fontSize: 28 },
  cardContent: { padding: 8 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 3 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  addressIcon: { fontSize: 10, marginRight: 2 },
  addressText: { fontSize: 10, color: colors.textLight, flex: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  badge: { backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: colors.available, fontSize: 9, fontWeight: '500' },
  badgeUnavailable: { backgroundColor: '#f3f4f6' },
  badgeTextUnavailable: { color: colors.textLight },
  cardDate: { fontSize: 9, color: colors.textLight },
  detailBtn: { backgroundColor: '#ede9fe', borderRadius: 8, paddingVertical: 5, alignItems: 'center' },
  detailBtnText: { fontSize: 11, color: colors.reqColor, fontWeight: '600' },
  empty: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 100 
  },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubText: { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },
  errorText: { color: 'red', marginBottom: 12 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: 'white', fontWeight: '600' },
});
