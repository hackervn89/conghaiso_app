import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SIZES, COLORS } from '../../constants/styles';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import TaskCard from '../../components/TaskCard';
import TaskFilterModal from '../../components/TaskFilterModal'; // Import bộ lọc mới

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  // Sửa state của filter để hỗ trợ nhiều orgIds
  const [filters, setFilters] = useState({ statuses: [], orgIds: [] });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        // Sửa lại tên tham số cho phù hợp với API
        statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
        orgIds: filters.orgIds.length > 0 ? filters.orgIds : undefined,
      };
      const response = await apiClient.get('/tasks', { params });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách công việc:", err);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);
  
  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color={COLORS.primaryRed} style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
        <Stack.Screen options={{ 
            // Sử dụng header chung từ _layout.js, không cần định nghĩa lại ở đây
            // headerTitle: 'Quản lý công việc',
            headerRight: () => (
                <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ marginRight: 15 }}>
                    <Ionicons name="filter-outline" size={26} color={COLORS.primaryRed} />
                </TouchableOpacity>
            )
        }} />
        {/* Sử dụng component Modal mới */}
        <Modal visible={isFilterModalVisible} animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
            <TaskFilterModal
                visible={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                onApply={setFilters}
                initialFilters={filters}
            />
        </Modal>

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TaskCard 
            task={item} 
            onPress={() => router.push({ pathname: `/task/${item.task_id}`, params: { task: JSON.stringify(item) } })} 
          />
        )}
        keyExtractor={(item) => item.task_id.toString()}
        contentContainerStyle={{padding: SIZES.padding}}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>Không có công việc nào phù hợp.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryRed]} />
        }
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/task/create')}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  fab: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    right: 30, bottom: 30, backgroundColor: COLORS.primaryRed, borderRadius: 30, elevation: 8,
  },
  // Modal Styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalTitle: { fontSize: SIZES.h2, fontWeight: 'bold' },
  modalContent: { padding: SIZES.padding },
  filterSectionTitle: { fontSize: SIZES.h3, fontWeight: 'bold', marginTop: 10, marginBottom: 15 },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.mediumGray, borderRadius: SIZES.radius, justifyContent: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkboxLabel: { marginLeft: 15, fontSize: 16 },
  applyButton: { backgroundColor: COLORS.primaryRed, padding: 15, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 30 },
  applyButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});