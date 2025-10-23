import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { stringify } from 'qs';

const apiClient = axios.create({
  baseURL: `https://api.conghaiso.vn/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // SỬA LỖI: Thêm paramsSerializer để xử lý tham số query dạng mảng
  // Giúp gửi dynamicStatus=['a', 'b'] thành dynamicStatus=a,b đúng chuẩn web yêu cầu
  paramsSerializer: params => stringify(params, { arrayFormat: 'comma' })
});

apiClient.interceptors.request.use(
  async (config) => {
    // SỬA LỖI: Lấy token từ SecureStore, đồng bộ với AuthContext
    const token = await SecureStore.getItemAsync('token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default apiClient;