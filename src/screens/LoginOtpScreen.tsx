import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { apiClient } from '../services/apiClient';

interface LoginOtpScreenProps {
  phone: string;
  onGoBack: () => void;
  onVerified: (isNewUser: boolean, token?: string) => void;
}

export const LoginOtpScreen: React.FC<LoginOtpScreenProps> = ({ phone, onGoBack, onVerified }) => {
  // Empty by default so user sees initial state before typing
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const inputRef = useRef<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length < 6) {
      setErrorText('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorText('');

    try {
      const response = await apiClient.post('/auth/otp/verify', {
        phone,
        otp: code,
      });

      if (response.data?.success) {
        // Clear any previous session keys before storing the newly authenticated studio session
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

        if (response.data.isNewUser) {
          onVerified(true);
        } else {
          if (response.data.token) {
            await AsyncStorage.setItem('@shilpi_token', response.data.token);
          }
          if (response.data.beautician) {
            if (response.data.beautician.id) {
              await AsyncStorage.setItem('@shilpi_beautician_id', response.data.beautician.id);
            }
            await AsyncStorage.setItem(
              '@shilpi_profile',
              JSON.stringify({
                beauticianId: response.data.beautician.id,
                ownerName: response.data.beautician.ownerName,
                businessName: response.data.beautician.businessName,
                businessTypes: response.data.beautician.businessTypes || [],
                city: response.data.beautician.city || '',
                address: response.data.beautician.address || '',
                pincode: response.data.beautician.pincode || '',
                phone: response.data.beautician.phone || phone,
                logoUri: response.data.beautician.profilePhotoUrl,
              })
            );
            await AsyncStorage.setItem('@shilpi_setup_done', 'true');
          }
          onVerified(false, response.data.token);
        }
      } else {
        setErrorText(response.data?.error?.message || 'Incorrect verification code.');
      }
    } catch (err: any) {
      setErrorText(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(30);
    setErrorText('');
    try {
      await apiClient.post('/auth/otp/send', { phone });
    } catch (e) {
      console.warn('Resend failed', e);
    }
  };

  // Split OTP into 6 characters for individual visual boxes
  const otpDigits = [0, 1, 2, 3, 4, 5].map((index) => otp[index] || '');

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Black Header with Back Action */}
      <View style={styles.headerBlack}>
        <TouchableOpacity onPress={onGoBack} style={styles.changeNumberBtn} activeOpacity={0.7}>
          <Text style={styles.changeNumberText}>← CHANGE NUMBER</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>VERIFICATION</Text>
        <Text style={styles.headline}>
          Enter the code sent to{'\n'}
          <Text style={styles.phoneHighlight}>{phone}</Text>
        </Text>

        {/* 6 Individual Digit Display Boxes */}
        {/* Before typing: White box with subtle border */}
        {/* When typed: Box changes into Pink background with White digit */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.otpBoxesRow}
          onPress={() => inputRef.current?.focus()}
        >
          {otpDigits.map((digit, i) => {
            const isFilled = Boolean(digit);
            const isActive = otp.length === i;

            return (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  isActive && styles.otpBoxActive,
                  isFilled && styles.otpBoxFilled,
                ]}
              >
                <Text style={[styles.digitText, isFilled && styles.digitTextFilled]}>
                  {digit}
                </Text>
              </View>
            );
          })}
        </TouchableOpacity>

        {/* Hidden Real Input */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(val) => {
            setOtp(val);
            if (errorText) setErrorText('');
            if (val.length === 6) {
              handleVerify(val);
            }
          }}
          autoFocus
        />

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        {/* Resend Row */}
        <View style={styles.resendRow}>
          <Text style={styles.resendTimer}>
            {timer > 0 ? `Resend code in 0:${timer < 10 ? `0${timer}` : timer}` : 'Did not receive code?'}
          </Text>
          <TouchableOpacity onPress={handleResend} disabled={timer > 0} activeOpacity={0.7}>
            <Text style={[styles.resendAction, timer > 0 && styles.resendDisabled]}>
              RESEND
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify CTA Button */}
        <TouchableOpacity
          style={[
            styles.verifyBtn,
            otp.length >= 4 ? styles.verifyBtnActive : styles.verifyBtnDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={loading || otp.length < 4}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text
              style={[
                styles.verifyBtnText,
                otp.length < 4 && styles.verifyBtnTextDisabled,
              ]}
            >
              VERIFY & PROCEED
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  headerBlack: {
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  changeNumberBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  changeNumberText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.deep,
    fontWeight: '700',
  },
  headline: {
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 30,
    marginTop: 6,
    color: '#121212',
    fontWeight: '700',
  },
  phoneHighlight: {
    fontWeight: '700',
    color: Colors.accent,
  },
  demoNoticeBadge: {
    marginTop: 12,
    backgroundColor: Colors.tint,
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.25)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  demoNoticeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.deep,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
    gap: 8,
  },
  // Default box before typing: White background, subtle border
  otpBox: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.14)',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // Active focused box waiting for next digit
  otpBoxActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.tint2,
    borderWidth: 2,
  },
  // After typing: Box turns Pink with White text!
  otpBoxFilled: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    borderWidth: 2,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  digitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#121212',
  },
  digitTextFilled: {
    color: '#ffffff', // White text on pink box
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    color: Colors.deep,
    fontSize: 12,
    marginTop: 10,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  resendTimer: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.6)',
  },
  resendAction: {
    color: Colors.deep,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
  },
  resendDisabled: {
    color: 'rgba(18, 18, 18, 0.3)',
  },
  verifyBtn: {
    marginTop: 28,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyBtnActive: {
    backgroundColor: Colors.accent, // Pink color from design system
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnDisabled: {
    backgroundColor: '#f1f1f4',
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.1)',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  verifyBtnTextDisabled: {
    color: 'rgba(18, 18, 18, 0.35)',
  },
});
