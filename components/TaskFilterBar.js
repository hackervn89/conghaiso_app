import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/styles';
import OrganizationSelector from './OrganizationSelector';

// CẬP NHẬT: Định nghĩa các bộ lọc theo nhóm trạng thái của backend
const FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả', statuses: [] },
  { value: 'incomplete', label: 'Chưa hoàn thành', statuses: ['pending', 'doing', 'overdue'] },
  { value: 'completed', label: 'Đã hoàn thành', statuses: ['completed_on_time', 'completed_late'] },
];

const TaskFilterBar = ({ filters, onFilterChange }) => {
  const [isOrgSelectorVisible, setIsOrgSelectorVisible] = useState(false);
  
  // Xác định bộ lọc đang hoạt động dựa trên mảng `dynamicStatus`
  const activeFilterValue = (() => {
    const currentStatuses = JSON.stringify(filters.dynamicStatus?.sort());
    if (!currentStatuses || currentStatuses === '[]') return 'all';
    if (currentStatuses === JSON.stringify(['pending', 'doing', 'overdue'].sort())) return 'incomplete';
    if (currentStatuses === JSON.stringify(['completed_late', 'completed_on_time'].sort())) return 'completed';
    // Nếu không khớp, mặc định là "Tất cả"
    return 'all';
  })();

  // CẬP NHẬT: Xử lý khi người dùng chọn một bộ lọc
  const handleFilterSelect = (filter) => {
    // Gọi callback để cập nhật filter ở màn hình cha
    onFilterChange({
      ...filters,
      dynamicStatus: filter.statuses,
    });
  };

  const handleOrgSelectionConfirm = (selectedIdArray) => {
    const newOrgId = selectedIdArray.length > 0 ? selectedIdArray[0] : null;
    setIsOrgSelectorVisible(false);
    onFilterChange({
      ...filters,
      orgId: newOrgId,
    });
  };

  // CẬP NHẬT: Xóa bộ lọc đơn vị
  const handleClearOrgFilter = () => {
    onFilterChange({
      ...filters,
      orgId: null,
    });
  };

  return (
    <View style={styles.container}>
      {isOrgSelectorVisible && (
        <Modal
          visible={isOrgSelectorVisible}
          animationType="slide"
          onRequestClose={() => setIsOrgSelectorVisible(false)}
        >
          <OrganizationSelector
            initialSelectedIds={filters.orgId ? [filters.orgId] : []}
            onSelectionChange={handleOrgSelectionConfirm}
            allowMultiSelect={false}
            onClose={() => setIsOrgSelectorVisible(false)}
            title="Chọn đơn vị lọc"
          />
        </Modal>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusScrollContainer}>
        {FILTER_OPTIONS.map((filter) => {
          const isSelected = activeFilterValue === filter.value;
          return (
            <TouchableOpacity
              key={filter.value}
              style={[styles.statusChip, isSelected && styles.selectedStatusChip]}
              onPress={() => handleFilterSelect(filter)}
            >
              <Text style={[styles.statusChipText, isSelected && styles.selectedStatusChipText]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.orgFilterContainer}>
        <TouchableOpacity style={styles.orgButton} onPress={() => setIsOrgSelectorVisible(true)}>
          <Ionicons name="business-outline" size={18} color={filters.orgId ? COLORS.primaryRed : COLORS.darkGray} />
          <Text style={[styles.orgButtonText, filters.orgId && { color: COLORS.primaryRed }]}>
            {filters.orgId ? 'Đã chọn đơn vị' : 'Lọc theo đơn vị'}
          </Text>
        </TouchableOpacity>
        {filters.orgId && (
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