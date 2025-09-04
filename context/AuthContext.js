import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // API /auth/me giờ đã trả về đủ thông tin
          const { data } = await apiClient.get('/auth/me');
          setUser(data);
        }
      } catch (e) {
        console.error("Phiên đăng nhập không hợp lệ:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserFromStorage();
  }, []);

  const signIn = async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await SecureStore.setItemAsync('token', token);
      setUser(userData); // userData từ API login đã có managedScopes
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (e) {
      console.error("Lỗi khi đăng xuất:", e);
    }
  };

  const value = { user, isLoading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};