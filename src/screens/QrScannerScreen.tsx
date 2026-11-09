import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../theme/colors';
import { apiClient } from '../services/apiClient';

interface QrScannerScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const QrScannerScreen: React.FC<QrScannerScreenProps> = ({ onSuccess, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera permission is required to link with your Web Terminal.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
          <Text style={styles.actionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || authorizing) return;
    setScanned(true);

    try {
      const payload = JSON.parse(data);
      if (payload.app !== 'shilpi' || payload.action !== 'link_terminal' || !payload.sessionId) {
        Alert.alert('Invalid QR Code', 'This is not a valid Shilpi Web Terminal QR code.', [
          { text: 'Retry', onPress: () => setScanned(false) },
        ]);
        return;
      }

      setAuthorizing(true);

      // Send authorization request with current mobile session
      const response = await apiClient.post('/auth/qr/authorize', {
        sessionId: payload.sessionId,
      });

      if (response.data.success) {
        Alert.alert('Terminal Linked', 'Web terminal has been authenticated successfully.', [
          { text: 'OK', onPress: onSuccess },
        ]);
      } else {
        throw new Error(response.data.error?.message || 'Authorization failed');
      }
    } catch (err: any) {
      Alert.alert('Pairing Error', err.message || 'Could not link with web terminal.', [
        { text: 'Retry', onPress: () => setScanned(false) },
      ]);
    } finally {
      setAuthorizing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Web Terminal QR</Text>
        <Text style={styles.subtitle}>Point your camera at the QR code displayed on the Shilpi website.</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
        <View style={styles.overlayFrame} />
      </View>

      <View style={styles.footer}>
        {authorizing ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    padding: 24,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  overlayFrame: {
    position: 'absolute',
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    borderColor: Colors.primary,
    borderWidth: 2,
    borderRadius: 12,
  },
  footer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  actionBtnText: {
    color: '#000',
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  permissionText: {
    color: Colors.textPrimary,
    textAlign: 'center',
    fontSize: 15,
  },
});
