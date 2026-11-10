import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface BottomTabBarProps {
  activeTab: 'clients' | 'home' | 'orders';
  onSelectTab: (tab: 'clients' | 'home' | 'orders') => void;
}

// 1. Bespoke Luxury Duo-Tone Clients Icon infused with Signature Pink
const ClientsIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const strokeColor = isActive ? '#ffffff' : '#e8276b';
  const fillColor = isActive ? 'rgba(255, 255, 255, 0.28)' : 'rgba(232, 39, 107, 0.18)';

  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      {/* Secondary background user silhouette */}
      <Path
        d="M16.5 4.5a3.5 3.5 0 0 1 0 7"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M19 20.5c0-2.8-2.2-5.2-5-5.8"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Primary foreground user avatar with subtle duo-tone depth */}
      <Circle
        cx={9}
        cy={7}
        r={4}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
      />
      <Path
        d="M2 20.5c0-3.5 3.1-6.5 7-6.5s7 3 7 6.5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// 2. Bespoke Luxury Architectural Home Icon infused with Signature Pink
const HomeIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const strokeColor = isActive ? '#ffffff' : '#e8276b';
  const fillColor = isActive ? 'rgba(255, 255, 255, 0.28)' : 'rgba(232, 39, 107, 0.18)';

  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      {/* Studio sanctuary outer architecture with smooth apex */}
      <Path
        d="M2.8 10.2L11 3.5a1.6 1.6 0 0 1 2 0l8.2 6.7a1 1 0 0 1 .3.8v8.6a1.8 1.8 0 0 1-1.8 1.8H4.3A1.8 1.8 0 0 1 2.5 19.6V11a1 1 0 0 1 .3-.8z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Architectural center arch doorway */}
      <Path
        d="M9.5 21v-5a2.5 2.5 0 0 1 5 0v5"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// 3. Bespoke Luxury Orders / Agenda Booking Pass Icon infused with Signature Pink
const OrdersIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const strokeColor = isActive ? '#ffffff' : '#e8276b';
  const fillColor = isActive ? 'rgba(255, 255, 255, 0.28)' : 'rgba(232, 39, 107, 0.18)';

  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      {/* Booking Pass Card Base */}
      <Rect
        x={3.5}
        y={4}
        width={17}
        height={16.5}
        rx={3.5}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
      />
      {/* Twin binder studs */}
      <Line
        x1={8}
        y1={1.5}
        x2={8}
        y2={5.5}
        stroke={strokeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Line
        x1={16}
        y1={1.5}
        x2={16}
        y2={5.5}
        stroke={strokeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {/* Horizontal calendar demarcation */}
      <Line
        x1={3.5}
        y1={9.5}
        x2={20.5}
        y2={9.5}
        stroke={strokeColor}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Confirmed booking checkmark badge */}
      <Path
        d="M8.5 14.8l2.2 2.2 4.8-4.8"
        stroke={strokeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <View style={styles.floatingDock}>
      {/* 1. Clients Tab */}
      <TouchableOpacity
        style={[
          styles.tabItem,
          activeTab === 'clients' ? styles.activeTabPill : styles.inactiveTabPill,
        ]}
        onPress={() => onSelectTab('clients')}
        activeOpacity={0.75}
      >
        <ClientsIcon isActive={activeTab === 'clients'} />
        <Text
          style={[styles.tabLabel, activeTab === 'clients' ? styles.activeTabLabel : styles.inactiveTabLabel]}
          numberOfLines={1}
        >
          CLIENTS
        </Text>
      </TouchableOpacity>

      {/* 2. Home Tab (Center Anchor) */}
      <TouchableOpacity
        style={[
          styles.tabItem,
          activeTab === 'home' ? styles.activeTabPill : styles.inactiveTabPill,
        ]}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.75}
      >
        <HomeIcon isActive={activeTab === 'home'} />
        <Text
          style={[styles.tabLabel, activeTab === 'home' ? styles.activeTabLabel : styles.inactiveTabLabel]}
          numberOfLines={1}
        >
          HOME
        </Text>
      </TouchableOpacity>

      {/* 3. Orders Tab */}
      <TouchableOpacity
        style={[
          styles.tabItem,
          activeTab === 'orders' ? styles.activeTabPill : styles.inactiveTabPill,
        ]}
        onPress={() => onSelectTab('orders')}
        activeOpacity={0.75}
      >
        <OrdersIcon isActive={activeTab === 'orders'} />
        <Text
          style={[styles.tabLabel, activeTab === 'orders' ? styles.activeTabLabel : styles.inactiveTabLabel]}
          numberOfLines={1}
        >
          ORDERS
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingDock: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#110b14', // Deep obsidian with rich pink aura
    borderRadius: 999, // Floating pill capsule
    paddingVertical: 5,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 39, 107, 0.42)', // Luminous signature pink border
    gap: 4,
    // Ambient pink glow shadow
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 16,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    gap: 7,
  },
  inactiveTabPill: {
    backgroundColor: 'rgba(232, 39, 107, 0.08)', // Subtle pink glass aura for inactive tabs
  },
  activeTabPill: {
    backgroundColor: '#e8276b', // Signature Shilpi Pink active pill
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  inactiveTabLabel: {
    color: '#e8276b', // Signature pink for inactive labels
    opacity: 0.85,
  },
  activeTabLabel: {
    color: '#ffffff',
  },
});
