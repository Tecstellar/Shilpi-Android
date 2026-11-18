import React, { useState, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { apiClient } from '../services/apiClient';

// Premium Hand-Drawn Vector Icons (Zero Emojis)
const IndiaFlagVector: React.FC = () => (
  <Svg width={18} height={12} viewBox="0 0 60 40">
    <Rect width={60} height={13.33} fill="#FF9933" />
    <Rect y={13.33} width={60} height={13.33} fill="#FFFFFF" />
    <Rect y={26.66} width={60} height={13.33} fill="#138808" />
    <Circle cx={30} cy={20} r={5} stroke="#000080" strokeWidth={1} fill="none" />
  </Svg>
);

const CheckMarkVectorIcon: React.FC = () => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LocationPinVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ffffff', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={2} />
  </Svg>
);

const MapCompassVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ff2d75', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
  </Svg>
);

const ChevronRightVector: React.FC<{ color?: string; size?: number }> = ({ color = '#888888', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SecurityShieldVector: React.FC<{ color?: string; size?: number }> = ({ color = '#888899', size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface LoginPhoneScreenProps {
  onOtpSent: (phone: string) => void;
  onFindNearest?: () => void;
}

export const LoginPhoneScreen: React.FC<LoginPhoneScreenProps> = ({ onOtpSent, onFindNearest }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const isValidPhone = /^\d{10}$/.test(phoneNumber);
  const isButtonEnabled = agreed && isValidPhone;

  const handleSendCode = async () => {
    if (!agreed) {
      setErrorText('Please agree to the Terms and Privacy Policy to continue.');
      return;
    }

    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleaned)) {
      setErrorText('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = `+91${cleaned}`;
    setLoading(true);
    setErrorText('');

    try {
      const response = await apiClient.post('/auth/otp/send', {
        phone: fullPhone,
      });

      if (response.data?.success) {
        onOtpSent(fullPhone);
      } else {
        setErrorText(response.data?.error?.message || 'Could not send verification code.');
      }
    } catch (err: any) {
      setErrorText(
        err?.message || 'Unable to connect to Shilpi server. Please check your network.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openTerms = () => {
    Alert.alert(
      'Terms of Service',
      'By using Shilpi, you agree to standard service terms, client data protection guidelines, and cloud backup policies.'
    );
  };

  const openPrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'Shilpi strictly secures your client book, appointments, payment logs, and phone numbers. Your data is never shared or sold.'
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Curved Obsidian Header with Shilpi Branding */}
        <View style={styles.headerBlack}>
          <Image
            source={require('../../assets/shilpi-lockup-black.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Clean, Focused Input Card */}
        <View style={styles.cardContainer}>
          <View style={styles.inputCard}>
            <Text style={styles.headline}>Enter your phone number</Text>
            <Text style={styles.subheadline}>
              We'll send a 6-digit SMS code to verify your account
            </Text>

            {/* Refined Phone Number Input */}
            <View style={styles.phoneInputRow}>
              <View style={styles.countryPrefix}>
                <IndiaFlagVector />
                <Text style={styles.prefixText}>+91</Text>
                <View style={styles.verticalDivider} />
              </View>

              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="9876543210"
                placeholderTextColor="rgba(18, 18, 24, 0.35)"
                selectionColor={colors.accent}
                value={phoneNumber}
                onChangeText={(val) => {
                  const digits = val.replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(digits);
                  if (errorText) setErrorText('');
                }}
                maxLength={10}
              />
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            {/* Clickable Agreement Row */}
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxAgreed]}>
                {agreed && <CheckMarkVectorIcon />}
              </View>
              <View style={styles.consentTextWrap}>
                <Text style={styles.consentText}>
                  By continuing, you agree to the{' '}
                  <Text style={styles.linkText} onPress={openTerms}>
                    Terms
                  </Text>
                  {' '}and{' '}
                  <Text style={styles.linkText} onPress={openPrivacy}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </TouchableOpacity>

            {/* 'Send Code' Button */}
            <TouchableOpacity
              style={[
                styles.sendBtn,
                isButtonEnabled ? styles.sendBtnActive : styles.sendBtnDisabled,
              ]}
              onPress={handleSendCode}
              disabled={!isButtonEnabled || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text
                  style={[
                    styles.sendBtnText,
                    !isButtonEnabled && styles.sendBtnTextDisabled,
                  ]}
                >
                  SEND VERIFICATION CODE
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Customer Discovery Luxury Concierge Row */}
          {onFindNearest && (
            <View style={styles.customerEntryWrap}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>OR EXPLORE AS A CLIENT</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.discoveryBanner}
                onPress={onFindNearest}
                activeOpacity={0.85}
              >
                <View style={styles.discoveryIconCircle}>
                  <MapCompassVector color="#ff2d75" size={20} />
                </View>
                <View style={styles.discoveryContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={styles.discoveryTitle}>Find Nearest Beautician</Text>
                    <View style={styles.liveMapBadge}>
                      <View style={styles.liveGreenDot} />
                      <Text style={styles.liveMapBadgeText}>LIVE MAP</Text>
                    </View>
                  </View>
                  <Text style={styles.discoverySubtitle}>
                    Locate registered bridal & makeover artists near your PIN
                  </Text>
                </View>
                <View style={styles.discoveryActionPill}>
                  <Text style={styles.discoveryActionText}>EXPLORE</Text>
                  <ChevronRightVector color="#ff2d75" size={11} />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#f6f6f8',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 40,
    },
    headerBlack: {
      backgroundColor: '#000000',
      paddingTop: Platform.OS === 'ios' ? 56 : 42,
      paddingBottom: 28,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      alignItems: 'flex-start',
    },
    logo: {
      width: 260,
      height: 104,
      marginLeft: -8,
    },
    cardContainer: {
      paddingHorizontal: 18,
      marginTop: -8,
    },
    inputCard: {
      backgroundColor: '#ffffff',
      borderRadius: 22,
      padding: 22,
      shadowColor: '#0a0a0e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.04)',
    },
    headline: {
      fontSize: 20,
      letterSpacing: -0.4,
      color: '#111116',
      fontWeight: '700',
    },
    subheadline: {
      fontSize: 12.5,
      lineHeight: 17,
      color: 'rgba(17, 17, 22, 0.55)',
      marginTop: 4,
      marginBottom: 16,
    },
    phoneInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.palePinkBorder,
      backgroundColor: colors.tint2,
      overflow: 'hidden',
    },
    countryPrefix: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      gap: 7,
    },
    prefixText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111116',
    },
    verticalDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.palePinkBorder,
      marginLeft: 4,
    },
    textInput: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 12,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 1.2,
      color: '#111116',
    },
    errorText: {
      fontSize: 11.5,
      color: '#e53935',
      marginTop: 8,
      fontWeight: '600',
    },
    consentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 16,
      marginBottom: 18,
      gap: 10,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: 'rgba(17, 17, 22, 0.25)',
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    checkboxAgreed: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    consentTextWrap: {
      flex: 1,
    },
    consentText: {
      fontSize: 11.5,
      lineHeight: 16,
      color: 'rgba(17, 17, 22, 0.65)',
    },
    linkText: {
      color: colors.accent,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
    sendBtn: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnActive: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    },
    sendBtnDisabled: {
      backgroundColor: '#eeeeF2',
      borderWidth: 1,
      borderColor: 'rgba(17, 17, 22, 0.08)',
    },
    sendBtnText: {
      color: '#ffffff',
      fontSize: 12,
      letterSpacing: 1,
      fontWeight: '700',
    },
    sendBtnTextDisabled: {
      color: 'rgba(17, 17, 22, 0.35)',
    },
    customerEntryWrap: {
      marginTop: 22,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
    dividerLabel: {
      fontSize: 9.5,
      letterSpacing: 1,
      fontWeight: '700',
      color: 'rgba(17, 17, 22, 0.45)',
    },
    discoveryBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: '#ffe4ee',
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      gap: 12,
    },
    discoveryIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#fff1f6',
      borderWidth: 1,
      borderColor: '#ffd2e3',
      justifyContent: 'center',
      alignItems: 'center',
    },
    discoveryContent: {
      flex: 1,
      minWidth: 0,
    },
    discoveryTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: '#0f172a',
      letterSpacing: -0.3,
    },
    liveMapBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#ecfdf5',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#a7f3d0',
    },
    liveGreenDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#10b981',
    },
    liveMapBadgeText: {
      fontSize: 7.5,
      fontWeight: '800',
      color: '#047857',
      letterSpacing: 0.4,
    },
    discoverySubtitle: {
      fontSize: 10.5,
      lineHeight: 14,
      color: '#64748b',
    },
    discoveryActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingVertical: 6,
      paddingHorizontal: 9,
      borderRadius: 8,
      backgroundColor: '#fff1f6',
      borderWidth: 1,
      borderColor: '#ffd2e3',
    },
    discoveryActionText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#ff2d75',
      letterSpacing: 0.5,
    },
    securityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 24,
    },
    securityText: {
      fontSize: 11,
      color: '#8e8e99',
      fontWeight: '500',
    },
  });
