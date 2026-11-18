import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginPhoneScreen } from './src/screens/LoginPhoneScreen';
import { LoginOtpScreen } from './src/screens/LoginOtpScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { MainAppContainer } from './src/screens/MainAppContainer';
import { QrScannerScreen } from './src/screens/QrScannerScreen';
import { NearestBeauticiansScreen } from './src/screens/NearestBeauticiansScreen';
import { ThemeProvider } from './src/theme/ThemeContext';

type ScreenState = 'splash' | 'login_phone' | 'login_otp' | 'setup' | 'dashboard' | 'qr_scanner' | 'nearest_beauticians';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');
  const [authPhone, setAuthPhone] = useState('+919876543210');

  useEffect(() => {
    const checkAuthToken = async () => {
      const token = await AsyncStorage.getItem('@shilpi_token');
      // If token exists, user can directly jump to dashboard if desired
    };
    checkAuthToken();
  }, []);

  // 1. Full-bleed edge-to-edge view for Splash video
  if (screen === 'splash') {
    return (
      <ThemeProvider>
        <View style={styles.splashContainer}>
          <StatusBar hidden />
          <SplashScreen onFinish={() => setScreen('login_phone')} />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* 2. Login Phone Number Screen */}
      {screen === 'login_phone' && (
        <LoginPhoneScreen
          onOtpSent={(phone) => {
            setAuthPhone(phone);
            setScreen('login_otp');
          }}
          onFindNearest={() => setScreen('nearest_beauticians')}
        />
      )}

      {/* 3. Login OTP Verification Screen */}
      {screen === 'login_otp' && (
        <LoginOtpScreen
          phone={authPhone}
          onGoBack={() => setScreen('login_phone')}
          onVerified={(isNewUser) => {
            if (isNewUser) {
              setScreen('setup');
            } else {
              setScreen('dashboard');
            }
          }}
        />
      )}

      {/* 4. Complete Prototype Setup Screen */}
      {screen === 'setup' && (
        <SetupScreen
          phone={authPhone}
          onCompleted={() => setScreen('dashboard')}
        />
      )}

      {/* 5. Main Prototype Authenticated Studio Experience (Tabs, Drawer, Screens & Sheets) */}
      {screen === 'dashboard' && (
        <MainAppContainer
          onOpenQrScanner={() => setScreen('qr_scanner')}
          onLogout={async () => {
            await AsyncStorage.multiRemove([
              '@shilpi_token',
              '@shilpi_beautician_id',
              '@shilpi_profile',
              '@shilpi_clients',
              '@shilpi_bookings',
              '@shilpi_notifs',
              '@shilpi_packages',
              '@shilpi_setup_done',
            ]);
            setScreen('login_phone');
          }}
        />
      )}

      {/* 6. Web Terminal Camera QR Linker */}
      {screen === 'qr_scanner' && (
        <QrScannerScreen
          onSuccess={() => setScreen('dashboard')}
          onCancel={() => setScreen('dashboard')}
        />
      )}

      {/* 7. Public Customer Discovery: Nearest Beautician Near You (No Login Required) */}
      {screen === 'nearest_beauticians' && (
        <NearestBeauticiansScreen
          onGoBack={() => setScreen('login_phone')}
        />
      )}
      </SafeAreaView>
    </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
