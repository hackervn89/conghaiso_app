import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, ActivityIndicator, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { globalStyles, COLORS, SIZES } from '../../constants/styles';
import apiClient from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import UserSelector from '../../components/UserSelector';

const TaskFormScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditMode = !!params.taskId;

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [isDirect, setIsDirect] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Selections
  const [assignedOrgIds, setAssignedOrgIds] = useState([]);
  const [trackerIds, setTrackerIds] = useState([]);

  // Data for selectors
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [colleagues, setColleagues] = useState([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(isEditMode);
  const [selectorConfig, setSelectorConfig] = useState({ visible: false, type: null });

  // Dropdown states
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [priority, setPriority] = useState('normal');
  const [priorityItems, setPriorityItems] = useState([
    { label: 'Thông thường', value: 'normal' },
    { label: 'Quan trọng', value: 'important' },
    { label: 'Khẩn', value: 'urgent' },
  ]);

  useEffect(() => {
    apiClient.get('/users/colleagues').then(res => {
        if (Array.isArray(res.data)) {
            setColleagues(res.data.map(u => ({ id: u.user_id, name: u.full_name })));
        }
    });

    apiClient.get('/organizations').then(res => {
        const flattenOrgs = (orgs, level = 0) => {
            let list = [];
            orgs.forEach(org => {
                list.push({ id: org.org_id, name: ' '.repeat(level * 4) + org.org_name });
                if (org.children && org.children.length > 0) {
                    list = list.concat(flattenOrgs(org.children, level + 1));
                }
            });
            return list;
        };
        if (Array.isArray(res.data)) {
            setAllOrganizations(flattenOrgs(res.data));
        }
    });

    if (isEditMode) {
      setLoadingDetails(true);
      apiClient.get(`/tasks/${params.taskId}`).then(res => {
        const details = res.data;
        setTitle(details.title || '');
        setDescription(details.description || '');
        setDocumentRef(details.document_ref || '');
        setIsDirect(details.is_direct_assignment || false);
        setDueDate(details.due_date ? new Date(details.due_date) : new Date());
        setPriority(details.priority || 'normal');
        setAssignedOrgIds(details.assigned_orgs?.map(o => o.org_id) || []);
        setTrackerIds(details.trackers?.map(t => t.user_id) || []);
        setLoadingDetails(false);
      }).catch(err => {
        Alert.alert("Lỗi", "Không thể tải chi tiết công việc.");
        setLoadingDetails(false);
      });
    }
  }, [isEditMode, params.taskId]);

  const openSelector = (type) => {
    setSelectorConfig({ visible: true, type: type });
  };

  const onSelectionChange = (selectedIds) => {
    if (selectorConfig.type === 'orgs') {
      setAssignedOrgIds(selectedIds);
    } else if (selectorConfig.type === 'trackers') {
      setTrackerIds(selectedIds.slice(0, 1));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      title, description, document_ref: documentRef, is_direct_assignment: isDirect,
      due_date: dueDate.toISOString().split('T')[0],
      priority, assignedOrgIds, trackerIds
    };

    console.log('Payload:', payload);
    try {
      const response = isEditMode
        ? await apiClient.put(`/tasks/${params.taskId}`, payload)
        : await apiClient.post('/tasks', payload);
      Alert.alert('Thành công', `Đã ${isEditMode ? 'cập nhật' : 'tạo'} công việc thành công!`);
      router.back();
    } catch (err) {
      console.error('Error saving task:', err);
      Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDetails) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primaryRed} /></View>;
  }

  return (
    <>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ padding: SIZES.padding }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Tên công việc*</Text>
        <TextInput style={globalStyles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Nội dung chi tiết</Text>
        <TextInput style={[globalStyles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />

        <View style={styles.row}>
            <View style={{flex: 1}}>
                <Text style={styles.label}>Văn bản giao việc</Text>
                <TextInput style={globalStyles.input} value={documentRef} onChangeText={setDocumentRef} placeholder="Số/Ký hiệu" />
            </View>
            <View style={styles.switchContainer}>
                <Text style={styles.label}>Giao trực tiếp</Text>
                <Switch value={isDirect} onValueChange={setIsDirect} />
            </View>
        </View>

        <View style={[styles.row, { zIndex: 1000 }]}>
            <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.label}>Hạn hoàn thành</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={globalStyles.input}>
                    <Text>{dueDate.toLocaleDateString('vi-VN')}</Text>
                </TouchableOpacity>
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.label}>Mức độ ưu tiên</Text>
                <DropDownPicker
                    open={priorityOpen}
                    value={priority}
                    items={priorityItems}
                    setOpen={setPriorityOpen}
                    setValue={setPriority}
                    setItems={setPriorityItems}
                />
            </View>
        </View>

        {showDatePicker && <DateTimePicker value={dueDate} mode="date" display="default" onChange={(e,d) => {setShowDatePicker(false); if(d) setDueDate(d);}} />}

        <Text style={styles.label}>Đơn vị chủ trì (Thực hiện)*</Text>
        <TouchableOpacity style={globalStyles.input} onPress={() => openSelector('orgs')}>
            <Text style={{color: assignedOrgIds.length > 0 ? COLORS.darkText : COLORS.darkGray}}>
                Đã chọn {assignedOrgIds.length} đơn vị
            </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Người theo dõi</Text>
        <TouchableOpacity style={globalStyles.input} onPress={() => openSelector('trackers')}>
            <Text style={{color: trackerIds.length > 0 ? COLORS.darkText : COLORS.darkGray}}>
                {trackerIds.length > 0 ? `Đã chọn 1 người` : 'Chọn người theo dõi'}
            </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[globalStyles.button, { marginTop: 32 }]} onPress={handleSubmit} disabled={loading}>
            <Text style={globalStyles.buttonText}>{loading ? 'Đang lưu...' : 'LƯU CÔNG VIỆC'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={selectorConfig.visible} animationType="slide">
        <UserSelector 
          initialSelectedIds={selectorConfig.type === 'orgs' ? assignedOrgIds : trackerIds}
          onSelectionChange={onSelectionChange}
          onClose={() => setSelectorConfig({ visible: false, type: null })}
          dataSource={selectorConfig.type === 'orgs' ? allOrganizations : colleagues}
          allowMultiSelect={selectorConfig.type === 'orgs'}
          title={selectorConfig.type === 'orgs' ? 'Chọn đơn vị' : 'Chọn người theo dõi'}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 16, color: COLORS.primaryRed, marginBottom: 8, marginTop: 16, fontWeight: '600' },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  switchContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 16 }
});

export default TaskFormScreen;