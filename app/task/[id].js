import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../../api/client';
import { SIZES, COLORS, globalStyles } from '../../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../../../context/AuthContext';

const TaskDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/tasks/${id}`);
      setTask(response.data);
      setStatus(response.data.status);
    } catch (err) {
      setError('Không thể tải thông tin công việc.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      await apiClient.put(`/tasks/${id}/status`, { status });
      Alert.alert('Thành công', 'Đã cập nhật trạng thái công việc.');
      router.back();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isAllowedToUpdate = () => {
      // Allow assignee or admin to update status
      return user?.user_id === task?.assignee_id || user?.role === 'Admin';
  }

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primaryRed} style={styles.centered} />;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!task) {
    return <View style={styles.centered}><Text>Không tìm thấy công việc.</Text></View>;
  }

  const statusItems = [
    { label: 'Mới', value: 'Mới' },
    { label: 'Đang thực hiện', value: 'Đang thực hiện' },
    { label: 'Hoàn thành', value: 'Hoàn thành' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color={COLORS.darkGray} />
          <Text style={styles.infoLabel}>Người thực hiện:</Text>
          <Text style={styles.infoValue}>{task.assignee?.full_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.darkGray} />
          <Text style={styles.infoLabel}>Hạn chót:</Text>
          <Text style={styles.infoValue}>{new Date(task.due_date).toLocaleDateString('vi-VN')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="flag-outline" size={20} color={COLORS.darkGray} />
          <Text style={styles.infoLabel}>Trạng thái hiện tại:</Text>
          <Text style={styles.infoValue}>{task.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mô tả</Text>
        <Text style={styles.description}>{task.description || 'Không có mô tả.'}</Text>
      </View>

      {isAllowedToUpdate() && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cập nhật trạng thái</Text>
          <View style={globalStyles.input}>
            <RNPickerSelect
              onValueChange={(value) => setStatus(value)}
              items={statusItems}
              value={status}
              placeholder={{}}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => <Ionicons name="chevron-down" size={24} color={COLORS.darkGray} />}
            />
          </View>
          <TouchableOpacity 
            style={[globalStyles.button, { marginTop: 16 }]} 
            onPress={handleUpdateStatus} 
            disabled={isUpdating}
          >
            {isUpdating ? 
              <ActivityIndicator color={COLORS.white} /> : 
              <Text style={globalStyles.buttonText}>CẬP NHẬT</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.error, fontSize: 16 },
  header: { backgroundColor: COLORS.white, padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.mediumGray },
  title: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.primaryRed },
  section: { backgroundColor: COLORS.white, marginTop: SIZES.base, padding: SIZES.padding },
  sectionTitle: { fontSize: SIZES.h3, fontWeight: 'bold', marginBottom: SIZES.padding },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.base },
  infoLabel: { fontSize: 16, marginLeft: 10, fontWeight: '500' },
  infoValue: { fontSize: 16, marginLeft: 5, color: COLORS.darkGray },
  description: { fontSize: 16, color: COLORS.darkText, lineHeight: 24 },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, height: '100%', color: COLORS.darkText },
  inputAndroid: { fontSize: 16, height: '100%', color: COLORS.darkText },
  iconContainer: { top: 12, right: 15 },
});

export default TaskDetailScreen;
