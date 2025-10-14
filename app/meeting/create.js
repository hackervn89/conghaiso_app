import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { globalStyles, COLORS, SIZES } from '../../constants/styles';
import apiClient from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import UserSelector from '../../components/UserSelector';
import { useAuth } from '../../context/AuthContext';
import * as DocumentPicker from 'expo-document-picker';

const CreateMeetingScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3 * 60 * 60 * 1000));
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isCustomEndTime, setIsCustomEndTime] = useState(false);
  const [attendeeIds, setAttendeeIds] = useState([]);
  const [isUserSelectorVisible, setIsUserSelectorVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agenda, setAgenda] = useState([{ title: '', documents: [] }]);

  // Dropdown state
  const [open, setOpen] = useState(false);
  const [selectedOrgIdForAdmin, setSelectedOrgIdForAdmin] = useState(null);
  const [organizations, setOrganizations] = useState([]); 

  const handlePickAndUploadDocument = async (agendaIndex) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
      if (result.canceled) return;

      const newAgenda = [...agenda];
      const decodedNames = []; // Lưu lại tên đã giải mã để so sánh

      result.assets.forEach(asset => {
        const decodedName = decodeURIComponent(asset.name);
        decodedNames.push(decodedName);
        newAgenda[agendaIndex].documents.push({
          doc_name: decodedName, // Lưu tên đã giải mã vào state
          google_drive_file_id: null,
          isUploading: true,
        });
      });
      setAgenda(newAgenda);

      const formData = new FormData();
      result.assets.forEach(asset => {
        formData.append('documents', {
          uri: asset.uri,
          name: asset.name, // Gửi đi tên gốc (có thể bị mã hóa)
          type: asset.mimeType,
        });
      });
      
      const response = await apiClient.post('/upload', formData);
      
      const finalAgenda = [...agenda];
      response.data.files.forEach(uploadedFile => {
        // So sánh với tên đã được giải mã
        const docIndex = finalAgenda[agendaIndex].documents.findIndex(d => d.isUploading && d.doc_name === uploadedFile.name);
        if(docIndex !== -1){
          finalAgenda[agendaIndex].documents[docIndex].google_drive_file_id = uploadedFile.id;
          finalAgenda[agendaIndex].documents[docIndex].isUploading = false;
        }
      });
      setAgenda(finalAgenda);

    } catch (error) {
      console.error("Lỗi khi tải file:", error.response || error);
      Alert.alert("Lỗi", "Không thể tải file lên. Vui lòng thử lại.");
      const cleanedAgenda = [...agenda];
      cleanedAgenda[agendaIndex].documents = cleanedAgenda[agendaIndex].documents.filter(d => !d.isUploading);
      setAgenda(cleanedAgenda);
    }
  };


  useEffect(() => {
    if (user?.role === 'Admin') {
      const fetchOrganizations = async () => {
        try {
          const response = await apiClient.get('/organizations');
          const formattedOrgs = response.data.map(org => ({
            label: org.org_name, value: org.org_id,
          }));
          setOrganizations(formattedOrgs);
        } catch (error) {
          Alert.alert("Lỗi", "Không thể tải danh sách cơ quan.");
        }
      };
      fetchOrganizations();
    }
  }, [user]);

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
  const removeDocument = (agendaIndex, docIndex) => {
    const newAgenda = [...agenda];
    newAgenda[agendaIndex].documents.splice(docIndex, 1);
    setAgenda(newAgenda);
  };

  const handleCreateMeeting = async () => {
    const finalOrgId = user?.role === 'Admin' 
      ? selectedOrgIdForAdmin 
      : (user?.managedScopes && user.managedScopes.length > 0 ? user.managedScopes[0] : null);
    if (!title || !location || !finalOrgId || attendeeIds.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin và chọn ít nhất một người tham dự.');
      return;
    }
    const isAnyFileUploading = agenda.some(item => item.documents.some(doc => doc.isUploading));
    if (isAnyFileUploading) {
      Alert.alert('Vui lòng chờ', 'Một số tài liệu vẫn đang được tải lên.');
      return;
    }
    setLoading(true);
    try {
      const filteredAgenda = agenda
        .map(item => ({
          ...item,
          documents: item.documents.filter(doc => doc.doc_name && doc.doc_name.trim() !== '' && doc.google_drive_file_id)
        }))
        .filter(item => item.title && item.title.trim() !== '');
      const payload = {
        title, location,
        startTime: startTime.toISOString(),
        endTime: isCustomEndTime ? endTime.toISOString() : null,
        orgId: finalOrgId,
        attendeeIds,
        agenda: filteredAgenda,
      };
      await apiClient.post('/meetings', payload);
      Alert.alert('Thành công', 'Đã tạo cuộc họp mới thành công!');
      router.back();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tạo cuộc họp.';
      Alert.alert('Thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const onTimeChange = (event, selectedDate, setTime, setShowPicker) => {
    setShowPicker(false);
    if (selectedDate) setTime(selectedDate);
  };
  const formatDateTime = (date) => date.toLocaleString('vi-VN');

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }} contentContainerStyle={{ padding: SIZES.padding }} keyboardShouldPersistTaps="handled">
        {/* ... Các trường thông tin cũ ... */}
        <Text style={styles.label}>Tiêu đề cuộc họp*</Text>
        <TextInput style={globalStyles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.label}>Địa điểm*</Text>
        <TextInput style={globalStyles.input} value={location} onChangeText={setLocation} />
        {user?.role === 'Admin' && (
          <>
            <Text style={styles.label}>Cơ quan tổ chức*</Text>
            <DropDownPicker
                open={open}
                value={selectedOrgIdForAdmin}
                items={organizations}
                setOpen={setOpen}
                setValue={setSelectedOrgIdForAdmin}
                setItems={setOrganizations}
                placeholder="Chọn một cơ quan..."
                listMode="MODAL"
                zIndex={1000}
            />
          </>
        )}
        <Text style={styles.label}>Người tham dự*</Text>
        <TouchableOpacity style={globalStyles.input} onPress={() => setIsUserSelectorVisible(true)}>
          <Text style={{color: attendeeIds.length > 0 ? COLORS.darkText : COLORS.darkGray}}>
            Đã chọn {attendeeIds.length} người
          </Text>
        </TouchableOpacity>
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
            <TextInput
              style={globalStyles.input}
              placeholder="Nhập tiêu đề nội dung..."
              value={item.title}
              onChangeText={(text) => handleAgendaChange(agendaIndex, text)}
            />
            
            {/* GIAO DIỆN MỚI CHO TÀI LIỆU */}
            {item.documents.map((doc, docIndex) => (
              <View key={docIndex} style={styles.documentRow}>
                <Ionicons name="document-attach-outline" size={24} color={COLORS.darkGray} />
                <Text style={styles.docName} numberOfLines={1}>{doc.doc_name}</Text>
                {doc.isUploading ? (
                  <ActivityIndicator color={COLORS.primaryRed}/>
                ) : (
                  <TouchableOpacity onPress={() => removeDocument(agendaIndex, docIndex)}>
                    <Ionicons name="close-circle" size={24} color={COLORS.darkGray} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addDocumentButton} onPress={() => handlePickAndUploadDocument(agendaIndex)}>
              <Ionicons name="cloud-upload-outline" size={22} color={COLORS.primaryRed} />
              <Text style={styles.addDocumentText}>Tải lên tài liệu</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addAgendaButton} onPress={addAgendaItem}>
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.addAgendaButtonText}>Thêm nội dung chương trình</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[globalStyles.button, { marginTop: 32 }]} 
          onPress={handleCreateMeeting}
          disabled={loading}
        >
          <Text style={globalStyles.buttonText}>{loading ? 'Đang tạo...' : 'TẠO CUỘC HỌP'}</Text>
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
  addDocumentButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'flex-start' },
  addDocumentText: { marginLeft: 8, color: COLORS.primaryRed, fontWeight: 'bold' },
  addAgendaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: COLORS.darkGray, borderRadius: SIZES.radius },
  addAgendaButtonText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 8 },
  documentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: 10, borderRadius: SIZES.radius, marginTop: 8, borderWidth: 1, borderColor: COLORS.mediumGray },
  docName: { flex: 1, marginLeft: 10, fontSize: 16 }
});

export default CreateMeetingScreen;