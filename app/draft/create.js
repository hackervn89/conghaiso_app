import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { globalStyles, COLORS, SIZES } from '../../constants/styles';
import apiClient from '../../api/client';
import UserSelector from '../../components/UserSelector';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';


const CreateDraftScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [documentNumber, setDocumentNumber] = useState(''); // State cho số hiệu văn bản
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // State cho hạn góp ý, mặc định 7 ngày
  const [showDatePicker, setShowDatePicker] = useState(false); // State để hiện/ẩn date picker

  const [assigneeIds, setAssigneeIds] = useState([]);
  const [documents, setDocuments] = useState([]); // State mới để lưu các tệp đã chọn
  const [isUserSelectorVisible, setIsUserSelectorVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Cho phép chọn mọi loại tệp
        multiple: true, // Cho phép chọn nhiều tệp
      });

      if (!result.canceled) {
        // result.assets là một mảng các tệp đã chọn
        setDocuments(prevDocs => [...prevDocs, ...result.assets]);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể mở trình chọn tệp.');
      console.error('Lỗi khi chọn tệp:', err);
    }
  };

  const removeDocument = (uri) => {
    setDocuments(docs => docs.filter(doc => doc.uri !== uri));
  };

  const handleCreateDraft = async () => {
    // Cập nhật điều kiện kiểm tra để phù hợp với backend
    if (!title || assigneeIds.length === 0 || documents.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền tiêu đề, chọn người góp ý và đính kèm ít nhất một tài liệu.');
      return;
    }
    setSaving(true);

    // Tạo đối tượng FormData để gửi tệp
    const formData = new FormData();
    formData.append('title', title);

    // SỬA LỖI: Gửi từng ID người tham gia như một trường riêng biệt.
    // Backend sẽ tự động tập hợp chúng thành một mảng.
    assigneeIds.forEach(id => formData.append('participants', id));

    // Thêm các trường mới vào payload
    if (documentNumber) {
      formData.append('document_number', documentNumber);
    }
    // Backend yêu cầu deadline
    formData.append('deadline', deadline.toISOString().split('T')[0]);

    // Thêm các tệp vào formData
    documents.forEach(doc => {
      // SỬA LỖI: Gửi tên tệp gốc, không cần mã hóa.
      // SỬA LỖI: Backend mong đợi mỗi tệp có key là 'document' (số ít)
      formData.append('document', {
        uri: doc.uri,
        name: doc.name,
        type: doc.mimeType || 'application/octet-stream',
      });
    });

    try {
      // Gửi request với header 'multipart/form-data'
      // SỬA: Không cần config header, axios sẽ tự nhận diện FormData
      await apiClient.post('/drafts', formData);
      Alert.alert('Thành công', 'Đã tạo dự thảo mới thành công!');
      router.back();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tạo dự thảo. Hãy chắc chắn bạn đã đính kèm tệp.';
      Alert.alert('Thất bại', errorMessage);
      console.error("Lỗi khi tạo dự thảo:", JSON.stringify(error.response?.data));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Tiêu đề dự thảo*</Text>
        <TextInput style={globalStyles.input} value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề..." />

        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 10}}>
            <Text style={styles.label}>Số hiệu văn bản</Text>
            <TextInput style={globalStyles.input} value={documentNumber} onChangeText={setDocumentNumber} placeholder="VD: 123/QĐ-UBND" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Hạn góp ý*</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={globalStyles.input}>
                <Text>{deadline.toLocaleDateString('vi-VN')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && <DateTimePicker value={deadline} mode="date" display="default" onChange={(e,d) => {setShowDatePicker(false); if(d) setDeadline(d);}} />}
        
        <Text style={styles.label}>Giao cho*</Text>
        <TouchableOpacity style={globalStyles.input} onPress={() => setIsUserSelectorVisible(true)}>
          <Text style={{ color: assigneeIds.length > 0 ? COLORS.darkText : COLORS.darkGray }}>
            Đã chọn {assigneeIds.length} người
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Tài liệu đính kèm*</Text>
        <View>
          {documents.map(doc => (
            <View key={doc.uri} style={styles.fileRow}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.darkGray} />
              <Text style={styles.fileName} numberOfLines={1}>{doc.name}</Text>
              <TouchableOpacity onPress={() => removeDocument(doc.uri)}>
                <Ionicons name="close-circle" size={22} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.addFileButton} onPress={handlePickDocument}>
          <Ionicons name="add" size={22} color={COLORS.primaryRed} />
          <Text style={styles.addFileButtonText}>Thêm tài liệu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 32 }]}
          onPress={handleCreateDraft}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={globalStyles.buttonText}>TẠO DỰ THẢO</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isUserSelectorVisible} animationType="slide">
        <UserSelector
          initialSelectedIds={assigneeIds}
          onSelectionChange={(selectedIds) => setAssigneeIds(selectedIds)}
          onClose={() => setIsUserSelectorVisible(false)}
          allowMultiSelect={true}
          title="Chọn người góp ý"
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  contentContainer: { padding: SIZES.padding },
  label: { fontSize: 16, color: COLORS.primaryRed, marginBottom: 8, marginTop: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  addFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primaryRed,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  addFileButtonText: { color: COLORS.primaryRed, marginLeft: 8, fontWeight: 'bold' },
  fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, padding: 10, borderRadius: SIZES.radius, marginBottom: 8 },
  fileName: { flex: 1, marginLeft: 10, marginRight: 10 },
});

export default CreateDraftScreen;