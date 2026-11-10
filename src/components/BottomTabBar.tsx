import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface BottomTabBarProps {
  activeTab: 'clients' | 'home' | 'orders';
  onSelectTab: (tab: 'clients' | 'home' | 'orders') => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <View style={styles.floatingDock}>
      {/* 1. Clients Tab */}
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'clients' && styles.activeTabPill]}
        onPress={() => onSelectTab('clients')}
        activeOpacity={0.8}
      >
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={activeTab === 'clients' ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <Circle cx="9" cy="7" r="4" />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
        <Text
          style={[styles.tabLabel, activeTab === 'clients' && styles.activeTabLabel]}
          numberOfLines={1}
        >
          CLIENTS
        </Text>
      </TouchableOpacity>

      {/* 2. Home Tab (Anchor) */}
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'home' && styles.activeTabPill]}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.8}
      >
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={activeTab === 'home' ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M3 10.2L12 3l9 7.2V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V10.2z" />
          <Path d="M9 21V12h6v9" />
        </Svg>
        <Text
          style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}
          numberOfLines={1}
        >
          HOME
        </Text>
      </TouchableOpacity>

      {/* 3. Orders Tab */}
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'orders' && styles.activeTabPill]}
        onPress={() => onSelectTab('orders')}
        activeOpacity={0.8}
      >
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={activeTab === 'orders' ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Rect x="3" y="4" width="18" height="17" rx="2.5" />
          <Line x1="16" y1="2" x2="16" y2="6" />
          <Line x1="8" y1="2" x2="8" y2="6" />
          <Line x1="3" y1="10" x2="21" y2="10" />
          <Path d="M9 15l2 2 4-4" />
        </Svg>
        <Text
          style={[styles.tabLabel, activeTab === 'orders' && styles.activeTabLabel]}
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
    backgroundColor: '#111113', // Obsidian dark fintech container
    borderRadius: 999, // Floating pill capsule
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Multi-layer deep shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 16,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    gap: 6,
  },
  activeTabPill: {
    backgroundColor: '#e8276b', // Signature Shilpi Pink pill highlight
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  activeTabLabel: {
    color: '#ffffff',
  },
});
