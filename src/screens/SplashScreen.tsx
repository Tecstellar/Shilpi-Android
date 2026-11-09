import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const finishedRef = useRef(false);

  const safeFinish = () => {
    if (!finishedRef.current) {
      finishedRef.current = true;
      onFinish();
    }
  };

  const player = useVideoPlayer(require('../../assets/Shilpi_Splash_Intro.mp4'), (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    // 1. Listen to natural video completion
    const subscription = player.addListener('playToEnd', () => {
      safeFinish();
    });

    // 2. Fallback safety timer (video duration is ~3.5 seconds; timer triggers at 4.5s)
    const timeout = setTimeout(() => {
      safeFinish();
    }, 4500);

    return () => {
      subscription.remove();
      clearTimeout(timeout);
    };
  }, [player]);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.container}
      onPress={safeFinish}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        nativeControls={false}
        contentFit="contain"
      />

      {/* Brand Overlay */}
      <View style={styles.footerOverlay}>
        <Text style={styles.brandSubtitle}>
          Bookings · Clients · Payments · Reports
        </Text>
        <Text style={styles.tapToContinue}>
          Tap anywhere to continue
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  footerOverlay: {
    paddingBottom: 48,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: '100%',
    paddingTop: 24,
  },
  brandSubtitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  tapToContinue: {
    fontSize: 10.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
