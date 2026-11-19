import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingBuildScreen } from './src/screens/OnboardingBuildScreen';
import { RoleSelectionScreen } from './src/screens/RoleSelectionScreen';
import { LoginPhoneScreen } from './src/screens/LoginPhoneScreen';
import { LoginOtpScreen } from './src/screens/LoginOtpScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { MainAppContainer } from './src/screens/MainAppContainer';
import { QrScannerScreen } from './src/screens/QrScannerScreen';
import { NearestBeauticiansScreen } from './src/screens/NearestBeauticiansScreen';
import { ThemeProvider } from './src/theme/ThemeContext';

export type ScreenState =
  | 'splash'
  | 'onboarding'
  | 'role_selection'
  | 'login_phone'
  | 'login_otp'
  | 'setup'
  | 'dashboard'
  | 'qr_scanner'
  | 'nearest_beauticians';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');
  const [previousScreen, setPreviousScreen] = useState<ScreenState>('role_selection');
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
          <SplashScreen onFinish={() => setScreen('onboarding')} />
        </View>
      </ThemeProvider>
    );
  }

  // 2. Full-bleed 4-Build Onboarding Walkthrough (White Theme)
  if (screen === 'onboarding') {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <View style={styles.fullBleedContainer}>
            <StatusBar style="dark" />
            <OnboardingBuildScreen
              onComplete={() => setScreen('role_selection')}
              onSkip={() => setScreen('role_selection')}
            />
          </View>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  // 3. Full-bleed Role Selection ("How will you use SHILPI?")
  if (screen === 'role_selection') {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <View style={styles.fullBleedContainer}>
            <StatusBar style="dark" />
            <RoleSelectionScreen
              onSelectBeautician={() => {
                setPreviousScreen('role_selection');
                setScreen('login_phone');
              }}
              onSelectClient={() => {
                setPreviousScreen('role_selection');
                setScreen('nearest_beauticians');
              }}
              onGoBack={() => setScreen('onboarding')}
            />
          </View>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />

          {/* 4. Login Phone Number Screen (Beautician Portal Auth) */}
          {screen === 'login_phone' && (
            <LoginPhoneScreen
              onOtpSent={(phone) => {
                setAuthPhone(phone);
                setScreen('login_otp');
              }}
              onGoBack={() => setScreen('role_selection')}
            />
          )}

          {/* 5. Login OTP Verification Screen */}
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

          {/* 6. Complete Prototype Setup Screen */}
          {screen === 'setup' && (
            <SetupScreen
              phone={authPhone}
              onCompleted={() => setScreen('dashboard')}
            />
          )}

          {/* 7. Main Prototype Authenticated Studio Experience (Tabs, Drawer, Screens & Sheets) */}
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

          {/* 8. Web Terminal Camera QR Linker */}
          {screen === 'qr_scanner' && (
            <QrScannerScreen
              onSuccess={() => setScreen('dashboard')}
              onCancel={() => setScreen('dashboard')}
            />
          )}

          {/* 9. Public Customer Discovery: Nearest Beautician Near You (Linked with "I am looking for a Beautician") */}
          {screen === 'nearest_beauticians' && (
            <NearestBeauticiansScreen
              onGoBack={() => setScreen(previousScreen || 'role_selection')}
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
  fullBleedDarkContainer: {
    flex: 1,
    backgroundColor: '#0e0f13',
  },
  fullBleedContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
