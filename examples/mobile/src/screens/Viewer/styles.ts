import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F12',
    paddingHorizontal: 16,
  },

  screenTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F2F2F2',
    marginBottom: 16,
  },

  /* -------- actions -------- */

  actions: {
    gap: 10,
    marginBottom: 20,
  },

  actionButton: {
    backgroundColor: '#1A1C22',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  actionText: {
    color: '#EDEEF3',
    fontWeight: '500',
    fontSize: 14,
  },

  /* -------- cards -------- */

  cards: {
    gap: 20,
  },

  cardBlock: {
    gap: 8,
  },

  blockTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },

  viewerCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#1A1C22',
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2D6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarLetter: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  viewerMeta: {
    flex: 1,
    gap: 4,
  },

  viewerName: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },

  viewerEmail: {
    color: '#9CA3AF',
    fontSize: 13,
  },

  viewerBio: {
    color: '#D1D5DB',
    fontSize: 13,
    marginTop: 6,
  },

  emptyCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#1A1C22',
    alignItems: 'center',
  },

  emptyText: {
    color: '#9CA3AF',
  },
});
