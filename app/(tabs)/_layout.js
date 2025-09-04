import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/styles';

// Component Menu người dùng tùy chỉnh
const UserMenu = () => {
  const { user, signOut } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginRight: 15 }}>
        <Ionicons name="person-circle-outline" size={30} color={COLORS.primaryRed} />
      </TouchableOpacity>
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.fullName}</Text>
              <Text style={styles.userRole}>{user?.role}</Text>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setModalVisible(false);
              signOut();
            }}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primaryRed,
        headerRight: () => <UserMenu />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      {/* THÊM TAB MỚI: Tra cứu */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tra cứu',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="search" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: 60,
    marginRight: 15,
    backgroundColor: 'white',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
  },
  userInfo: {
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    width: '100%',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
  },
});