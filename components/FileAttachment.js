import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES } from '../constants/styles';
import apiClient from '../api/client';

const FileAttachment = ({ fileUrl, fileName }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAndOpenFile = async (fileUrl, fileName) => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    try {
      // 1. Tạo đường dẫn lưu file tạm trong máy (encode để tránh lỗi ký tự đặc biệt)
      const safeFileName = encodeURIComponent(fileName);
      const fileUri = `${FileSystem.cacheDirectory}${safeFileName}`;

      // SỬA LỖI: Chuyển sang endpoint /files/view để Backend kiểm tra quyền và JWT
      let downloadUrl = fileUrl;
      if (fileUrl && !fileUrl.startsWith('http')) {
        // fileUrl ở đây là đường dẫn tương đối (ví dụ: 'meetings/...')
        downloadUrl = `${apiClient.defaults.baseURL}/files/view?path=${encodeURIComponent(fileUrl.replace(/^\//, ''))}`;
      } else if (fileUrl && fileUrl.startsWith('http')) {
        // Nếu là URL tuyệt đối, bóc tách lấy path để Backend xử lý chuẩn xác
        try {
          const urlObj = new URL(fileUrl);
          const pathParam = urlObj.pathname.replace(/^\/api\/uploads\//, '').replace(/^\/uploads\//, '');
          downloadUrl = `${apiClient.defaults.baseURL}/files/view?path=${encodeURIComponent(pathParam)}`;
        } catch (e) {
          // Fallback nếu không parse được URL
        }
      }

      // Lấy Token từ SecureStore (do AuthContext đã lưu token ở đây)
      const userToken = await SecureStore.getItemAsync('token');

      // 2. Tải file từ Server về máy kèm Token bảo mật
      const downloadRes = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // 3. Mở file bằng trình xem mặc định của iOS/Android
      if (downloadRes.status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // Xác định mimeType từ đuôi file để Android mở file mượt hơn
          const fileExtension = fileName.split('.').pop().toLowerCase();
          const mimeTypeSuffix = fileExtension === 'pdf' ? 'application/pdf' : 'application/octet-stream';
          
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: mimeTypeSuffix,
            dialogTitle: `Mở tài liệu: ${fileName}`, // Thay đổi tiêu đề hộp thoại
            UTI: fileExtension === 'pdf' ? 'com.adobe.pdf' : undefined, // Hỗ trợ thêm cho iOS
          });
        } else {
          Alert.alert('Lỗi', 'Thiết bị của bạn không hỗ trợ mở file này.');
        }
      } else {
        Alert.alert('Lỗi', 'Không thể tải tài liệu lúc này.');
      }
    } catch (error) {
      console.error('Lỗi tải file:', error);
      Alert.alert('Lỗi', 'Không thể tải tài liệu lúc này.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.fileRow} onPress={() => downloadAndOpenFile(fileUrl, fileName)} disabled={isDownloading}>
      <Ionicons name="document-text" size={24} color={COLORS.primaryRed} />
      
      <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
        {fileName}
      </Text>
      
      {isDownloading && <ActivityIndicator size="small" color={COLORS.primaryRed} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, padding: 10, borderRadius: SIZES.radius, marginBottom: 8, marginTop: 4 },
  fileName: { flex: 1, marginLeft: 10, marginRight: 10, color: COLORS.darkText, fontSize: 16 },
});

export default FileAttachment;