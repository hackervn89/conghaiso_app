import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, Switch, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { globalStyles, COLORS, SIZES } from '../../../constants/styles';
import apiClient from '../../../api/client';
import { Ionicons } from '@expo/vector-icons';
import UserSelector from '../../../components/UserSelector';
import { useAuth } from '../../../context/AuthContext';

const EditMeetingScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams(); // Lấy ID cuộc họp từ URL

  // States cho form
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isCustomEndTime, setIsCustomEndTime] = useState(false);
  
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  
  const [attendeeIds, setAttendeeIds] = useState([]);
  const [isUserSelectorVisible, setIsUserSelectorVisible] = useState(false);
  
  const [agenda, setAgenda] = useState([]);
  
  const [loading, setLoading] = useState(true); // Loading để fetch dữ liệu
  const [saving, setSaving] = useState(false); // Saving khi cập nhật

  // Tải dữ liệu cuộc họp khi màn hình được mở
  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        const response = await apiClient.get(`/meetings/${id}`);
        const meeting = response.data;
        
        // Điền dữ liệu vào form
        setTitle(meeting.title);
        setLocation(meeting.location);
        setStartTime(new Date(meeting.start_time));
        if (meeting.end_time) {
          setEndTime(new Date(meeting.end_time));
          setIsCustomEndTime(true);
        }
        setSelectedOrgId(meeting.org_id);
        setAttendeeIds(meeting.attendees.map(a => a.user_id).filter(id => id !== null));
        setAgenda(meeting.agenda.length > 0 ? meeting.agenda : [{ title: '', documents: [] }]);

      } catch (error) {
        Alert.alert("Lỗi", "Không thể tải dữ liệu cuộc họp.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingData();
    
    // Tải danh sách cơ quan nếu là Admin
    if (user?.role === 'Admin') {
      const fetchOrganizations = async () => {
        const response = await apiClient.get('/organizations');
        setOrganizations(response.data.map(org => ({ label: org.org_name, value: org.org_id })));
      };
      fetchOrganizations();
    }
  }, [id]);
  
  // ... (Các hàm xử lý agenda, document tương tự như màn hình Create)
  const handleAgendaChange = (index, value) => {
    const newAgenda = [...agenda];
    newAgenda[index].title = value;
    setAgenda(newAgenda);
  };
  const addAgendaItem = () => setAgenda([...agenda, { title: '', documents: [] }]);
  const removeAgendaItem = (index) => {
    const newAgenda = [...agenda];
    newAgenda.splice(index, 1);
    setAgenda(newAgenda);
  };
  const handleDocumentChange = (agendaIndex, docIndex, field, value) => {
    const newAgenda = [...agenda];
    newAgenda[agendaIndex].documents[docIndex][field] = value;
    setAgenda(newAgenda);
  };
  const addDocument = (agendaIndex) => {
    const newAgenda = [...agenda];
    newAgenda[agendaIndex].documents.push({ doc_name: '', google_drive_file_id: '' });
    setAgenda(newAgenda);
  };
  const removeDocument = (agendaIndex, docIndex) => {
    const newAgenda = [...agenda];
    newAgenda[agendaIndex].documents.splice(docIndex, 1);
    setAgenda(newAgenda);
  };

  const handleUpdateMeeting = async () => {
    if (!title || !location || attendeeIds.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin và chọn ít nhất một người tham dự.');
      return;
    }
    setSaving(true);
    try {
      const filteredAgenda = agenda
        .map(item => ({
          ...item,
          documents: item.documents.filter(doc => doc.doc_name && doc.doc_name.trim() !== '')
        }))
        .filter(item => item.title && item.title.trim() !== '');

      const payload = {
        title, location,
        startTime: startTime.toISOString(),
        endTime: isCustomEndTime ? endTime.toISOString() : null,
        attendeeIds,
        agenda: filteredAgenda,
      };

      await apiClient.put(`/meetings/${id}`, payload);
      Alert.alert('Thành công', 'Đã cập nhật cuộc họp thành công!');
      router.back();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật cuộc họp.';
      Alert.alert('Thất bại', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const onTimeChange = (event, selectedDate, setTime, setShowPicker) => {
    setShowPicker(false);
    if (selectedDate) setTime(selectedDate);
  };
  const formatDateTime = (date) => date.toLocaleString('vi-VN');

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={COLORS.primaryRed} /></View>;
  }

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }} contentContainerStyle={{ padding: SIZES.padding }}>
        {/* Tiêu đề màn hình */}
        <Stack.Screen options={{ title: "Chỉnh sửa Cuộc họp" }}/>

        {/* Form chỉnh sửa */}
        <Text style={styles.label}>Tiêu đề cuộc họp*</Text>
        <TextInput style={globalStyles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.label}>Địa điểm*</Text>
        <TextInput style={globalStyles.input} value={location} onChangeText={setLocation} />
        
        {/* Admin có thể đổi cơ quan, Văn thư thì không */}
        {user?.role === 'Admin' && (
          <>
            <Text style={styles.label}>Cơ quan tổ chức*</Text>
            <View style={globalStyles.input}>
              <RNPickerSelect
                  value={selectedOrgId}
                  onValueChange={(value) => setSelectedOrgId(value)}
                  items={organizations}
                  style={pickerSelectStyles}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => <Ionicons name="chevron-down" size={24} color={COLORS.darkGray} />}
              />
            </View>
          </>
        )}

        <Text style={styles.label}>Người tham dự*</Text>
        <TouchableOpacity style={globalStyles.input} onPress={() => setIsUserSelectorVisible(true)}>
          <Text style={{color: attendeeIds.length > 0 ? COLORS.darkText : COLORS.darkGray}}>
            Đã chọn {attendeeIds.length} người
          </Text>
        </TouchableOpacity>

        {/* Các trường thời gian và chương trình nghị sự tương tự màn hình Create */}
        <Text style={styles.label}>Thời gian bắt đầu*</Text>
        <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={globalStyles.input}>
          <Text>{formatDateTime(startTime)}</Text>
        </TouchableOpacity>
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime} mode="datetime" display="default"
            onChange={(e, date) => onTimeChange(e, date, setStartTime, setShowStartTimePicker)}
          />
        )}
        <View style={styles.customTimeContainer}>
            <Text style={styles.label}>Đặt thời gian kết thúc tùy chỉnh</Text>
            <Switch value={isCustomEndTime} onValueChange={setIsCustomEndTime}/>
        </View>
        {isCustomEndTime && (
          <>
            <Text style={styles.label}>Thời gian kết thúc</Text>
            <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={globalStyles.input}>
              <Text>{formatDateTime(endTime)}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime} mode="datetime" display="default"
                onChange={(e, date) => onTimeChange(e, date, setEndTime, setShowEndTimePicker)}
              />
            )}
          </>
        )}

        <View style={styles.divider} />
        <Text style={styles.label}>Chương trình nghị sự</Text>
        {agenda.map((item, agendaIndex) => (
          <View key={agendaIndex} style={styles.agendaItemContainer}>
            <View style={styles.agendaHeader}>
              <Text style={styles.agendaTitle}>Nội dung {agendaIndex + 1}</Text>
              {agenda.length > 1 && (
                <TouchableOpacity onPress={() => removeAgendaItem(agendaIndex)}>
                  <Ionicons name="trash-bin-outline" size={24} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
            <TextInput style={globalStyles.input} placeholder="Nhập tiêu đề nội dung..." value={item.title} onChangeText={(text) => handleAgendaChange(agendaIndex, text)} />
            {item.documents.map((doc, docIndex) => (
              <View key={docIndex} style={styles.documentContainer}>
                <TextInput style={[globalStyles.input, styles.docInput]} placeholder="Tên tài liệu" value={doc.doc_name} onChangeText={(text) => handleDocumentChange(agendaIndex, docIndex, 'doc_name', text)} />
                <TextInput style={[globalStyles.input, styles.docInput]} placeholder="ID File Google Drive" value={doc.google_drive_file_id} onChangeText={(text) => handleDocumentChange(agendaIndex, docIndex, 'google_drive_file_id', text)} />
                <TouchableOpacity onPress={() => removeDocument(agendaIndex, docIndex)}><Ionicons name="remove-circle-outline" size={24} color={COLORS.darkGray} /></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addDocumentButton} onPress={() => addDocument(agendaIndex)}><Ionicons name="add-circle-outline" size={22} color={COLORS.primaryRed} /><Text style={styles.addDocumentText}>Thêm tài liệu</Text></TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addAgendaButton} onPress={addAgendaItem}><Ionicons name="add" size={24} color={COLORS.white} /><Text style={styles.addAgendaButtonText}>Thêm nội dung chương trình</Text></TouchableOpacity>
        
        <TouchableOpacity 
          style={[globalStyles.button, { marginTop: 32 }]} 
          onPress={handleUpdateMeeting}
          disabled={saving}
        >
          <Text style={globalStyles.buttonText}>{saving ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isUserSelectorVisible} animationType="slide">
        <UserSelector 
          initialSelectedIds={attendeeIds}
          onSelectionChange={(selectedIds) => setAttendeeIds(selectedIds)}
          onClose={() => setIsUserSelectorVisible(false)}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 16, color: COLORS.primaryRed, marginBottom: 8, marginTop: 16, fontWeight: '600' },
  customTimeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  divider: { height: 1, backgroundColor: COLORS.mediumGray, marginVertical: 24 },
  agendaItemContainer: { backgroundColor: COLORS.lightGray, borderRadius: SIZES.radius, padding: SIZES.padding, marginBottom: 16, borderWidth: 1, borderColor: COLORS.mediumGray },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  agendaTitle: { fontSize: 18, fontWeight: 'bold' },
  documentContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  docInput: { flex: 1, marginRight: 10, height: 40 },
  addDocumentButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'flex-start' },
  addDocumentText: { marginLeft: 8, color: COLORS.primaryRed, fontWeight: 'bold' },
  addAgendaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: COLORS.darkGray, borderRadius: SIZES.radius },
  addAgendaButtonText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 8 },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, height: '100%', color: COLORS.darkText },
  inputAndroid: { fontSize: 16, height: '100%', color: COLORS.darkText },
  iconContainer: { top: 12, right: 15 },
});

export default EditMeetingScreen;