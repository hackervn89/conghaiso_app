import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { SIZES, COLORS } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';

// Logic to determine task status dynamically, copied from web version
const getDynamicStatus = (task) => {
    if (!task) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    const completedAt = task.completed_at ? new Date(task.completed_at) : null;

    let statusInfo = {
        text: 'Mới',
        style: { backgroundColor: '#E5E7EB', color: '#1F2937' }
    };

    if (task.status === 'completed') {
        if (completedAt && dueDate && completedAt > dueDate) {
            statusInfo = { text: 'Hoàn thành trễ hạn', style: { backgroundColor: '#FEF3C7', color: '#92400E' } };
        } else {
            statusInfo = { text: 'Hoàn thành đúng hạn', style: { backgroundColor: '#D1FAE5', color: '#065F46' } };
        }
    } else {
        if (dueDate) {
            if (now > dueDate) {
                statusInfo = { text: 'Trễ hạn', style: { backgroundColor: '#FEE2E2', color: '#991B1B' } };
            } else {
                // YÊU CẦU: Đổi sang màu xanh cho đồng bộ
                statusInfo = { text: 'Còn hạn', style: { backgroundColor: '#D1FAE5', color: '#065F46' } };
            }
        } else {
             statusInfo = { text: 'Thường xuyên', style: { backgroundColor: '#E5E7EB', color: '#1F2937' } };
        }
    }
    return statusInfo;
};

const TaskCard = ({ task, onPress }) => {
  if (!task) return null;
  const statusInfo = getDynamicStatus(task);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.cardContainer}
      activeOpacity={0.7}
    >
      <Text style={styles.cardTitle} numberOfLines={2}>
        {task.title}
      </Text>

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={16} color={COLORS.darkGray} />
          <Text style={[styles.dateText, statusInfo?.text === 'Trễ hạn' && styles.overdueText]}>
            Hạn chót: {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Không có hạn'}
          </Text>
        </View>

        {statusInfo && (
          <View style={[styles.statusBadge, statusInfo.style]}>
            <Text style={{ color: statusInfo.style.color, fontSize: 11, fontWeight: 'bold' }}>
              {statusInfo.text}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkText,
    marginBottom: 12,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginLeft: 6,
  },
  overdueText: {
      color: COLORS.error,
      fontWeight: 'bold'
  }
});

export default TaskCard;