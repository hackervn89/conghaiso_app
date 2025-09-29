import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { globalStyles, COLORS, SIZES } from '../../constants/styles';
import apiClient from '../../api/client';
import UserSelector from '../../components/UserSelector';

const CreateTaskScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assigneeId, setAssigneeId] = useState(null);
  const [isUserSelectorVisible, setIsUserSelectorVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!title || !assigneeId) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và chọn người thực hiện.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        due_date: dueDate.toISOString(),
        assignee_id: assigneeId,
      };
      await apiClient.post('/tasks', payload);
      Alert.alert('Thành công', 'Đã giao việc mới thành công!');
      router.back();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tạo công việc.';
      Alert.alert('Thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const onUserSelectionChange = (selectedIds) => {
    // UserSelector returns an array, but we only need one assignee
    if (selectedIds.length > 0) {
      setAssigneeId(selectedIds[0]);
    }
  };

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }} contentContainerStyle={{ padding: SIZES.padding }}>
        <Text style={styles.label}>Tiêu đề công việc*</Text>
        <TextInput style={globalStyles.input} value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề công việc" />

        <Text style={styles.label}>Mô tả</Text>
        <TextInput
          style={[globalStyles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Nhập mô tả chi tiết cho công việc"
          multiline
        />

        <Text style={styles.label}>Giao cho*</Text>
        <TouchableOpacity style={globalStyles.input} onPress={() => setIsUserSelectorVisible(true)}>
          <Text style={{ color: assigneeId ? COLORS.darkText : COLORS.darkGray }}>
            {assigneeId ? 'Đã chọn 1 người' : 'Chọn người thực hiện'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Hạn chót*</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={globalStyles.input}>
          <Text>{dueDate.toLocaleDateString('vi-VN')}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 32 }]}
          onPress={handleCreateTask}
          disabled={loading}
        >
          {loading ? 
            <ActivityIndicator color={COLORS.white} /> : 
            <Text style={globalStyles.buttonText}>GIAO VIỆC</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isUserSelectorVisible} animationType="slide">
        <UserSelector
          initialSelectedIds={assigneeId ? [assigneeId] : []}
          onSelectionChange={onUserSelectionChange}
          onClose={() => setIsUserSelectorVisible(false)}
          // Assuming UserSelector supports a single selection mode or we adapt
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 16, color: COLORS.primaryRed, marginBottom: 8, marginTop: 16, fontWeight: '600' },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default CreateTaskScreen;
