import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/styles';
import OrganizationSelector from './OrganizationSelector';

const DYNAMIC_STATUS_OPTIONS = [
  { value: 'on_time', label: 'Còn hạn' },
  { value: 'overdue', label: 'Trễ hạn' },
  { value: 'completed_on_time', label: 'Hoàn thành đúng hạn' },
  { value: 'completed_late', label: 'Hoàn thành trễ hạn' },
];

const TaskFilterBar = ({ filters, onFilterChange }) => {
  const [isOrgSelectorVisible, setIsOrgSelectorVisible] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(filters.orgId || null);
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(filters.dynamicStatus || []));

  // Cập nhật state nội bộ khi filter từ bên ngoài thay đổi (ví dụ: xóa lọc)
  useEffect(() => {
    setSelectedOrgId(filters.orgId || null);
    setSelectedStatuses(new Set(filters.dynamicStatus || []));
  }, [filters]);

  const handleStatusToggle = (statusValue) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(statusValue)) {
      newStatuses.delete(statusValue);
    } else {
      newStatuses.add(statusValue);
    }
    // Gọi callback để cập nhật filter ở màn hình cha
    onFilterChange({
      ...filters,
      dynamicStatus: Array.from(newStatuses),
    });
  };

  const handleOrgSelectionConfirm = (selectedIdArray) => {
    const newOrgId = selectedIdArray.length > 0 ? selectedIdArray[0] : null;
    setIsOrgSelectorVisible(false);
    // Gọi callback để cập nhật filter ở màn hình cha
    onFilterChange({
      ...filters,
      orgId: newOrgId,
    });
  };

  const handleClearOrgFilter = () => {
    onFilterChange({
      ...filters,
      orgId: null,
    });
  };

  return (
    <View style={styles.container}>
      {/* SỬA LỖI: Bọc OrganizationSelector trong Modal */}
      <Modal
        visible={isOrgSelectorVisible}
        animationType="slide"
        onRequestClose={() => setIsOrgSelectorVisible(false)}
      >
        <OrganizationSelector
          initialSelectedIds={selectedOrgId ? [selectedOrgId] : []}
          onSelectionChange={handleOrgSelectionConfirm}
          allowMultiSelect={false}
          onClose={() => setIsOrgSelectorVisible(false)}
          title="Chọn đơn vị lọc"
        />
      </Modal>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusScrollContainer}>
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
      </ScrollView>

      <View style={styles.orgFilterContainer}>
        <TouchableOpacity style={styles.orgButton} onPress={() => setIsOrgSelectorVisible(true)}>
          <Ionicons name="business-outline" size={18} color={selectedOrgId ? COLORS.primaryRed : COLORS.darkGray} />
          <Text style={[styles.orgButtonText, selectedOrgId && { color: COLORS.primaryRed }]}>
            {selectedOrgId ? 'Đã chọn đơn vị' : 'Lọc theo đơn vị'}
          </Text>
        </TouchableOpacity>
        {selectedOrgId && (
          <TouchableOpacity onPress={handleClearOrgFilter} style={styles.clearOrgButton}>
            <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  statusScrollContainer: {
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingBottom: 10, // Thêm khoảng cách giữa 2 hàng
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedStatusChip: {
    backgroundColor: '#FEF2F2',
    borderColor: COLORS.primaryRed,
  },
  statusChipText: {
    color: COLORS.darkText,
    fontSize: 14,
  },
  selectedStatusChipText: {
    color: COLORS.primaryRed,
    fontWeight: '600',
  },
  orgFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    marginTop: 4,
  },
  orgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    flex: 1,
  },
  orgButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  clearOrgButton: {
    padding: 4, // Tăng vùng bấm
  },
});

export default TaskFilterBar;