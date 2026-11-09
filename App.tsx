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
  const [authPhone, setAuthPhone] = useState('');

  // Check if token already exists
  useEffect(() => {
    const checkAuthToken = async () => {
      const token = await AsyncStorage.getItem('@shilpi_token');
      // If token exists, we can transition to dashboard after splash
    };
    checkAuthToken();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* 1. Splash Intro Video */}
      {screen === 'splash' && (
        <SplashScreen
          onFinish={() => setScreen('login_phone')}
        />
      )}

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
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
