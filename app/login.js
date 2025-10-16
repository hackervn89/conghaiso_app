import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { globalStyles, COLORS } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons'; // Import thư viện icon
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State mới để quản lý việc ẩn/hiện mật khẩu
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // State mới để quản lý việc lưu tài khoản
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn } = useAuth();

  // useEffect để tải thông tin đăng nhập đã lưu khi mở ứng dụng
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedCredentials = await AsyncStorage.getItem('credentials');
        if (savedCredentials) {
          const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
          setUsername(savedUsername);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin đăng nhập:", error);
      }
    };
    loadCredentials();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await signIn(username, password);
      // Xử lý lưu hoặc xóa thông tin đăng nhập
      if (rememberMe) {
        await AsyncStorage.setItem('credentials', JSON.stringify({ username, password }));
      } else {
        await AsyncStorage.removeItem('credentials');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      Alert.alert('Đăng nhập thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.lightGray }}>
      <StatusBar barStyle="dark-content" />
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>CÔNG HẢI SỐ</Text>

        <View style={globalStyles.inputContainer}>
          <TextInput
            style={globalStyles.input}
            placeholder="Tên đăng nhập"
            placeholderTextColor={COLORS.darkGray}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* Khung nhập mật khẩu mới với icon */}
        <View style={[globalStyles.input, styles.passwordContainer]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mật khẩu"
            placeholderTextColor={COLORS.darkGray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Checkbox Lưu tài khoản */}
        <TouchableOpacity style={styles.rememberMeContainer} onPress={() => setRememberMe(!rememberMe)}>
          <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={24} color={COLORS.darkGray} />
          <Text style={styles.rememberMeText}>Lưu tài khoản</Text>
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={globalStyles.buttonText}>ĐĂNG NHẬP</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Stylesheet cục bộ cho các thành phần mới
const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'flex-start', // Căn sang lề trái
  },
  rememberMeText: {
    marginLeft: 8,
    color: COLORS.darkText,
    fontSize: 16,
  },
});

export default LoginScreen;
