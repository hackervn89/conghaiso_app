import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import apiClient from '../../api/client';
import { COLORS, SIZES } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';

const UserItem = ({ item, onEdit, onDelete }) => (
  <View style={styles.userItem}>
    <View style={{ flex: 1 }}>
      <Text style={styles.userName}>{item.full_name}</Text>
      <Text style={styles.userInfo}>{item.username} - {item.role}</Text>
    </View>
    <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionButton}>
      <Ionicons name="pencil-outline" size={24} color={COLORS.darkGray} />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionButton}>
      <Ionicons name="trash-outline" size={24} color={COLORS.error} />
    </TouchableOpacity>
  </View>
);

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const handleEdit = (user) => {
    router.push({ pathname: '/admin/user-form', params: { userId: user.user_id } });
  };

  const handleDelete = (user) => {
    // Logic xóa người dùng
  };
  
  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primaryRed} style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
        <Stack.Screen 
            options={{
                headerRight: () => (
                    <TouchableOpacity onPress={() => router.push('/admin/user-form')} style={{ marginRight: 15 }}>
                        <Ionicons name="add-circle-outline" size={30} color={COLORS.primaryRed} />
                    </TouchableOpacity>
                )
            }}
        />
        <FlatList
            data={users}
            keyExtractor={(item) => item.user_id.toString()}
            renderItem={({ item }) => <UserItem item={item} onEdit={handleEdit} onDelete={handleDelete} />}
        />
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.lightGray },
    userItem: { flexDirection: 'row', backgroundColor: COLORS.white, padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.mediumGray, alignItems: 'center' },
    userName: { fontSize: 16, fontWeight: 'bold' },
    userInfo: { color: COLORS.darkGray },
    actionButton: { padding: 8 }
});

export default UserManagementScreen;
