import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingBuildScreen } from './src/screens/OnboardingBuildScreen';
import { RoleSelectionScreen } from './src/screens/RoleSelectionScreen';
import { LoginPhoneScreen } from './src/screens/LoginPhoneScreen';
import { LoginOtpScreen } from './src/screens/LoginOtpScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { MainAppContainer } from './src/screens/MainAppContainer';
import { QrScannerScreen } from './src/screens/QrScannerScreen';
import { ThemeProvider } from './src/theme/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const NearestBeauticiansScreen = React.lazy(() =>
  import('./src/screens/NearestBeauticiansScreen').then((m) => ({
    default: m.NearestBeauticiansScreen,
  }))
);

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
    // Hide the native splash screen as soon as React Native mounts
    ExpoSplashScreen.hideAsync().catch(() => {});

    const checkAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('@shilpi_token');
        // If token exists, user can directly jump to dashboard if desired
      } catch (err) {
        console.warn('Error reading token on launch:', err);
      }
    };
    checkAuthToken();
  }, []);

  const renderContent = () => {
    // 1. Full-bleed edge-to-edge view for Splash animation
    if (screen === 'splash') {
      return (
        <View style={styles.splashContainer}>
          <StatusBar hidden />
          <SplashScreen onFinish={() => setScreen('onboarding')} />
        </View>
      );
    }

    // 2. Full-bleed 4-Build Onboarding Walkthrough
    if (screen === 'onboarding') {
      return (
        <View style={styles.fullBleedContainer}>
          <StatusBar style="dark" />
          <OnboardingBuildScreen
            onComplete={() => setScreen('role_selection')}
            onSkip={() => setScreen('role_selection')}
          />
        </View>
      );
    }

    // 3. Full-bleed Role Selection ("How will you use SHILPI?")
    if (screen === 'role_selection') {
      return (
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
      );
    }

    // 4. Inset-safe Screens
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        {/* Login Phone Number Screen */}
        {screen === 'login_phone' && (
          <LoginPhoneScreen
            onOtpSent={(phone) => {
              setAuthPhone(phone);
              setScreen('login_otp');
            }}
            onGoBack={() => setScreen('role_selection')}
          />
        )}

        {/* Login OTP Verification Screen */}
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

        {/* Complete Prototype Setup Screen */}
        {screen === 'setup' && (
          <SetupScreen
            phone={authPhone}
            onCompleted={() => setScreen('dashboard')}
          />
        )}

        {/* Main Prototype Authenticated Studio Experience */}
        {screen === 'dashboard' && (
          <MainAppContainer
            onOpenQrScanner={() => setScreen('qr_scanner')}
            onLogout={async () => {
              try {
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
              } catch (e) {
                console.warn('Logout storage clear error:', e);
              }
              setScreen('login_phone');
            }}
          />
        )}

        {/* Web Terminal Camera QR Linker */}
        {screen === 'qr_scanner' && (
          <QrScannerScreen
            onSuccess={() => setScreen('dashboard')}
            onCancel={() => setScreen('dashboard')}
          />
        )}

        {/* Public Customer Discovery: Nearest Beautician Near You */}
        {screen === 'nearest_beauticians' && (
          <ErrorBoundary fallbackMessage="Unable to load beauticians map. Please check network connection.">
            <React.Suspense fallback={<View style={{ flex: 1, backgroundColor: '#ffffff' }} />}>
              <NearestBeauticiansScreen
                onGoBack={() => setScreen(previousScreen || 'role_selection')}
              />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </SafeAreaView>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          {renderContent()}
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#08080c',
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
