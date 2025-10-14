import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SIZES, COLORS } from '../constants/styles';

const statusStyles = {
  pending: {
    backgroundColor: '#DBEAFE', // blue-100
    color: '#1E40AF', // blue-800
    text: 'Chờ góp ý',
  },
  in_review: {
    backgroundColor: '#FEF3C7', // amber-100
    color: '#92400E', // amber-800
    text: 'Đang góp ý',
  },
  approved: {
    backgroundColor: '#D1FAE5', // green-100
    color: '#065F46', // green-800
    text: 'Đã duyệt',
  },
  rejected: {
    backgroundColor: '#FEE2E2', // red-100
    color: '#991B1B', // red-800
    text: 'Đã từ chối',
  },
};

const DraftCard = ({ draft, onPress }) => {
  const status = statusStyles[draft.status] || statusStyles.pending;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{draft.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={16} color={COLORS.darkGray} />
        <Text style={styles.infoText}>Người tạo: {draft.creator?.fullName || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.darkGray} />
        <Text style={styles.infoText}>Ngày tạo: {new Date(draft.createdAt).toLocaleDateString('vi-VN')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: SIZES.padding, marginBottom: SIZES.padding, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: SIZES.h3, fontWeight: 'bold', color: COLORS.darkText, flex: 1, marginRight: 10 },
  statusBadge: { borderRadius: SIZES.radius, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  infoText: { marginLeft: 8, color: COLORS.darkGray, fontSize: 14 },
});

export default DraftCard;