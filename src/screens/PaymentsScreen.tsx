import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Booking, fmt } from '../data/prototypeData';

interface PaymentsScreenProps {
  bookings?: Booking[];
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
  onOpenBooking,
  onOpenRemindSheet,
}) => {
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<'Monthly' | 'All'>('Monthly');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthLong = MONTH_LONG_ARR[currentMonthIdx];
  const todayStart = new Date(currentYear, currentMonthIdx, now.getDate());

  const scopedBookings = useMemo(() => {
    if (scope === 'All') return bookings;
    return bookings.filter((b) => {
      const dt = parseBookingDayLocal(b, currentYear);
      return dt.getFullYear() === currentYear && dt.getMonth() === currentMonthIdx;
    });
  }, [bookings, scope, currentYear, currentMonthIdx]);

  const metrics = useMemo(() => {
    let receivedSum = 0;
    let pendingNowSum = 0;
    let upcomingDueSum = 0;
    let totalSum = 0;

    const rows: CollectionRow[] = scopedBookings.map((b) => {
      const bDate = parseBookingDayLocal(b, currentYear);
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
        parseBookingDayLocal(b.booking, currentYear).getTime() -
        parseBookingDayLocal(a.booking, currentYear).getTime()
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
  }, [scopedBookings, currentYear, todayStart]);

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
      ? `${currentMonthLong.toUpperCase()} ${currentYear}`
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
                  {tab === 'Monthly' ? `${currentMonthLong}` : 'All Time'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
                    { width: `${metrics.pendingPct}%`, backgroundColor: Colors.accent },
                  ]}
                />
              )}
              {metrics.upcomingPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${metrics.upcomingPct}%`, backgroundColor: Colors.accent2 },
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
          <Text style={[styles.legendText, { color: Colors.accent }]}>
            ■ Pending {metrics.pendingPct}%
          </Text>
          <Text style={[styles.legendText, { color: Colors.accent2 }]}>
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
                ? `No bookings recorded in ${currentMonthLong}`
                : 'No bookings recorded yet'}
            </Text>
            <Text style={styles.emptySub}>
              {scope === 'Monthly' && bookings.length > 0
                ? 'Switch to All Time above to review payments from other months.'
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
              ALL {scope === 'Monthly' ? currentMonthLong.toUpperCase() : ''} PAYMENTS COLLECTED
            </Text>
          </View>
        ) : null}
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
    color: Colors.accentLt,
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
    backgroundColor: Colors.accent,
  },
  scopeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  scopeTabTextActive: {
    color: '#ffffff',
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
    backgroundColor: Colors.tint,
    borderWidth: 1,
    borderColor: Colors.accent,
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
    color: Colors.deep,
    fontWeight: '700',
  },
  pendingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
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
    backgroundColor: Colors.tint,
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
    color: Colors.accent,
  },
  ctaContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  remindBtn: {
    backgroundColor: Colors.accent,
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
