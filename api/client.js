import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// THAY ĐỔI ĐỊA CHỈ IP CỦA MÁY TÍNH BẠN VÀO ĐÂY
const YOUR_COMPUTER_IP_ADDRESS = '192.168.1.52'; 

const apiClient = axios.create({
  baseURL: `http://${YOUR_COMPUTER_IP_ADDRESS}:3000/api`,
  headers: {
    'Content-Type': 'application/json',
  },
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