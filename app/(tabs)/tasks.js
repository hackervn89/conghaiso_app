import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SIZES, COLORS } from '../../constants/styles';
import apiClient from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import TaskCard from '../../components/TaskCard';
import TaskCardSkeleton from '../../components/TaskCardSkeleton'; // YÊU CẦU: Import skeleton

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // PHẦN 1: Tối ưu hóa bộ lọc
  const [activeTab, setActiveTab] = useState('uncompleted'); // 'uncompleted', 'completed', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Logic debounce cho thanh tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchTasks = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) {
      setLoading(true);
    }
    try {
      let dynamicStatus;
      if (activeTab === 'uncompleted') {
        dynamicStatus = ['pending', 'doing', 'overdue'];
      } else if (activeTab === 'completed') {
        dynamicStatus = ['completed_on_time', 'completed_late'];
      }

      const params = {
        dynamicStatus: dynamicStatus,
        searchTerm: debouncedSearchTerm || undefined,
      };

      const response = await apiClient.get('/tasks', { params });
      // PHẦN 1.3: Sửa lỗi xử lý dữ liệu
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách công việc:", err);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, debouncedSearchTerm]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks(true);
  }, [fetchTasks]);

  // PHẦN 2.2: Skeleton Loading
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <Text style={[styles.tab, styles.tabText]}>Chưa hoàn thành</Text>
          <Text style={[styles.tab, styles.tabText]}>Đã hoàn thành</Text>
          <Text style={[styles.tab, styles.tabText]}>Tất cả</Text>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Tìm kiếm theo tiêu đề công việc..." editable={false} />
        </View>
        <View style={{ paddingHorizontal: SIZES.padding, paddingTop: SIZES.padding }}>
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerRight: null }} />

      {/* PHẦN 1.1: Giao diện Tab trạng thái */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'uncompleted' && styles.activeTab]} onPress={() => setActiveTab('uncompleted')}>
          <Text style={[styles.tabText, activeTab === 'uncompleted' && styles.activeTabText]}>Chưa hoàn thành</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'completed' && styles.activeTab]} onPress={() => setActiveTab('completed')}>
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Đã hoàn thành</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.activeTab]} onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* PHẦN 1.2: Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tiêu đề công việc..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={COLORS.darkGray}
        />
      </View>

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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primaryRed,
  },
  tabText: {
    fontSize: 15,
    color: COLORS.darkGray,
  },
  activeTabText: {
    color: COLORS.primaryRed,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: SIZES.radius,
    margin: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  fab: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    right: 30, bottom: 30, backgroundColor: COLORS.primaryRed, borderRadius: 30, elevation: 8,
  }
});