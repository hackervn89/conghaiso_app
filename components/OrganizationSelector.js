import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/styles';
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
        <View>
            <View style={[styles.orgRow, { marginLeft: level * 10 }]}>
                <TouchableOpacity style={styles.orgTouchable} onPress={() => onSelectionChange(org.org_id)}>
                    <Checkbox
                        style={styles.checkbox}
                        value={selectedIds.has(org.org_id)}
                        onValueChange={() => onSelectionChange(org.org_id)}
                        color={selectedIds.has(org.org_id) ? COLORS.primaryRed : undefined}
                    />
                    <Text style={styles.orgName}>{org.org_name}</Text>
                </TouchableOpacity>
                {org.children && org.children.length > 0 && (
                    <TouchableOpacity onPress={() => setIsExpanded(prev => !prev)} style={{ padding: 5 }}>
                        <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={COLORS.darkGray} />
                    </TouchableOpacity>
                )}
            </View>
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

    useEffect(() => {
        apiClient.get('/organizations').then(res => {
            setOrganizations(res.data);
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
    orgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    orgTouchable: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    checkbox: { marginRight: 12 },
    orgName: { fontSize: 16, color: COLORS.darkText },
    childContainer: { marginLeft: SIZES.padding, borderLeftWidth: 1, borderLeftColor: COLORS.lightGray },
});

export default OrganizationSelector;