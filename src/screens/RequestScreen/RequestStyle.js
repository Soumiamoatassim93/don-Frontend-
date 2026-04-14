
import { StyleSheet } from 'react-native';
const colors = {
  primary: '#6366f1',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  card: '#fff'
};

// ── STYLES ─────────────────────────────────────────
export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background ,
    paddingBottom:50
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
  backBtn: { 
    marginRight: 10 
  },
  backIcon: { 
    fontSize: 24, 
    color: colors.primary 
  },
  headerTitle: { 
    flex: 1, 
    fontSize: 20, 
    fontWeight: '600', 
    color: colors.text 
  },
  tabs: { 
    flexDirection: 'row', 
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  tab: { 
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: colors.primary
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight
  },
  tabTextActive: {
    color: colors.primary
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
  cardImage: { 
    width: '100%', 
    height: 120,
    resizeMode: 'cover'
  },
  cardImagePlaceholder: { 
    height: 120, 
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { 
    fontSize: 12, 
    color: colors.textLight 
  },
  statusBadge: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12,
    zIndex: 10
  },
  statusBadgeText: { 
    fontSize: 10, 
    fontWeight: '600' 
  },
  cardContent: { 
    padding: 10 
  },
  cardTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: colors.text, 
    marginBottom: 4 
  },
  cardAddress: { 
    fontSize: 11, 
    color: colors.textLight, 
    marginBottom: 4 
  },
  senderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4,
    gap: 6
  },
  senderAvatar: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  senderAvatarText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  senderName: { 
    fontSize: 11, 
    color: colors.text, 
    flex: 1 
  },
  cardDate: { 
    fontSize: 10, 
    color: colors.textLight, 
    marginBottom: 8 
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 6,
    marginBottom: 8
  },
  actionBtn: { 
    flex: 1, 
    paddingVertical: 6, 
    borderRadius: 6, 
    alignItems: 'center' 
  },
  acceptBtn: { 
    backgroundColor: colors.available 
  },
  acceptBtnText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600' 
  },
  rejectBtn: { 
    backgroundColor: colors.rejected 
  },
  rejectBtnText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600' 
  },
  cancelBtn: { 
    backgroundColor: '#f59e0b', 
    paddingVertical: 6, 
    borderRadius: 6, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cancelBtnText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600' 
  },
  deleteBtn: { 
    backgroundColor: '#fee2e2', 
    paddingVertical: 6, 
    borderRadius: 6, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#fecaca' 
  },
  deleteBtnText: { 
    color: colors.rejected, 
    fontSize: 11, 
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
    fontSize: 15, 
    textAlign: 'center' 
  },
  trackBtn: {
  backgroundColor: '#6366f1',
  paddingVertical: 8,
  borderRadius: 6,
  alignItems: 'center',
  marginTop: 4,
},
trackBtnText: {
  color: '#ffffff',
  fontSize: 11,
  fontWeight: '600',
},
viewDonBtn: {
  backgroundColor: '#6366f1',
  paddingVertical: 8,
  borderRadius: 6,
  alignItems: 'center',
  marginTop: 8,
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 6,
},
viewDonBtnText: {
  color: '#ffffff',
  fontSize: 11,
  fontWeight: '600',
},
acceptedMessage: {
  color: '#10b981',
},
refusedMessage: {
  color: '#ef4444',
},
});
