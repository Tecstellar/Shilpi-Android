import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { Booking, fmt } from '../data/prototypeData';

interface PaymentsScreenProps {
  bookings?: Booking[];
  registeredAt?: string;
  onOpenBooking?: (booking: Booking) => void;
  onOpenRemindSheet: (pendingBookings?: Booking[]) => void;
  onGoBack: () => void;
}

const MONTH_SHORT_ARR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_LONG_ARR = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toMonthSerial(year: number, monthIdx: number): number {
  return year * 12 + monthIdx;
}

function fromMonthSerial(serial: number): { year: number; monthIdx: number } {
  const year = Math.floor(serial / 12);
  const monthIdx = ((serial % 12) + 12) % 12;
  return { year, monthIdx };
}

function parseBookingDayLocal(b: Booking, fallbackYear: number): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.bookingDate || ''));
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const mIdx = Math.max(0, MONTH_SHORT_ARR.indexOf(b.month));
  return new Date(b.year || fallbackYear, mIdx, b.day || 1);
}

type CollectionStatus = 'Received' | 'Pending' | 'Upcoming';
type FilterStatus = 'All' | CollectionStatus;

interface CollectionRow {
  booking: Booking;
  client: string;
  pkg: string;
  dateTag: string;
  bookingTotal: number;
  received: number;
  balanceDue: number;
  displayAmount: number;
  status: CollectionStatus;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  bookings = [],
  registeredAt,
  onOpenBooking,
  onOpenRemindSheet,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<'Monthly' | 'All'>('Monthly');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const currentSerial = toMonthSerial(currentYear, currentMonthIdx);
  const todayStart = useMemo(
    () => new Date(currentYear, currentMonthIdx, now.getDate()),
    [currentYear, currentMonthIdx, now]
  );

  // Clamp backward month navigation strictly to the beautician's registration month
  const regDate = useMemo(() => {
    if (registeredAt) {
      const parsed = new Date(registeredAt);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date(currentYear, currentMonthIdx, 1);
  }, [registeredAt, currentYear, currentMonthIdx]);

  const minSerial = toMonthSerial(regDate.getFullYear(), regDate.getMonth());

  const furthestBookingSerial = useMemo(() => {
    let maxS = currentSerial;
    for (const b of bookings) {
      const dt = parseBookingDayLocal(b, currentYear);
      const s = toMonthSerial(dt.getFullYear(), dt.getMonth());
      if (s > maxS) maxS = s;
    }
    return maxS;
  }, [bookings, currentSerial, currentYear]);

  const maxSerial = Math.max(currentSerial + 12, furthestBookingSerial + 1);

  const [selectedSerial, setSelectedSerial] = useState<number>(() =>
    Math.max(minSerial, currentSerial)
  );

  useEffect(() => {
    setSelectedSerial((prev) => Math.max(minSerial, prev));
  }, [minSerial]);

  const slideOffset = useRef(new Animated.Value(0)).current;

  const stepMonth = (delta: number) => {
    setSelectedSerial((prev) => {
      const next = Math.max(minSerial, Math.min(maxSerial, prev + delta));
      if (next === prev) return prev;
      slideOffset.setValue(delta > 0 ? 18 : -18);
      Animated.spring(slideOffset, {
        toValue: 0,
        useNativeDriver: true,
        speed: 24,
        bounciness: 4,
      }).start();
      return next;
    });
  };

  const stepMonthRef = useRef<(delta: number) => void>(() => {});
  stepMonthRef.current = stepMonth;

  const monthPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 16 && Math.abs(gesture.dy) < 18,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx < -32) {
          stepMonthRef.current(1);
        } else if (gesture.dx > 32) {
          stepMonthRef.current(-1);
        }
      },
    })
  ).current;

  const { year: selectedYear, monthIdx: selectedMonthIdx } = fromMonthSerial(selectedSerial);
  const selectedMonthLong = MONTH_LONG_ARR[selectedMonthIdx];
  const canGoPrev = selectedSerial > minSerial;
  const canGoNext = selectedSerial < maxSerial;
  const prevMonthShort = canGoPrev
    ? MONTH_SHORT_ARR[fromMonthSerial(selectedSerial - 1).monthIdx].toUpperCase()
    : '';
  const nextMonthShort = canGoNext
    ? MONTH_SHORT_ARR[fromMonthSerial(selectedSerial + 1).monthIdx].toUpperCase()
    : '';

  const regBadgeText = `${MONTH_SHORT_ARR[regDate.getMonth()].toUpperCase()} ${regDate.getFullYear()}`;

  const scopedBookings = useMemo(() => {
    if (scope === 'All') return bookings;
    return bookings.filter((b) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonthIdx;
    });
  }, [bookings, scope, selectedYear, selectedMonthIdx]);

  const metrics = useMemo(() => {
    let receivedSum = 0;
    let pendingNowSum = 0;
    let upcomingDueSum = 0;
    let totalSum = 0;

    const rows: CollectionRow[] = scopedBookings.map((b) => {
      const bDate = parseBookingDayLocal(b, selectedYear);
      const bookingTotal =
        b.items.reduce((s, item) => s + (item.price || 0), 0) + (b.travel || 0);
      const rawAdvance = Math.max(0, b.advance || 0);
      const received = Math.min(bookingTotal, rawAdvance);
      const balanceDue = Math.max(0, bookingTotal - received);

      receivedSum += received;
      totalSum += bookingTotal;

      let status: CollectionStatus = 'Received';
      if (balanceDue > 0) {
        if (b.status === 'Completed' || b.status === 'Closed' || bDate <= todayStart) {
          status = 'Pending';
          pendingNowSum += balanceDue;
        } else {
          status = 'Upcoming';
          upcomingDueSum += balanceDue;
        }
      }

      const pkgNames =
        b.items.map((i) => i.name).filter(Boolean).join(' + ') || 'Studio Booking';
      const dateTag = `${b.day} ${b.month}`;

      return {
        booking: b,
        client: b.client,
        pkg: pkgNames,
        dateTag,
        bookingTotal,
        received,
        balanceDue,
        displayAmount: balanceDue > 0 ? balanceDue : bookingTotal,
        status,
      };
    });

    // Sort Pending first, then Upcoming, then Received
    const priorityOrder: Record<CollectionStatus, number> = {
      Pending: 0,
      Upcoming: 1,
      Received: 2,
    };
    rows.sort((a, b) => {
      const pDiff = priorityOrder[a.status] - priorityOrder[b.status];
      if (pDiff !== 0) return pDiff;
      return (
        parseBookingDayLocal(b.booking, selectedYear).getTime() -
        parseBookingDayLocal(a.booking, selectedYear).getTime()
      );
    });

    const totalToCollect = pendingNowSum + upcomingDueSum;
    const receivedPct = totalSum > 0 ? Math.round((receivedSum / totalSum) * 100) : 0;
    const pendingPct = totalSum > 0 ? Math.round((pendingNowSum / totalSum) * 100) : 0;
    const upcomingPct =
      totalSum > 0 ? Math.max(0, 100 - receivedPct - pendingPct) : 0;

    return {
      receivedSum,
      pendingNowSum,
      upcomingDueSum,
      totalToCollect,
      totalSum,
      receivedPct,
      pendingPct,
      upcomingPct,
      rows,
    };
  }, [scopedBookings, selectedYear, todayStart]);

  const filteredRows = useMemo(() => {
    if (statusFilter === 'All') return metrics.rows;
    return metrics.rows.filter((r) => r.status === statusFilter);
  }, [metrics.rows, statusFilter]);

  const counts = useMemo(() => {
    let pending = 0;
    let upcoming = 0;
    let received = 0;
    for (const r of metrics.rows) {
      if (r.status === 'Pending') pending++;
      else if (r.status === 'Upcoming') upcoming++;
      else received++;
    }
    return {
      All: metrics.rows.length,
      Pending: pending,
      Upcoming: upcoming,
      Received: received,
    };
  }, [metrics.rows]);

  const unpaidRows = useMemo(
    () => metrics.rows.filter((r) => r.balanceDue > 0),
    [metrics.rows]
  );

  const unpaidClientCount = useMemo(() => {
    const names = new Set(unpaidRows.map((r) => r.client.trim().toLowerCase()));
    return names.size;
  }, [unpaidRows]);

  const periodKicker =
    scope === 'Monthly'
      ? `ACTIVE SINCE ${regBadgeText}`
      : 'ALL TIME STUDIO LEDGER';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 24) + 90 },
      ]}
    >
      {/* 1. Header Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.kicker}>{periodKicker}</Text>
        <Text style={styles.title}>Payments & Collections</Text>

        <View style={styles.scopeTabsRow}>
          {(['Monthly', 'All'] as const).map((tab) => {
            const active = scope === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.scopeTabBtn, active && styles.scopeTabBtnActive]}
                onPress={() => setScope(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.scopeTabText, active && styles.scopeTabTextActive]}>
                  {tab === 'Monthly' ? 'Monthly Slider' : 'All Time'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 1b. Prototype Centered Month Slider Pill */}
      {scope === 'Monthly' && (
        <View style={styles.monthSliderPill} {...monthPanResponder.panHandlers}>
          <TouchableOpacity
            style={[styles.monthArrowBtn, !canGoPrev && styles.monthArrowBtnDisabled]}
            onPress={() => stepMonth(-1)}
            disabled={!canGoPrev}
            accessibilityLabel="Previous month"
            activeOpacity={0.75}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18l-6-6 6-6"
                stroke="#ffffff"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            {canGoPrev ? <Text style={styles.monthSideLabel}>{prevMonthShort}</Text> : null}
          </TouchableOpacity>

          <Animated.View
            style={[styles.monthCenterBox, { transform: [{ translateX: slideOffset }] }]}
          >
            <Text style={styles.monthCenterLabel} numberOfLines={1}>
              {selectedMonthLong.toUpperCase()} {selectedYear}
            </Text>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.monthArrowBtn,
              styles.monthArrowBtnRight,
              !canGoNext && styles.monthArrowBtnDisabled,
            ]}
            onPress={() => stepMonth(1)}
            disabled={!canGoNext}
            accessibilityLabel="Next month"
            activeOpacity={0.75}
          >
            {canGoNext ? <Text style={styles.monthSideLabel}>{nextMonthShort}</Text> : null}
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke="#ffffff"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Top Summary KPI Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>RECEIVED</Text>
          <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(metrics.receivedSum)}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.pendingCard]}>
          <Text style={styles.pendingLabel}>TO COLLECT</Text>
          <Text style={styles.pendingValue} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(metrics.totalToCollect)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL</Text>
          <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(metrics.totalSum)}
          </Text>
        </View>
      </View>

      {/* 3. Cash Flow Multi-color Bar */}
      <View style={styles.barCard}>
        <Text style={styles.barTitle}>CASH FLOW PROGRESS</Text>
        <View style={styles.multiBar}>
          {metrics.totalSum > 0 ? (
            <>
              {metrics.receivedPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${metrics.receivedPct}%`, backgroundColor: '#121212' },
                  ]}
                />
              )}
              {metrics.pendingPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${metrics.pendingPct}%`, backgroundColor: colors.accent },
                  ]}
                />
              )}
              {metrics.upcomingPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${metrics.upcomingPct}%`, backgroundColor: colors.accent2 },
                  ]}
                />
              )}
            </>
          ) : (
            <View style={[styles.barSegment, { width: '100%', backgroundColor: '#e5e7eb' }]} />
          )}
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>■ Received {metrics.receivedPct}%</Text>
          <Text style={[styles.legendText, { color: colors.accent }]}>
            ■ Pending {metrics.pendingPct}%
          </Text>
          <Text style={[styles.legendText, { color: colors.accent2 }]}>
            ■ Upcoming {metrics.upcomingPct}%
          </Text>
        </View>
      </View>

      {/* 4. Collections Breakdown */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>COLLECTIONS BREAKDOWN</Text>
        <Text style={styles.sectionCount}>
          {filteredRows.length} {filteredRows.length === 1 ? 'booking' : 'bookings'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
      >
        {(['All', 'Pending', 'Upcoming', 'Received'] as FilterStatus[]).map((f) => {
          const active = statusFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f} ({counts[f]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.listCard}>
        {filteredRows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {scope === 'Monthly'
                ? `No bookings recorded in ${selectedMonthLong} ${selectedYear}`
                : 'No bookings recorded yet'}
            </Text>
            <Text style={styles.emptySub}>
              {scope === 'Monthly' && bookings.length > 0
                ? 'Slide left or right above to view another month, or switch to All Time.'
                : 'Your advances, pending balances, and final settlements will appear here automatically.'}
            </Text>
          </View>
        ) : (
          filteredRows.map((c, i) => {
            const isLast = i === filteredRows.length - 1;
            const subtitle =
              c.balanceDue > 0 && c.received > 0
                ? `${c.pkg} · ${c.dateTag} · Paid ${fmt(c.received)}`
                : `${c.pkg} · ${c.dateTag}`;

            return (
              <TouchableOpacity
                key={c.booking.id}
                style={[styles.row, isLast && styles.rowLast]}
                onPress={() => onOpenBooking?.(c.booking)}
                disabled={!onOpenBooking}
                activeOpacity={0.75}
              >
                <View style={styles.clientCol}>
                  <Text style={styles.clientName} numberOfLines={1}>
                    {c.client}
                  </Text>
                  <Text style={styles.pkgName} numberOfLines={2}>
                    {subtitle}
                  </Text>
                </View>

                <View style={styles.amountCol}>
                  <Text style={styles.amountText}>{fmt(c.displayAmount)}</Text>
                  <View
                    style={[
                      styles.statusTag,
                      c.status === 'Pending' && styles.statusTagPending,
                      c.status === 'Upcoming' && styles.statusTagUpcoming,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTagText,
                        c.status === 'Pending' && styles.statusTagTextPending,
                      ]}
                    >
                      {c.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* 5. Remind Pending Clients CTA */}
      <View style={styles.ctaContainer}>
        {unpaidRows.length > 0 ? (
          <TouchableOpacity
            style={styles.remindBtn}
            onPress={() => onOpenRemindSheet(unpaidRows.map((r) => r.booking))}
            activeOpacity={0.8}
          >
            <Text style={styles.remindBtnText}>
              REMIND {unpaidClientCount}{' '}
              {unpaidClientCount === 1 ? 'CLIENT' : 'CLIENTS'} ABOUT{' '}
              {fmt(metrics.totalToCollect)}
            </Text>
          </TouchableOpacity>
        ) : metrics.rows.length > 0 ? (
          <View style={styles.settledBanner}>
            <Text style={styles.settledBannerText}>
              ALL {scope === 'Monthly' ? selectedMonthLong.toUpperCase() : ''} PAYMENTS COLLECTED
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  inkHeaderCard: {
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.accentLt,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  scopeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  scopeTabBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeTabBtnActive: {
    backgroundColor: colors.accent,
  },
  scopeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  scopeTabTextActive: {
    color: '#ffffff',
  },
  monthSliderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 6,
    backgroundColor: '#121212',
    borderRadius: 999,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  monthArrowBtn: {
    minWidth: 72,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  monthArrowBtnRight: {
    justifyContent: 'flex-end',
  },
  monthArrowBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    opacity: 0.25,
  },
  monthSideLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  monthCenterBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  monthCenterLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  pendingCard: {
    backgroundColor: colors.tint,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  summaryLabel: {
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: 'rgba(18, 18, 18, 0.55)',
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121212',
    marginTop: 4,
  },
  pendingLabel: {
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.deep,
    fontWeight: '700',
  },
  pendingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 4,
  },
  barCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  barTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(18, 18, 18, 0.6)',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  multiBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  barSegment: {
    height: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  legendText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#121212',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
  },
  sectionCount: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.5)',
  },
  filterChipsRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#121212',
    borderColor: '#121212',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.72)',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  emptyBox: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.55)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 62,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  clientCol: {
    flex: 1,
    paddingRight: 12,
  },
  clientName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  pkgName: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  statusTag: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  statusTagPending: {
    backgroundColor: colors.tint,
  },
  statusTagUpcoming: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.2)',
  },
  statusTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.65)',
  },
  statusTagTextPending: {
    color: colors.accent,
  },
  ctaContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  remindBtn: {
    backgroundColor: colors.accent,
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remindBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
    textAlign: 'center',
  },
  settledBanner: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  settledBannerText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#047857',
  },
});
