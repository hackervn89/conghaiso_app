import axios from 'axios';

// THAY ĐỔI ĐỊA CHỈ IP CỦA MÁY TÍNH BẠN VÀO ĐÂY
const YOUR_COMPUTER_IP_ADDRESS = '192.168.1.62'; 

const apiClient = axios.create({
  baseURL: `http://${YOUR_COMPUTER_IP_ADDRESS}:3000/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;