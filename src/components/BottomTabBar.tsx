import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../theme/colors';

interface BottomTabBarProps {
  activeTab: 'clients' | 'home' | 'orders';
  onSelectTab: (tab: 'clients' | 'home' | 'orders') => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <View style={styles.tabBar}>
      {/* 1. Clients Tab */}
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'clients' && styles.activeTabButton]}
        onPress={() => onSelectTab('clients')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabIcon, activeTab === 'clients' && styles.activeTabColor]}>
          👥
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'clients' && styles.activeTabColor]}>
          CLIENTS
        </Text>
      </TouchableOpacity>

      {/* 2. Home Tab */}
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'home' && styles.activeTabButton]}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabColor]}>
          🏛️
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabColor]}>
          HOME
        </Text>
      </TouchableOpacity>

      {/* 3. Orders Tab */}
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'orders' && styles.activeTabButton]}
        onPress={() => onSelectTab('orders')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabIcon, activeTab === 'orders' && styles.activeTabColor]}>
          📋
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'orders' && styles.activeTabColor]}>
          ORDERS
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(18, 18, 18, 0.07)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 3,
    borderTopColor: 'transparent',
    marginTop: -3,
  },
  activeTabButton: {
    borderTopColor: Colors.accent,
  },
  tabIcon: {
    fontSize: 20,
    color: 'rgba(18, 18, 18, 0.45)',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: 'rgba(18, 18, 18, 0.5)',
  },
  activeTabColor: {
    color: Colors.accent,
  },
});
