import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, globalStyles } from '../constants/styles';
import OrganizationSelector from './OrganizationSelector'; // Tái sử dụng component có sẵn
import apiClient from '../api/client';

const TaskFilterModal = ({ visible, onClose, onApply, initialFilters }) => {
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(initialFilters.statuses || []));
  const [selectedOrgIds, setSelectedOrgIds] = useState(initialFilters.orgIds || []);
  const [isOrgSelectorVisible, setIsOrgSelectorVisible] = useState(false);

  // --- THAY ĐỔI: State để lưu các tùy chọn lọc động ---
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Reset state khi filter thay đổi từ bên ngoài
  useEffect(() => {
    setSelectedStatuses(new Set(initialFilters.statuses || []));
    setSelectedOrgIds(initialFilters.orgIds || []);
  }, [initialFilters]);

  // --- THAY ĐỔI: Tải các tùy chọn lọc từ API khi modal được mở ---
  useEffect(() => {
    if (visible) {
      setIsLoadingOptions(true);
      apiClient.get('/tasks/filter-options')
        .then(response => {
          setAvailableStatuses(response.data.statuses || []);
        })
        .catch(error => console.error("Lỗi khi tải tùy chọn lọc:", error))
        .finally(() => setIsLoadingOptions(false));
    }
  }, [visible]);

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
      statuses: Array.from(selectedStatuses),
      orgIds: selectedOrgIds,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setSelectedStatuses(new Set());
    setSelectedOrgIds([]);
    onApply({ statuses: [], orgIds: [] }); // Áp dụng ngay lập tức
    onClose();
  };

  if (!visible) return null;

  // Nếu đang mở bộ chọn đơn vị, chỉ hiển thị nó
  if (isOrgSelectorVisible) {
    return (
      <OrganizationSelector
        initialSelectedIds={selectedOrgIds}
        onSelectionChange={setSelectedOrgIds}
        onClose={() => setIsOrgSelectorVisible(false)}
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
          {isLoadingOptions ? (
            <ActivityIndicator color={COLORS.primaryRed} style={{ marginTop: 10 }} />
          ) : (
            <View style={styles.statusContainer}>
              {/* --- THAY ĐỔI: Render từ state động thay vì hằng số --- */}
              {availableStatuses.map((status) => {
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
          )}
        </View>

        {/* Phần lọc đơn vị */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lọc theo đơn vị</Text>
          <TouchableOpacity style={globalStyles.input} onPress={() => setIsOrgSelectorVisible(true)}>
            <Text style={{ color: selectedOrgIds.length > 0 ? COLORS.darkText : COLORS.darkGray }}>
              Đã chọn {selectedOrgIds.length} đơn vị
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