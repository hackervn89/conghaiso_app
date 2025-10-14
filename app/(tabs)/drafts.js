import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SIZES, COLORS } from '../../constants/styles';
import apiClient from '../../api/client';
import DraftCard from '../../components/DraftCard'; // Import component mới
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const DraftsScreen = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchDrafts = async () => {
    try {
      const response = await apiClient.get('/drafts'); // API endpoint mới
      setDrafts(response.data.data); // Giả sử API trả về { data: [...] }
    } catch (err) {
      console.error("Lỗi khi tải danh sách dự thảo:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDrafts();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDrafts();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primaryRed} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={drafts}
        renderItem={({ item }) => (
          <DraftCard 
            draft={item} 
            onPress={() => router.push(`/draft/${item.id}`)} // Đường dẫn này đã đúng, không cần sửa
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<Text style={styles.title}>Góp ý Dự thảo</Text>}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{color: COLORS.darkGray}}>Không có dự thảo nào.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryRed]} />
        }
        contentContainerStyle={{ padding: SIZES.padding }}
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/draft/create')} // Đường dẫn này đã đúng, không cần sửa
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  title: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.primaryRed, marginBottom: SIZES.padding },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 200 },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: COLORS.primaryRed, borderRadius: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 1, height: 2 } },
});

export default DraftsScreen;