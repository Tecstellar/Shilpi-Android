import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const finishedRef = useRef(false);

  const attemptFinish = () => {
    if (!finishedRef.current) {
      finishedRef.current = true;
      onFinish();
    }
  };

  useEffect(() => {
    // 1. Entrance animation (smooth fade + spring scale)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle luxury breathing glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Auto-transition smoothly into onboarding
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        attemptFinish();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, pulseAnim]);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={attemptFinish}
    >
      {/* Background Subtle Ambient Rose Glow */}
      <View style={styles.ambientGlow} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 400 400">
          <Defs>
            <SvgLinearGradient id="splashGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#e8276b" stopOpacity="0.22" />
              <Stop offset="55%" stopColor="#ff528c" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#08080c" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx="200" cy="200" r="180" fill="url(#splashGlow)" />
        </Svg>
      </View>

      <Animated.View
        style={[
          styles.contentWrap,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Luxury Shilpi Sparkling Emblem */}
        <View style={styles.emblemWrap}>
          <Svg width={76} height={76} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
              fill="#e8276b"
            />
            <Path
              d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z"
              fill="#ff7a9e"
            />
          </Svg>
        </View>

        {/* Brand Headline */}
        <Text style={styles.brandTitle}>SHILPI</Text>

        {/* Editorial Subtitle */}
        <Text style={styles.brandSubtitle}>BEAUTY & MAKEOVER STUDIO</Text>

        {/* Breathing Status Indicator */}
        <Animated.View style={[styles.dotPill, { opacity: pulseAnim }]}>
          <View style={styles.dot} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080c',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  emblemWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(232, 39, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#ffffff',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: 32,
  },
  dotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e8276b',
  },
});
