import React, { useState, useLayoutEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { globalStyles, COLORS, SIZES } from '../../constants/styles';
import apiClient from '../../api/client';
import UserSelector from '../../components/UserSelector';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';


const CreateDraftScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [assigneeIds, setAssigneeIds] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isUserSelectorVisible, setIsUserSelectorVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setDocuments(prevDocs => [...prevDocs, ...result.assets]);
      }
    } catch (err)
      {
      console.error("Lỗi khi chọn tài liệu:", err);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi chọn tài liệu.");
    }
  };
  const removeDocument = (index) => {
    setDocuments(docs => docs.filter((_, i) => i !== index));
  };

  const handleCreateDraft = useCallback(async () => {
    if (!title || assigneeIds.length === 0 || documents.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tiêu đề, Người góp ý và đính kèm ít nhất 1 tài liệu.');
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('document_number', documentNumber);
    formData.append('deadline', deadline.toISOString());

    // --- SỬA LỖI Ở ĐÂY ---
    // Chuyển đổi mảng các ID thành một chuỗi JSON duy nhất
    formData.append('participants', JSON.stringify(assigneeIds));

    documents.forEach((doc) => {
      const file = {
        uri: doc.uri,
        name: doc.name,
        type: doc.mimeType || 'application/octet-stream',
      };
      formData.append('documents', file);
    });
    
    try {
      await apiClient.post('/drafts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      Alert.alert('Thành công', 'Dự thảo đã được tạo thành công.');
      router.back();
    } catch (error) {
      console.error('Lỗi khi tạo dự thảo:', error.response?.data || error.message);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo dự thảo, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [title, documentNumber, deadline, assigneeIds, documents, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Tạo dự thảo mới',
      headerRight: () => (
        <TouchableOpacity onPress={handleCreateDraft} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={COLORS.primaryRed} style={{ marginRight: 15 }} />
          ) : (
            <Text style={{ color: COLORS.primaryRed, fontWeight: 'bold', fontSize: 16, marginRight: 15 }}>Tạo</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving, handleCreateDraft]);


  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowDatePicker(Platform.OS === 'ios');
    setDeadline(currentDate);
  };


  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.label}>Tiêu đề *</Text>
        <TextInput
          style={globalStyles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ví dụ: Dự thảo Kế hoạch công tác năm 2025"
        />

        <Text style={styles.label}>Số hiệu văn bản (nếu có)</Text>
        <TextInput
          style={globalStyles.input}
          value={documentNumber}
          onChangeText={setDocumentNumber}
          placeholder="Ví dụ: 123/KH-VPCP"
        />
        
        <Text style={styles.label}>Hạn góp ý *</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.row}>
            <TextInput
                style={[globalStyles.input, { flex: 1 }]}
                value={deadline.toLocaleDateString('vi-VN')}
                editable={false}
            />
            <Ionicons name="calendar" size={24} color={COLORS.darkGray} style={{ marginLeft: 10 }} />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={deadline}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
          />
        )}


        <Text style={styles.label}>Người góp ý *</Text>
        <TouchableOpacity style={globalStyles.buttonOutline} onPress={() => setIsUserSelectorVisible(true)}>
            <Text style={globalStyles.buttonOutlineText}>Chọn người góp ý ({assigneeIds.length})</Text>
        </TouchableOpacity>
        

        <Text style={styles.label}>Tài liệu đính kèm *</Text>
        {documents.map((doc, index) => (
          <View key={index} style={styles.fileItem}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.darkGray} />
            <Text style={styles.fileName} numberOfLines={1}>{doc.name}</Text>
            <TouchableOpacity onPress={() => removeDocument(index)}>
                <Ionicons name="close-circle" size={22} color={COLORS.primaryRed} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addFileButton} onPress={handlePickDocument}>
            <Ionicons name="add" size={24} color={COLORS.primaryRed} />
            <Text style={styles.addFileButtonText}>Thêm tài liệu</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 30, backgroundColor: saving ? COLORS.gray : COLORS.primaryRed }]}
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
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 10,
    borderRadius: SIZES.radius,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    marginLeft: 10,
  },
});

export default CreateDraftScreen;