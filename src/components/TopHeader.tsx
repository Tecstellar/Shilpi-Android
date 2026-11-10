import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  const isRoot =
    screen === 'home' ||
    screen === 'clients' ||
    screen === 'orders' ||
    screen === 'payments' ||
    screen === 'earnings';

  return (
    <View style={styles.headerBlack}>
      {/* Left section: Hamburger / Back button + Close-by prominent Shilpi Lockup */}
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

        {/* Signature Shilpi Brand Logo Lockup */}
        <Image
          source={require('../../assets/shilpi-lockup-black.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* For secondary screens, show a subtle context pill next to the logo */}
        {!isRoot && title && (
          <View style={styles.screenBadge}>
            <Text style={styles.screenBadgeText}>{title.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Right section: Vector Notification Bell with Signature Pink Dot */}
      <View style={styles.rightAction}>
        <TouchableOpacity
          onPress={onOpenNotifications}
          style={styles.iconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <View style={styles.bellWrap}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            {/* Signature Pink notification badge dot */}
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburger: {
    width: 22,
    height: 15,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 22,
    height: 2.2,
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
  },
  backChevron: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '300',
    marginTop: -4,
  },
  logo: {
    height: 34,
    width: 145,
    marginLeft: 12,
  },
  screenBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  screenBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  rightAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bellWrap: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#e8276b',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
});
