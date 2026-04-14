import { StyleSheet } from "react-native";
const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb'};
export const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  desc: { fontSize: 14, color: '#555', marginBottom: 5 },
  address: { fontSize: 12, color: '#6366f1', marginBottom: 4 },
  status: { fontSize: 12, color: '#888', marginBottom: 10 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  editBtn: { backgroundColor: '#6366f1', padding: 8, borderRadius: 6 },
  deleteBtn: { backgroundColor: '#ef4444', padding: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#555' },
});
