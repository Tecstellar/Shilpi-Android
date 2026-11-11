import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  Image,
  Linking,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Booking, fmt } from '../data/prototypeData';

const ScalePressable: React.FC<{
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  containerStyle?: any;
  accessibilityLabel?: string;
  children: React.ReactNode;
}> = ({ onPress, disabled, style, containerStyle, accessibilityLabel, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (val: number) => {
    Animated.spring(scale, {
      toValue: val,
      useNativeDriver: true,
      speed: 28,
      bounciness: 4,
    }).start();
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => !disabled && animateTo(0.975)}
      onPressOut={() => animateTo(1)}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[style, disabled && { opacity: 0.6 }, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const MapPinIcon = ({ color = Colors.deep, size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const MessageIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckCircleIcon = ({ color = '#121212', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
    <Circle cx="12" cy="12" r="9" />
    <Polyline points="9 12 11.2 14.2 15.5 9.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CameraIcon = ({ color = '#ffffff', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

interface OrderDetailScreenProps {
  order: Booking | null;
  onGoBack: () => void;
  onUpdateStatus: (orderId: string, status: 'Upcoming' | 'Completed' | 'Closed') => void;
  onOpenConfirmSheet: (order: Booking) => void;
  onCloseBooking: (order: Booking) => void;
  onMarkFullyPaid?: (orderId: string) => void;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({
  order,
  onGoBack,
  onUpdateStatus,
  onOpenConfirmSheet,
  onCloseBooking,
  onMarkFullyPaid,
}) => {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width < 380 || fontScale > 1.15;
  const isWideActionRow = width >= 440 && fontScale <= 1.1;

  const [profile, setProfile] = useState<{ businessName?: string; logoUri?: string; ownerName?: string }>({});
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('@shilpi_profile');
        if (stored) {
          setProfile(JSON.parse(stored));
        }
      } catch (e) {}
    };
    loadProfile();
  }, []);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f4f6', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#121212', marginBottom: 12 }}>Booking not found</Text>
        <TouchableOpacity
          onPress={onGoBack}
          style={{ backgroundColor: Colors.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700' }}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = order.items.reduce((s, i) => s + i.price, 0) + order.travel;
  const balance = Math.max(total - order.advance, 0);
  const venueLabel = order.venue?.trim() || 'Studio / Client Residence';
  const addressLabel =
    order.address?.trim() && order.address.trim() !== venueLabel
      ? order.address.trim()
      : '';
  const hasNotes = Boolean(order.notes && order.notes.trim().length > 0);
  const canMarkCompleted = order.status === 'Upcoming';
  const canCloseBooking = order.status !== 'Closed';

  const handleOpenMaps = async () => {
    const queryStr = [order.venue, order.address]
      .filter((s) => Boolean(s && s.trim()))
      .join(', ');
    if (!queryStr) {
      Alert.alert('No Location', 'No venue address was added for this booking.');
      return;
    }
    const encoded = encodeURIComponent(queryStr);
    const nativeUrl = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    });
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    try {
      const supported = nativeUrl ? await Linking.canOpenURL(nativeUrl) : false;
      await Linking.openURL(supported && nativeUrl ? nativeUrl : fallbackUrl);
    } catch {
      Linking.openURL(fallbackUrl).catch(() =>
        Alert.alert('Unable to Open Maps', 'Please check your maps application.')
      );
    }
  };

  const handleMarkPaidPress = async () => {
    if (!onMarkFullyPaid || paying) return;
    setPaying(true);
    try {
      await Promise.resolve(onMarkFullyPaid(order.id));
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 24) + 96 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Black Ink Booking Pass Card with Studio Logo */}
      <View style={styles.inkHeaderCard}>
        <View style={styles.responsiveInner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.refCode}>{order.ref}</Text>
              <Text style={styles.clientTitle}>{order.client}</Text>
            </View>
            {profile.logoUri ? (
              <View style={styles.headerLogoContainer}>
                <Image source={{ uri: profile.logoUri }} style={styles.headerLogoImage} resizeMode="cover" />
              </View>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaDate}>
              {order.dateLong} · {order.time} {order.meridiem}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.responsiveInner}>
        {/* 2. Packages & Payment Breakdown */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>PACKAGES & PAYMENT</Text>
          <Text style={[styles.invoiceTag, balance <= 0 && styles.invoiceTagPaid]}>
            {balance > 0 ? 'BALANCE DUE' : 'PAID IN FULL'}
          </Text>
        </View>

      <View style={styles.tableCard}>
        {/* Studio Logo Header stamped on the bill */}
        {profile.logoUri ? (
          <View style={styles.billBrandRow}>
            <View style={styles.billLogoBox}>
              <Image source={{ uri: profile.logoUri }} style={styles.billLogoImage} resizeMode="cover" />
            </View>
            <View style={styles.billBrandDetails}>
              <Text style={styles.billBusinessName} numberOfLines={1}>
                {profile.businessName || 'Beauty & Bridal Studio'}
              </Text>
              <Text style={styles.billRefLine}>
                Client Invoice · {order.ref}
              </Text>
            </View>
          </View>
        ) : null}

        {order.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{fmt(item.price)}</Text>
          </View>
        ))}

        {order.travel > 0 ? (
          <View style={styles.tableRow}>
            <Text style={styles.itemName}>Travel charges</Text>
            <Text style={styles.itemPrice}>{fmt(order.travel)}</Text>
          </View>
        ) : null}

        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmt(total)}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.itemName}>Advance paid</Text>
          <Text style={styles.itemPrice}>{fmt(order.advance)}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.balanceLabel}>Balance due</Text>
          <Text
            style={[
              styles.balanceValue,
              balance > 0 ? styles.balanceDue : styles.balancePaid,
            ]}
          >
            {balance > 0 ? fmt(balance) : 'Paid in Full'}
          </Text>
        </View>

        {balance > 0 && onMarkFullyPaid && (
          <ScalePressable
            style={styles.markPaidBtn}
            onPress={handleMarkPaidPress}
            disabled={paying}
            accessibilityLabel={`Mark as fully paid ${fmt(balance)}`}
          >
            <CheckCircleIcon color="#ffffff" size={16} />
            <Text
              style={styles.markPaidBtnText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {paying ? 'RECORDING PAYMENT...' : `MARK AS FULLY PAID (${fmt(balance)})`}
            </Text>
          </ScalePressable>
        )}
      </View>

      {/* 3. Venue & Open in Maps */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>VENUE</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.venueHeading}>{venueLabel}</Text>
        {addressLabel ? <Text style={styles.addressText}>{addressLabel}</Text> : null}

        <ScalePressable
          style={[styles.mapStripCard, isCompact && styles.mapStripCardCompact]}
          onPress={handleOpenMaps}
          accessibilityLabel={`Open ${venueLabel} in Maps`}
        >
          <View style={styles.mapStripLeft}>
            <View style={styles.mapPinBadge}>
              <MapPinIcon color={Colors.deep} size={16} />
            </View>
            <View style={styles.mapStripTextWrap}>
              <Text style={styles.mapStripPrimary} numberOfLines={1}>
                Open venue in Maps
              </Text>
              <Text style={styles.mapStripSub} numberOfLines={1}>
                {venueLabel}
              </Text>
            </View>
          </View>
          <View style={[styles.openMapsBtn, isCompact && styles.openMapsBtnCompact]}>
            <Text style={styles.openMapsBtnText}>OPEN IN MAPS</Text>
          </View>
        </ScalePressable>
      </View>

      {/* 4. Notes (only when notes are provided) */}
      {hasNotes ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NOTES</Text>
          </View>
          <View style={styles.notesOuter}>
            <View style={styles.notesCalloutCard}>
              <Text style={styles.notesText}>{order.notes.trim()}</Text>
            </View>
          </View>
        </>
      ) : null}

      {/* 5. Action Buttons — Adaptive Layout (Stacked full-width pills on phones, split grid on wider screens) */}
      <View style={styles.ctaRow}>
        <ScalePressable
          style={styles.whatsAppBtn}
          onPress={() => onOpenConfirmSheet(order)}
          accessibilityLabel="Send WhatsApp confirmation"
        >
          <MessageIcon color="#ffffff" size={17} />
          <Text
            style={styles.whatsAppBtnText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            SEND WHATSAPP CONFIRMATION
          </Text>
        </ScalePressable>

        {canMarkCompleted && canCloseBooking ? (
          <View style={[styles.secondaryActionGroup, isWideActionRow && styles.secondaryActionRow]}>
            <ScalePressable
              containerStyle={isWideActionRow ? styles.flex1Col : undefined}
              style={styles.markCompletedBtn}
              onPress={() => onUpdateStatus(order.id, 'Completed')}
              accessibilityLabel="Mark booking completed"
            >
              <CheckCircleIcon color="#121212" size={17} />
              <Text
                style={styles.markCompletedBtnText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                MARK COMPLETED
              </Text>
            </ScalePressable>

            <ScalePressable
              containerStyle={isWideActionRow ? styles.flex1Col : undefined}
              style={styles.closePhotosBtn}
              onPress={() => onCloseBooking(order)}
              accessibilityLabel="Close booking and add photos"
            >
              <CameraIcon color="#ffffff" size={17} />
              <Text
                style={styles.closePhotosBtnText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {isWideActionRow ? 'CLOSE · ADD PHOTOS' : 'CLOSE BOOKING · ADD PHOTOS'}
              </Text>
            </ScalePressable>
          </View>
        ) : canCloseBooking ? (
          <ScalePressable
            style={styles.closePhotosBtn}
            onPress={() => onCloseBooking(order)}
            accessibilityLabel="Close booking and add photos"
          >
            <CameraIcon color="#ffffff" size={17} />
            <Text
              style={styles.closePhotosBtnText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              CLOSE BOOKING · ADD PHOTOS
            </Text>
          </ScalePressable>
        ) : null}
      </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  scrollContent: {
    flexGrow: 1,
  },
  responsiveInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  inkHeaderCard: {
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitles: {
    flex: 1,
    paddingRight: 12,
  },
  headerLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: '#ffeef4',
  },
  headerLogoImage: {
    width: '100%',
    height: '100%',
  },
  refCode: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.deep,
    fontWeight: '700',
  },
  clientTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  metaDate: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.78)',
    flexShrink: 1,
  },
  statusBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  invoiceTag: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.deep,
    backgroundColor: '#ffeef4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  invoiceTagPaid: {
    color: '#186d3b',
    backgroundColor: '#eaf8ef',
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  billBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.08)',
  },
  billLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.3)',
    backgroundColor: '#ffeef4',
    marginRight: 10,
  },
  billLogoImage: {
    width: '100%',
    height: '100%',
  },
  billBrandDetails: {
    flex: 1,
  },
  billBusinessName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  billRefLine: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.5)',
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.05)',
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(18, 18, 18, 0.12)',
  },
  itemName: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
    fontSize: 13.5,
    color: '#121212',
  },
  itemPrice: {
    flexShrink: 0,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  totalValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  balanceLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  balanceValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  balanceDue: {
    color: Colors.deep,
  },
  balancePaid: {
    color: '#16a34a',
  },
  markPaidBtn: {
    marginTop: 14,
    marginBottom: 4,
    minHeight: 50,
    backgroundColor: '#121212',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  markPaidBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  venueHeading: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  addressText: {
    fontSize: 12.5,
    color: 'rgba(18, 18, 18, 0.65)',
    marginTop: 3,
    lineHeight: 18,
  },
  mapStripCard: {
    marginTop: 12,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.18)',
    backgroundColor: Colors.tint,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mapStripCardCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  mapStripLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapPinBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mapStripTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  mapStripPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
  },
  mapStripSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.deep,
    marginTop: 1,
  },
  openMapsBtn: {
    backgroundColor: '#ffffff',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  openMapsBtnCompact: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  openMapsBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#121212',
  },
  notesOuter: {
    paddingHorizontal: 16,
  },
  notesCalloutCard: {
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.18)',
    borderRadius: 16,
    backgroundColor: Colors.tint,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  notesText: {
    fontSize: 13,
    color: '#121212',
    lineHeight: 20,
  },
  ctaRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  whatsAppBtn: {
    minHeight: 52,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsAppBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#ffffff',
    textAlign: 'center',
  },
  secondaryActionGroup: {
    gap: 10,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1Col: {
    flex: 1,
    minWidth: 0,
  },
  markCompletedBtn: {
    minHeight: 52,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.14)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  markCompletedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#121212',
    textAlign: 'center',
  },
  closePhotosBtn: {
    minHeight: 52,
    backgroundColor: '#121212',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closePhotosBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#ffffff',
    textAlign: 'center',
  },
});
