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

// Premium Vector Icons replacing emojis
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

const SmsBubbleIcon: React.FC = () => {
  const { colors } = useTheme();
  return (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke={colors.accent}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={colors.palePinkBorder}
    />
    <Circle cx={8.5} cy={11.5} r={1.2} fill={colors.accent} />
    <Circle cx={12} cy={11.5} r={1.2} fill={colors.accent} />
    <Circle cx={15.5} cy={11.5} r={1.2} fill={colors.accent} />
  </Svg>
  );
};

const SecurityLockIcon: React.FC = () => {
  const { colors } = useTheme();
  return (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3.5}
      y={11}
      width={17}
      height={11}
      rx={2.5}
      stroke={colors.accent}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={colors.palePinkBorder}
    />
    <Path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={colors.accent}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={16} r={1.5} fill={colors.accent} />
  </Svg>
  );
};

const LocationPinVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ff2d75', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={10} r={3.2} stroke={color} strokeWidth={2} />
  </Svg>
);

const ChevronRightVector: React.FC<{ color?: string; size?: number }> = ({ color = '#888888', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
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
  const [agreed, setAgreed] = useState(false); // Default unkept/unchecked as requested
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Curved Deep Black Header with Shilpi White & Gold Lockup */}
        <View style={styles.headerBlack}>
          <Image
            source={require('../../assets/shilpi-lockup-black.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Input Card matching Prototype */}
        <View style={styles.cardContainer}>
          <View style={styles.inputCard}>
            <Text style={styles.kicker}>SIGN IN</Text>
            <Text style={styles.headline}>What's your phone number?</Text>

            {/* Pink-shaped Phone Number Field with only black and pink used in prototype */}
            <View style={styles.phoneInputRow}>
              <View style={styles.countryPrefix}>
                <View style={{ marginRight: 4 }}>
                  <IndiaFlagVector />
                </View>
                <Text style={styles.prefixText}>+91</Text>
                <View style={styles.verticalDivider} />
              </View>

              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="9876543210"
                placeholderTextColor="rgba(18, 18, 18, 0.4)"
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

            {/* Clickable Agreement Row: Terms and Privacy Policy */}
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

            {/* 'Send Code' button - Defaultly unkept/disabled until clicked, pink color when enabled */}
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
                  SEND CODE
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Public Discovery Entry Point - No Login Required */}
        {onFindNearest && (
          <View style={styles.discoverySection}>
            <View style={styles.discoveryDividerWrap}>
              <View style={styles.discoveryDividerLine} />
              <Text style={styles.discoveryDividerText}>LOOKING FOR A BEAUTICIAN?</Text>
              <View style={styles.discoveryDividerLine} />
            </View>

            <TouchableOpacity
              style={styles.findNearestCard}
              onPress={onFindNearest}
              activeOpacity={0.85}
            >
              <View style={styles.findNearestLeft}>
                <View style={styles.findNearestIconCircle}>
                  <LocationPinVector color="#ffffff" size={20} />
                </View>
                <View style={styles.findNearestTextWrap}>
                  <View style={styles.findNearestHeaderRow}>
                    <Text style={styles.findNearestTitle}>Find Nearest Beautician</Text>
                    <View style={styles.guestBadge}>
                      <Text style={styles.guestBadgeText}>NO LOGIN</Text>
                    </View>
                  </View>
                  <Text style={styles.findNearestSubtitle}>
                    Locate top bridal, mehendi & hair artists around your PIN code with direct WhatsApp & call
                  </Text>
                </View>
              </View>
              <View style={styles.findNearestChevronWrap}>
                <ChevronRightVector color={colors.accent} size={18} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Trust Badges matching Prototype with Premium Vector Icons */}
        <View style={styles.trustContainer}>
          <View style={styles.trustItem}>
            <View style={styles.iconCircle}>
              <SmsBubbleIcon />
            </View>
            <Text style={styles.trustLabel}>
              The six-digit code arrives on SMS.
            </Text>
          </View>

          <View style={styles.trustItem}>
            <View style={styles.iconCircle}>
              <SecurityLockIcon />
            </View>
            <Text style={styles.trustLabel}>
              This number sends your client confirmations.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingHorizontal: 16,
    marginTop: -10,
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
    color: colors.deep,
    fontWeight: '700',
  },
  headline: {
    fontSize: 22,
    letterSpacing: -0.3,
    marginTop: 6,
    color: '#121212',
    fontWeight: '700',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent, // Pink colored shape from prototype
    backgroundColor: colors.tint2, // Soft pink surface tint from prototype
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
    width: 1.5,
    height: 24,
    backgroundColor: colors.palePinkBorder,
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 18,
    letterSpacing: 1,
    color: '#121212', // Black text
    fontWeight: '700',
  },
  errorText: {
    color: colors.deep,
    fontSize: 12,
    marginTop: 8,
    marginLeft: 2,
    fontWeight: '600',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(18, 18, 18, 0.35)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxAgreed: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  consentTextWrap: {
    flex: 1,
  },
  consentText: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.75)',
    lineHeight: 18,
  },
  linkText: {
    color: colors.accent,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  sendBtn: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.accent, // Pink color from design system
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#f1f1f4',
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.1)',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  sendBtnTextDisabled: {
    color: 'rgba(18, 18, 18, 0.35)',
  },
  trustContainer: {
    paddingHorizontal: 16,
    marginTop: 18,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.tint2,
    borderWidth: 1.2,
    borderColor: colors.palePinkBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustLabel: {
    flex: 1,
    fontSize: 12,
    color: '#121212',
    fontWeight: '600',
    lineHeight: 18,
  },
  discoverySection: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  discoveryDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  discoveryDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  discoveryDividerText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: 'rgba(18, 18, 18, 0.45)',
  },
  findNearestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.palePinkBorder,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  findNearestLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  findNearestIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  findNearestTextWrap: {
    flex: 1,
  },
  findNearestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  findNearestTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#121212',
    letterSpacing: -0.2,
  },
  guestBadge: {
    backgroundColor: colors.tint2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.palePinkBorder,
  },
  guestBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.accent,
  },
  findNearestSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(18, 18, 18, 0.6)',
    fontWeight: '500',
  },
  findNearestChevronWrap: {
    paddingLeft: 8,
  },
});
