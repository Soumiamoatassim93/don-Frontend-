// screens/ChatRoomScreen/styles.js
import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  myBubble: '#6366f1',
  otherBubble: '#e5e7eb',
};

export const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: 50, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  keyboardView: { flex: 1 },
  innerContainer: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 88 },
  messageRow: { marginBottom: 12, flexDirection: 'row' },
  myMessage: { justifyContent: 'flex-end' },
  theirMessage: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 18 },
  myBubble: { backgroundColor: colors.myBubble, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: colors.otherBubble, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15 },
  myMessageText: { color: '#fff' },
  time: { fontSize: 10, color: colors.textLight, marginTop: 4 },
  inputContainer: {
    flexDirection: 'row', padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb'
  },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center'
  },
  disabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontSize: 18 },
  emptyMessages: { padding: 40, alignItems: 'center' },
});