import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';

const DelegationModal = ({ visible, candidates, onClose, onConfirm }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!selectedUserId) return;
    setIsConfirming(true);
    await onConfirm(selectedUserId);
    setIsConfirming(false);
    // Reset state when modal is closed or confirmed
    setSelectedUserId(null);
  };

  const renderCandidate = ({ item }) => {
    const isSelected = item.user_id === selectedUserId;
    return (
      <TouchableOpacity
        style={[styles.candidateItem, isSelected && styles.selectedItem]}
        onPress={() => setSelectedUserId(item.user_id)}
      >
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>{item.full_name}</Text>
          <Text style={styles.candidatePosition}>{item.position}</Text>
        </View>
        <Ionicons
          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
          size={24}
          color={isSelected ? COLORS.primaryRed : COLORS.darkGray}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Ủy quyền tham dự</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={candidates}
            renderItem={renderCandidate}
            keyExtractor={(item) => item.user_id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>Không có người nào để ủy quyền.</Text>}
            style={styles.list}
          />

          <TouchableOpacity
            style={[styles.confirmButton, !selectedUserId && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={!selectedUserId || isConfirming}
          >
            {isConfirming ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.confirmButtonText}>Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SIZES.padding, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.padding },
  title: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.primaryRed },
  list: { marginBottom: SIZES.padding },
  candidateItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.padding, borderWidth: 1, borderColor: COLORS.mediumGray, borderRadius: SIZES.radius, marginBottom: 10 },
  selectedItem: { borderColor: COLORS.primaryRed, borderWidth: 2, backgroundColor: '#FEF2F2' },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 16, fontWeight: 'bold' },
  candidatePosition: { fontSize: 14, color: COLORS.darkGray, marginTop: 4 },
  emptyText: { textAlign: 'center', fontStyle: 'italic', color: COLORS.darkGray, marginTop: 20 },
  confirmButton: { backgroundColor: COLORS.primaryRed, padding: 15, borderRadius: SIZES.radius, alignItems: 'center' },
  disabledButton: { backgroundColor: COLORS.mediumGray },
  confirmButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});

export default DelegationModal;