import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import apiClient from '../../api/client';
import { globalStyles, COLORS, SIZES } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';

// Component con, sử dụng đệ quy để hiển thị cây
const OrgCheckboxItem = ({ org, selectedIds, onSelectionChange, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true); // State để quản lý đóng/mở

    return (
        <View style={{ marginLeft: level * 20 }}>
            <View style={styles.orgItem}>
                <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', flex: 1}} onPress={() => onSelectionChange(org.org_id)}>
                    <Ionicons name={selectedIds.has(org.org_id) ? 'checkbox' : 'square-outline'} size={24} color={COLORS.primaryRed} />
                    <Text style={styles.orgName}>{org.org_name}</Text>
                </TouchableOpacity>
                {/* Nút đóng/mở chỉ hiển thị khi có đơn vị con */}
                {org.children && org.children.length > 0 && (
                    <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ padding: 5 }}>
                        <Ionicons name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} size={22} color={COLORS.darkGray} />
                    </TouchableOpacity>
                )}
            </View>
            {/* Chỉ render các đơn vị con nếu isExpanded là true */}
            {isExpanded && org.children && org.children.length > 0 && (
                 <View style={styles.childContainer}>
                    {org.children.map(childOrg => (
                        <OrgCheckboxItem key={childOrg.org_id} org={childOrg} selectedIds={selectedIds} onSelectionChange={onSelectionChange} level={level + 1} />
                    ))}
                </View>
            )}
        </View>
    );
};

const UserFormScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const isEditMode = !!params.userId;

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState('Attendee');
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/organizations').then(res => setOrganizations(res.data));

    if (isEditMode) {
      apiClient.get(`/users/${params.userId}`).then(res => {
        const userData = res.data;
        setFullName(userData.full_name);
        setUsername(userData.username);
        setEmail(userData.email);
        setPosition(userData.position);
        setRole(userData.role);
        setSelectedOrgIds(new Set(userData.organizationIds));
      }).catch(() => Alert.alert("Lỗi", "Không thể tải dữ liệu người dùng."))
      .finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, []);

  const handleOrgSelection = (orgId) => {
    const newSelection = new Set(selectedOrgIds);
    if (newSelection.has(orgId)) newSelection.delete(orgId);
    else newSelection.add(orgId);
    setSelectedOrgIds(newSelection);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const payload = { fullName, email, position, role, organizationIds: Array.from(selectedOrgIds) };
    
    if (!isEditMode) {
      payload.username = username;
      payload.password = password;
    }

    try {
      if (isEditMode) {
        await apiClient.put(`/users/${params.userId}`, payload);
      } else {
        await apiClient.post('/users', payload);
      }
      router.back();
    } catch (error) {
      Alert.alert("Thất bại", error.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primaryRed} style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Stack.Screen options={{ title: isEditMode ? "Sửa Người dùng" : "Thêm Người dùng mới" }} />
        <Text style={styles.label}>Họ và Tên*</Text>
        <TextInput style={globalStyles.input} value={fullName} onChangeText={setFullName} />
        <Text style={styles.label}>Tên đăng nhập*</Text>
        <TextInput style={globalStyles.input} value={username} onChangeText={setUsername} editable={!isEditMode} autoCapitalize="none"/>
        <Text style={styles.label}>Email*</Text>
        <TextInput style={globalStyles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
        {!isEditMode && (
            <>
                <Text style={styles.label}>Mật khẩu*</Text>
                <TextInput style={globalStyles.input} value={password} onChangeText={setPassword} secureTextEntry />
            </>
        )}
        <Text style={styles.label}>Chức vụ</Text>
        <TextInput style={globalStyles.input} value={position} onChangeText={setPosition} />
        <Text style={styles.label}>Vai trò*</Text>
        <TextInput style={globalStyles.input} value={role} onChangeText={setRole} />

        <Text style={styles.label}>Cơ quan / Đơn vị</Text>
        <View style={styles.orgsContainer}>
            {organizations.map(org => (
                <OrgCheckboxItem key={org.org_id} org={org} selectedIds={selectedOrgIds} onSelectionChange={handleOrgSelection} />
            ))}
        </View>

        <TouchableOpacity style={[globalStyles.button, { marginTop: 32 }]} onPress={handleSubmit} disabled={saving}>
            <Text style={globalStyles.buttonText}>{saving ? 'Đang lưu...' : 'LƯU'}</Text>
        </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    contentContainer: { padding: SIZES.padding },
    label: { fontSize: 16, color: COLORS.primaryRed, marginBottom: 8, marginTop: 16, fontWeight: '600' },
    orgsContainer: { marginTop: 8, padding: 10, backgroundColor: COLORS.lightGray, borderRadius: SIZES.radius },
    orgItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    orgName: { marginLeft: 12, fontSize: 16 },
    childContainer: {
        borderLeftWidth: 1,
        borderLeftColor: COLORS.mediumGray,
        marginLeft: 12,
        paddingLeft: 10
    }
});

export default UserFormScreen;

