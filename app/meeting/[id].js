import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { SIZES, COLORS, globalStyles } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import QRScannerModal from '../../components/QRScannerModal'; // IMPORT COMPONENT MỚI

const MeetingDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAttendeesExpanded, setIsAttendeesExpanded] = useState(false);
  const [isScannerVisible, setScannerVisible] = useState(false); // STATE CHO MODAL

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

  // HÀM XỬ LÝ ĐIỂM DANH
  const handleCheckIn = async (scannedData) => {
    setScannerVisible(false); // Đóng scanner ngay lập tức
    
    let parsedQrData;
    try {
      parsedQrData = JSON.parse(scannedData);
    } catch (e) {
      Alert.alert("Lỗi", "Dữ liệu QR không hợp lệ.");
      return;
    }

    const { meetingId: scannedMeetingId, token: qrToken } = parsedQrData;

    // DEBUG: In ra giá trị để kiểm tra
    console.log("Scanned Data (parsed):", parsedQrData);
    console.log("Scanned Meeting ID:", scannedMeetingId, typeof scannedMeetingId);
    console.log("Scanned Token:", qrToken);
    console.log("Current Meeting ID:", meeting?.meeting_id, typeof meeting?.meeting_id);

    // So sánh ID từ QR với ID cuộc họp hiện tại (chuyển cả 2 về String để đảm bảo)
    if (String(scannedMeetingId) !== String(meeting?.meeting_id)) {
      Alert.alert("Lỗi", "Mã QR không hợp lệ hoặc không dành cho cuộc họp này.");
      return;
    }

    if (!qrToken) {
      Alert.alert("Lỗi", "Mã QR thiếu thông tin xác thực.");
      return;
    }

    try {
      // Gửi token trong body của request
      const response = await apiClient.post(`/meetings/${id}/check-in`, { token: qrToken });
      // Backend trả về 200 khi thành công
      if (response.status === 200) {
        Alert.alert("Thành công", response.data.message || "Điểm danh thành công!");
        fetchMeetingDetails(); // Tải lại thông tin để cập nhật trạng thái (nếu có)
      } else {
        throw new Error("Phản hồi từ server không thành công.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Điểm danh thất bại. Bạn có thể đã điểm danh rồi hoặc không có trong danh sách tham dự.";
      Alert.alert("Lỗi", errorMessage);
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
  
  const openDocument = async (fileId) => {
    if (!fileId || fileId === 'chua_co_id') {
      Alert.alert("Thông báo", "Tài liệu này chưa có file đính kèm.");
      return;
    }
    try {
      const response = await apiClient.get(`/meetings/${id}/documents/${fileId}/view-url`);
      const { url } = response.data;
      if (url) {
        await WebBrowser.openBrowserAsync(url);
      } else {
        throw new Error("Không nhận được URL hợp lệ.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở tài liệu. Vui lòng thử lại.");
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
  
  const hasAttendees = meeting?.attendees?.length > 0 && meeting.attendees[0] !== null;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primaryRed} /></View>;
  if (error) return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  if (!meeting) return <View style={styles.centered}><Text>Không tìm thấy cuộc họp.</Text></View>;

  return (
    <>
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: 'Chi tiết Cuộc họp', headerBackTitle: 'Trở về' }} />

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{meeting.title}</Text>
        </View>
        
        {/* NÚT ĐIỂM DANH MỚI */}
        <View style={styles.checkInSection}>
            <TouchableOpacity style={styles.checkInButton} onPress={() => setScannerVisible(true)}>
                <Ionicons name="qr-code-outline" size={20} color={COLORS.white} />
                <Text style={styles.checkInButtonText}>Điểm danh QR</Text>
            </TouchableOpacity>
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
                {(item.documents || []).map(doc => (
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
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                  Người tham dự ({hasAttendees ? meeting.attendees.length : 0})
              </Text>
              {hasAttendees && (
                  <TouchableOpacity onPress={() => setIsAttendeesExpanded(!isAttendeesExpanded)}>
                      <Text style={styles.toggleButtonText}>
                          {isAttendeesExpanded ? 'Thu gọn' : 'Xem tất cả'}
                      </Text>
                  </TouchableOpacity>
              )}
          </View>
          
          {isAttendeesExpanded && hasAttendees && (
              meeting.attendees.map((attendee) => (
                  <View key={attendee.user_id} style={styles.attendeeRow}>
                      <Ionicons name="person-circle-outline" size={24} color={COLORS.darkText} />
                      <Text style={styles.attendeeName}>{attendee.full_name}</Text>
                  </View>
              ))
          )}
          {!hasAttendees && <Text style={styles.noContentText}>Chưa có người tham dự.</Text>}
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
      {/* COMPONENT MODAL ĐƯỢC THÊM VÀO ĐÂY */}
      <QRScannerModal
        visible={isScannerVisible}
        onClose={() => setScannerVisible(false)}
        onCodeScanned={handleCheckIn}
      />
    </>
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
  titleContainer: { backgroundColor: '#eeaaaaff', padding: SIZES.padding },
  title: { fontSize: SIZES.h1 - 4, fontWeight: 'bold', color: COLORS.primaryRed, textAlign: 'center' },
  
  // STYLES CHO NÚT ĐIỂM DANH
  checkInSection: {
    paddingHorizontal: SIZES.padding, // Giữ padding ngang
    paddingVertical: SIZES.padding / 2, // Giảm padding dọc một chút để không quá lớn
    backgroundColor: COLORS.white, // Nền trắng để nút đỏ nổi bật hơn
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
    marginBottom: SIZES.padding / 2, // Thêm khoảng cách dưới nút
  },
  checkInButton: {
    backgroundColor: '#e23636ff', // Lighter red
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding - 4, // Reduced padding
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: 10,
    // Thêm đổ bóng cho Android
    elevation: 3, // Reduced elevation
    // Thêm đổ bóng cho iOS
    shadowColor: '#D9534F',
    shadowOffset: { width: 0, height: 2 }, // Reduced shadow
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  checkInButtonText: {
    color: COLORS.white,
    fontSize: SIZES.h2 - 4, // Reduced font size
    fontWeight: 'bold',
  },

  infoSection: { padding: SIZES.padding, backgroundColor: COLORS.white },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { marginRight: 12 },
  infoLabel: { fontSize: SIZES.body, color: COLORS.darkGray, fontWeight: '600', width: 80 },
  infoValue: { fontSize: SIZES.body, color: COLORS.darkText, flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: SIZES.h2 - 2, fontWeight: 'bold', color: COLORS.primaryRed },
  toggleButtonText: { color: COLORS.primaryRed, fontWeight: 'bold' },
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
