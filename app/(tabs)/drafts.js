import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SIZES, COLORS } from '../../constants/styles';
import apiClient from '../../api/client';
import DraftCard from '../../components/DraftCard'; // Import component mới

const DraftsScreen = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchDrafts = async () => {
    try {
      const response = await apiClient.get('/drafts');
      setDrafts(Array.isArray(response.data) ? response.data : []);
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
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{color: COLORS.darkGray}}>Không có dự thảo nào.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryRed]} />
        }
        contentContainerStyle={{ paddingTop: SIZES.padding }} // Giữ padding top
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white }, // Đổi nền thành trắng để đồng bộ
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 200 },
});

export default DraftsScreen;