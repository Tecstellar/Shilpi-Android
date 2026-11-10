import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
  hasUnread = false,
  onOpenMenu,
  onGoBack,
  onOpenNotifications,
}) => {
  const isRoot = screen === 'home' || screen === 'clients' || screen === 'orders';
  const isHome = screen === 'home';

  return (
    <View style={styles.headerBlack}>
      {/* Left section: Hamburger / Back button + Close-by prominent Shilpi Lockup with a little gap */}
      <View style={styles.leftGroup}>
        {isRoot ? (
          <TouchableOpacity
            onPress={onOpenMenu}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            {/* Hamburger 3-line vector icon */}
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

        {isHome ? (
          <Image
            source={require('../../assets/shilpi-lockup-black.png')}
            style={styles.logoLarge}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.screenTitle}>{title?.toUpperCase() || 'SHILPI'}</Text>
        )}
      </View>

      {/* Right section: Vector Notification Bell */}
      <View style={styles.rightAction}>
        <TouchableOpacity
          onPress={onOpenNotifications}
          style={styles.iconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          {/* Crisp vector notification bell matching prototype */}
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
            <Path
              d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M13.73 21a2 2 0 01-3.46 0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          {hasUnread && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBlack: {
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
  logoLarge: {
    height: 38,
    width: 175,
    marginLeft: 10, // Close to menu bar with a tasteful 10px gap
  },
  screenTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 10,
  },
  rightAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e8276b',
  },
});
