import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Booking, fmt } from '../data/prototypeData';

const PlusVectorIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <Line x1={12} y1={5} x2={12} y2={19} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} strokeLinecap="round" />
  </Svg>
);

const ScalePressable: React.FC<{
  onPress: () => void;
  style?: any;
  accessibilityLabel?: string;
  children: React.ReactNode;
}> = ({ onPress, style, accessibilityLabel, children }) => {
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
      onPressIn={() => animateTo(0.975)}
      onPressOut={() => animateTo(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

const CalendarEmptyVectorIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={1.8}>
    <Rect x={3} y={4} width={18} height={18} rx={3} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={16} y1={2} x2={16} y2={6} strokeLinecap="round" />
    <Line x1={8} y1={2} x2={8} y2={6} strokeLinecap="round" />
    <Line x1={3} y1={10} x2={21} y2={10} strokeLinecap="round" />
    <Circle cx={8} cy={14} r={1.2} fill="#e8276b" />
    <Circle cx={12} cy={14} r={1.2} fill="#e8276b" />
    <Circle cx={16} cy={14} r={1.2} fill="#e8276b" />
    <Circle cx={8} cy={18} r={1.2} fill="#e8276b" />
    <Circle cx={12} cy={18} r={1.2} fill="#e8276b" />
  </Svg>
);

interface OrdersScreenProps {
  bookings: Booking[];
  onOpenBooking: (bookingId: string) => void;
  onStartNewBooking?: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  bookings,
  onOpenBooking,
  onStartNewBooking,
}) => {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width < 380 || fontScale > 1.15;
  const [filter, setFilter] = useState<'Upcoming' | 'Completed' | 'Closed'>('Upcoming');

  const filtered = bookings.filter((b) => b.status === filter);

  const tabs: { label: 'Upcoming' | 'Completed' | 'Closed'; count: number }[] = [
    { label: 'Upcoming', count: bookings.filter((b) => b.status === 'Upcoming').length },
    { label: 'Completed', count: bookings.filter((b) => b.status === 'Completed').length },
    { label: 'Closed', count: bookings.filter((b) => b.status === 'Closed').length },
  ];

  return (
    <View style={styles.container}>
      {/* 1. Responsive Filter Tabs + Quick New Booking Action */}
      <View style={styles.headerControlsBar}>
        <View style={styles.controlsInner}>
          <View style={styles.tabsRow}>
            {tabs.map((tab) => {
              const isActive = filter === tab.label;
              return (
                <TouchableOpacity
                  key={tab.label}
                  style={[
                    styles.tabPill,
                    isActive && styles.tabPillActive,
                    isCompact && styles.tabPillCompact,
                  ]}
                  onPress={() => setFilter(tab.label)}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={`${tab.label} bookings (${tab.count})`}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.tabTextActive,
                      isCompact && styles.tabTextCompact,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {tab.label.toUpperCase()} ({tab.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
            {onStartNewBooking && (
              <ScalePressable
                onPress={onStartNewBooking}
                style={styles.quickAddBtn}
                accessibilityLabel="Create new booking"
              >
                <PlusVectorIcon color="#ffffff" size={18} />
              </ScalePressable>
            )}
          </View>
        </View>
      </View>

      {/* 2. Orders List or Empty State */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listInner}>
          {filtered.length > 0 ? (
            filtered.map((b) => {
              const total = b.items.reduce((sum, item) => sum + item.price, 0) + b.travel;
              const balance = Math.max(0, total - b.advance);

              return (
                <ScalePressable
                  key={b.id}
                  style={styles.orderRow}
                  onPress={() => onOpenBooking(b.id)}
                  accessibilityLabel={`Booking for ${b.client} on ${b.day} ${b.month}`}
                >
                  {/* Date Box */}
                  <View style={[styles.dateBox, isCompact && styles.dateBoxCompact]}>
                    <Text style={styles.dayNum}>{b.day}</Text>
                    <Text style={styles.monthLabel}>{b.month.toUpperCase()}</Text>
                    <Text style={styles.timeLabel} numberOfLines={1}>
                      {b.time}
                    </Text>
                  </View>

                  {/* Order Info */}
                  <View style={styles.orderInfo}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {b.client}
                    </Text>
                    <Text style={styles.pkgText} numberOfLines={2}>
                      {b.items.map((i) => i.name).join(' + ')}
                    </Text>
                    <Text style={styles.venueText} numberOfLines={1}>
                      {b.venue}
                    </Text>
                  </View>

                  {/* Amount & Balance Status */}
                  <View style={styles.amountBox}>
                    <Text style={styles.amountText}>{fmt(total)}</Text>
                    <View
                      style={[
                        styles.balanceBadge,
                        balance > 0 ? styles.balanceDueBadge : styles.paidBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.balancePill,
                          balance > 0 ? styles.balanceDueText : styles.paidText,
                        ]}
                        numberOfLines={1}
                      >
                        {balance > 0 ? `${fmt(balance)} due` : 'Paid'}
                      </Text>
                    </View>
                  </View>
                </ScalePressable>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <CalendarEmptyVectorIcon />
              </View>
              <Text style={styles.emptyTitle}>No {filter.toLowerCase()} bookings</Text>
              <Text style={styles.emptySubtitle}>
                When you record a client bridal, reception, or party appointment, it will be organized here.
              </Text>
              {onStartNewBooking && (
                <ScalePressable
                  style={styles.emptyBtn}
                  onPress={onStartNewBooking}
                  accessibilityLabel="New Booking"
                >
                  <PlusVectorIcon color="#ffffff" size={16} />
                  <Text style={styles.emptyBtnText}>New Booking</Text>
                </ScalePressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  headerControlsBar: {
    backgroundColor: '#f4f4f6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
  },
  controlsInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabPill: {
    flex: 1,
    minHeight: 44,
    minWidth: 0,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabPillCompact: {
    paddingHorizontal: 6,
  },
  tabPillActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#121212',
    textAlign: 'center',
  },
  tabTextCompact: {
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  quickAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  listInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  dateBox: {
    width: 60,
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: 'rgba(18, 18, 18, 0.07)',
    paddingRight: 8,
    alignItems: 'center',
  },
  dateBoxCompact: {
    width: 52,
    paddingRight: 6,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121212',
  },
  monthLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(18, 18, 18, 0.55)',
    fontWeight: '700',
    marginTop: 2,
  },
  timeLabel: {
    fontSize: 10,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 4,
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
  },
  pkgText: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.72)',
    marginTop: 2,
  },
  venueText: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  balanceBadge: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  balanceDueBadge: {
    backgroundColor: '#ffeef4',
  },
  paidBadge: {
    backgroundColor: '#eaf8ef',
  },
  balancePill: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  balanceDueText: {
    color: Colors.deep,
  },
  paidText: {
    color: '#186d3b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffeef4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 26,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(18, 18, 18, 0.55)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  emptyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
