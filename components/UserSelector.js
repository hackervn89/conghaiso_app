import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { COLORS, SIZES, globalStyles } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';

// Component con cho từng nhóm cơ quan
const OrganizationGroup = ({ group, selectedUsers, onUserSelect, onGroupSelect }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Kiểm tra xem tất cả user trong nhóm này có được chọn không
  const isAllSelected = group.users.length > 0 && group.users.every(user => selectedUsers.has(user.user_id));
  
  return (
    <View style={styles.groupContainer}>
      <TouchableOpacity style={styles.groupHeader} onPress={() => setIsExpanded(!isExpanded)}>
        <TouchableOpacity onPress={() => onGroupSelect(group.org_id, group.users)}>
          <Ionicons 
            name={isAllSelected ? 'checkbox' : 'square-outline'} 
            size={24} 
            color={COLORS.primaryRed} 
          />
        </TouchableOpacity>
        <Text style={styles.groupTitle}>{group.org_name} ({group.users.length})</Text>
        <Ionicons 
          name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} 
          size={24} 
          color={COLORS.darkGray} 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.userList}>
          {group.users.map(user => (
            <TouchableOpacity 
              key={user.user_id} 
              style={styles.userRow}
              onPress={() => onUserSelect(user.user_id)}
            >
              <Ionicons 
                name={selectedUsers.has(user.user_id) ? 'checkbox' : 'square-outline'} 
                size={24} 
                color={COLORS.darkGray} 
              />
              <Text style={styles.userName}>{user.full_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Component chính
const UserSelector = ({ initialSelectedIds = [], onSelectionChange, onClose }) => {
  const [groupedUsers, setGroupedUsers] = React.useState([]);
  const [selectedUsers, setSelectedUsers] = React.useState(new Set(initialSelectedIds));

  // Tải dữ liệu người dùng theo nhóm
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Giả sử apiClient đã được cấu hình và có token
        const apiClient = require('../api/client').default;
        const response = await apiClient.get('/users/grouped');
        setGroupedUsers(response.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách người dùng theo nhóm:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleUserSelect = (userId) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };
  
  const handleGroupSelect = (orgId, usersInGroup) => {
    const newSelection = new Set(selectedUsers);
    const userIdsInGroup = usersInGroup.map(u => u.user_id);
    const isAllSelected = userIdsInGroup.length > 0 && userIdsInGroup.every(id => selectedUsers.has(id));

    if (isAllSelected) {
      // Bỏ chọn tất cả user trong nhóm
      userIdsInGroup.forEach(id => newSelection.delete(id));
    } else {
      // Chọn tất cả user trong nhóm
      userIdsInGroup.forEach(id => newSelection.add(id));
    }
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
            selectedUsers={selectedUsers}
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.mediumGray, backgroundColor: COLORS.white },
  headerTitle: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.primaryRed },
  footer: { padding: SIZES.padding, borderTopWidth: 1, borderTopColor: COLORS.mediumGray, backgroundColor: COLORS.white },
  groupContainer: { backgroundColor: COLORS.white, margin: SIZES.padding, borderRadius: SIZES.radius, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  groupTitle: { flex: 1, marginLeft: 12, fontSize: 18, fontWeight: 'bold' },
  userList: { padding: SIZES.padding },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userName: { marginLeft: 12, fontSize: 16 },
});

export default UserSelector;
