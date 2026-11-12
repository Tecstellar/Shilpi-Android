import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { Booking, fmt } from '../data/prototypeData';

interface ReportsScreenProps {
  bookings?: Booking[];
  monthExpenses?: number;
  onGoBack: () => void;
}

const MONTH_SHORT_ARR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG_ARR = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  bookings = [],
  monthExpenses = 0,
  onGoBack,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [view, setView] = useState<'Monthly' | 'Annual'>('Monthly');

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentMonthShort = MONTH_SHORT_ARR[currentMonthIdx];
  const currentMonthLong = MONTH_LONG_ARR[currentMonthIdx];
  const currentYear = now.getFullYear();

  const isMonthly = view === 'Monthly';

  const filteredBookings = bookings.filter((b) =>
    isMonthly
      ? b.month === currentMonthShort && (!b.year || b.year === currentYear)
      : !b.year || b.year === currentYear
  );

  const sales = filteredBookings.reduce(
    (sum, b) => sum + b.items.reduce((s, item) => s + item.price, 0) + (b.travel || 0),
    0
  );
  const collected = filteredBookings.reduce((sum, b) => sum + (b.advance || 0), 0);
  const pending = Math.max(0, sales - collected);
  const expenses = monthExpenses;
  const profit = sales - expenses;
  const avgVal = filteredBookings.length > 0 ? Math.round(sales / filteredBookings.length) : 0;
  const period = isMonthly ? `${currentMonthLong} ${currentYear}` : `${currentYear} Full Year`;

  const monthIndices = Array.from({ length: 6 }, (_, i) => (currentMonthIdx - 5 + i + 12) % 12);
  const monthlySeries = monthIndices.map((mIdx) => {
    const mName = MONTH_SHORT_ARR[mIdx];
    const mSales = bookings
      .filter((b) => b.month === mName && (!b.year || b.year === currentYear))
      .reduce((sum, b) => sum + b.items.reduce((s, item) => s + item.price, 0) + (b.travel || 0), 0);
    return { label: mName, sales: mSales };
  });
  const maxMonthSales = Math.max(1, ...monthlySeries.map((m) => m.sales));
  const monthlyBars = monthlySeries.map((m) => ({
    label: m.label,
    salesPct: `${Math.max(4, Math.round((m.sales / maxMonthSales) * 100))}%`,
    profitPct: `${Math.max(4, Math.round((Math.max(0, m.sales - (m.label === currentMonthShort ? expenses : 0)) / maxMonthSales) * 100))}%`,
  }));

  const annualQuarterSales = [0, 1, 2, 3].map((q) => {
    const qMonths = [q * 3, q * 3 + 1, q * 3 + 2].map((idx) => MONTH_SHORT_ARR[idx]);
    return bookings
      .filter((b) => qMonths.includes(b.month) && (!b.year || b.year === currentYear))
      .reduce((sum, b) => sum + b.items.reduce((s, item) => s + item.price, 0) + (b.travel || 0), 0);
  });
  const maxQSales = Math.max(1, ...annualQuarterSales);
  const annualBars = annualQuarterSales.map((qSales, q) => ({
    label: `Q${q + 1}`,
    salesPct: `${Math.max(4, Math.round((qSales / maxQSales) * 100))}%`,
    profitPct: `${Math.max(4, Math.round((qSales / maxQSales) * 100))}%`,
  }));

  const bars = isMonthly ? monthlyBars : annualBars;

  const metrics = [
    { label: 'Bookings', value: String(filteredBookings.length) },
    { label: 'Avg booking value', value: fmt(avgVal) },
    { label: 'Payments received', value: fmt(collected) },
    { label: 'Pending payments', value: fmt(pending) },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Toggle Tabs */}
      <View style={styles.tabsRow}>
        {(['Monthly', 'Annual'] as const).map((t) => {
          const isActive = view === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setView(t)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Top Summary Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.kicker}>{period.toUpperCase()} · NET PROFIT</Text>
        <Text style={styles.profitText}>{fmt(profit)}</Text>
        <View style={styles.subFiguresRow}>
          <Text style={styles.subFigure}>Sales: {fmt(sales)}</Text>
          <Text style={styles.subFigure}>Expenses: {fmt(expenses)}</Text>
        </View>
      </View>

      {/* 3. Bar Chart Comparison */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SALES & PROFIT TREND</Text>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.barsContainer}>
          {bars.map((b, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.salesBar, { height: b.salesPct as any }]} />
                <View style={[styles.profitBar, { height: b.profitPct as any }]} />
              </View>
              <Text style={styles.barLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#121212' }]} />
            <Text style={styles.legendLabel}>Sales</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendLabel}>Profit</Text>
          </View>
        </View>
      </View>

      {/* 4. KPI Metrics Table */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>PERFORMANCE BREAKDOWN</Text>
      </View>

      <View style={styles.metricsCard}>
        {metrics.map((m, idx) => (
          <View key={idx} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>{m.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
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
    paddingVertical: 12,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
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
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.deep,
    fontWeight: '700',
  },
  profitText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  subFiguresRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  subFigure: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sectionHeader: {
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
  chartCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.08)',
    paddingBottom: 4,
  },
  barCol: {
    alignItems: 'center',
    width: 36,
  },
  barTrack: {
    height: 100,
    width: 24,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  salesBar: {
    width: 10,
    backgroundColor: '#121212',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  profitBar: {
    width: 10,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 6,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 11,
    color: '#121212',
    fontWeight: '600',
  },
  metricsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
  },
  metricLabel: {
    fontSize: 13.5,
    color: 'rgba(18, 18, 18, 0.7)',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
});
