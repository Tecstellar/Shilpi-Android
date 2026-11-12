import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { Booking, ExpenseRecord, fmt } from '../data/prototypeData';

interface ReportsScreenProps {
  bookings?: Booking[];
  expenses?: ExpenseRecord[];
  monthExpenses?: number;
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

function parseBookingMonthYear(b: Booking, fallbackYear: number): { year: number; monthIdx: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.bookingDate || ''));
  if (m) {
    return { year: Number(m[1]), monthIdx: Number(m[2]) - 1 };
  }
  const mIdx = Math.max(0, MONTH_SHORT_ARR.indexOf(b.month));
  return { year: b.year || fallbackYear, monthIdx: mIdx };
}

function parseExpenseMonthYear(e: ExpenseRecord, fallbackYear: number): { year: number; monthIdx: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(e.expenseDate || ''));
  if (m) {
    return { year: Number(m[1]), monthIdx: Number(m[2]) - 1 };
  }
  const parsed = new Date(e.expenseDate);
  if (!Number.isNaN(parsed.getTime())) {
    return { year: parsed.getFullYear(), monthIdx: parsed.getMonth() };
  }
  return { year: fallbackYear, monthIdx: new Date().getMonth() };
}

function bookingTotalAmount(b: Booking): number {
  return b.items.reduce((s, item) => s + (item.price || 0), 0) + (b.travel || 0);
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  bookings = [],
  expenses = [],
  monthExpenses = 0,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [view, setView] = useState<'Monthly' | 'Annual'>('Monthly');

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentMonthLong = MONTH_LONG_ARR[currentMonthIdx];
  const currentYear = now.getFullYear();

  const isMonthly = view === 'Monthly';

  const reportData = useMemo(() => {
    const filteredBookings = bookings.filter((b) => {
      const { year, monthIdx } = parseBookingMonthYear(b, currentYear);
      return isMonthly ? year === currentYear && monthIdx === currentMonthIdx : year === currentYear;
    });

    const filteredExpenses = expenses.filter((e) => {
      const parsed = parseExpenseMonthYear(e, currentYear);
      if (!parsed) return false;
      return isMonthly
        ? parsed.year === currentYear && parsed.monthIdx === currentMonthIdx
        : parsed.year === currentYear;
    });

    let sales = 0;
    let collected = 0;
    for (const b of filteredBookings) {
      const total = bookingTotalAmount(b);
      sales += total;
      collected += Math.min(total, Math.max(0, b.advance || 0));
    }

    const pending = Math.max(0, sales - collected);
    const computedExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expensesTotal =
      expenses.length > 0 ? computedExpenses : isMonthly ? monthExpenses : monthExpenses;
    const profit = sales - expensesTotal;
    const avgVal = filteredBookings.length > 0 ? Math.round(sales / filteredBookings.length) : 0;
    const period = isMonthly ? `${currentMonthLong} ${currentYear}` : `${currentYear}`;

    const metrics = [
      { label: 'BOOKINGS', value: String(filteredBookings.length) },
      { label: 'AVG BOOKING VALUE', value: fmt(avgVal) },
      { label: 'PAYMENTS RECEIVED', value: fmt(collected) },
      { label: 'PENDING PAYMENTS', value: fmt(pending) },
    ];

    let rawBars: { label: string; sales: number; profit: number }[] = [];

    if (isMonthly) {
      rawBars = Array.from({ length: 6 }, (_, i) => {
        const dt = new Date(currentYear, currentMonthIdx - 5 + i, 1);
        const y = dt.getFullYear();
        const m = dt.getMonth();
        const label = MONTH_SHORT_ARR[m];

        const mSales = bookings.reduce((sum, b) => {
          const parsed = parseBookingMonthYear(b, currentYear);
          return parsed.year === y && parsed.monthIdx === m ? sum + bookingTotalAmount(b) : sum;
        }, 0);

        const mExp = expenses.reduce((sum, e) => {
          const parsed = parseExpenseMonthYear(e, currentYear);
          return parsed && parsed.year === y && parsed.monthIdx === m
            ? sum + (Number(e.amount) || 0)
            : sum;
        }, 0);

        return {
          label,
          sales: mSales,
          profit: Math.max(0, mSales - mExp),
        };
      });
    } else {
      rawBars = [0, 1, 2, 3].map((q) => {
        const qMonths = [q * 3, q * 3 + 1, q * 3 + 2];
        const qSales = bookings.reduce((sum, b) => {
          const parsed = parseBookingMonthYear(b, currentYear);
          return parsed.year === currentYear && qMonths.includes(parsed.monthIdx)
            ? sum + bookingTotalAmount(b)
            : sum;
        }, 0);

        const qExp = expenses.reduce((sum, e) => {
          const parsed = parseExpenseMonthYear(e, currentYear);
          return parsed && parsed.year === currentYear && qMonths.includes(parsed.monthIdx)
            ? sum + (Number(e.amount) || 0)
            : sum;
        }, 0);

        return {
          label: `Q${q + 1}`,
          sales: qSales,
          profit: Math.max(0, qSales - qExp),
        };
      });
    }

    const maxBar = Math.max(1, ...rawBars.map((b) => Math.max(b.sales, b.profit)));
    const bars = rawBars.map((b) => ({
      label: b.label,
      salesH: b.sales > 0 ? Math.max(4, Math.round((b.sales / maxBar) * 100)) : 0,
      profitH: b.profit > 0 ? Math.max(4, Math.round((b.profit / maxBar) * 100)) : 0,
    }));

    return {
      period,
      profit,
      sales,
      expensesTotal,
      metrics,
      bars,
    };
  }, [bookings, expenses, monthExpenses, isMonthly, currentYear, currentMonthIdx, currentMonthLong]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 24) + 90 },
      ]}
    >
      {/* 1. Prototype Pill Toggle Tabs */}
      <View style={styles.tabsRow}>
        {(['Monthly', 'Annual'] as const).map((t) => {
          const isActive = view === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setView(t)}
              activeOpacity={0.82}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Prototype Rounded-Bottom Ink Hero Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.kicker}>{reportData.period.toUpperCase()} · PROFIT</Text>
        <Text style={styles.profitText}>{fmt(reportData.profit)}</Text>
        <View style={styles.subFiguresRow}>
          <Text style={styles.subFigureLabel}>
            Sales <Text style={styles.subFigureVal}>{fmt(reportData.sales)}</Text>
          </Text>
          <Text style={styles.subFigureLabel}>
            Expenses <Text style={styles.subFigureVal}>{fmt(reportData.expensesTotal)}</Text>
          </Text>
        </View>
      </View>

      {/* 3. Prototype 2x2 KPI Metrics Grid */}
      <View style={styles.metricsGrid}>
        {reportData.metrics.map((m, idx) => (
          <View key={idx} style={styles.metricTile}>
            <Text style={styles.metricTileLabel}>{m.label}</Text>
            <Text style={styles.metricTileValue} numberOfLines={1} adjustsFontSizeToFit>
              {m.value}
            </Text>
          </View>
        ))}
      </View>

      {/* 4. Prototype Bar Chart Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isMonthly ? 'MONTH BY MONTH' : 'QUARTER BY QUARTER'}
        </Text>
      </View>

      <View style={styles.barsSection}>
        <View style={styles.barsContainer}>
          {reportData.bars.map((b, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.salesBar, { height: `${b.salesH}%` as any }]} />
                <View style={[styles.profitBar, { height: `${b.profitH}%` as any }]} />
              </View>
              <Text style={styles.barLabel}>{b.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Legend */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: '#121212' }]} />
          <Text style={styles.legendLabel}>SALES</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendLabel}>PROFIT</Text>
        </View>
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
    tabsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    tabBtn: {
      flex: 1,
      minHeight: 44,
      backgroundColor: '#ffffff',
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBtnActive: {
      backgroundColor: colors.accent,
    },
    tabText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 1,
      color: '#121212',
    },
    tabTextActive: {
      color: '#ffffff',
    },
    inkHeaderCard: {
      backgroundColor: '#121212',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 18,
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
    },
    kicker: {
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.accent2,
      fontWeight: '700',
    },
    profitText: {
      fontSize: 42,
      fontWeight: '700',
      color: colors.accentLt,
      marginTop: 2,
      letterSpacing: -1,
    },
    subFiguresRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 10,
    },
    subFigureLabel: {
      fontSize: 12.5,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    subFigureVal: {
      fontWeight: '700',
      color: '#ffffff',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.07)',
    },
    metricTile: {
      width: '48.8%',
      backgroundColor: '#ffffff',
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 18,
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    metricTileLabel: {
      fontSize: 9,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: 'rgba(18, 18, 18, 0.55)',
      fontWeight: '700',
    },
    metricTileValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#121212',
      marginTop: 4,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 4,
    },
    sectionTitle: {
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontWeight: '700',
      color: '#121212',
    },
    barsSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 18,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.07)',
    },
    barsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
    },
    barCol: {
      flex: 1,
      alignItems: 'stretch',
      gap: 4,
    },
    barTrack: {
      height: 104,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
    },
    salesBar: {
      flex: 1,
      backgroundColor: '#121212',
    },
    profitBar: {
      flex: 1,
      backgroundColor: colors.accent,
    },
    barLabel: {
      fontSize: 9,
      letterSpacing: 0.6,
      textAlign: 'center',
      color: 'rgba(18, 18, 18, 0.55)',
      fontWeight: '700',
    },
    chartLegend: {
      flexDirection: 'row',
      gap: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendSquare: {
      width: 10,
      height: 10,
      borderRadius: 3,
    },
    legendLabel: {
      fontSize: 10.5,
      letterSpacing: 0.8,
      color: 'rgba(18, 18, 18, 0.6)',
      fontWeight: '700',
    },
  });
