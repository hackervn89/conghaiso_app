import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/styles';

const UserSelector = ({ initialSelectedIds, onSelectionChange, onClose, dataSource, allowMultiSelect, title }) => {
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      if (allowMultiSelect) {
        newSelection.delete(id);
      }
    } else {
      if (!allowMultiSelect) {
        newSelection.clear();
      }
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleSave = () => {
    onSelectionChange(Array.from(selectedIds));
    onClose();
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return dataSource;
    return dataSource.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, dataSource]);

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity onPress={() => toggleSelection(item.id)} style={styles.itemContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Ionicons 
          name={isSelected ? (allowMultiSelect ? 'checkbox' : 'radio-button-on') : (allowMultiSelect ? 'square-outline' : 'radio-button-off')}
          size={24} 
          color={isSelected ? COLORS.primaryRed : COLORS.darkGray} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={30} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        extraData={selectedIds}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: { fontSize: SIZES.h3, fontWeight: 'bold' },
  saveText: { fontSize: 16, color: COLORS.primaryRed, fontWeight: 'bold' },
  searchContainer: { padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  searchInput: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SIZES.padding,
    height: 40,
    borderRadius: SIZES.radius,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemName: { fontSize: 16, flex: 1, marginRight: 10 },
});

export default UserSelector;