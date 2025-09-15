import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import apiClient from '../../api/client';
import { COLORS, SIZES } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';

const OrgItem = ({ org, onEdit, onDelete, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <View>
      <View style={[styles.orgItem, { paddingLeft: level * 20 + SIZES.padding }]}>
        <TouchableOpacity style={styles.orgNameContainer} onPress={() => setIsExpanded(!isExpanded)}>
          {org.children && org.children.length > 0 && (
            <Ionicons name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} size={18} color={COLORS.darkGray} />
          )}
          <Text style={styles.orgName}>{org.org_name}</Text>
        </TouchableOpacity>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => onEdit(org)} style={styles.actionButton}>
            <Ionicons name="pencil-outline" size={22} color={COLORS.darkGray} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(org)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
      {isExpanded && org.children && org.children.map(child => (
        <OrgItem key={child.org_id} org={child} onEdit={onEdit} onDelete={onDelete} level={level + 1} />
      ))}
    </View>
  );
};

const OrganizationManagementScreen = () => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/organizations');
      setOrgs(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách cơ quan:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrgs(); }, []));

  const handleEdit = (org) => {
    router.push({ pathname: '/admin/org-form', params: { orgData: JSON.stringify(org) } });
  };
  
  const handleDelete = (org) => {
    Alert.alert("Xác nhận Xóa", `Bạn có chắc muốn xóa "${org.org_name}"?`, [
      { text: "Hủy" },
      { text: "Xóa", style: "destructive", onPress: async () => {
        try {
            await apiClient.delete(`/organizations/${org.org_id}`);
            fetchOrgs();
        } catch(err) {
            Alert.alert("Lỗi", err.response?.data?.message || "Xóa thất bại.");
        }
      }}
    ]);
  };
  
  if (loading) return <ActivityIndicator size="large" color={COLORS.primaryRed} style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/admin/org-form')} style={{ marginRight: 15 }}>
              <Ionicons name="add-circle-outline" size={30} color={COLORS.primaryRed} />
            </TouchableOpacity>
          )
        }}
      />
      <ScrollView>
        {orgs.map(org => <OrgItem key={org.org_id} org={org} onEdit={handleEdit} onDelete={handleDelete} />)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  orgItem: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, alignItems: 'center' },
  orgNameContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  orgName: { fontSize: 16, marginLeft: 8 },
  actionsContainer: { flexDirection: 'row' },
  actionButton: { padding: 8 }
});

export default OrganizationManagementScreen;
