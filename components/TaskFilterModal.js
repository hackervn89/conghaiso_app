import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, globalStyles } from '../constants/styles';
import OrganizationSelector from './OrganizationSelector'; // Tái sử dụng component có sẵn
import apiClient from '../api/client';

// SỬA LỖI: Định nghĩa cứng 4 trạng thái động để đồng bộ với phiên bản web
const DYNAMIC_STATUS_OPTIONS = [
  { value: 'on_time', label: 'Còn hạn' },
  { value: 'overdue', label: 'Trễ hạn' },
  { value: 'completed_on_time', label: 'Hoàn thành đúng hạn' },
  { value: 'completed_late', label: 'Hoàn thành trễ hạn' },
];

const TaskFilterModal = ({ visible, onClose, onApply, initialFilters }) => {
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(initialFilters.dynamicStatus || []));
  const [selectedOrgId, setSelectedOrgId] = useState(initialFilters.orgId || null);
  const [isOrgSelectorVisible, setIsOrgSelectorVisible] = useState(false);

  // Reset state khi filter thay đổi từ bên ngoài
  useEffect(() => {
    setSelectedStatuses(new Set(initialFilters.dynamicStatus || []));
    setSelectedOrgId(initialFilters.orgId || null);
  }, [initialFilters]);

  const handleStatusToggle = (statusValue) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(statusValue)) {
      newStatuses.delete(statusValue);
    } else {
      newStatuses.add(statusValue);
    }
    setSelectedStatuses(newStatuses);
  };

  const handleApply = () => {
    onApply({
      dynamicStatus: Array.from(selectedStatuses),
      orgId: selectedOrgId,
    });
    onClose();
  };

  // SỬA LỖI: Chỉ cần một hàm để xử lý việc chọn đơn vị.
  // Hàm này chỉ cập nhật state của modal lọc và đóng bộ chọn đơn vị, không áp dụng ngay.
  const handleOrgSelectionConfirm = (selectedIdArray) => {
    // Vì không cho chọn nhiều, mảng sẽ có 0 hoặc 1 phần tử
    setSelectedOrgId(selectedIdArray.length > 0 ? selectedIdArray[0] : null);
    setIsOrgSelectorVisible(false);
  };

  const handleClearFilters = () => {
    setSelectedStatuses(new Set());
    setSelectedOrgId(null);
    onApply({ dynamicStatus: [], orgId: null }); // Áp dụng ngay lập tức
    onClose();
  };

  if (!visible) return null;

  // Nếu đang mở bộ chọn đơn vị, chỉ hiển thị nó
  if (isOrgSelectorVisible) {
    return (
      <OrganizationSelector
        initialSelectedIds={selectedOrgId ? [selectedOrgId] : []}
        onSelectionChange={handleOrgSelectionConfirm} // SỬA LỖI: Chỉ truyền một prop onSelectionChange
        allowMultiSelect={false} // QUAN TRỌNG: Chỉ cho phép chọn 1 đơn vị
        onClose={() => setIsOrgSelectorVisible(false)} // Xử lý khi người dùng bấm hủy
        title="Chọn đơn vị lọc"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={30} color={COLORS.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>Bộ lọc công việc</Text>
        <TouchableOpacity onPress={handleClearFilters}>
          <Text style={styles.clearText}>Xóa lọc</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Phần lọc trạng thái */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lọc theo trạng thái</Text>
          <View style={styles.statusContainer}>
            {/* SỬA LỖI: Render từ danh sách trạng thái động đã định nghĩa */}
            {DYNAMIC_STATUS_OPTIONS.map((status) => {
              const isSelected = selectedStatuses.has(status.value);
              return (
                <TouchableOpacity
                  key={status.value}
                  style={[styles.statusChip, isSelected && styles.selectedStatusChip]}
                  onPress={() => handleStatusToggle(status.value)}
                >
                  <Text style={[styles.statusChipText, isSelected && styles.selectedStatusChipText]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Phần lọc đơn vị */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lọc theo đơn vị</Text>
          <TouchableOpacity style={globalStyles.input} onPress={() => setIsOrgSelectorVisible(true)}>
            <Text style={{ color: selectedOrgId ? COLORS.darkText : COLORS.darkGray }}>
              {selectedOrgId ? 'Đã chọn 1 đơn vị' : 'Chưa chọn đơn vị'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Nút áp dụng */}
      <View style={styles.footer}>
        <TouchableOpacity style={globalStyles.button} onPress={handleApply}>
          <Text style={globalStyles.buttonText}>ÁP DỤNG BỘ LỌC</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
  },
  clearText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  content: {
    padding: SIZES.padding,
  },
  section: {
    marginBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SIZES.padding,
    color: COLORS.primaryRed,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  selectedStatusChip: {
    backgroundColor: '#FEF2F2', // Màu đỏ nhạt
    borderColor: COLORS.primaryRed,
  },
  statusChipText: {
    color: COLORS.darkText,
  },
  selectedStatusChipText: {
    color: COLORS.primaryRed,
    fontWeight: 'bold',
  },
  footer: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
});

export default TaskFilterModal;