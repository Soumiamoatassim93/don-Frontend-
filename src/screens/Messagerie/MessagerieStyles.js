// screens/Messagerie/MessagerieStyles.js
import { StyleSheet } from 'react-native';

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  myBubble: '#6366f1',
  otherBubble: '#e5e7eb',
  danger: '#ef4444',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background ,paddingTop:30},
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header liste
  header: { backgroundColor: colors.card, padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },

  // Conversation item
  convItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  convAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  convAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.card },
  convBody: { flex: 1 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 15, color: colors.text },
  convNameBold: { fontWeight: '700' },
  convTime: { fontSize: 12, color: colors.textLight },
  convBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convPreview: { fontSize: 13, color: colors.textLight, flex: 1 },
  convPreviewBold: { color: colors.text, fontWeight: '600' },
  unreadBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubText: { fontSize: 14, color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },

  // Don banner
  donBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ede9fe', padding: 10, paddingHorizontal: 16, gap: 8 },
  donBannerIcon: { fontSize: 16 },
  donBannerText: { fontSize: 13, color: colors.primary, fontWeight: '500', flex: 1 },

  // Messages
  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  msgAvatarText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bubble: { maxWidth: '75%', padding: 10, paddingHorizontal: 14, borderRadius: 18 },
  bubbleMe: { backgroundColor: colors.myBubble, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.otherBubble, borderBottomLeftRadius: 4 },
  bubbleFailed: { opacity: 0.6 },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: colors.textLight, marginTop: 3, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },

  // Input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnIcon: { color: '#fff', fontSize: 16 },

  // Empty chat
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 ,paddingBottom:50},
  emptyChatText: { fontSize: 15, color: colors.textLight },
});