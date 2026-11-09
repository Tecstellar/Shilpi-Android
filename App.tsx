import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginPhoneScreen } from './src/screens/LoginPhoneScreen';
import { LoginOtpScreen } from './src/screens/LoginOtpScreen';
import { OnboardingWizardScreen } from './src/screens/OnboardingWizardScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { QrScannerScreen } from './src/screens/QrScannerScreen';

type ScreenState = 'splash' | 'login_phone' | 'login_otp' | 'onboarding' | 'dashboard' | 'qr_scanner';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');
  const [authPhone, setAuthPhone] = useState('+919876543210');

  useEffect(() => {
    const checkAuthToken = async () => {
      const token = await AsyncStorage.getItem('@shilpi_token');
    };
    checkAuthToken();
  }, []);

  // Full-bleed edge-to-edge view for Splash video
  if (screen === 'splash') {
    return (
      <View style={styles.splashContainer}>
        <StatusBar hidden />
        <SplashScreen onFinish={() => setScreen('login_phone')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* 2. Login Phone Number Screen */}
      {screen === 'login_phone' && (
        <LoginPhoneScreen
          onOtpSent={(phone) => {
            setAuthPhone(phone);
            setScreen('login_otp');
          }}
        />
      )}

      {/* 3. Login OTP Verification Screen */}
      {screen === 'login_otp' && (
        <LoginOtpScreen
          phone={authPhone}
          onGoBack={() => setScreen('login_phone')}
          onVerified={(isNewUser) => {
            if (isNewUser) {
              setScreen('onboarding');
            } else {
              setScreen('dashboard');
            }
          }}
        />
      )}

      {/* 4. Onboarding 4-Step Wizard */}
      {screen === 'onboarding' && (
        <OnboardingWizardScreen
          phone={authPhone}
          onCompleted={() => setScreen('dashboard')}
        />
      )}

      {/* 5. Main Authenticated Studio Dashboard */}
      {screen === 'dashboard' && (
        <DashboardScreen
          onOpenQrScanner={() => setScreen('qr_scanner')}
          onNewBooking={() => console.log('New booking')}
        />
      )}

      {/* 6. Web Terminal Camera QR Linker */}
      {screen === 'qr_scanner' && (
        <QrScannerScreen
          onSuccess={() => setScreen('dashboard')}
          onCancel={() => setScreen('dashboard')}
        />
      )}
    </SafeAreaView>
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
