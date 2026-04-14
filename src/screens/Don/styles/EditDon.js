import { StyleSheet } from 'react-native';

const colors = {
  primary: '#6366f1',
  text: '#111827'};
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#111827' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 10 },
  textArea: { height: 100 },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginBottom: 10 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', marginBottom: 5 },
  categoryChipSelected: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  categoryChipText: { fontSize: 14, color: '#111827' },
  categoryChipTextSelected: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
});