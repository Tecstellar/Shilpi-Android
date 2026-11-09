import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const videoRef = useRef<Video>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        onFinish();
      }
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.container}
      onPress={onFinish}
    >
      {/* Splash Intro Video as demanded */}
      <Video
        ref={videoRef}
        source={require('../../assets/Shilpi_Splash_Intro.mp4')}
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        isMuted={false}
        onLoad={() => setVideoLoaded(true)}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(err) => {
          console.warn('Video playback warning, falling back to instant proceed', err);
          setTimeout(onFinish, 2000);
        }}
      />

      {/* Elegant Bottom Brand Tagline Overlay */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
