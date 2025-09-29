import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SIZES, COLORS } from '../../constants/styles';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import TaskCard from '../../components/TaskCard';

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchTasks = async () => {
    try {
      setError(null);
      // Assuming /tasks endpoint exists
      const response = await apiClient.get('/tasks');
      setTasks(response.data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách công việc:", err);
      setError("Không thể tải danh sách công việc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTasks();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, []);
  
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primaryRed} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh}><Text style={{color: COLORS.primaryRed}}>Thử lại</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TaskCard 
            task={item} 
            onPress={() => router.push(`/task/${item.task_id}`)} 
          />
        )}
        keyExtractor={(item) => item.task_id.toString()}
        ListHeaderComponent={<Text style={styles.title}>Danh sách công việc</Text>}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>Không có công việc nào.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryRed]} />
        }
      />
      
      {(user?.role === 'Admin' || user?.role === 'Secretary') && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/task/create')}
        >
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.primaryRed,
    marginVertical: SIZES.padding,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.body,
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
    backgroundColor: COLORS.primaryRed,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 2 },
  },

});
