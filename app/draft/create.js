import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles, COLORS, SIZES } from '../../constants/styles';
import apiClient from '../../api/client';
import UserSelector from '../../components/UserSelector';

const CreateDraftScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [isUserSelectorVisible, setIsUserSelectorVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreateDraft = async () => {
    if (!title || !content || assigneeIds.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tiêu đề, nội dung và chọn ít nhất một người góp ý.');
      return;
    }
    setSaving(true);
    try {
      const payload = { title, content, assigneeIds };
      await apiClient.post('/drafts', payload);
      Alert.alert('Thành công', 'Đã tạo dự thảo mới thành công!');
      router.back();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tạo dự thảo.';
      Alert.alert('Thất bại', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Tiêu đề dự thảo*</Text>
        <TextInput style={globalStyles.input} value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề..." />

        <Text style={styles.label}>Nội dung*</Text>
        <TextInput
          style={[globalStyles.input, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Nhập nội dung chi tiết của dự thảo..."
          multiline
        />

        <Text style={styles.label}>Giao cho*</Text>
        <TouchableOpacity style={globalStyles.input} onPress={() => setIsUserSelectorVisible(true)}>
          <Text style={{ color: assigneeIds.length > 0 ? COLORS.darkText : COLORS.darkGray }}>
            Đã chọn {assigneeIds.length} người
          </Text>
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
  textArea: { height: 150, textAlignVertical: 'top' },
});

export default CreateDraftScreen;