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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 330);

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  ownerName?: string;
}

// ----------------- Bespoke Luxury Vector SVG Icons ----------------- //

const UserPlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={8.5} cy={7} r={4} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={20} y1={8} x2={20} y2={14} strokeLinecap="round" />
    <Line x1={23} y1={11} x2={17} y2={11} strokeLinecap="round" />
  </Svg>
);

const PackagesIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PaymentsIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Rect x={2} y={5} width={20} height={14} rx={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={2} y1={10} x2={22} y2={10} strokeLinecap="round" />
  </Svg>
);

const GalleryIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Rect x={3} y={3} width={18} height={18} rx={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={8.5} cy={8.5} r={1.5} fill="#ffffff" />
    <Path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const NotificationsIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RemindersIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Circle cx={12} cy={12} r={9} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ExpensesIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
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
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Line x1={18} y1={20} x2={18} y2={10} strokeLinecap="round" strokeWidth={2.2} />
    <Line x1={12} y1={20} x2={12} y2={4} strokeLinecap="round" strokeWidth={2.2} />
    <Line x1={6} y1={20} x2={6} y2={14} strokeLinecap="round" strokeWidth={2.2} />
  </Svg>
);

const SubscriptionIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const QrIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Path d="M3 7V5a2 2 0 0 1 2-2h2" strokeLinecap="round" />
    <Path d="M17 3h2a2 2 0 0 1 2 2v2" strokeLinecap="round" />
    <Path d="M21 17v2a2 2 0 0 1-2 2h-2" strokeLinecap="round" />
    <Path d="M7 21H5a2 2 0 0 1-2-2v-2" strokeLinecap="round" />
    <Rect x={7} y={7} width={10} height={10} rx={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SettingsIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Circle cx={12} cy={12} r={3} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ff5c7a" strokeWidth={2}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={21} y1={12} x2={9} y2={12} strokeLinecap="round" />
  </Svg>
);

// ----------------- Menu Items Grouped Definitions ----------------- //

interface DrawerItem {
  id: string;
  label: string;
  screen: string;
  icon: React.ReactNode;
  isDanger?: boolean;
}

interface DrawerSection {
  title: string;
  items: DrawerItem[];
}

const MENU_SECTIONS: DrawerSection[] = [
  {
    title: 'STUDIO & CLIENTS',
    items: [
      { id: 'newclient', label: 'Add Client', screen: 'newclient', icon: <UserPlusIcon /> },
      { id: 'packages', label: 'My Packages', screen: 'packages', icon: <PackagesIcon /> },
      { id: 'gallery', label: 'My Gallery', screen: 'gallery', icon: <GalleryIcon /> },
    ],
  },
  {
    title: 'FINANCE & EARNINGS',
    items: [
      { id: 'payments', label: 'Payments', screen: 'payments', icon: <PaymentsIcon /> },
      { id: 'expenses', label: 'Expenses', screen: 'expenses', icon: <ExpensesIcon /> },
      { id: 'reports', label: 'Reports & Stats', screen: 'reports', icon: <ReportsIcon /> },
    ],
  },
  {
    title: 'TOOLS & ASSISTANT',
    items: [
      { id: 'notifications', label: 'Notifications', screen: 'notifications', icon: <NotificationsIcon /> },
      { id: 'reminders', label: 'Reminders', screen: 'reminders', icon: <RemindersIcon /> },
      { id: 'qr_scanner', label: 'Link Web Terminal', screen: 'qr_scanner', icon: <QrIcon /> },
      { id: 'subscription', label: 'Membership Plan', screen: 'subscription', icon: <SubscriptionIcon /> },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { id: 'settings', label: 'Profile & Settings', screen: 'settings', icon: <SettingsIcon /> },
      { id: 'logout', label: 'Sign Out', screen: 'logout', icon: <LogoutIcon />, isDanger: true },
    ],
  },
];

// ----------------- Main Drawer Component ----------------- //

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
  ownerName,
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const animX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const animFade = useRef(new Animated.Value(0)).current;

  // Real Owner & Business Name loaded dynamically from AsyncStorage
  const [profile, setProfile] = useState<{ ownerName: string; businessName: string }>({
    ownerName: ownerName || 'Studio Owner',
    businessName: 'Beauty & Bridal Studio',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('@shilpi_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile({
            ownerName: parsed.ownerName?.trim() || ownerName || 'Studio Owner',
            businessName: parsed.businessName?.trim() || 'Beauty & Bridal Studio',
          });
        } else if (ownerName) {
          setProfile((prev) => ({ ...prev, ownerName }));
        }
      } catch (e) {}
    };
    loadProfile();
  }, [isOpen, ownerName]);

  // Handle Animated Open & Close
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(animX, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(animFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
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

  const initial = (profile.ownerName?.charAt(0) || 'S').toUpperCase();

  return (
    <View style={styles.overlay}>
      {/* 1. Animated Sliding Obsidian Drawer Container */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            transform: [{ translateX: animX }],
          },
        ]}
      >
        {/* Modern Header: Owner Identity Card (No 'Shilpi', No 'Premium') */}
        <View style={styles.drawerHeader}>
          {/* Close button pill */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => handleCloseWithAction()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Owner Profile Card */}
          <View style={styles.profileRow}>
            <View style={styles.avatarGlowRing}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            </View>

            <View style={styles.profileDetails}>
              <Text style={styles.ownerTitle} numberOfLines={1}>
                {profile.ownerName}
              </Text>
              <Text style={styles.businessSubtitle} numberOfLines={1}>
                {profile.businessName}
              </Text>
            </View>
          </View>

          {/* Subtle Pink Luminous Hairline Accent */}
          <View style={styles.accentBar} />
        </View>

        {/* 2. Organized Categorized Menu List */}
        <ScrollView
          style={styles.menuScroll}
          contentContainerStyle={styles.menuScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {MENU_SECTIONS.map((section, sIndex) => (
            <View key={section.title} style={[styles.sectionBlock, sIndex > 0 && styles.sectionGap]}>
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>

              <View style={styles.itemsGroup}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuRow}
                    onPress={() =>
                      handleCloseWithAction(() => {
                        if (item.screen === 'logout') {
                          onLogout();
                        } else {
                          onNavigate(item.screen);
                        }
                      })
                    }
                    activeOpacity={0.65}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        item.isDanger && styles.iconContainerDanger,
                      ]}
                    >
                      {item.icon}
                    </View>

                    <Text
                      style={[
                        styles.menuLabel,
                        item.isDanger && styles.menuLabelDanger,
                      ]}
                    >
                      {item.label}
                    </Text>

                    <Text style={[styles.chevronArrow, item.isDanger && styles.chevronDanger]}>
                      ›
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* 3. Dimmed Backdrop Dismissal with Smooth Fade */}
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
    zIndex: 999,
    flexDirection: 'row',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#0e0e12',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    zIndex: 1000,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 20,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.65)',
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: -2,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1b1b22',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingRight: 36,
  },
  avatarGlowRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2.5,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#1b1419',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileDetails: {
    marginLeft: 14,
    flex: 1,
  },
  ownerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  businessSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  accentBar: {
    height: 2.5,
    width: 44,
    borderRadius: 1.5,
    backgroundColor: Colors.accent,
    marginTop: 16,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 48,
  },
  sectionBlock: {
    marginBottom: 4,
  },
  sectionGap: {
    marginTop: 18,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  itemsGroup: {
    backgroundColor: '#14141a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1f1f28',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconContainerDanger: {
    backgroundColor: 'rgba(255, 92, 122, 0.12)',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.1,
  },
  menuLabelDanger: {
    color: '#ff5c7a',
    fontWeight: '700',
  },
  chevronArrow: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.25)',
    fontWeight: '300',
    marginLeft: 6,
  },
  chevronDanger: {
    color: 'rgba(255, 92, 122, 0.4)',
  },
});
