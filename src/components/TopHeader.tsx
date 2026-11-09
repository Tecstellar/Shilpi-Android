import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Colors } from '../theme/colors';

interface TopHeaderProps {
  screen: string;
  title?: string;
  hasUnread?: boolean;
  onOpenMenu: () => void;
  onGoBack: () => void;
  onOpenNotifications: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  screen,
  title,
  hasUnread = true,
  onOpenMenu,
  onGoBack,
  onOpenNotifications,
}) => {
  const isRoot = screen === 'home' || screen === 'clients' || screen === 'orders';
  const isHome = screen === 'home';

  return (
    <View style={styles.headerBlack}>
      <View style={styles.leftAction}>
        {isRoot ? (
          <TouchableOpacity
            onPress={onOpenMenu}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            {/* Hamburger 3-line icon */}
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onGoBack}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            {/* Back chevron icon */}
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerContainer}>
        {isHome ? (
          <Image
            source={require('../../assets/shilpi-lockup-black.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.screenTitle}>{title?.toUpperCase() || 'SHILPI'}</Text>
        )}
      </View>

      <View style={styles.rightAction}>
        <TouchableOpacity
          onPress={onOpenNotifications}
          style={styles.iconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          {/* Bell Icon */}
          <Text style={styles.bellIcon}>🔔</Text>
          {hasUnread && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBlack: {
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  leftAction: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
  },
  hamburger: {
    width: 22,
    height: 16,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 22,
    height: 2.2,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  backChevron: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '300',
    marginTop: -4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 36,
    width: 170,
  },
  screenTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  rightAction: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
});
