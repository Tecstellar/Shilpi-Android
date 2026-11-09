import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

interface MenuItemDef {
  label: string;
  screen: string;
  badge?: string;
  color?: string;
  isDivider?: boolean;
}

const MENU_ITEMS: MenuItemDef[] = [
  { label: 'Add Client', screen: 'newclient' },
  { label: 'My Packages', screen: 'packages' },
  { label: 'Payments', screen: 'payments', badge: '₹18,000 pending' },
  { label: 'My Gallery', screen: 'gallery' },
  { label: 'Notifications', screen: 'notifications', badge: '3 new' },
  { label: 'Reminders', screen: 'reminders', badge: '3 today' },
  { label: 'Expenses', screen: 'expenses' },
  { label: 'Reports', screen: 'reports' },
  { label: 'Subscription', screen: 'subscription', badge: 'Premium' },
  { label: 'Link Web (QR Scanner)', screen: 'qr_scanner' },
  { label: 'My Profile & Settings', screen: 'settings', isDivider: true },
  { label: 'Logout', screen: 'logout', color: Colors.accent2, isDivider: true },
];

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.drawerContainer}>
        {/* Drawer Header with Logo & Artist Profile */}
        <View style={styles.drawerHeader}>
          <Image
            source={require('../../assets/shilpi-lockup-black.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.artistSubtitle}>Shilpa R. · Premium</Text>
        </View>

        {/* Menu Items List */}
        <ScrollView
          style={styles.menuScroll}
          contentContainerStyle={styles.menuScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {MENU_ITEMS.map((item, index) => {
            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, item.isDivider && styles.menuItemDivider]}
                onPress={() => {
                  onClose();
                  if (item.screen === 'logout') {
                    onLogout();
                  } else {
                    onNavigate(item.screen);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuLabel, item.color ? { color: item.color } : null]}>
                  {item.label}
                </Text>

                {item.badge ? (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dimmed Backdrop to dismiss */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
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
    width: width * 0.78,
    backgroundColor: '#121212',
    borderBottomRightRadius: 26,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    zIndex: 1000,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.45)',
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  logo: {
    width: '100%',
    maxWidth: 200,
    height: 42,
  },
  artistSubtitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 10,
    color: Colors.deep,
    fontWeight: '700',
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuItemDivider: {
    marginTop: 12,
  },
  menuLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  badgeContainer: {
    backgroundColor: 'rgba(165, 15, 69, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10.5,
    color: Colors.accent,
    fontWeight: '700',
  },
});
