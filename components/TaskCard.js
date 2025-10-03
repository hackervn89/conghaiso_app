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
                statusInfo = { text: 'Còn hạn', style: { backgroundColor: '#DBEAFE', color: '#1E40AF' } };
            }
        } else {
             statusInfo = { text: 'Thường xuyên', style: { backgroundColor: '#E5E7EB', color: '#1F2937' } };
        }
    }
    return statusInfo;
};

const priorityLabels = {
    normal: 'Thông thường',
    important: 'Quan trọng',
    urgent: 'Khẩn',
};

const TaskCard = ({ task, onPress }) => {
  const statusInfo = getDynamicStatus(task);

  return (
    <TouchableOpacity onPress={onPress} style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{task.title}</Text>
        {statusInfo && (
            <View style={[styles.statusBadge, statusInfo.style]}>
                <Text style={{color: statusInfo.style.color, fontSize: 12, fontWeight: 'bold'}}>{statusInfo.text}</Text>
            </View>
        )}
      </View>
      
      <View style={styles.cardBody}>
        <InfoRow icon="business-outline" text={task.assigned_orgs?.map(o => o.org_name).join(', ') || 'Chưa giao đơn vị'} />
        <InfoRow icon="person-outline" text={task.trackers?.map(t => t.full_name).join(', ') || 'Chưa có người theo dõi'} />
        <InfoRow icon="flag-outline" text={`Ưu tiên: ${priorityLabels[task.priority] || 'Thường'}`} />
        <InfoRow icon="calendar-outline" text={`Hạn: ${task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'N/A'}`} isOverdue={statusInfo?.text === 'Trễ hạn'} />
      </View>
    </TouchableOpacity>
  );
};

const InfoRow = ({icon, text, isOverdue}) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={16} color={isOverdue ? COLORS.error : COLORS.primaryRed} />
        <Text style={[styles.infoText, isOverdue && styles.overdueText]} numberOfLines={1}>{text}</Text>
    </View>
)

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18, // Slightly larger title
    fontWeight: 'bold',
    color: COLORS.darkText,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    borderRadius: SIZES.radius,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15, // Slightly larger for readability
    color: COLORS.darkText, // Darker text for better contrast
  },
  overdueText: {
      color: COLORS.error,
      fontWeight: 'bold'
  }
});

export default TaskCard;