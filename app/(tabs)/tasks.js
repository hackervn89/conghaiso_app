import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { SIZES, COLORS } from '../../constants/styles';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import TaskCard from '../../components/TaskCard';
import DropDownPicker from 'react-native-dropdown-picker';

const statusOptions = [
    { value: 'on_time', label: 'Còn hạn' },
    { value: 'overdue', label: 'Trễ hạn' },
    { value: 'completed_on_time', label: 'Hoàn thành đúng hạn' },
    { value: 'completed_late', label: 'Hoàn thành trễ hạn' },        
];

const FilterModal = ({ visible, onClose, applyFilters, organizations, initialFilters }) => {
    const [selectedStatuses, setSelectedStatuses] = useState(initialFilters.statuses);
    const [orgFilter, setOrgFilter] = useState(initialFilters.orgId);

    // Dropdown state
    const [orgOpen, setOrgOpen] = useState(false);
    const [orgItems, setOrgItems] = useState(organizations);

    useEffect(() => {
        setOrgItems(organizations);
    }, [organizations]);

    const [statusOpen, setStatusOpen] = useState(false);
    const [statusItems, setStatusItems] = useState(statusOptions);

    const handleApply = () => {
        applyFilters({ statuses: selectedStatuses, orgId: orgFilter });
        onClose();
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{flex: 1}}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Lọc công việc</Text>
                    <TouchableOpacity onPress={onClose}><Ionicons name="close" size={30} /></TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                    <Text style={styles.filterSectionTitle}>Lọc theo đơn vị</Text>
                    <View style={{ zIndex: 2000 }}>
                        <DropDownPicker
                            open={orgOpen}
                            value={orgFilter}
                            items={orgItems}
                            setOpen={setOrgOpen}
                            setValue={setOrgFilter}
                            setItems={setOrgItems}
                            placeholder="Tất cả đơn vị"
                            listMode="MODAL" 
                        />
                    </View>

                    <Text style={styles.filterSectionTitle}>Lọc theo trạng thái</Text>
                    <View style={{ zIndex: 1000 }}>
                        <DropDownPicker
                            open={statusOpen}
                            value={selectedStatuses}
                            items={statusItems}
                            setOpen={setStatusOpen}
                            setValue={setSelectedStatuses}
                            setItems={setStatusItems}
                            placeholder="Tất cả trạng thái"
                            multiple={true}
                            mode="BADGE"
                            listMode="MODAL"
                        />
                    </View>

                    <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                        <Text style={styles.applyButtonText}>Áp dụng</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    )
}

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Filters
  const [organizations, setOrganizations] = useState([]);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({ statuses: [], orgId: null });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        dynamicStatus: filters.statuses.length > 0 ? filters.statuses : null,
        orgId: filters.orgId || null,
      };
      const response = await apiClient.get('/tasks', { params });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách công việc:", err);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    apiClient.get('/organizations').then(res => {
        const flattenOrgs = (orgs, level = 0) => {
            let list = [];
            orgs.forEach(org => {
                list.push({ label: '\u00A0'.repeat(level * 4) + org.org_name, value: org.org_id });
                if (org.children && org.children.length > 0) {
                    list = list.concat(flattenOrgs(org.children, level + 1));
                }
            });
            return list;
        };
        if (Array.isArray(res.data)) {
            setOrganizations(flattenOrgs(res.data));
        }
    });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);
  
  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color={COLORS.primaryRed} style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
        <Stack.Screen options={{ 
            headerTitle: 'Quản lý công việc',
            headerRight: () => (
                <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ marginRight: 15 }}>
                    <Ionicons name="filter-outline" size={26} color={COLORS.primaryRed} />
                </TouchableOpacity>
            )
        }} />

        <FilterModal 
            visible={isFilterModalVisible}
            onClose={() => setFilterModalVisible(false)}
            applyFilters={setFilters}
            organizations={organizations}
            initialFilters={filters}
        />

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TaskCard 
            task={item} 
            onPress={() => router.push({ pathname: `/task/${item.task_id}`, params: { task: JSON.stringify(item) } })} 
          />
        )}
        keyExtractor={(item) => item.task_id.toString()}
        contentContainerStyle={{padding: SIZES.padding}}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>Không có công việc nào phù hợp.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryRed]} />
        }
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/task/create')}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  fab: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    right: 30, bottom: 30, backgroundColor: COLORS.primaryRed, borderRadius: 30, elevation: 8,
  },
  // Modal Styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalTitle: { fontSize: SIZES.h2, fontWeight: 'bold' },
  modalContent: { padding: SIZES.padding },
  filterSectionTitle: { fontSize: SIZES.h3, fontWeight: 'bold', marginTop: 10, marginBottom: 15 },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.mediumGray, borderRadius: SIZES.radius, justifyContent: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkboxLabel: { marginLeft: 15, fontSize: 16 },
  applyButton: { backgroundColor: COLORS.primaryRed, padding: 15, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 30 },
  applyButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});
