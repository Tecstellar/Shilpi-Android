import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { QrScannerScreen } from './src/screens/QrScannerScreen';
import { Colors } from './src/theme/colors';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'qr_scanner'>('dashboard');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {activeScreen === 'dashboard' ? (
        <DashboardScreen
          onOpenQrScanner={() => setActiveScreen('qr_scanner')}
          onNewBooking={() => console.log('New booking')}
        />
      ) : (
        <QrScannerScreen
          onSuccess={() => setActiveScreen('dashboard')}
          onCancel={() => setActiveScreen('dashboard')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
