import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/styles';
import AppHeader from '../../components/AppHeader'; // Sửa đường dẫn import

// Component cho nút bộ lọc
const FilterTasksButton = () => {
  // Nút này sẽ được quản lý bởi Stack.Screen trong file tasks.js
  // Chúng ta chỉ cần một placeholder ở đây hoặc có thể để trống
  // vì logic mở modal đã nằm trong file tasks.js
  // Tuy nhiên, để đảm bảo tính nhất quán, chúng ta vẫn giữ nó ở đây
  // và logic thực sự sẽ được ghi đè bởi Stack.Screen trong tasks.js
  return null; 
};

// Component cho nút thêm cuộc họp mới
const AddMeetingButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/meeting/create')} style={{ marginRight: 15 }}>
      <Ionicons name="add-circle-outline" size={32} color={COLORS.primaryRed} />
    </TouchableOpacity>
  );
};
// Component cho nút thêm dự thảo mới
const AddDraftButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/draft/create')} style={{ marginRight: 15 }}>
      <Ionicons name="add-circle-outline" size={32} color={COLORS.primaryRed} />
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
        tabBarActiveTintColor: COLORS.primaryRed,
        header: ({ options }) => <AppHeader title={options.title} RightActions={options.headerRight} />
      }}>
      <Tabs.Screen name="index" options={{ 
          title: 'Cuộc họp', 
          tabBarIcon: ({ color }) => <Ionicons size={28} name="people-outline" color={color} />,
          headerRight: () => <AddMeetingButton />
        }} />
      <Tabs.Screen name="tasks" options={{ 
          title: 'Công việc', 
          tabBarIcon: ({ color }) => <Ionicons size={28} name="briefcase-outline" color={color} />,
          // Giả định có nút Filter ở đây
          headerRight: () => <FilterTasksButton />
        }} />
      <Tabs.Screen name="drafts" options={{ 
          title: 'Dự thảo', 
          tabBarIcon: ({ color }) => <Ionicons size={28} name="document-text-outline" color={color} />,
          headerRight: () => <AddDraftButton />
        }} />
      <Tabs.Screen name="profile" options={{ 
          title: 'Cá nhân', 
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person-circle-outline" color={color} />,
          headerRight: null // Không có nút hành động bên phải cho tab này
        }} />
    </Tabs>
  );
}