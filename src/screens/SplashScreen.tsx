import React, { Component, ReactNode, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface SplashScreenProps {
  onFinish: () => void;
}

// Error boundary to gracefully catch any native video module issue
class VideoErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Video playback warning, proceeding to login:', error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const IntroVideoPlayer: React.FC<{ onEnd: () => void }> = ({ onEnd }) => {
  const [hasEnded, setHasEnded] = useState(false);
  const endedRef = useRef(false);
  const videoSource = require('../../assets/Shilpi_Splash_Intro.mp4');

  const player = useVideoPlayer(videoSource, (p) => {
    try {
      p.loop = false;
      p.muted = true; // Essential for silent 1080x1920 MP4 to prevent ExoPlayer clock stall
      p.play();
    } catch (e) {
      console.warn('Player init error', e);
    }
  });

  const triggerEnd = useRef(() => {
    if (!endedRef.current) {
      endedRef.current = true;
      setHasEnded(true);
      onEnd();
    }
  }).current;

  useEffect(() => {
    let subEnd: any;
    let subStatus: any;
    try {
      subEnd = player.addListener('playToEnd', () => {
        triggerEnd();
      });
      subStatus = player.addListener('statusChange', ({ status, error }: any) => {
        if (status === 'error' || error) {
          triggerEnd();
        }
      });
      // Force play in case autoplay was deferred by platform
      player.play();
    } catch {
      triggerEnd();
    }

    return () => {
      try {
        subEnd?.remove();
        subStatus?.remove();
      } catch {}
    };
  }, [player, triggerEnd]);

  if (hasEnded) {
    return null;
  }

  return (
    <VideoView
      style={StyleSheet.absoluteFillObject}
      player={player}
      nativeControls={false}
      contentFit="cover"
    />
  );
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [videoFinished, setVideoFinished] = useState(false);
  const finishedRef = useRef(false);

  const attemptFinish = () => {
    if (!finishedRef.current) {
      finishedRef.current = true;
      onFinish();
    }
  };

  useEffect(() => {
    if (videoFinished) {
      attemptFinish();
    }
  }, [videoFinished]);

  // The video duration is 8.00s. Fallback timer at 8.5s ensures the entire video plays!
  useEffect(() => {
    const timeout = setTimeout(() => {
      setVideoFinished(true);
    }, 8500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      {!videoFinished && (
        <VideoErrorBoundary onError={() => setVideoFinished(true)}>
          <IntroVideoPlayer onEnd={() => setVideoFinished(true)} />
        </VideoErrorBoundary>
      )}

      {/* Tap anywhere to skip */}
      <TouchableOpacity
        style={styles.touchOverlay}
        activeOpacity={1}
        onPress={() => setVideoFinished(true)}
      >
        <View style={styles.footerOverlay}>
          <Text style={styles.brandSubtitle}>
            Bookings · Clients · Payments · Reports
          </Text>
          <Text style={styles.tapToContinue}>
            Tap anywhere to skip
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  footerOverlay: {
    paddingBottom: 48,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: '100%',
    paddingTop: 20,
  },
  brandSubtitle: {
    fontSize: 11.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  tapToContinue: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.45)',
  },
});
