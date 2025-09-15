import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { COLORS, SIZES, globalStyles } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

// Component con, sử dụng đệ quy để hiển thị cây
const OrganizationGroup = ({ group, selectedIds, onUserSelect, onGroupSelect, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const allChildOrgIds = (org) => {
    let ids = [org.org_id];
    if (org.children) {
      org.children.forEach(child => {
        ids = [...ids, ...allChildOrgIds(child)];
      });
    }
    return ids;
  };
  
  const isAllSelected = group.users.length > 0 && group.users.every(user => selectedIds.has(user.user_id));

  return (
    <View style={{ marginLeft: level * 15 }}>
      <View style={styles.groupHeader}>
        <TouchableOpacity onPress={() => onGroupSelect(group)}>
          <Ionicons name={isAllSelected ? 'checkbox' : 'square-outline'} size={24} color={COLORS.primaryRed} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.groupTitle}>{group.org_name}</Text>
            {group.children && group.children.length > 0 && (
                <Ionicons name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={22} color={COLORS.darkGray} />
            )}
        </TouchableOpacity>
      </View>
      
      {isExpanded && (
        <View style={styles.userList}>
          {group.users.map(user => (
            <TouchableOpacity key={user.user_id} style={styles.userRow} onPress={() => onUserSelect(user.user_id)}>
              <Ionicons name={selectedIds.has(user.user_id) ? 'checkbox' : 'square-outline'} size={22} color={COLORS.darkGray} />
              <Text style={styles.userName}>{user.full_name}</Text>
            </TouchableOpacity>
          ))}
           {group.children.map(childGroup => (
             <OrganizationGroup 
                key={childGroup.org_id} 
                group={childGroup} 
                selectedIds={selectedIds}
                onUserSelect={onUserSelect}
                onGroupSelect={onGroupSelect}
                level={level + 1} 
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Component chính
const UserSelector = ({ initialSelectedIds = [], onSelectionChange, onClose }) => {
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set(initialSelectedIds));

  useEffect(() => {
    apiClient.get('/users/grouped').then(res => setGroupedUsers(res.data));
  }, []);

  const handleUserSelect = (userId) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) newSelection.delete(userId);
    else newSelection.add(userId);
    setSelectedUsers(newSelection);
  };
  
  const handleGroupSelect = (group) => {
    const newSelection = new Set(selectedUsers);
    const getAllUserIdsInGroup = (g) => {
        let ids = g.users.map(u => u.user_id);
        g.children.forEach(child => {
            ids = [...ids, ...getAllUserIdsInGroup(child)];
        });
        return ids;
    };
    const userIdsInGroup = getAllUserIdsInGroup(group);
    const isAllSelected = userIdsInGroup.length > 0 && userIdsInGroup.every(id => selectedUsers.has(id));

    if (isAllSelected) userIdsInGroup.forEach(id => newSelection.delete(id));
    else userIdsInGroup.forEach(id => newSelection.add(id));
    setSelectedUsers(newSelection);
  };

  const handleConfirm = () => {
    onSelectionChange(Array.from(selectedUsers));
    onClose();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chọn người tham dự</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={30} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        {groupedUsers.map(group => (
          <OrganizationGroup 
            key={group.org_id}
            group={group}
            selectedIds={selectedUsers}
            onUserSelect={handleUserSelect}
            onGroupSelect={handleGroupSelect}
          />
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={globalStyles.button} onPress={handleConfirm}>
          <Text style={globalStyles.buttonText}>XÁC NHẬN ({selectedUsers.size})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  container: { flex: 1, padding: SIZES.padding / 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.mediumGray, backgroundColor: COLORS.white },
  headerTitle: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.primaryRed },
  footer: { padding: SIZES.padding, borderTopWidth: 1, borderTopColor: COLORS.mediumGray, backgroundColor: COLORS.white },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  groupTitle: { flex: 1, marginLeft: 10, fontSize: 18, fontWeight: 'bold' },
  userList: { paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: COLORS.mediumGray, marginLeft: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  userName: { marginLeft: 10, fontSize: 16 },
});

export default UserSelector;
