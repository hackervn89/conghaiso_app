import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { SIZES, COLORS, globalStyles } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';

const MeetingDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMeetingDetails();
  }, [id]);

  const fetchMeetingDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/meetings/${id}`);
      setMeeting(response.data);
    } catch (err) {
      setError("Không thể tải thông tin cuộc họp.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận Xóa",
      "Bạn có chắc chắn muốn xóa cuộc họp này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy bỏ", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: async () => {
          try {
            await apiClient.delete(`/meetings/${id}`);
            Alert.alert("Thành công", "Đã xóa cuộc họp thành công.");
            router.back();
          } catch (err) {
            Alert.alert("Lỗi", "Không thể xóa cuộc họp. Vui lòng thử lại.");
          }
        }}
      ]
    );
  };
  
  // --- HÀM MỞ TÀI LIỆU ĐÃ ĐƯỢC NÂNG CẤP HOÀN CHỈNH ---
  const openDocument = async (fileId) => {
    if (!fileId || fileId === 'chua_co_id') {
      Alert.alert("Thông báo", "Tài liệu này chưa có file đính kèm.");
      return;
    }
    try {
      // 1. Gọi API backend để lấy link xem an toàn
      const response = await apiClient.get(`/meetings/${id}/documents/${fileId}/view-url`);
      const { url } = response.data;

      // 2. Mở link bằng WebBrowser
      if (url) {
        await WebBrowser.openBrowserAsync(url);
      } else {
        throw new Error("Không nhận được URL hợp lệ.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở tài liệu. Vui lòng thử lại.");
      console.error("Lỗi khi mở tài liệu:", error);
    }
  };


  const formatDateTime = (isoString) => {
    if (!isoString) return 'Chưa xác định';
    const date = new Date(isoString);
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} - ${day}`;
  };

  let canEditOrDelete = false;
  if (user && meeting) {
    if (user.role === 'Admin') {
      canEditOrDelete = true;
    } else if (user.role === 'Secretary') {
      if (user.managedScopes && user.managedScopes.includes(meeting.org_id)) {
        canEditOrDelete = true;
      }
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primaryRed} /></View>;
  if (error) return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  if (!meeting) return <View style={styles.centered}><Text>Không tìm thấy cuộc họp.</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Chi tiết Cuộc họp', headerBackTitle: 'Trở về' }} />

      <View style={styles.titleContainer}>
        <Text style={styles.title}>{meeting.title}</Text>
      </View>
      
      <View style={styles.infoSection}>
        <InfoRow icon="location-outline" label="Địa điểm:" value={meeting.location} />
        <InfoRow icon="time-outline" label="Bắt đầu:" value={formatDateTime(meeting.start_time)} />
        <InfoRow icon="time-outline" label="Kết thúc:" value={formatDateTime(meeting.end_time)} />
      </View>
      
      <View style={styles.agendaSection}>
        <Text style={styles.sectionTitle}>Chương trình nghị sự</Text>
        {meeting.agenda && meeting.agenda.length > 0 ? (
          meeting.agenda.map((item, index) => (
            <View key={item.agenda_id} style={styles.agendaItem}>
              <Text style={styles.agendaTitle}>{`${index + 1}. ${item.title}`}</Text>
              {item.documents.map(doc => (
                <TouchableOpacity key={doc.doc_id} style={styles.documentRow} onPress={() => openDocument(doc.google_drive_file_id)}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.primaryRed} />
                  <Text style={styles.documentName}>{doc.doc_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.noContentText}>Chưa có chương trình nghị sự.</Text>
        )}
      </View>


      <View style={styles.attendeesSection}>
        <Text style={styles.sectionTitle}>Danh sách tham dự</Text>
        {meeting.attendees && meeting.attendees.length > 0 && meeting.attendees[0] !== null ? (
          meeting.attendees.map((attendee) => (
            <View key={attendee.user_id} style={styles.attendeeRow}>
              <Ionicons name="person-circle-outline" size={24} color={COLORS.darkText} />
              <Text style={styles.attendeeName}>{attendee.full_name}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noContentText}>Chưa có người tham dự.</Text>
        )}
      </View>
      
      {canEditOrDelete && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={() => router.push(`/meeting/edit/${meeting.meeting_id}`)}
          >
            <Ionicons name="pencil-outline" size={20} color={COLORS.primaryRed} />
            <Text style={[styles.actionButtonText, { color: COLORS.primaryRed }]}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color={COLORS.primaryRed} style={styles.icon} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  titleContainer: { backgroundColor: COLORS.primaryRed, padding: SIZES.padding },
  title: { fontSize: SIZES.h1 - 4, fontWeight: 'bold', color: COLORS.white, textAlign: 'center' },
  infoSection: { padding: SIZES.padding },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { marginRight: 12 },
  infoLabel: { fontSize: SIZES.body, color: COLORS.darkGray, fontWeight: '600', width: 80 },
  infoValue: { fontSize: SIZES.body, color: COLORS.darkText, flex: 1 },
  sectionTitle: { fontSize: SIZES.h2 - 2, fontWeight: 'bold', color: COLORS.primaryRed, marginBottom: 16 },
  agendaSection: { padding: SIZES.padding, borderTopWidth: 8, borderTopColor: COLORS.lightGray },
  agendaItem: { marginBottom: 16 },
  agendaTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.darkText, marginBottom: 8 },
  documentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, padding: 10, borderRadius: SIZES.radius, marginTop: 4 },
  documentName: { marginLeft: 10, fontSize: 16, color: COLORS.darkText },
  attendeesSection: { padding: SIZES.padding, marginTop: 8, borderTopWidth: 8, borderTopColor: COLORS.lightGray },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: COLORS.lightGray, padding: 8, borderRadius: SIZES.radius },
  attendeeName: { marginLeft: 10, fontSize: SIZES.body },
  noContentText: { fontStyle: 'italic', color: COLORS.darkGray },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.error },
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: SIZES.padding, borderTopWidth: 1, borderTopColor: COLORS.mediumGray, backgroundColor: COLORS.lightGray },
  actionButton: { flex: 1, flexDirection: 'row', gap: 8, height: 50, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center' },
  actionButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  editButton: { marginRight: 8, backgroundColor: COLORS.white, borderColor: COLORS.primaryRed, borderWidth: 2 },
  deleteButton: { marginLeft: 8, backgroundColor: COLORS.primaryRed },
});

export default MeetingDetailScreen;

