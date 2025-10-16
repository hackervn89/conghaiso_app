import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Địa chỉ IP của server backend
const YOUR_COMPUTER_IP_ADDRESS = '103.1.236.206'; 

const apiClient = axios.create({
  baseURL: `http://${YOUR_COMPUTER_IP_ADDRESS}:5000/api`,
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