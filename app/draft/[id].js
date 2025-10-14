import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import apiClient from '../../api/client';
import { SIZES, COLORS, globalStyles } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const DraftDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);

  const fetchDraftDetails = useCallback(async () => {
    try {
      const draftRes = await apiClient.get(`/drafts/${id}`);
      setDraft(draftRes.data);
      // Góp ý đã được tích hợp sẵn trong draftRes.data.comments
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải chi tiết dự thảo.");
      console.error("Lỗi tải chi tiết dự thảo:", err.response?.data || err);
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDraftDetails();
      setLoading(false);
    };
    if (id) {
      loadData();
    }
  }, [id, fetchDraftDetails]);

  const handleAddComment = async (commentContent) => {
    if (!commentContent.trim()) { Alert.alert("Lỗi", "Nội dung góp ý không được để trống."); return; }
    setIsSubmitting(true);
    try {
      // SỬA LỖI: Backend mong đợi key là 'comment', không phải 'content'
      await apiClient.post(`/drafts/${id}/comments`, { comment: commentContent });
      Alert.alert("Thành công", "Gửi góp ý thành công.");
      setCommentModalVisible(false); // Đóng modal
      fetchDraftDetails(); // Tải lại dữ liệu để cập nhật trạng thái
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Không thể gửi góp ý.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAgree = async () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn thống nhất với nội dung dự thảo này không?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đồng ý", onPress: async () => {
            try {
              await apiClient.post(`/drafts/${id}/agree`);
              Alert.alert("Thành công", "Bạn đã xác nhận thống nhất với dự thảo.");
              fetchDraftDetails(); // Tải lại để cập nhật trạng thái
            } catch (error) {
              Alert.alert("Lỗi", error.response?.data?.message || "Không thể thực hiện hành động này.");
            }
        }}
      ]
    );
  };

  const handleOpenFile = async (file) => {
    // Backend chưa có endpoint để lấy URL xem trước cho tệp dự thảo.
    // Tạm thời, chúng ta sẽ xây dựng URL dựa trên cấu trúc đã biết.
    // Ví dụ: http://<your-server-address>/uploads/drafts/<draft_id>/<file_name>
    // Cần thay thế bằng endpoint chính thức khi backend cung cấp.
    try {
      // Giả định file.file_path là đường dẫn tương đối từ backend, ví dụ: 'uploads/drafts/123/document.pdf'
      const fileUrl = `${apiClient.defaults.baseURL}/${file.file_path}`;
      console.log("Opening file URL:", fileUrl);
      await WebBrowser.openBrowserAsync(fileUrl);
    } catch (error) {
      console.error("Lỗi khi mở tệp:", error);
      Alert.alert("Lỗi", "Không thể mở tệp. Vui lòng kiểm tra lại đường dẫn hoặc kết nối mạng.");
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primaryRed} /></View>;
  }

  if (!draft) {
    return <View style={styles.centered}><Text>Không tìm thấy dự thảo.</Text></View>;
  }

  // Lấy trạng thái của người dùng hiện tại
  // SỬA LỖI: So sánh ID người dùng, xử lý cả trường hợp user.userId (camelCase) và user.user_id (snake_case)
  const currentUserId = user?.user_id || user?.userId;
  const currentUserParticipant = draft.participants?.find(p => p.user_id == currentUserId);
  const canCommentOrAgree = currentUserParticipant && currentUserParticipant.status === 'cho_y_kien';
  const canViewComments = user.role === 'Admin' || user.role === 'Secretary' || draft.creator_id === user.user_id;

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <Ionicons name="person-circle-outline" size={40} color={COLORS.darkGray} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.full_name}</Text>
          <Text style={styles.commentDate}>{new Date(item.created_at).toLocaleString('vi-VN')}</Text>
        </View>
        {/* Backend trả về trường 'comment' */}
        <Text>{item.comment}</Text>
      </View>
    </View>
  );

  // Component Modal để nhập góp ý
  const CommentInputModal = ({ visible, onClose, onSubmit }) => {
    const [commentText, setCommentText] = useState('');

    const handleSubmit = () => {
      onSubmit(commentText);
      // Không reset text ở đây. Việc reset sẽ được xử lý bởi component cha sau khi submit thành công.
    };

    return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nội dung góp ý</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập nội dung góp ý của bạn..."
              multiline
              value={commentText}
              onChangeText={setCommentText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onClose}>
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalButtonText}>Gửi</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: 'Chi tiết Dự thảo' }} />
      <FlatList
        style={styles.container}
        data={canViewComments ? draft.comments : []}
        renderItem={renderCommentItem}
        keyExtractor={(item, index) => `${item.user_id}-${index}`}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{draft.title}</Text>
            <Text style={styles.label}>Người tạo: <Text style={styles.value}>{draft.creator_name}</Text></Text>
            <Text style={styles.label}>Hạn góp ý: <Text style={styles.value}>{new Date(draft.deadline).toLocaleDateString('vi-VN')}</Text></Text>
            
            <Text style={styles.sectionTitle}>Tài liệu đính kèm</Text>
            {draft.attachments && draft.attachments.length > 0 ? (
              draft.attachments.map(file => (
                <TouchableOpacity key={file.attachment_id} style={styles.fileRow} onPress={() => handleOpenFile(file)}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.primaryRed} />
                  <Text style={styles.fileName}>{file.file_name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noComments}>Không có tài liệu đính kèm.</Text>
            )}

            <Text style={styles.sectionTitle}>Các ý kiến góp ý ({draft.comments?.length || 0})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{paddingHorizontal: SIZES.padding}}>
            {canViewComments 
              ? <Text style={styles.noComments}>Chưa có góp ý nào.</Text>
              : <Text style={styles.noComments}>Bạn không có quyền xem các góp ý.</Text>
            }
          </View>
        }
      />
      {/* Chỉ hiển thị ô nhập liệu khi người dùng có quyền */}
      {canCommentOrAgree && (
        <View style={styles.actionFooter}>
          <TouchableOpacity onPress={() => setCommentModalVisible(true)} style={[styles.footerButton, styles.commentButton]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.white} />
            <Text style={styles.footerButtonText}>Góp ý</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAgree} style={[styles.footerButton, styles.agreeButton]}>
            <Ionicons name="checkmark-done-outline" size={20} color={COLORS.white} />
            <Text style={styles.footerButtonText}>Thống nhất</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal nhập liệu */}
      {canCommentOrAgree && (
        <CommentInputModal visible={commentModalVisible} onClose={() => setCommentModalVisible(false)} onSubmit={handleAddComment} />
      )}
      
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: COLORS.white },
  headerContainer: { padding: SIZES.padding },
  title: { fontSize: SIZES.h1 - 2, fontWeight: 'bold', color: COLORS.primaryRed, marginBottom: 16 },
  label: { fontSize: 15, color: COLORS.darkGray, marginBottom: 4 },
  value: { fontWeight: '600', color: COLORS.darkText },
  sectionTitle: { fontSize: SIZES.h3, fontWeight: 'bold', color: COLORS.primaryRed, marginTop: 24, marginBottom: 8, borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: 16 },
  content: { fontSize: 16, lineHeight: 24, color: COLORS.darkText },
  fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, padding: 10, borderRadius: SIZES.radius, marginBottom: 8 },
  fileName: { flex: 1, marginLeft: 10, marginRight: 10, color: COLORS.darkText },
  noComments: { textAlign: 'center', fontStyle: 'italic', color: COLORS.darkGray, marginTop: 20 },
  commentItem: { flexDirection: 'row', paddingHorizontal: SIZES.padding, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  commentContent: { flex: 1, marginLeft: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentAuthor: { fontWeight: 'bold', color: COLORS.darkText },
  commentDate: { fontSize: 12, color: COLORS.darkGray },
  actionFooter: { flexDirection: 'row', padding: SIZES.padding, borderTopWidth: 1, borderTopColor: COLORS.lightGray, backgroundColor: COLORS.white, gap: SIZES.padding },
  footerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: SIZES.radius, elevation: 2 },
  footerButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  commentButton: { backgroundColor: COLORS.primaryRed },
  agreeButton: { backgroundColor: COLORS.success },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  modalContainer: { width: '100%', backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: SIZES.padding },
  modalTitle: { fontSize: SIZES.h3, fontWeight: 'bold', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: COLORS.mediumGray, borderRadius: SIZES.radius, padding: 12, minHeight: 120, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: SIZES.radius },
  modalButtonCancel: { backgroundColor: COLORS.mediumGray },
  modalButtonSubmit: { backgroundColor: COLORS.primaryRed },
  modalButtonText: { color: COLORS.white, fontWeight: 'bold' },
});

export default DraftDetailScreen;