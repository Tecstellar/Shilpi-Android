import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 340);

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  ownerName?: string;
}

// ----------------- Bespoke Luxury Vector SVG Icons ----------------- //

const CloseIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.4}>
    <Line x1={18} y1={6} x2={6} y2={18} strokeLinecap="round" />
    <Line x1={6} y1={6} x2={18} y2={18} strokeLinecap="round" />
  </Svg>
);

const UserPlusIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={8.5} cy={7} r={4} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={20} y1={8} x2={20} y2={14} strokeLinecap="round" />
    <Line x1={23} y1={11} x2={17} y2={11} strokeLinecap="round" />
  </Svg>
);

const PackagesIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
    <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PaymentsIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={2}>
    <Rect x={2} y={5} width={20} height={14} rx={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={2} y1={10} x2={22} y2={10} strokeLinecap="round" />
  </Svg>
);

const GalleryIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
    <Rect x={3} y={3} width={18} height={18} rx={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={8.5} cy={8.5} r={1.5} fill="rgba(255,255,255,0.7)" />
    <Path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const NotificationsIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}>
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RemindersIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}>
    <Circle cx={12} cy={12} r={9} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ExpensesIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}>
    <Path
      d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={8} y1={8} x2={16} y2={8} strokeLinecap="round" />
    <Line x1={8} y1={12} x2={14} y2={12} strokeLinecap="round" />
  </Svg>
);

const ReportsIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}>
    <Line x1={18} y1={20} x2={18} y2={10} strokeLinecap="round" strokeWidth={2.2} />
    <Line x1={12} y1={20} x2={12} y2={4} strokeLinecap="round" strokeWidth={2.2} />
    <Line x1={6} y1={20} x2={6} y2={14} strokeLinecap="round" strokeWidth={2.2} />
  </Svg>
);

const SubscriptionIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={2}>
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ProfileIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={7} r={4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SettingsIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
    <Circle cx={12} cy={12} r={3} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ff4d6d" strokeWidth={2}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={21} y1={12} x2={9} y2={12} strokeLinecap="round" />
  </Svg>
);

// ----------------- GSAP-Inspired Micro-Interactive Pressable Card ----------------- //

interface AnimatedTouchableCardProps {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
}

const AnimatedTouchableCard: React.FC<AnimatedTouchableCardProps> = ({
  onPress,
  style,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      tension: 180,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 140,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ----------------- Main Luxury Drawer Component ----------------- //

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
  ownerName,
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  // GSAP-style physics controllers
  const animX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const animFade = useRef(new Animated.Value(0)).current;

  // Staggered child entrance animations (GSAP-like fluid cascade)
  const animHeader = useRef(new Animated.Value(0)).current;
  const animProfile = useRef(new Animated.Value(0)).current;
  const animGrid = useRef(new Animated.Value(0)).current;
  const animList = useRef(new Animated.Value(0)).current;
  const animFooter = useRef(new Animated.Value(0)).current;

  // Dynamic user data
  const [profile, setProfile] = useState<{ ownerName: string; businessName: string }>({
    ownerName: ownerName || 'Shilpa R.',
    businessName: 'Beauty & Bridal Studio',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('@shilpi_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile({
            ownerName: parsed.ownerName?.trim() || ownerName || 'Shilpa R.',
            businessName: parsed.businessName?.trim() || 'Beauty & Bridal Studio',
          });
        } else if (ownerName) {
          setProfile((prev) => ({ ...prev, ownerName }));
        }
      } catch (e) {}
    };
    loadProfile();
  }, [isOpen, ownerName]);

  // Entrance and Exit Orchestration
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Reset child cascade values
      animHeader.setValue(0);
      animProfile.setValue(0);
      animGrid.setValue(0);
      animList.setValue(0);
      animFooter.setValue(0);

      // Slide drawer in with spring dynamics
      Animated.parallel([
        Animated.spring(animX, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(animFade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered fluid cascade for interior items
      Animated.stagger(45, [
        Animated.spring(animHeader, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(animProfile, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(animGrid, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(animList, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(animFooter, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();
    } else if (isVisible) {
      Animated.parallel([
        Animated.timing(animX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(animFade, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [isOpen]);

  const handleCloseWithAction = (action?: () => void) => {
    Animated.parallel([
      Animated.timing(animX, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(animFade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onClose();
      if (action) {
        action();
      }
    });
  };

  if (!isVisible && !isOpen) return null;

  // Extract up to 2 uppercase initials from name
  const nameParts = (profile.ownerName || 'Shilpa R.').trim().split(' ');
  const initials = nameParts.length >= 2
    ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
    : (nameParts[0]?.substring(0, 2) || 'SR').toUpperCase();

  return (
    <View style={styles.overlay}>
      {/* 1. Main Sliding Luxury Obsidian Drawer */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            transform: [{ translateX: animX }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header: Shilpi Logo + Close Button */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: animHeader,
                transform: [
                  {
                    translateY: animHeader.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.headerRow}>
              {/* Shilpi Logo */}
              <Image
                source={require('../../assets/shilpi-logo-tight.png')}
                style={styles.shilpiLogo}
                resizeMode="contain"
              />

              {/* Close Button Pill */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => handleCloseWithAction()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            {/* Vibrant Pink Hairline Divider */}
            <View style={styles.pinkDivider} />
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: animProfile,
                transform: [
                  {
                    translateY: animProfile.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                  {
                    scale: animProfile.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Top Row: Avatar + Name + Premium Badge */}
            <View style={styles.profileTopRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>

              <View style={styles.profileDetails}>
                <Text style={styles.ownerName} numberOfLines={1}>
                  {profile.ownerName}
                </Text>

                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumCrown}>👑</Text>
                  <Text style={styles.premiumText}>PREMIUM</Text>
                </View>
              </View>
            </View>

            {/* Internal Divider */}
            <View style={styles.profileCardDivider} />

            {/* Bottom Row: Month Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>This month</Text>
                <Text style={styles.metricValueWhite}>11 bookings</Text>
              </View>

              <View style={styles.metricSeparator} />

              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>To collect</Text>
                <Text style={styles.metricValuePink}>₹18,000</Text>
              </View>
            </View>
          </Animated.View>

          {/* 2x2 Quick Action Cards Grid */}
          <Animated.View
            style={[
              styles.actionGrid,
              {
                opacity: animGrid,
                transform: [
                  {
                    translateY: animGrid.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Card 1: Add Client (Signature Pink Hero Card) */}
            <AnimatedTouchableCard
              style={[styles.gridCard, styles.gridCardPink]}
              onPress={() => handleCloseWithAction(() => onNavigate('newclient'))}
            >
              <View style={styles.iconCircleTranslucent}>
                <UserPlusIcon />
              </View>
              <Text style={styles.cardTitleWhite}>Add Client</Text>
            </AnimatedTouchableCard>

            {/* Card 2: My Packages */}
            <AnimatedTouchableCard
              style={styles.gridCard}
              onPress={() => handleCloseWithAction(() => onNavigate('packages'))}
            >
              <View style={styles.iconCircleDark}>
                <PackagesIcon />
              </View>
              <Text style={styles.cardTitleWhite}>My Packages</Text>
            </AnimatedTouchableCard>

            {/* Card 3: Payments */}
            <AnimatedTouchableCard
              style={styles.gridCard}
              onPress={() => handleCloseWithAction(() => onNavigate('payments'))}
            >
              <View style={styles.iconCircleDark}>
                <PaymentsIcon />
              </View>
              <View>
                <Text style={styles.cardTitleWhite}>Payments</Text>
                <Text style={styles.cardSubPink}>₹18,000 pending</Text>
              </View>
            </AnimatedTouchableCard>

            {/* Card 4: My Gallery */}
            <AnimatedTouchableCard
              style={styles.gridCard}
              onPress={() => handleCloseWithAction(() => onNavigate('gallery'))}
            >
              <View style={styles.iconCircleDark}>
                <GalleryIcon />
              </View>
              <Text style={styles.cardTitleWhite}>My Gallery</Text>
            </AnimatedTouchableCard>
          </Animated.View>

          {/* Vertical Menu Navigation Group Card */}
          <Animated.View
            style={[
              styles.menuListCard,
              {
                opacity: animList,
                transform: [
                  {
                    translateY: animList.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Notifications */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => handleCloseWithAction(() => onNavigate('notifications'))}
              activeOpacity={0.65}
            >
              <View style={styles.rowLeft}>
                <View style={styles.menuIconBox}>
                  <NotificationsIcon />
                </View>
                <Text style={styles.menuRowText}>Notifications</Text>
              </View>
              <View style={styles.badgePinkPill}>
                <Text style={styles.badgePinkText}>3 new</Text>
              </View>
            </TouchableOpacity>

            {/* Reminders */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => handleCloseWithAction(() => onNavigate('reminders'))}
              activeOpacity={0.65}
            >
              <View style={styles.rowLeft}>
                <View style={styles.menuIconBox}>
                  <RemindersIcon />
                </View>
                <Text style={styles.menuRowText}>Reminders</Text>
              </View>
              <Text style={styles.subtextGray}>3 today</Text>
            </TouchableOpacity>

            {/* Expenses */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => handleCloseWithAction(() => onNavigate('expenses'))}
              activeOpacity={0.65}
            >
              <View style={styles.rowLeft}>
                <View style={styles.menuIconBox}>
                  <ExpensesIcon />
                </View>
                <Text style={styles.menuRowText}>Expenses</Text>
              </View>
              <Text style={styles.chevronGray}>›</Text>
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => handleCloseWithAction(() => onNavigate('reports'))}
              activeOpacity={0.65}
            >
              <View style={styles.rowLeft}>
                <View style={styles.menuIconBox}>
                  <ReportsIcon />
                </View>
                <Text style={styles.menuRowText}>Reports</Text>
              </View>
              <Text style={styles.chevronGray}>›</Text>
            </TouchableOpacity>

            {/* Subscription */}
            <TouchableOpacity
              style={[styles.menuRow, styles.menuRowLast]}
              onPress={() => handleCloseWithAction(() => onNavigate('subscription'))}
              activeOpacity={0.65}
            >
              <View style={styles.rowLeft}>
                <View style={styles.menuIconBox}>
                  <SubscriptionIcon />
                </View>
                <Text style={styles.menuRowText}>Subscription</Text>
              </View>
              <Text style={styles.premiumTextRight}>Premium</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom Utility Row: My Profile / Settings / Logout */}
          <Animated.View
            style={[
              styles.utilityRow,
              {
                opacity: animFooter,
                transform: [
                  {
                    translateY: animFooter.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* My Profile */}
            <AnimatedTouchableCard
              style={styles.utilityCard}
              onPress={() => handleCloseWithAction(() => onNavigate('settings'))}
            >
              <ProfileIcon />
              <Text style={styles.utilityTextWhite}>My Profile</Text>
            </AnimatedTouchableCard>

            {/* Settings */}
            <AnimatedTouchableCard
              style={styles.utilityCard}
              onPress={() => handleCloseWithAction(() => onNavigate('settings'))}
            >
              <SettingsIcon />
              <Text style={styles.utilityTextWhite}>Settings</Text>
            </AnimatedTouchableCard>

            {/* Logout */}
            <AnimatedTouchableCard
              style={styles.utilityCard}
              onPress={() => handleCloseWithAction(() => onLogout())}
            >
              <LogoutIcon />
              <Text style={styles.utilityTextRed}>Logout</Text>
            </AnimatedTouchableCard>
          </Animated.View>

          {/* Version Footer */}
          <Animated.View style={{ opacity: animFooter }}>
            <Text style={styles.versionFooter}>Shilpi v1.0</Text>
          </Animated.View>
        </ScrollView>
      </Animated.View>

      {/* Dimmed Backdrop Dismissal with Smooth Fade */}
      <TouchableWithoutFeedback onPress={() => handleCloseWithAction()}>
        <Animated.View style={[styles.backdrop, { opacity: animFade }]} />
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#0f0f13',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 10000,
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 25,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.65)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },

  // Header Section
  headerSection: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  shilpiLogo: {
    height: 22,
    width: 96,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pinkDivider: {
    height: 2,
    backgroundColor: '#e8276b',
    borderRadius: 1,
    width: '100%',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#16161a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#232328',
    padding: 14,
    marginBottom: 12,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#e8276b',
    backgroundColor: '#1a1016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  ownerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 39, 107, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.28)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  premiumCrown: {
    fontSize: 9,
    marginRight: 3,
  },
  premiumText: {
    color: '#e8276b',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  profileCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValueWhite: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metricSeparator: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 12,
  },
  metricValuePink: {
    color: '#e8276b',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // 2x2 Quick Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 12,
  },
  gridCard: {
    width: '48.5%',
    height: 98,
    backgroundColor: '#16161a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#232328',
    padding: 12,
    justifyContent: 'space-between',
  },
  gridCardPink: {
    backgroundColor: '#e8276b',
    borderColor: '#e8276b',
  },
  iconCircleTranslucent: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWhite: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  cardSubPink: {
    color: '#e8276b',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },

  // Menu List Group Card
  menuListCard: {
    backgroundColor: '#16161a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#232328',
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12.5,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBox: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuRowText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  badgePinkPill: {
    backgroundColor: '#e8276b',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  badgePinkText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  subtextGray: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  chevronGray: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 17,
    fontWeight: '300',
  },
  premiumTextRight: {
    color: '#e8276b',
    fontSize: 12,
    fontWeight: '700',
  },

  // Bottom Utility Row
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: '#16161a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#232328',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityTextWhite: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  utilityTextRed: {
    color: '#ff4d6d',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },

  // Footer
  versionFooter: {
    color: 'rgba(255, 255, 255, 0.28)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
    fontWeight: '500',
  },
});
