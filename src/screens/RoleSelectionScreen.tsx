import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, {
  Path,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// -------------------------------------------------------------
// PURE VECTOR ICONS (Zero emojis, editorial line work)
// -------------------------------------------------------------

const ArrowRightVector: React.FC<{ color?: string; size?: number }> = ({
  color = '#ffffff',
  size = 16,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12h14M12 5l7 7-7 7"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronLeftVector: React.FC<{ color?: string; size?: number }> = ({
  color = '#121212',
  size = 16,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface RoleSelectionScreenProps {
  onSelectBeautician: () => void;
  onSelectClient: () => void;
  onGoBack: () => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onSelectBeautician,
  onSelectClient,
  onGoBack,
}) => {
  const insets = useSafeAreaInsets();
  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(card1Anim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [card1Anim, card2Anim, headerAnim]);

  const handleBeauticianPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectBeautician();
  };

  const handleClientPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectClient();
  };

  const handleContactPress = () => {
    try {
      Linking.openURL('mailto:support@shilpiapp.com?subject=Shilpi%20Support');
    } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      {/* Top Right Subtle Ambient Blush Glow */}
      <View style={styles.ambientGlow} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <SvgRadialGradient
              id="topGlow"
              cx="100%"
              cy="0%"
              r="80%"
              fx="100%"
              fy="0%"
            >
              <Stop offset="0%" stopColor="#ffeef4" stopOpacity="0.8" />
              <Stop offset="50%" stopColor="#fff5f8" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#topGlow)" />
        </Svg>
      </View>

      {/* Top Bar with Arrow Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButtonCircle}
          onPress={onGoBack}
          activeOpacity={0.75}
        >
          <ChevronLeftVector color="#121212" size={20} />
        </TouchableOpacity>
      </View>

      {/* Main Single-Viewport Content (Zero Scrolling Required) */}
      <View style={styles.mainContent}>
        {/* Title Header */}
        <Animated.View style={[styles.headerSection, { opacity: headerAnim }]}>
          <Text style={styles.headline}>
            How will you{'\n'}use <Text style={styles.headlinePink}>Shilpi?</Text>
          </Text>
          <Text style={styles.subheadline}>
            Choose one to continue. You can switch any time.
          </Text>
        </Animated.View>

        {/* ------------------------------------------------------------- */}
        {/* CARD 01: I'M A BEAUTICIAN (Pink Card Gradient) */}
        {/* ------------------------------------------------------------- */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: card1Anim,
              transform: [
                {
                  translateY: card1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardBeautician}
            onPress={handleBeauticianPress}
            activeOpacity={0.92}
          >
            {/* Soft Pink Right-side Blush Gradient */}
            <View style={StyleSheet.absoluteFill}>
              <Svg width="100%" height="100%">
                <Defs>
                  <SvgLinearGradient id="beauticianGrad" x1="0" y1="0" x2="1" y2="0.6">
                    <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <Stop offset="55%" stopColor="#ffffff" stopOpacity="0.9" />
                    <Stop offset="85%" stopColor="#ffe7f0" stopOpacity="0.75" />
                    <Stop offset="100%" stopColor="#ffd9e8" stopOpacity="0.85" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx={24} fill="url(#beauticianGrad)" />
              </Svg>
            </View>

            {/* Top Row: 01 and Outlined PROFESSIONAL Pill */}
            <View style={styles.cardTopRow}>
              <Text style={styles.cardIndexNumber}>01</Text>
              <View style={styles.professionalPill}>
                <Text style={styles.professionalPillText}>PROFESSIONAL</Text>
              </View>
            </View>

            {/* Title & Copy */}
            <Text style={styles.cardTitle}>I'm a beautician</Text>
            <Text style={styles.cardDescription}>
              Showcase your work, manage bookings and grow your clients.
            </Text>

            {/* Bottom Row: Sign In Text + Black Arrow Circle */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.cardActionText}>Sign in</Text>
              <View style={styles.blackArrowCircle}>
                <ArrowRightVector color="#ffffff" size={15} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ------------------------------------------------------------- */}
        {/* CARD 02: I'M LOOKING FOR A BEAUTICIAN (Orange/Peach Gradient) */}
        {/* ------------------------------------------------------------- */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: card2Anim,
              transform: [
                {
                  translateY: card2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardClient}
            onPress={handleClientPress}
            activeOpacity={0.92}
          >
            {/* Soft Warm Orange/Peach Right-side Blush Gradient */}
            <View style={StyleSheet.absoluteFill}>
              <Svg width="100%" height="100%">
                <Defs>
                  <SvgLinearGradient id="clientGrad" x1="0" y1="0" x2="1" y2="0.6">
                    <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <Stop offset="55%" stopColor="#ffffff" stopOpacity="0.9" />
                    <Stop offset="85%" stopColor="#fff0e6" stopOpacity="0.8" />
                    <Stop offset="100%" stopColor="#ffe4d1" stopOpacity="0.9" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx={24} fill="url(#clientGrad)" />
              </Svg>
            </View>

            {/* Top Row: 02 and Outlined CLIENT Pill */}
            <View style={styles.cardTopRow}>
              <Text style={styles.cardIndexNumber}>02</Text>
              <View style={styles.clientPill}>
                <Text style={styles.clientPillText}>CLIENT</Text>
              </View>
            </View>

            {/* Title & Copy */}
            <Text style={styles.cardTitle}>I'm looking for a beautician</Text>
            <Text style={styles.cardDescription}>
              Discover trusted artists near you and book in seconds.
            </Text>

            {/* Bottom Row: Find Nearest Beautician Text + Black Arrow Circle */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.cardActionText}>Find nearest beautician</Text>
              <View style={styles.blackArrowCircle}>
                <ArrowRightVector color="#ffffff" size={15} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer Support Prompt */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Need help? </Text>
          <TouchableOpacity onPress={handleContactPress} activeOpacity={0.7}>
            <Text style={styles.footerContactText}>Contact us</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.75,
    height: 240,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 10,
    zIndex: 2,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
    zIndex: 2,
  },
  headerSection: {
    marginBottom: 6,
  },
  headline: {
    color: '#121212',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 8,
  },
  headlinePink: {
    color: '#e8276b',
  },
  subheadline: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  cardContainer: {
    width: '100%',
  },
  cardBeautician: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.16)',
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  cardClient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 157, 92, 0.22)',
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#ff9d5c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardIndexNumber: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  professionalPill: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  professionalPillText: {
    color: '#121212',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  clientPill: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  clientPillText: {
    color: '#121212',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  cardTitle: {
    color: '#121212',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  cardDescription: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  blackArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
  footerContactText: {
    color: '#e8276b',
    fontSize: 13,
    fontWeight: '800',
  },
});
