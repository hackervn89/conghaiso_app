
import React, { useState } from 'react';
import { View, Modal, StyleSheet, Button, Text, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SIZES } from '../constants/styles';

const QRScannerModal = ({ visible, onClose, onCodeScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Chúng tôi cần quyền truy cập camera để quét mã QR.</Text>
          <Button onPress={requestPermission} title="Cấp quyền" />
          <View style={{ marginTop: 10 }}>
            <Button onPress={onClose} title="Hủy" color={COLORS.darkGray} />
          </View>
        </View>
      </Modal>
    );
  }

  const handleBarCodeScanned = ({ type, data }) => {
    onCodeScanned(data);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Lớp phủ (overlay) được đặt ở đây, bên trên CameraView */}
        <View style={styles.overlayContainer}>
          <View style={styles.layerTop} />
          <View style={styles.layerCenter}>
            <View style={styles.layerLeft} />
            <View style={styles.focused} />
            <View style={styles.layerRight} />
          </View>
          <View style={styles.layerBottom} />
        </View>

        <View style={styles.closeButtonContainer}>
            <Button onPress={onClose} title="Đóng" color="white" />
        </View>
      </View>
    </Modal>
  );
};

const opacity = 'rgba(0, 0, 0, .6)';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: SIZES.body,
    marginBottom: SIZES.padding,
  },
  // Style mới cho container của lớp phủ
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: COLORS.primaryRed,
    borderRadius: SIZES.radius
  },
  layerTop: {
    flex: 2,
    backgroundColor: opacity
  },
  layerCenter: {
    flex: 3,
    flexDirection: 'row'
  },
  layerLeft: {
    flex: 1,
    backgroundColor: opacity
  },
  focused: {
    flex: 8,
    borderColor: COLORS.primaryRed,
    borderWidth: 2,
    borderRadius: SIZES.radius,
  },
  layerRight: {
    flex: 1,
    backgroundColor: opacity
  },
  layerBottom: {
    flex: 2,
    backgroundColor: opacity
  },
});

export default QRScannerModal;
