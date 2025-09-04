import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SIZES, COLORS, globalStyles } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import MeetingCard from '../../components/MeetingCard';

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Trạng thái để biết đã tìm kiếm lần nào chưa
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      return; // Không tìm kiếm nếu ô nhập rỗng
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await apiClient.get(`/meetings/search?q=${searchTerm}`);
      setResults(response.data);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      // Có thể thêm Alert ở đây để thông báo lỗi
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Ô tìm kiếm */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập tiêu đề cuộc họp để tìm..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch} // Cho phép tìm bằng nút "Enter" trên bàn phím
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Khu vực hiển thị kết quả */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryRed} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.meeting_id.toString()}
            renderItem={({ item }) => (
              <MeetingCard
                meeting={item}
                onPress={() => router.push(`/meeting/${item.meeting_id}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {hasSearched ? 'Không tìm thấy kết quả nào.' : 'Vui lòng nhập từ khóa và nhấn tìm kiếm.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    fontSize: SIZES.input,
    marginRight: 10,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primaryRed,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
    padding: SIZES.padding,
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.darkGray,
  }
});