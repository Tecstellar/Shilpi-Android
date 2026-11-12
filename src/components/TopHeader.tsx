import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isRoot =
    screen === 'home' ||
    screen === 'clients' ||
    screen === 'orders' ||
    screen === 'payments' ||
    screen === 'earnings';

  return (
    <View style={styles.headerBlack}>
      {/* Left: Hamburger (or Back button on child screens) + Shilpi Logo Lockup */}
      <View style={styles.leftGroup}>
        {isRoot ? (
          <TouchableOpacity
            onPress={onOpenMenu}
            style={styles.hamburgerBtn}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            activeOpacity={0.7}
          >
            {/* 3 crisp horizontal white lines matching reference */}
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onGoBack}
            style={styles.backBtn}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
        )}

        {/* Official Shilpi Brand Logo Lockup (Tight high-resolution crop) */}
        <Image
          source={require('../../assets/shilpi-logo-tight.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Screen context tag on secondary pages */}
        {!isRoot && title && (
          <View style={styles.screenTag}>
            <Text style={styles.screenTagText}>{title.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Right: Notification Bell with signature Shilpi Pink badge dot */}
      <TouchableOpacity
        onPress={onOpenNotifications}
        style={styles.bellBtn}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
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
          {/* Always show the pink notification dot badge per design */}
          <View style={styles.badgeDot} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  headerBlack: {
    height: 56,
    backgroundColor: '#000000',
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
  hamburgerBtn: {
    paddingVertical: 8,
    paddingRight: 6,
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
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backChevron: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '300',
    marginTop: -3,
  },
  logo: {
    height: 28,
    width: 118,
    marginLeft: 20, // Clean, tasteful gap exactly matching the screenshot
  },
  screenTag: {
    marginLeft: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
  },
  screenTagText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bellBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellWrap: {
    width: 24,
    height: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
});
