import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Booking, fmt } from '../data/prototypeData';

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
  const [filter, setFilter] = useState<'Upcoming' | 'Completed' | 'Closed'>('Upcoming');

  const filtered = bookings.filter((b) => b.status === filter);

  const tabs: { label: 'Upcoming' | 'Completed' | 'Closed'; count: number }[] = [
    { label: 'Upcoming', count: bookings.filter((b) => b.status === 'Upcoming').length },
    { label: 'Completed', count: bookings.filter((b) => b.status === 'Completed').length },
    { label: 'Closed', count: bookings.filter((b) => b.status === 'Closed').length },
  ];

  return (
    <View style={styles.container}>
      {/* 1. Filter Tabs matching Prototype */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = filter === tab.label;
          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setFilter(tab.label)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label.toUpperCase()} <Text style={styles.tabCount}>{tab.count}</Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Orders List or Empty State */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length > 0 ? (
          filtered.map((b) => {
            const total = b.items.reduce((sum, item) => sum + item.price, 0) + b.travel;
            const balance = total - b.advance;

            return (
              <TouchableOpacity
                key={b.id}
                style={styles.orderRow}
                onPress={() => onOpenBooking(b.id)}
                activeOpacity={0.7}
              >
                {/* Date Box */}
                <View style={styles.dateBox}>
                  <Text style={styles.dayNum}>{b.day}</Text>
                  <Text style={styles.monthLabel}>{b.month.toUpperCase()}</Text>
                  <Text style={styles.timeLabel}>{b.time}</Text>
                </View>

                {/* Order Info */}
                <View style={styles.orderInfo}>
                  <Text style={styles.clientName}>{b.client}</Text>
                  <Text style={styles.pkgText}>
                    {b.items.map((i) => i.name).join(' + ')}
                  </Text>
                  <Text style={styles.venueText}>{b.venue}</Text>
                </View>

                {/* Amount & Status */}
                <View style={styles.amountBox}>
                  <Text style={styles.amountText}>{fmt(total)}</Text>
                  <Text
                    style={[
                      styles.balancePill,
                      balance > 0 ? styles.balanceDueText : styles.paidText,
                    ]}
                  >
                    {balance > 0 ? `${fmt(balance)} due` : 'Paid'}
                  </Text>
                </View>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={onStartNewBooking}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>＋ New Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f4f4f6',
  },
  tabPill: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabPillActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#121212',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabCount: {
    opacity: 0.65,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    backgroundColor: '#ffffff',
    paddingBottom: 110,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  dateBox: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: 'rgba(18, 18, 18, 0.07)',
    paddingRight: 8,
    alignItems: 'center',
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
    paddingHorizontal: 12,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
  },
  pkgText: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.7)',
    marginTop: 2,
  },
  venueText: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.45)',
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  balancePill: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  balanceDueText: {
    color: Colors.deep,
  },
  paidText: {
    color: 'rgba(18, 18, 18, 0.45)',
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
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    marginTop: 20,
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
