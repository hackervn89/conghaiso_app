import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SIZES, COLORS } from '../../constants/styles';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import TaskCard from '../../components/TaskCard';
import TaskFilterBar from '../../components/TaskFilterBar'; // Import thanh lọc mới

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  // CẬP NHẬT: Đặt trạng thái mặc định là "Chưa hoàn thành" khi mở tab.
  const [filters, setFilters] = useState({ 
    dynamicStatus: ['pending', 'doing', 'overdue'], 
    orgId: null 
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        // ĐƠN GIẢN HÓA: Xóa bỏ logic .join(',') thủ công.
        // Gửi thẳng mảng `dynamicStatus` hoặc `undefined` nếu mảng rỗng.
        // `apiClient` sẽ tự động chuyển đổi mảng thành chuỗi "a,b,c" nhờ `paramsSerializer`.
        dynamicStatus: filters.dynamicStatus?.length > 0 ? filters.dynamicStatus : undefined,
        orgId: filters.orgId ? filters.orgId : undefined,
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

  const handleClearAllFilters = () => {
    setFilters({ dynamicStatus: [], orgId: null });
  };

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color={COLORS.primaryRed} style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerRight: () => (
          <TouchableOpacity onPress={handleClearAllFilters} style={{ marginRight: 15 }}>
            <Text style={{ color: COLORS.primaryRed, fontSize: 16 }}>Xóa lọc</Text>
          </TouchableOpacity>
        )
      }} />

      <TaskFilterBar filters={filters} onFilterChange={setFilters} />

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TaskCard 
            task={item} 
            onPress={() => router.push({ pathname: `/task/${item.task_id}`, params: { task: JSON.stringify(item) } })} 
          />
        )}
        keyExtractor={(item) => item.task_id.toString()}
        contentContainerStyle={{ paddingTop: SIZES.padding, paddingHorizontal: SIZES.padding }}
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
  }
});