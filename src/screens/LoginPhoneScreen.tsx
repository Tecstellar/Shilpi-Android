import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { apiClient } from '../services/apiClient';

interface LoginPhoneScreenProps {
  onOtpSent: (phone: string) => void;
}

export const LoginPhoneScreen: React.FC<LoginPhoneScreenProps> = ({ onOtpSent }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSendCode = async () => {
    const cleaned = phoneNumber.replace(/\s+/g, '');
    if (cleaned.length < 10) {
      setErrorText('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = cleaned.startsWith('+91') ? cleaned : `+91${cleaned}`;
    setLoading(true);
    setErrorText('');

    try {
      const response = await apiClient.post('/auth/otp/send', {
        phone: fullPhone,
      });

      if (response.data.success) {
        onOtpSent(fullPhone);
      } else {
        setErrorText(response.data.error?.message || 'Could not send verification code.');
      }
    } catch (err: any) {
      setErrorText('Connection error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Curved Deep Black Header with Official Shilpi Lockup */}
        <View style={styles.headerBlack}>
          <Image
            source={require('../../assets/shilpi-lockup-light.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Input Card exactly like Prototype */}
        <View style={styles.cardContainer}>
          <View style={styles.inputCard}>
            <Text style={styles.kicker}>SIGN IN</Text>
            <Text style={styles.headline}>What's your phone number?</Text>

            <View style={styles.phoneInputRow}>
              <View style={styles.countryPrefix}>
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.prefixText}>+91</Text>
                <View style={styles.verticalDivider} />
              </View>

              <TextInput
                style={styles.textInput}
                keyboardType="phone-pad"
                placeholder="98765 43210"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                value={phoneNumber}
                onChangeText={(val) => {
                  setPhoneNumber(val);
                  if (errorText) setErrorText('');
                }}
                maxLength={10}
              />
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendCode}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>SEND CODE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Badges exactly like Prototype */}
        <View style={styles.trustContainer}>
          <View style={styles.trustItem}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>💬</Text>
            </View>
            <Text style={styles.trustLabel}>
              A 6-digit code arrives on WhatsApp and SMS.
            </Text>
          </View>

          <View style={styles.trustItem}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔒</Text>
            </View>
            <Text style={styles.trustLabel}>
              This number sends your client confirmations. Never shared.
            </Text>
          </View>
        </View>

        {/* Legal Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerLegal}>
            By continuing you agree to the Terms and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBlack: {
    backgroundColor: '#000000',
    paddingTop: 60,
    paddingBottom: 34,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  logo: {
    width: 210,
    height: 48,
  },
  cardContainer: {
    paddingHorizontal: 16,
    marginTop: -8,
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#8c6b3e', // Deep Warm Bronze from prototype
    fontWeight: '700',
  },
  headline: {
    fontSize: 22,
    letterSpacing: -0.3,
    marginTop: 6,
    color: '#121212',
    fontWeight: '600',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.12)',
    backgroundColor: '#fafafb',
    overflow: 'hidden',
  },
  countryPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  flagEmoji: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121212',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(18, 18, 18, 0.14)',
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 17,
    letterSpacing: 1,
    color: '#121212',
    fontWeight: '500',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 2,
  },
  sendBtn: {
    marginTop: 16,
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  trustContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  trustLabel: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.72)',
    lineHeight: 18,
  },
  footerContainer: {
    marginTop: 'auto',
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerLegal: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.45)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
