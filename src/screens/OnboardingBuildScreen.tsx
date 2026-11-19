import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// -------------------------------------------------------------
// PURE VECTOR ICONS (Zero emojis, editorial line work)
// -------------------------------------------------------------

const ArrowRightVector: React.FC<{ color?: string; size?: number }> = ({
  color = '#ffffff',
  size = 18,
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
  size = 18,
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

const CheckVector: React.FC<{ color?: string; size?: number }> = ({
  color = '#ffffff',
  size = 10,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// -------------------------------------------------------------
// 4 FASHIONABLE BUILD SLIDES (White Luxury Theme)
// -------------------------------------------------------------

export interface BuildSlideData {
  id: string;
  stepNumber: string;
  kicker: string;
  titlePrefix: string;
  titleAccent: string;
  titleSuffix: string;
  description: string;
  pillTag: string;
  statusBadge?: string;
  type: 'photo' | 'client_crm' | 'payments_dues' | 'lookbook_qr';
}

const BUILD_SLIDES: BuildSlideData[] = [
  {
    id: 'build_1',
    stepNumber: '01 / 04',
    kicker: 'BRIDAL CALENDAR',
    titlePrefix: 'Schedule Auspicious\n',
    titleAccent: 'Muhurthams',
    titleSuffix: ' & Bookings',
    description:
      'Never double-book during wedding seasons. Manage muhurtham timings, reception dates, and trial sessions with real-time conflict alerts.',
    pillTag: 'CALENDAR & BOOKINGS',
    statusBadge: 'Appointment Completed',
    type: 'photo',
  },
  {
    id: 'build_2',
    stepNumber: '02 / 04',
    kicker: 'CLIENT CRM',
    titlePrefix: 'Curate Personalized\n',
    titleAccent: 'Bridal',
    titleSuffix: ' Profiles & Notes',
    description:
      'Save every bride’s skin tone, hair texture, saree draping style, and trial makeup look in one private, organized directory.',
    pillTag: 'CLIENT DIRECTORY',
    type: 'client_crm',
  },
  {
    id: 'build_3',
    stepNumber: '03 / 04',
    kicker: 'PAYMENTS & REPORTS',
    titlePrefix: 'Track Payments, ',
    titleAccent: 'Dues',
    titleSuffix: '\n& Studio Reports',
    description:
      'Manage client advance payments and pending balance dues effortlessly. View your monthly earnings, studio cashflow, and detailed profit reports.',
    pillTag: 'EARNINGS & DUES',
    type: 'payments_dues',
  },
  {
    id: 'build_4',
    stepNumber: '04 / 04',
    kicker: 'BRIDAL GALLERY',
    titlePrefix: 'Showcase Bridal\n',
    titleAccent: 'Transformations',
    titleSuffix: ' & Lookbooks',
    description:
      'Organize your signature bridal looks into stunning mobile galleries to share with walk-in brides and sync with the front-desk terminal.',
    pillTag: 'BRIDAL LOOKBOOKS',
    type: 'lookbook_qr',
  },
];

const GALLERY_PHOTOS_6 = [
  {
    id: 'g1',
    source: require('../../assets/build_1_appointment.jpg'),
  },
  {
    id: 'g2',
    source: {
      uri: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400&auto=format&fit=crop',
    },
  },
  {
    id: 'g3',
    source: {
      uri: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400&auto=format&fit=crop',
    },
  },
  {
    id: 'g4',
    source: {
      uri: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=400&auto=format&fit=crop',
    },
  },
  {
    id: 'g5',
    source: {
      uri: 'https://images.unsplash.com/photo-1605806616949-1e87b487fc2f?q=80&w=400&auto=format&fit=crop',
    },
  },
  {
    id: 'g6',
    source: {
      uri: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=400&auto=format&fit=crop',
    },
  },
];

interface OnboardingBuildScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingBuildScreen: React.FC<OnboardingBuildScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < BUILD_SLIDES.length) {
      setActiveIndex(index);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const goToNextSlide = () => {
    if (activeIndex < BUILD_SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    } else {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      onComplete();
    }
  };

  const goToPrevSlide = () => {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setActiveIndex(prevIndex);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  // -------------------------------------------------------------
  // HERO ILLUSTRATIONS FOR EACH BUILD
  // -------------------------------------------------------------

  // Slide 1: Real Photo with girl's head fully visible & Appointment Completed Badge
  const renderPhotoHero = (item: BuildSlideData) => (
    <View style={styles.heroCanvasPhoto}>
      <Image
        source={require('../../assets/build_1_appointment.jpg')}
        style={styles.heroImagePhoto}
        resizeMode="cover"
      />

      {/* Bottom-only fade: transparent at top, smoothly blends to white at bottom */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <SvgLinearGradient id="bottomFadeOnly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <Stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
              <Stop offset="82%" stopColor="#ffffff" stopOpacity="0.55" />
              <Stop offset="96%" stopColor="#ffffff" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bottomFadeOnly)" />
        </Svg>
      </View>

      {/* Floating Status Badge: Appointment Completed */}
      {item.statusBadge ? (
        <View style={styles.floatingStatusBox}>
          <View style={styles.statusCheckCircle}>
            <CheckVector color="#ffffff" size={10} />
          </View>
          <Text style={styles.statusBoxText}>{item.statusBadge}</Text>
        </View>
      ) : null}
    </View>
  );

  // Slide 2: Dedicated Client Directory & Bridal CRM Illustration
  const renderClientCrmHero = () => (
    <View style={styles.heroCanvasUi}>
      <View style={styles.uiAmbientGlow} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <SvgRadialGradient id="crmGlow" cx="50%" cy="40%" r="60%">
              <Stop offset="0%" stopColor="#ffeef4" stopOpacity="0.9" />
              <Stop offset="70%" stopColor="#fff5f8" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#crmGlow)" />
        </Svg>
      </View>

      <View style={styles.mockupImageCard}>
        <Image
          source={require('../../assets/build_2_client_crm.jpg')}
          style={styles.mockupImageFull}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  // Slide 3: Dedicated Financial, Dues & Studio Reports Illustration
  const renderPaymentsDuesHero = () => (
    <View style={styles.heroCanvasUi}>
      <View style={styles.uiAmbientGlow} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <SvgRadialGradient id="payGlow" cx="50%" cy="35%" r="65%">
              <Stop offset="0%" stopColor="#fff3f7" stopOpacity="0.95" />
              <Stop offset="70%" stopColor="#fffafc" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#payGlow)" />
        </Svg>
      </View>

      <View style={styles.mockupImageCard}>
        <Image
          source={require('../../assets/build_3_payments_reports.jpg')}
          style={styles.mockupImageFull}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  // Slide 4: 6-Photo Seamless Collage of Traditional Bridal Looks
  const renderLookbookQrHero = () => (
    <View style={styles.heroCanvasCollage}>
      <View style={styles.uiAmbientGlow} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <SvgRadialGradient id="lookGlow" cx="50%" cy="35%" r="65%">
              <Stop offset="0%" stopColor="#ffeef4" stopOpacity="0.95" />
              <Stop offset="70%" stopColor="#fffafc" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#lookGlow)" />
        </Svg>
      </View>

      {/* Seamless Mobile Gallery Collage Card */}
      <View style={styles.collageCard}>
        {/* Clean Header: Only "Bridal Transformations" */}
        <View style={styles.collageHeader}>
          <Text style={styles.collageTitle}>Bridal Transformations</Text>
        </View>

        {/* 6 Photos in a Tight Seamless Collage Grid (3 Columns x 2 Rows) */}
        <View style={styles.collageGrid}>
          {GALLERY_PHOTOS_6.map((photo) => (
            <View key={photo.id} style={styles.collageGridItem}>
              <Image source={photo.source} style={styles.collagePhoto} resizeMode="cover" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSlide = ({ item }: { item: BuildSlideData }) => (
    <View style={styles.slideContainer}>
      {/* Upper Hero Canvas */}
      {item.type === 'photo' && renderPhotoHero(item)}
      {item.type === 'client_crm' && renderClientCrmHero()}
      {item.type === 'payments_dues' && renderPaymentsDuesHero()}
      {item.type === 'lookbook_qr' && renderLookbookQrHero()}

      {/* Lower Content Container (Headline, Description & Feature Pill on White Ground) */}
      <View style={styles.contentSection}>
        {/* Category Pill Tag */}
        <View style={styles.pillTagWrap}>
          <Text style={styles.pillTagText}>{item.pillTag}</Text>
        </View>

        {/* Big Bold Headline with Accent Word Highlight */}
        <Text style={styles.mainHeadline}>
          {item.titlePrefix}
          <Text style={styles.headlineAccent}>{item.titleAccent}</Text>
          {item.titleSuffix}
        </Text>

        {/* Clean, Readable Description */}
        <Text style={styles.descriptionText}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 14 }]}>
      {/* Top Header Bar: Official Shilpi Black Logo & Story Progress */}
      <View style={styles.headerBar}>
        <Image
          source={require('../../assets/shilpi-logo-black.png')}
          style={styles.brandLogoHeader}
          resizeMode="contain"
        />

        {/* Top Story Progress Bar (Pink on Soft Blush) */}
        <View style={styles.segmentedProgressBar}>
          {BUILD_SLIDES.map((slide, index) => {
            const isActive = index === activeIndex;
            const isPassed = index < activeIndex;
            return (
              <View key={slide.id} style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: isActive
                        ? '#e8276b'
                        : isPassed
                        ? '#121212'
                        : '#fce7f0',
                      width: isActive ? '100%' : isPassed ? '100%' : '0%',
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.75}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel */}
      <FlatList
        ref={flatListRef}
        data={BUILD_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      />

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        {activeIndex > 0 && (
          <TouchableOpacity
            style={styles.backButtonCircle}
            onPress={goToPrevSlide}
            activeOpacity={0.75}
          >
            <ChevronLeftVector color="#121212" size={18} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.getStartedButton, activeIndex === 0 && styles.getStartedButtonFull]}
          onPress={goToNextSlide}
          activeOpacity={0.88}
        >
          <Text style={styles.getStartedButtonText}>
            {activeIndex === BUILD_SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ArrowRightVector color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 10,
    zIndex: 10,
    backgroundColor: '#ffffff',
  },
  brandLogoHeader: {
    width: 98,
    height: 25,
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 90,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#fce7f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButton: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  skipButtonText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '700',
  },
  carousel: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'space-between',
  },

  // -----------------------------------------------------------
  // BUILD 1: PHOTO CANVAS (Full bride face & maang tikka visible)
  // -----------------------------------------------------------
  heroCanvasPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.50,
    position: 'relative',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  heroImagePhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.56,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  floatingStatusBox: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  statusCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBoxText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // -----------------------------------------------------------
  // BUILDS 2 & 3: APP UI MOCKUPS (Client Profile & Financial Overview)
  // -----------------------------------------------------------
  heroCanvasUi: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  uiAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mockupImageCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.14)',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  mockupImageFull: {
    width: '100%',
    height: '100%',
  },

  // -----------------------------------------------------------
  // BUILD 4: 6-PHOTO SEAMLESS COLLAGE (Bridal Transformations)
  // -----------------------------------------------------------
  heroCanvasCollage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.47,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 10, // Avoid mingling with top bar
  },
  collageCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.16)',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  collageHeader: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  collageTitle: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  collageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  collageGridItem: {
    width: '33.3333%',
    height: 120, // Increased length & width to completely fill space without white lines
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  collagePhoto: {
    width: '100%',
    height: '100%',
  },

  // -----------------------------------------------------------
  // LOWER CONTENT SECTION
  // -----------------------------------------------------------
  contentSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  pillTagWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff0f5',
    borderWidth: 1,
    borderColor: '#fcd2e1',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 12,
    marginBottom: 8,
  },
  pillTagText: {
    color: '#e8276b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  mainHeadline: {
    color: '#121212',
    fontSize: 29,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  headlineAccent: {
    color: '#e8276b',
  },
  descriptionText: {
    color: '#4b5563',
    fontSize: 13.5,
    lineHeight: 20,
    maxWidth: SCREEN_WIDTH - 48,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: '#ffffff',
  },
  backButtonCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e8276b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  getStartedButtonFull: {
    width: '100%',
  },
  getStartedButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
