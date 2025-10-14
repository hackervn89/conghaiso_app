import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, globalStyles } from '../constants/styles';
import apiClient from '../api/client';
import Checkbox from 'expo-checkbox';

// Component con để hiển thị từng đơn vị (đệ quy)
const OrgItem = ({ org, selectedIds, onSelectionChange, level = 0, searchQuery }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2);
    
    // Sử dụng useMemo để tính toán xem nhánh này có nên hiển thị không.
    // Một nhánh sẽ hiển thị nếu:
    // 1. Không có tìm kiếm.
    // 2. Tên của nó khớp với tìm kiếm.
    // 3. Bất kỳ con nào của nó khớp với tìm kiếm.
    const isVisible = useMemo(() => {
        if (!searchQuery) return true;
        const checkVisibility = (o) => {
            if (o.org_name.toLowerCase().includes(searchQuery)) return true;
            if (o.children) {
                return o.children.some(checkVisibility);
            }
            return false;
        };
        return checkVisibility(org);
    }, [org, searchQuery]);
    
    if (!isVisible) {
        return null; // Quan trọng: Nếu cả nhánh không khớp, không render gì cả.
    }
    
    return (
        <View style={{ marginLeft: level * 15 }}>
            <TouchableOpacity 
                style={[styles.orgRow, selectedIds.has(org.org_id) && styles.selectedOrgRow]} 
                onPress={() => onSelectionChange(org.org_id)}
            >
                <View style={styles.orgTouchable}>
                    <Ionicons 
                        name={selectedIds.has(org.org_id) ? 'checkbox' : 'square-outline'} 
                        size={24} 
                        color={selectedIds.has(org.org_id) ? COLORS.primaryRed : COLORS.darkGray} 
                    />
                    <Text style={styles.orgName} numberOfLines={1}>{org.org_name}</Text>
                </View>
                {org.children && org.children.length > 0 && (
                    <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={20} color={COLORS.darkGray} />
                )}
            </TouchableOpacity>
            {isExpanded && org.children && org.children.length > 0 && (
                <View style={styles.childContainer}>
                    {org.children.map(childOrg => (
                        <OrgItem
                            key={childOrg.org_id}
                            org={childOrg}
                            selectedIds={selectedIds}
                            onSelectionChange={onSelectionChange}
                            level={level + 1}
                            searchQuery={searchQuery}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const OrganizationSelector = ({ initialSelectedIds = [], onSelectionChange, onClose, allowMultiSelect = true, title = "Chọn đơn vị" }) => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));
    const [allOrgIds, setAllOrgIds] = useState([]); // Lưu tất cả ID để dùng cho "Chọn tất cả"

    useEffect(() => {
        apiClient.get('/organizations').then(res => {
            setOrganizations(res.data);
            // Lấy tất cả ID của các đơn vị
            const ids = [];
            const collectIds = (orgs) => {
                orgs.forEach(org => {
                    ids.push(org.org_id);
                    if (org.children) {
                        collectIds(org.children);
                    }
                });
            };
            collectIds(res.data);
            setAllOrgIds(ids);
        }).catch(err => {
            console.error("Lỗi khi tải danh sách đơn vị:", err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);
    const handleSelection = (orgId) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(orgId)) {
            newSelection.delete(orgId);
        } else {
            if (!allowMultiSelect) {
                newSelection.clear();
            }
            newSelection.add(orgId);
        }
        setSelectedIds(newSelection);
    };

    const handleSelectAll = () => {
        setSelectedIds(new Set(allOrgIds));
    };

    const handleClearAll = () => {
        setSelectedIds(new Set());
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
                <TextInput style={styles.searchInput} placeholder="Tìm kiếm theo tên đơn vị..." value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color={COLORS.primaryRed} />
            ) : (
                <ScrollView>
                    {organizations.map(org => (
                        <OrgItem
                            key={org.org_id}
                            org={org}
                            selectedIds={selectedIds}
                            onSelectionChange={handleSelection}
                            searchQuery={searchQuery.toLowerCase()}
                        />
                    ))}
                </ScrollView>
            )}

            {/* Footer với các nút hành động */}
            {!loading && (
                <View style={styles.footer}>
                    <TouchableOpacity style={globalStyles.buttonOutline} onPress={handleSelectAll}>
                        <Text style={globalStyles.buttonOutlineText}>Chọn tất cả</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[globalStyles.buttonOutline, { borderColor: COLORS.darkGray }]} onPress={handleClearAll}>
                        <Text style={[globalStyles.buttonOutlineText, { color: COLORS.darkGray }]}>Bỏ chọn</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
    title: { fontSize: SIZES.h2, fontWeight: 'bold' },
    confirmText: { fontSize: 16, color: COLORS.primaryRed, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: SIZES.radius, margin: SIZES.padding, paddingHorizontal: SIZES.padding },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 45 },
    orgRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 12, 
        paddingHorizontal: SIZES.padding,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    selectedOrgRow: {
        backgroundColor: '#FEF2F2', // Màu nền đỏ nhạt
        borderLeftColor: COLORS.primaryRed,
        borderLeftWidth: 4,
    },
    orgTouchable: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    orgName: { fontSize: 16, color: COLORS.darkText, marginLeft: 12, flex: 1 },
    childContainer: { borderLeftWidth: 1, borderLeftColor: '#E5E7EB', marginLeft: SIZES.padding },
    footer: { flexDirection: 'row', justifyContent: 'space-around', padding: SIZES.padding, borderTopWidth: 1, borderTopColor: COLORS.lightGray, backgroundColor: COLORS.white },
});

export default OrganizationSelector;