import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../theme/colors';
import { fmt } from '../data/prototypeData';

interface ReportsScreenProps {
  onGoBack: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onGoBack }) => {
  const [view, setView] = useState<'Monthly' | 'Annual'>('Monthly');

  const isMonthly = view === 'Monthly';

  const profit = isMonthly ? 90000 : 742000;
  const sales = isMonthly ? 125000 : 1046000;
  const expenses = isMonthly ? 35000 : 304000;
  const period = isMonthly ? 'September 2026' : '2026 Full Year';

  const monthlyBars = [
    { label: 'Apr', salesPct: '50%', profitPct: '32%' },
    { label: 'May', salesPct: '62%', profitPct: '44%' },
    { label: 'Jun', salesPct: '76%', profitPct: '54%' },
    { label: 'Jul', salesPct: '57%', profitPct: '38%' },
    { label: 'Aug', salesPct: '88%', profitPct: '63%' },
    { label: 'Sep', salesPct: '100%', profitPct: '72%' },
  ];

  const annualBars = [
    { label: 'Q1', salesPct: '44%', profitPct: '28%' },
    { label: 'Q2', salesPct: '75%', profitPct: '52%' },
    { label: 'Q3', salesPct: '88%', profitPct: '63%' },
    { label: 'Q4', salesPct: '100%', profitPct: '73%' },
  ];

  const bars = isMonthly ? monthlyBars : annualBars;

  const metrics = isMonthly
    ? [
        { label: 'Bookings', value: '11' },
        { label: 'Avg booking value', value: fmt(11364) },
        { label: 'Payments received', value: fmt(72500) },
        { label: 'Pending payments', value: fmt(18000) },
      ]
    : [
        { label: 'Bookings', value: '96' },
        { label: 'Avg booking value', value: fmt(10896) },
        { label: 'Payments received', value: fmt(988000) },
        { label: 'Pending payments', value: fmt(58000) },
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
            <View style={[styles.legendSquare, { backgroundColor: Colors.accent }]} />
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.accent,
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
    color: Colors.deep,
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
    backgroundColor: Colors.accent,
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
