import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import apiClient from '../../api/client';
import { globalStyles, COLORS, SIZES } from '../../constants/styles';
import DropDownPicker from 'react-native-dropdown-picker';

const OrgFormScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const initialData = params.orgData ? JSON.parse(params.orgData) : null;
  const isEditMode = !!initialData;

  const [name, setName] = useState(initialData?.org_name || '');
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order?.toString() || '10');
  const [loading, setLoading] = useState(false);

  // Dropdown state
  const [open, setOpen] = useState(false);
  const [parentId, setParentId] = useState(initialData?.parent_id || null);
  const [orgList, setOrgList] = useState([]);

  useEffect(() => {
    apiClient.get('/organizations').then(response => {
      const flattenOrgs = (orgs, level = 0) => {
        let list = [];
        orgs.forEach(org => {
            list.push({ label: `${ '\u00A0'.repeat(level*4)}${org.org_name}`, value: org.org_id });
            if (org.children && org.children.length > 0) {
                list = list.concat(flattenOrgs(org.children, level + 1));
            }
        });
        return list;
      };
      setOrgList(flattenOrgs(response.data));
    });
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    const payload = { name, parentId, display_order: parseInt(displayOrder, 10) };
    try {
      if (isEditMode) {
        await apiClient.put(`/organizations/${initialData.org_id}`, payload);
      } else {
        await apiClient.post('/organizations', payload);
      }
      router.back();
    } catch (error) {
      Alert.alert("Thất bại", error.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isEditMode ? "Sửa Cơ quan" : "Thêm Cơ quan mới" }} />
      <Text style={styles.label}>Tên Cơ quan / Đơn vị*</Text>
      <TextInput style={globalStyles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Thuộc Cơ quan cha</Text>
      <DropDownPicker
          open={open}
          value={parentId}
          items={orgList}
          setOpen={setOpen}
          setValue={setParentId}
          setItems={setOrgList}
          placeholder="-- Là cơ quan gốc --"
          listMode="MODAL"
          zIndex={1000}
      />

      <Text style={styles.label}>Thứ tự hiển thị</Text>
      <TextInput style={globalStyles.input} value={displayOrder} onChangeText={setDisplayOrder} keyboardType="number-pad" />
      
      <TouchableOpacity style={[globalStyles.button, { marginTop: 32 }]} onPress={handleSubmit} disabled={loading}>
        <Text style={globalStyles.buttonText}>{loading ? 'Đang lưu...' : 'LƯU'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    contentContainer: { padding: SIZES.padding },
    label: { fontSize: 16, color: COLORS.primaryRed, marginBottom: 8, marginTop: 16, fontWeight: '600' },
});

export default OrgFormScreen;
