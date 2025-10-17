import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

async function registerForPushNotificationsAsync() {
  let token;
  console.log('[PushToken] Bắt đầu quy trình đăng ký...');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log('[PushToken] Trạng thái quyền hiện tại:', existingStatus);

    if (existingStatus !== 'granted') {
      console.log('[PushToken] Đang xin quyền...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushToken] Người dùng đã từ chối quyền nhận thông báo.');
      // Alert.alert('Thông báo', 'Bạn đã không cấp quyền nhận thông báo, một số tính năng có thể bị hạn chế.');
      return;
    }

    console.log('[PushToken] Đang lấy Expo Push Token...');
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: "1263db86-5f00-46d9-aa6f-504761af4ab5", // Lấy từ app.json
    });
    token = expoPushToken.data;
    console.log('[PushToken] Lấy token thành công:', token);
  } else {
    console.warn('[PushToken] Phải sử dụng thiết bị thật để nhận thông báo đẩy.');
  }

  return token;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const taskId = response.notification.request.content.data.taskId;
      if (taskId) {
        console.log('[NotificationTap] Nhận được taskId:', taskId, 'Đang điều hướng...');
        router.push(`/task/${taskId}`);
      } else {
        console.log('[NotificationTap] Không tìm thấy taskId trong thông báo.');
      }
    });

    return () => subscription.remove();
  }, [router]);
  
  const handlePushTokenRegistration = async (retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          console.log(`[AuthContext] (Lần thử ${i + 1}) Chuẩn bị gửi Push Token...`);
          await apiClient.post('/users/push-token', { token: pushToken });
          console.log(`[AuthContext] (Lần thử ${i + 1}) Đã gửi Push Token thành công.`);
          return; // Thoát khỏi hàm nếu thành công
        }
      } catch (error) {
        console.error(`[AuthContext] (Lần thử ${i + 1}) Lỗi đăng ký Push Token:`, error.message);
        // Kiểm tra xem có phải lỗi tạm thời từ server Expo không (5xx)
        const isTransientError = error.message.includes('503') || error.message.includes('500');
        
        // Nếu là lần thử cuối cùng hoặc không phải lỗi tạm thời, thì dừng lại
        if (i === retries - 1 || !isTransientError) {
          console.error('[AuthContext] Không thể đăng ký Push Token sau nhiều lần thử.');
          return;
        }
        // Chờ một chút trước khi thử lại
        await new Promise(res => setTimeout(res, delay * (i + 1)));
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          // SỬA LỖI: Lưu toàn bộ đối tượng user trả về từ API
          setUser(response.data);
          await handlePushTokenRegistration();
        } catch (e) {
            console.error("[AuthContext] Lỗi khi xác thực token:", e);
            await SecureStore.deleteItemAsync('token');
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const signIn = useCallback(async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      // SỬA LỖI QUAN TRỌNG: Phải lưu token vào SecureStore để duy trì phiên đăng nhập
      await SecureStore.setItemAsync('token', token);
      // SỬA LỖI: Lưu toàn bộ đối tượng user
      setUser(userData); 
      await handlePushTokenRegistration();
      return userData;
    } catch (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        // Chỉ cần gọi API /api/auth/logout
        // Backend sẽ tự động xử lý việc xóa push token
        await apiClient.post('/auth/logout');
      }
    } catch(e) {
      // Có thể ghi log lỗi ở đây, nhưng không cần thông báo cho người dùng
      // vì block `finally` vẫn sẽ đảm bảo người dùng được đăng xuất khỏi app.
      console.error("Lỗi khi gọi API đăng xuất:", e);
    } finally {
        // Logic này đã đúng và cần được giữ nguyên
        await SecureStore.deleteItemAsync('token');
        setUser(null);
    }
}, []);


  const value = { user, isLoading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};