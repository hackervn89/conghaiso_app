import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { COLORS, SIZES } from '../constants/styles';

const SkeletonPiece = ({ style }) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // Hiệu ứng nhấp nháy
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1, // Lặp lại vô hạn
      true // Đảo ngược animation
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return <Animated.View style={[styles.skeleton, animatedStyle, style]} />;
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