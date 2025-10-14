import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import apiClient from '../../api/client';
import { SIZES, COLORS, globalStyles } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const DraftDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [draft, setDraft] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDraftDetails = useCallback(async () => {
    try {
      const draftRes = await apiClient.get(`/drafts/${id}`);
      setDraft(draftRes.data);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải chi tiết dự thảo.");
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const commentsRes = await apiClient.get(`/drafts/${id}/comments`);
      setComments(commentsRes.data.data); // Giả sử API trả về { data: [...] }
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải danh sách góp ý.");
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDraftDetails(), fetchComments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchDraftDetails, fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.post(`/drafts/${id}/comments`, { content: newComment });
      setComments(prev => [response.data, ...prev]); // Thêm comment mới vào đầu danh sách
      setNewComment('');
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi góp ý.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primaryRed} /></View>;
  }

  if (!draft) {
    return <View style={styles.centered}><Text>Không tìm thấy dự thảo.</Text></View>;
  }

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <Ionicons name="person-circle-outline" size={40} color={COLORS.darkGray} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author.fullName}</Text>
          <Text style={styles.commentDate}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
        </View>
        <Text>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: 'Chi tiết Dự thảo' }} />
      <FlatList
        style={styles.container}
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{draft.title}</Text>
            <Text style={styles.label}>Người tạo: <Text style={styles.value}>{draft.creator.fullName}</Text></Text>
            <Text style={styles.label}>Ngày tạo: <Text style={styles.value}>{new Date(draft.createdAt).toLocaleDateString('vi-VN')}</Text></Text>
            <Text style={styles.sectionTitle}>Nội dung dự thảo</Text>
            <Text style={styles.content}>{draft.content}</Text>
            <Text style={styles.sectionTitle}>Các ý kiến góp ý ({comments.length})</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.noComments}>Chưa có góp ý nào.</Text>}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Nhập ý kiến của bạn..."
          multiline
        />
        <TouchableOpacity onPress={handleAddComment} disabled={isSubmitting} style={styles.sendButton}>
          {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Ionicons name="send" size={24} color={COLORS.white} />}
        </TouchableOpacity>
      </View>
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
  noComments: { textAlign: 'center', fontStyle: 'italic', color: COLORS.darkGray, marginTop: 20 },
  commentItem: { flexDirection: 'row', paddingHorizontal: SIZES.padding, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  commentContent: { flex: 1, marginLeft: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentAuthor: { fontWeight: 'bold', color: COLORS.darkText },
  commentDate: { fontSize: 12, color: COLORS.darkGray },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, borderTopWidth: 1, borderTopColor: COLORS.lightGray, backgroundColor: COLORS.white },
  input: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, maxHeight: 100 },
  sendButton: { backgroundColor: COLORS.primaryRed, borderRadius: 25, width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
});

export default DraftDetailScreen;