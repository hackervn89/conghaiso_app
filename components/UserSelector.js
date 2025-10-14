import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/styles';
import apiClient from '../api/client';
import Checkbox from 'expo-checkbox';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth để lấy thông tin người dùng

// Hàm đệ quy để lọc người dùng hệ thống (Admin, Văn thư) ra khỏi cây dữ liệu
// Logic này được lấy từ phiên bản web để đảm bảo tính nhất quán
const filterSystemUsers = (groups) => {
    if (!Array.isArray(groups)) return [];
    return groups.reduce((acc, group) => {
        // Lọc người dùng trong đơn vị hiện tại
        const filteredUsers = (group.users || []).filter(
            user => user.full_name !== 'Quản trị viên Hệ thống' && !user.full_name.startsWith('Văn thư')
        );
        // Lọc đệ quy các đơn vị con
        const filteredChildren = filterSystemUsers(group.children);

        // Chỉ giữ lại đơn vị nếu nó có người dùng hoặc có đơn vị con hợp lệ
        if (filteredUsers.length > 0 || filteredChildren.length > 0) {
            acc.push({ ...group, users: filteredUsers, children: filteredChildren });
        }
        return acc;
    }, []);
};

// Hàm đệ quy để lọc cây tổ chức theo các đơn vị được quản lý (managedScopes)
const filterTreeByManagedScopes = (groups, managedScopes) => {
    if (!Array.isArray(groups) || !Array.isArray(managedScopes) || managedScopes.length === 0) return [];

    return groups.reduce((acc, group) => {
        // Nếu đơn vị này nằm trong danh sách quản lý, giữ lại toàn bộ nhánh con của nó
        if (managedScopes.includes(group.org_id)) {
            acc.push(group);
            return acc;
        }
        // Ngược lại, tiếp tục tìm kiếm ở các nhánh con
        const filteredChildren = filterTreeByManagedScopes(group.children, managedScopes);
        if (filteredChildren.length > 0) acc.push({ ...group, users: [], children: filteredChildren });
        return acc;
    }, []);
};

// Component con để hiển thị từng nhóm (đệ quy)
// Component con để hiển thị từng nhóm (đệ quy) - ĐÃ SỬA LỖI
const OrganizationGroup = ({ group, selectedIds, onUserSelect, level = 0, searchQuery }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2); // Mặc định mở 2 cấp đầu

    // Chỉ chuyển searchQuery sang chữ thường một lần
    const lowerCaseQuery = searchQuery.toLowerCase();

    // Sử dụng useMemo để lọc danh sách người dùng của group hiện tại
    // Việc này giúp tối ưu hiệu suất, chỉ tính toán lại khi searchQuery hoặc users thay đổi
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return group.users || [];
        return (group.users || []).filter(u => u.full_name.toLowerCase().includes(lowerCaseQuery));
    }, [searchQuery, group.users]);

    // Sử dụng useMemo để quyết định xem group này có nên hiển thị hay không
    // Một group được hiển thị nếu:
    // 1. Không có tìm kiếm.
    // 2. Tên của nó khớp với tìm kiếm.
    // 3. Nó có người dùng khớp với tìm kiếm.
    // 4. Hoặc, bất kỳ nhánh con nào của nó có chứa kết quả khớp.
    const isVisible = useMemo(() => {
        if (!searchQuery) return true;

        // Hàm đệ quy để kiểm tra sự tồn tại của kết quả khớp trong một nhánh
        const checkVisibility = (g) => {
            if (g.org_name.toLowerCase().includes(lowerCaseQuery)) {
                return true;
            }
            const hasMatchingUser = (g.users || []).some(u => u.full_name.toLowerCase().includes(lowerCaseQuery));
            if (hasMatchingUser) {
                return true;
            }
            return (g.children || []).some(child => checkVisibility(child));
        };

        return checkVisibility(group);
    }, [searchQuery, group]);

    // Nếu không hiển thị, trả về null để không render gì cả
    if (!isVisible) {
        return null;
    }

    return (
        <View style={{ marginLeft: level * 10 }}>
            <TouchableOpacity style={styles.groupHeader} onPress={() => setIsExpanded(!isExpanded)}>
                <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={18} color={COLORS.primaryRed} />
                <Text style={styles.groupName}>{group.org_name}</Text>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.childrenContainer}>
                    {/* Khi có tìm kiếm, chỉ hiển thị người dùng đã được lọc */}
                    {filteredUsers.map(user => (
                        <TouchableOpacity key={user.user_id} style={styles.userRow} onPress={() => onUserSelect(user.user_id)}>
                            <Checkbox
                                style={styles.checkbox}
                                value={selectedIds.has(user.user_id)}
                                onValueChange={() => onUserSelect(user.user_id)}
                                color={selectedIds.has(user.user_id) ? COLORS.primaryRed : undefined}
                            />
                            <Text style={styles.userName}>{user.full_name}</Text>
                        </TouchableOpacity>
                    ))}
                    {/* Render đệ quy các component con, mỗi con sẽ tự quyết định có isVisible hay không */}
                    {(group.children || []).map(childGroup => (
                        <OrganizationGroup
                            key={childGroup.org_id}
                            group={childGroup}
                            selectedIds={selectedIds}
                            onUserSelect={onUserSelect}
                            level={level + 1}
                            searchQuery={searchQuery}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const UserSelector = ({ initialSelectedIds = [], onSelectionChange, onClose, allowMultiSelect = true, title = "Chọn người dùng", purpose = null }) => {
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));
  const { user } = useAuth(); // 2. Lấy thông tin người dùng từ context

  useEffect(() => {
    const fetchGroupedUsers = async () => {
        setLoading(true);
        try {
            // Sử dụng endpoint /users/grouped để lấy cây tổ chức
            const response = await apiClient.get('/users/grouped');
            let data = response.data;

            // 3. Áp dụng logic phân quyền nếu mục đích là chọn người theo dõi công việc
            if (purpose === 'task_tracker') {
                console.log("[UserSelector] Đang áp dụng phân quyền. Dữ liệu người dùng:", JSON.stringify(user, null, 2));
                if (user?.managedScopes && user.managedScopes.length > 0) {
                    // Lãnh đạo (có managedScopes): Lọc theo đơn vị quản lý
                    console.log("[UserSelector] Phát hiện Lãnh đạo. Lọc theo managedScopes:", user.managedScopes);
                    data = filterTreeByManagedScopes(data, user.managedScopes);
                } else if (user?.role === 'Attendee' || !user?.role) { // Xử lý cả trường hợp role không xác định
                    // Attendee: Chỉ hiển thị chính mình
                    console.log("[UserSelector] Phát hiện Attendee. Chỉ hiển thị cá nhân.");
                    // SỬA LỖI: Xử lý cả camelCase (userId) và snake_case (user_id) để đảm bảo tương thích
                    const self = { 
                        org_id: 'self', org_name: 'Cá nhân', 
                        users: [{ user_id: user.user_id || user.userId, full_name: user.full_name || user.fullName }] 
                    };
                    data = [self];
                }
                // Admin: Không cần làm gì, sẽ thấy tất cả
            }

            if (Array.isArray(data)) {
                // Luôn lọc bỏ các tài khoản hệ thống
                const finalFilteredData = filterSystemUsers(data);
                setGroupedUsers(finalFilteredData);
            } else {
                setGroupedUsers([]);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách người dùng:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchGroupedUsers();
  }, [user, purpose]); // Thêm user và purpose vào dependencies

  const handleUserSelect = (userId) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(userId)) {
      newSelectedIds.delete(userId);
    } else {
      if (!allowMultiSelect) {
        newSelectedIds.clear(); // Xóa lựa chọn cũ nếu chỉ cho phép chọn 1
      }
      newSelectedIds.add(userId);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleConfirm = () => {
    onSelectionChange(Array.from(selectedIds));
    onClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={30} color={COLORS.darkText} /></TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleConfirm}><Text style={styles.confirmText}>Xong</Text></TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Tìm kiếm theo tên hoặc đơn vị..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={COLORS.primaryRed} />
      ) : (
        <ScrollView>
            {groupedUsers.length > 0 ? groupedUsers.map(group => (
                <OrganizationGroup
                    key={group.org_id}
                    group={group}
                    selectedIds={selectedIds}
                    onUserSelect={handleUserSelect}
                    searchQuery={searchQuery}
                />
            )) : <Text style={styles.emptyText}>Không có người dùng nào.</Text>}
        </ScrollView>
      )}
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
  confirmText: {
    fontSize: 16,
    color: COLORS.primaryRed,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    margin: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  groupName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryRed,
  },
  childrenContainer: {
    marginLeft: SIZES.padding,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.lightGray,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 8,
  },
  checkbox: {
    marginRight: 12,
  },
  userName: { fontSize: 16, color: COLORS.darkText },
  emptyText: { textAlign: 'center', marginTop: 20, color: COLORS.darkGray },
});

export default UserSelector;