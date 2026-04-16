// screens/ConversationsList/styles.js
import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  clearButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    marginTop: 50,
  },
  clearButtonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  conversationInfo: { flex: 1 },
  conversationName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  lastMessage: { fontSize: 14, color: colors.textLight },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubText: { fontSize: 14, color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },
});