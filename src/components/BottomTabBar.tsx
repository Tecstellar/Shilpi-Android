import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

export type TabType = 'home' | 'clients' | 'orders' | 'earnings';

interface BottomTabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onPressNewBooking: () => void;
}

// 1. Home Outline Icon
const HomeIcon: React.FC<{ isActive: boolean; accentColor: string }> = ({ isActive, accentColor }) => {
  const color = isActive ? accentColor : '#8e8e93';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// 2. Clients User Silhouette Icon
const ClientsIcon: React.FC<{ isActive: boolean; accentColor: string }> = ({ isActive, accentColor }) => {
  const color = isActive ? accentColor : '#8e8e93';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={7.5}
        r={4}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M4.5 20.5c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// 3. Orders Document Icon with Theme Accent Badge Dot
const OrdersIcon: React.FC<{
  isActive: boolean;
  accentColor: string;
  hasBadge?: boolean;
  iconContainerStyle: any;
  badgeDotStyle: any;
}> = ({
  isActive,
  accentColor,
  hasBadge = true,
  iconContainerStyle,
  badgeDotStyle,
}) => {
  const color = isActive ? accentColor : '#8e8e93';
  return (
    <View style={iconContainerStyle}>
      <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
        <Rect
          x={4.5}
          y={3}
          width={15}
          height={18}
          rx={3}
          stroke={color}
          strokeWidth={2}
        />
        <Line x1={8} y1={8} x2={16} y2={8} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Line x1={8} y1={12} x2={16} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Line x1={8} y1={16} x2={13} y2={16} stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
      {hasBadge && <View style={badgeDotStyle} />}
    </View>
  );
};

// 4. Earnings Vertical 3-Bar Chart Icon
const EarningsIcon: React.FC<{ isActive: boolean; accentColor: string }> = ({ isActive, accentColor }) => {
  const color = isActive ? accentColor : '#8e8e93';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Line x1={6} y1={20} x2={6} y2={14} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={12} y1={20} x2={12} y2={7} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={18} y1={20} x2={18} y2={11} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
};

// 5. White Plus Icon for Center Action FAB
const PlusIcon: React.FC = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Line x1={12} y1={5} x2={12} y2={19} stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onPressNewBooking,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const W = windowWidth || 390;
  const cx = W / 2;

  // Safe area bottom calculation
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);
  const barHeight = 60 + bottomPadding;

  // Exact notch coordinates: smooth concave notch dipping down to receive the FAB
  // Notch spans from (cx - 44) to (cx + 44) with depth of 30px
  const backgroundPath = `
    M 0 28
    Q 0 0 28 0
    L ${cx - 44} 0
    C ${cx - 28} 0, ${cx - 28} 32, ${cx} 32
    C ${cx + 28} 32, ${cx + 28} 0, ${cx + 44} 0
    L ${W - 28} 0
    Q ${W} 0 ${W} 28
    L ${W} ${barHeight}
    L 0 ${barHeight}
    Z
  `;

  return (
    <View style={[styles.navBarContainer, { height: barHeight }]}>
      {/* 1. Curved Dark Background with Center Notched Cradle */}
      <Svg width={W} height={barHeight} style={StyleSheet.absoluteFill}>
        <Path d={backgroundPath} fill="#141416" />
      </Svg>

      {/* 2. Interactive Navigation Tabs Row */}
      <View style={[styles.tabsRow, { width: W }]}>
        {/* Tab 1: Home */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectTab('home')}
          activeOpacity={0.75}
        >
          {activeTab === 'home' && <View style={styles.activeIndicator} />}
          <HomeIcon isActive={activeTab === 'home'} accentColor={colors.accent} />
          <Text
            style={[styles.tabLabel, activeTab === 'home' ? styles.activeLabel : styles.inactiveLabel]}
            numberOfLines={1}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Clients */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectTab('clients')}
          activeOpacity={0.75}
        >
          {activeTab === 'clients' && <View style={styles.activeIndicator} />}
          <ClientsIcon isActive={activeTab === 'clients'} accentColor={colors.accent} />
          <Text
            style={[styles.tabLabel, activeTab === 'clients' ? styles.activeLabel : styles.inactiveLabel]}
            numberOfLines={1}
          >
            Clients
          </Text>
        </TouchableOpacity>

        {/* Slot 3: Center FAB Spacer to let the button sit unobstructed */}
        <View style={styles.centerSpacer} pointerEvents="none" />

        {/* Tab 4: Orders */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectTab('orders')}
          activeOpacity={0.75}
        >
          {activeTab === 'orders' && <View style={styles.activeIndicator} />}
          <OrdersIcon
            isActive={activeTab === 'orders'}
            accentColor={colors.accent}
            hasBadge={true}
            iconContainerStyle={styles.iconContainer}
            badgeDotStyle={styles.badgeDot}
          />
          <Text
            style={[styles.tabLabel, activeTab === 'orders' ? styles.activeLabel : styles.inactiveLabel]}
            numberOfLines={1}
          >
            Orders
          </Text>
        </TouchableOpacity>

        {/* Tab 5: Earnings (Redirects to Payments) */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectTab('earnings')}
          activeOpacity={0.75}
        >
          {activeTab === 'earnings' && <View style={styles.activeIndicator} />}
          <EarningsIcon isActive={activeTab === 'earnings'} accentColor={colors.accent} />
          <Text
            style={[styles.tabLabel, activeTab === 'earnings' ? styles.activeLabel : styles.inactiveLabel]}
            numberOfLines={1}
          >
            Earnings
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Center Floating Action Button (+) */}
      <TouchableOpacity
        style={[styles.centerFab, { left: cx - 28 }]}
        onPress={onPressNewBooking}
        activeOpacity={0.88}
      >
        <PlusIcon />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  navBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  tabsRow: {
    position: 'absolute',
    top: 0,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  centerSpacer: {
    width: 64,
    height: 58,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3.5,
    backgroundColor: colors.accent,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accent,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: colors.accent,
    fontWeight: '700',
  },
  inactiveLabel: {
    color: '#8e8e93',
    fontWeight: '500',
  },
  centerFab: {
    position: 'absolute',
    top: -22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    borderWidth: 4.5,
    borderColor: '#f5f4f2', // Light contour ring matching screen cards
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
});
