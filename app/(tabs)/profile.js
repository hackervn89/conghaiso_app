import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/styles';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Không có thông tin người dùng.</Text>
      </View>
    );
  }

  const handleSignOut = () => {
    Alert.alert(
      "Xác nhận Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng xuất", style: "destructive", onPress: signOut }
      ]
    );
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={24} color={COLORS.darkGray} style={styles.icon} />
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'Chưa cập nhật'}</Text>
      </View>
    </View>
  );

  const MenuItem = ({ icon, label, path }) => (
    <TouchableOpacity style={styles.menuItem} onPress={() => router.push(path)}>
      <Ionicons name={icon} size={22} color={COLORS.darkText} />
      <Text style={styles.menuItemText}>{label}</Text>
      <Ionicons name="chevron-forward-outline" size={22} color={COLORS.darkGray} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle" size={80} color={COLORS.primaryRed} />
          <Text style={styles.userName}>{user.fullName || user.full_name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <InfoRow icon="mail-outline" label="Email" value={user.email} />
          <InfoRow icon="briefcase-outline" label="Chức vụ" value={user.position} />
        </View>

        {user.role === 'Admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quản trị hệ thống</Text>
            <MenuItem icon="people-outline" label="Quản lý Người dùng" path="/admin/users" />
            <MenuItem icon="business-outline" label="Quản lý Cơ quan" path="/admin/organizations" />
          </View>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.signOutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  contentContainer: { paddingVertical: SIZES.padding },
  profileHeader: { alignItems: 'center', padding: SIZES.padding * 2, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  userName: { fontSize: SIZES.h2, fontWeight: 'bold', marginTop: 8 },
  userRole: { fontSize: SIZES.body, color: COLORS.darkGray, marginTop: 4 },
  section: { marginTop: SIZES.padding, backgroundColor: COLORS.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.darkGray, paddingHorizontal: SIZES.padding, paddingTop: SIZES.padding, paddingBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: 12 },
  icon: { marginRight: 16 },
  label: { fontSize: 12, color: COLORS.darkGray },
  value: { fontSize: 16, color: COLORS.darkText },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  menuItemText: { flex: 1, marginLeft: 16, fontSize: 16 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: SIZES.padding,
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signOutButtonText: {
    marginLeft: 8,
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;