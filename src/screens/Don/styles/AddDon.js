import { StyleSheet } from "react-native";

const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#ffffff',
  border: '#e5e7eb',
  error: '#ef4444',
};
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.card, borderWidth: 1,
    borderColor: colors.border, borderRadius: 10,
    padding: 14, fontSize: 15, color: colors.text,
  },
  textArea: { height: 100 },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 12, marginTop: 4 },
  gpsBtn: { marginTop: 8 },
  gpsBtnText: { color: colors.primary, fontSize: 13 },
  imagePickerBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    borderStyle: 'dashed', padding: 16, alignItems: 'center',
    backgroundColor: colors.card,
  },
  imagePickerText: { color: colors.primary, fontSize: 15 },
  imagePreview: { marginTop: 10 },
  imageWrapper: { position: 'relative', marginRight: 8 },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeImage: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: colors.error, borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  removeImageText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.card,
  },
  categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 14, color: colors.text },
  categoryChipTextSelected: { color: 'white', fontWeight: '600' },
  submitBtn: {
    backgroundColor: colors.primary, padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
