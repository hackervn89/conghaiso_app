import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { SIZES, COLORS } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

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

const TaskDetailScreen = () => {
  const { id, task: taskString } = useLocalSearchParams();
  const initialTask = taskString ? JSON.parse(taskString) : null;

  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [loading, setLoading] = useState(!initialTask); // Only load if no initial task

  const fetchTask = useCallback(() => {
    setLoading(true);
    apiClient.get(`/tasks/${id}`, { params: { _embed: 'assigned_orgs,trackers' } }).then(res => {
      setTask(res.data);
    }).catch(err => {
      Alert.alert("Lỗi", "Không thể tải thông tin công việc.");
    }).finally(() => {
      setLoading(false);
    });
  }, [id]); // <-- Dependency on `task` removed to fix infinite loop

  useEffect(() => {
    fetchTask();
  }, [fetchTask]); // <-- Always fetch to get complete data with description

  const handleAction = (action) => {
    let apiCall;
    let successMessage;

    switch (action) {
        case 'complete':
            apiCall = apiClient.put(`/tasks/${id}/status`, { status: 'completed' });
            successMessage = 'Đã hoàn thành công việc.';
            break;
        case 'delete':
            apiCall = apiClient.delete(`/tasks/${id}`);
            successMessage = 'Đã xóa công việc.';
            break;
        default: return;
    }

    Alert.alert('Xác nhận', `Bạn có chắc muốn ${action === 'delete' ? 'xóa' : 'hoàn thành'} công việc này?`, [
        { text: 'Hủy' },
        { text: 'OK', onPress: () => {
            setLoading(true);
            apiCall.then(() => {
                Alert.alert('Thành công', successMessage);
                router.back();
            }).catch(err => {
                Alert.alert('Lỗi', err.response?.data?.message || 'Thao tác thất bại.');
            }).finally(() => setLoading(false));
        }}
    ]);
  };

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primaryRed} style={styles.centered} />;
  }

  if (!task) {
    return <View style={styles.centered}><Text>Không tìm thấy công việc.</Text></View>;
  }

  const statusInfo = getDynamicStatus(task);

  return (
    <View style={{flex: 1}}>
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{task.title}</Text>
                <View style={[styles.statusBadge, statusInfo.style]}>
                    <Text style={{color: statusInfo.style.color, fontWeight: 'bold'}}>{statusInfo.text}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
                <InfoRow icon="flag-outline" label="Mức độ" value={priorityLabels[task.priority]} />
                <InfoRow icon="business-outline" label="Đơn vị chủ trì" value={(task.assigned_orgs || []).map(o => o.org_name).join(', ') || 'N/A'} />
                <InfoRow icon="person-outline" label="Người theo dõi" value={(task.trackers || []).map(t => t.full_name).join(', ') || 'N/A'} />
                <InfoRow icon="calendar-outline" label="Hạn chót" value={task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'N/A'} />
                <InfoRow icon="document-text-outline" label="Văn bản giao việc" value={task.document_ref || 'N/A'} />
                 {task.is_direct_assignment && <InfoRow icon="hand-right-outline" label="Loại" value="Giao trực tiếp" />}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mô tả</Text>
                <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>{task.description || 'Không có mô tả.'}</Text>
                </View>
            </View>
            
            {/* TODO: Display documents */}

        </ScrollView>
        <View style={styles.actionFooter}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/task/create?taskId=${id}`)}>
                <Ionicons name="pencil-outline" size={24} color={COLORS.primaryRed} />
                <Text style={styles.actionText}>Sửa</Text>
            </TouchableOpacity>
            {task.status !== 'completed' && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('complete')}>
                    <Ionicons name="checkmark-done-outline" size={24} color={COLORS.success} />
                    <Text style={[styles.actionText, {color: COLORS.success}]}>Hoàn thành</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('delete')}>
                <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                <Text style={[styles.actionText, {color: COLORS.error}]}>Xóa</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
};

const InfoRow = ({icon, label, value}) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={18} color={COLORS.primaryRed} style={{width: 20}} />
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue} selectable>{value}</Text>
    </View>
)

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { backgroundColor: COLORS.white, padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryRed, textAlign: 'center', marginBottom: 10 },
  statusBadge: { borderRadius: SIZES.radius, paddingHorizontal: 10, paddingVertical: 5 },
  section: { 
    backgroundColor: COLORS.white, 
    padding: SIZES.padding, 
    borderTopWidth: 8, 
    borderTopColor: COLORS.lightGray 
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: SIZES.padding, color: COLORS.primaryRed },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    paddingVertical: 14, // Reduced padding
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.lightGray 
  },
  infoLabel: { 
    fontSize: 15, // Reduced font size
    marginLeft: 10, 
    fontWeight: 'bold', 
    color: COLORS.primaryRed, 
    width: 130 // Fixed width for alignment
  },
  infoValue: { 
    fontSize: 15, // Reduced font size
    marginLeft: 5, 
    color: COLORS.darkText, 
    flex: 1 
  },
  descriptionContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  description: { 
    fontSize: 16, 
    color: COLORS.darkText, 
    lineHeight: 24 
  },
  actionFooter: {
      flexDirection: 'row', 
      justifyContent: 'space-around',
      padding: SIZES.padding,
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.lightGray
  },
  actionButton: {
      alignItems: 'center'
  },
  actionText: {
      marginTop: 4,
      color: COLORS.primaryRed,
      fontWeight: '600'
  }
});

export default TaskDetailScreen;
