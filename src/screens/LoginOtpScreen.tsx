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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';

interface LoginOtpScreenProps {
  phone: string;
  onGoBack: () => void;
  onVerified: (isNewUser: boolean, token?: string) => void;
}

export const LoginOtpScreen: React.FC<LoginOtpScreenProps> = ({ phone, onGoBack, onVerified }) => {
  const isDemo = phone.includes('9876543210');
  const [otp, setOtp] = useState(isDemo ? '528143' : '');
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

  const handleVerify = async () => {
    if (otp.length < 6) {
      setErrorText('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorText('');

    try {
      const response = await apiClient.post('/auth/otp/verify', {
        phone,
        otp,
      });

      if (response.data.success) {
        if (response.data.isNewUser) {
          onVerified(true);
        } else {
          await AsyncStorage.setItem('@shilpi_token', response.data.token);
          onVerified(false, response.data.token);
        }
      } else {
        setErrorText(response.data.error?.message || 'Incorrect verification code.');
      }
    } catch (err: any) {
      setErrorText('Verification failed. Please check the code and try again.');
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
        <TouchableOpacity onPress={onGoBack} style={styles.changeNumberBtn}>
          <Text style={styles.changeNumberText}>← CHANGE NUMBER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.kicker}>VERIFICATION</Text>
        <Text style={styles.headline}>
          Enter the code sent to{'\n'}
          <Text style={styles.phoneHighlight}>{phone}</Text>
        </Text>

        {isDemo ? (
          <View style={styles.demoNoticeBadge}>
            <Text style={styles.demoNoticeText}>Demo Code: 528143 (Prefilled)</Text>
          </View>
        ) : null}

        {/* 6 Individual Digit Display Boxes */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.otpBoxesRow}
          onPress={() => inputRef.current?.focus()}
        >
          {otpDigits.map((digit, i) => (
            <View
              key={i}
              style={[
                styles.otpBox,
                otp.length === i && styles.otpBoxActive,
                digit ? styles.otpBoxFilled : null,
              ]}
            >
              <Text style={styles.digitText}>{digit}</Text>
            </View>
          ))}
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
              // Auto trigger verify when 6 digits are typed
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
          <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
            <Text style={[styles.resendAction, timer > 0 && styles.resendDisabled]}>
              RESEND
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify CTA */}
        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.verifyBtnText}>VERIFY & CONTINUE</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: 56,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  changeNumberBtn: {
    paddingVertical: 6,
  },
  changeNumberText: {
    color: '#ffffff',
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#8c6b3e',
    fontWeight: '700',
  },
  headline: {
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 30,
    marginTop: 6,
    color: '#121212',
    fontWeight: '600',
  },
  phoneHighlight: {
    fontWeight: '700',
    color: '#121212',
  },
  demoNoticeBadge: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c59b6d',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  demoNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8c6b3e',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.12)',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  otpBoxActive: {
    borderColor: '#121212',
    borderWidth: 2,
  },
  otpBoxFilled: {
    backgroundColor: '#ffffff',
    borderColor: '#c59b6d',
  },
  digitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#121212',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 10,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  resendTimer: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.6)',
  },
  resendAction: {
    color: '#8c6b3e',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
  },
  resendDisabled: {
    color: 'rgba(18, 18, 18, 0.3)',
  },
  verifyBtn: {
    marginTop: 28,
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
