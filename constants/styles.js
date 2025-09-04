import { StyleSheet } from 'react-native';

// Bảng màu chủ đạo của ứng dụng
export const COLORS = {
  primaryRed: '#C00000', // Màu đỏ cờ, trang trọng
  white: '#FFFFFF',
  lightGray: '#F5F5F5', // Màu nền nhẹ nhàng
  mediumGray: '#DDDDDD', // Màu viền
  darkGray: '#A9A9A9',   // Màu chữ phụ, placeholder
  darkText: '#333333',   // Màu chữ chính
  success: '#28a745',
  error: '#dc3545',
};

// Kích thước chuẩn
export const SIZES = {
  h1: 28,
  h2: 22,
  body: 16,
  input: 16,
  radius: 8,
  padding: 16,
};

// Stylesheet toàn cục để tái sử dụng
export const globalStyles = StyleSheet.create({
  // --- Bố cục ---
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: SIZES.padding,
    justifyContent: 'center',
  },
  // --- Chữ ---
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.primaryRed,
    textAlign: 'center',
    marginBottom: 32,
  },
  // --- Form Controls ---
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  input: {
    height: 50,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    fontSize: SIZES.input,
    borderColor: COLORS.mediumGray,
    borderWidth: 1,
  },
  button: {
    height: 50,
    backgroundColor: COLORS.primaryRed,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
