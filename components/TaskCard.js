import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { SIZES, COLORS } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';

const getStatusStyle = (status) => {
  switch (status) {
    case 'Mới':
      return { backgroundColor: COLORS.info, color: COLORS.white };
    case 'Đang thực hiện':
      return { backgroundColor: COLORS.warning, color: COLORS.white };
    case 'Hoàn thành':
      return { backgroundColor: COLORS.success, color: COLORS.white };
    case 'Quá hạn':
      return { backgroundColor: COLORS.error, color: COLORS.white };
    default:
      return { backgroundColor: COLORS.darkGray, color: COLORS.white };
  }
};

const TaskCard = ({ task, onPress }) => {
  const statusStyle = getStatusStyle(task.status);

  return (
    <TouchableOpacity onPress={onPress} style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{task.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{task.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.darkGray} />
          <Text style={styles.infoText}>Người thực hiện: {task.assignee?.full_name || 'Chưa giao'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.darkGray} />
          <Text style={styles.infoText}>Hạn chót: {new Date(task.due_date).toLocaleDateString('vi-VN')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.base,
  },
  cardTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.darkText,
    flex: 1, // Allow title to take up available space
    marginRight: 10,
  },
  statusBadge: {
    borderRadius: SIZES.radius / 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 'auto', // Push badge to the right
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginTop: SIZES.padding / 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.darkGray,
  },
});

export default TaskCard;
