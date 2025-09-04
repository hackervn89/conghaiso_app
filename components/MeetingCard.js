import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';

const MeetingCard = ({ meeting, onPress }) => {
  // Hàm để định dạng lại ngày giờ cho dễ đọc
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} - ${day}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{meeting.title}</Text>
      
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color={COLORS.darkGray} />
        <Text style={styles.infoText}>{meeting.location}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color={COLORS.darkGray} />
        <Text style={styles.infoText}>{formatDateTime(meeting.start_time)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primaryRed,
    // Thêm hiệu ứng đổ bóng cho đẹp hơn
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryRed, // Cập nhật màu tiêu đề
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.darkGray,
  },
});

export default MeetingCard;