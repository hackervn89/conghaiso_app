import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SIZES, COLORS } from '../../constants/styles';
import apiClient from '../../api/client';
import MeetingCard from '../../components/MeetingCard';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchMeetings = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/meetings');
      setMeetings(response.data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách cuộc họp:", err);
      setError("Không thể tải danh sách cuộc họp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMeetings();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMeetings();
  }, []);
  
  if (loading) {
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
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <FlatList
        data={meetings}
        renderItem={({ item }) => (
          <MeetingCard 
            meeting={item} 
            onPress={() => router.push(`/meeting/${item.meeting_id}`)} 
          />
        )}
        keyExtractor={(item) => item.meeting_id.toString()}
        ListHeaderComponent={<Text style={styles.title}>Các cuộc họp sắp tới</Text>}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>Không có cuộc họp nào.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryRed]} />
        }
      />
      
      {(user?.role === 'Admin' || user?.role === 'Secretary') && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/meeting/create')}
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
    padding: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.primaryRed, // Cập nhật màu tiêu đề
    marginBottom: SIZES.padding,
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