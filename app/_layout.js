import { AuthProvider, useAuth } from '../context/AuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'login';
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  return (
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="meeting/[id]" />
        <Stack.Screen 
          name="meeting/create" 
          options={{ title: "Tạo Cuộc họp mới", presentation: 'modal' }} 
        />
        {/* Đăng ký màn hình Sửa cuộc họp mới */}
        <Stack.Screen 
          name="meeting/edit/[id]" 
          options={{ title: "Chỉnh sửa Cuộc họp", presentation: 'modal' }} 
        />
      </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const MainContent = () => {
  const { isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C00000" />
      </View>
    );
  }
  return <RootLayoutNav />;
}

