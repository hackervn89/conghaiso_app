import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { COLORS, SIZES } from '../constants/styles';

const AppHeader = ({ title, RightActions }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {RightActions && (
          <View style={styles.actionsContainer}>
            <RightActions />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
    // Thêm một đường viền mỏng để phân tách header với nội dung
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // lightGray
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    height: 60, // Chiều cao cố định cho header
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.primaryRed,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AppHeader;