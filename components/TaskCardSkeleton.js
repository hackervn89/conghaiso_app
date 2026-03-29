import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES } from '../constants/styles';

const SkeletonPiece = ({ style }) => {
  // Sử dụng Animated mặc định của React Native
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Hiệu ứng nhấp nháy an toàn
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true, // Tối ưu hóa hiệu năng
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { opacity }, style]} />;
};

const TaskCardSkeleton = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
            <SkeletonPiece style={{ width: '80%', height: 20, borderRadius: SIZES.radius, marginBottom: 8 }} />
            <SkeletonPiece style={{ width: '60%', height: 20, borderRadius: SIZES.radius }} />
        </View>
        <SkeletonPiece style={{ width: 80, height: 24, borderRadius: SIZES.radius }} />
      </View>
      <View style={styles.cardBody}>
        <SkeletonPiece style={{ width: '90%', height: 16, marginBottom: 10, borderRadius: SIZES.radius }} />
        <SkeletonPiece style={{ width: '80%', height: 16, marginBottom: 10, borderRadius: SIZES.radius }} />
        <SkeletonPiece style={{ width: '60%', height: 16, marginBottom: 10, borderRadius: SIZES.radius }} />
        <SkeletonPiece style={{ width: '50%', height: 16, borderRadius: SIZES.radius }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB', // lightGray
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding / 2,
    // Thêm các thuộc tính shadow để thẻ Skeleton nhìn giống thẻ thật
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
    borderLeftWidth: 5,
    borderLeftColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
});

export default TaskCardSkeleton;