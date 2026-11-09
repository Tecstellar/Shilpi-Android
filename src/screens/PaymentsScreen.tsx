import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../theme/colors';
import { fmt } from '../data/prototypeData';

interface PaymentsScreenProps {
  onOpenRemindSheet: () => void;
  onGoBack: () => void;
}

const COLLECTIONS = [
  { client: 'Priya Raghavan', pkg: 'Bridal Look', amount: 15000, status: 'Received', isPending: false },
  { client: 'Anu Menon', pkg: 'Party Makeup', amount: 6500, status: 'Received', isPending: false },
  { client: 'Divya Krishnan', pkg: 'Reception Look', amount: 10000, status: 'Pending', isPending: true },
  { client: 'Keerthi Bala', pkg: 'Party Makeup', amount: 8000, status: 'Pending', isPending: true },
  { client: 'Lakshmi Iyer', pkg: 'Bridal Look', amount: 18000, status: 'Upcoming', isPending: false },
];

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  onOpenRemindSheet,
  onGoBack,
}) => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Header Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.kicker}>SEPTEMBER 2026</Text>
        <Text style={styles.title}>Payments & Collections</Text>
      </View>

      {/* 2. Top Summary KPI Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>RECEIVED</Text>
          <Text style={styles.summaryValue}>{fmt(72500)}</Text>
        </View>

        <View style={[styles.summaryCard, styles.pendingCard]}>
          <Text style={styles.pendingLabel}>PENDING</Text>
          <Text style={styles.pendingValue}>{fmt(18000)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL</Text>
          <Text style={styles.summaryValue}>{fmt(90500)}</Text>
        </View>
      </View>

      {/* 3. Cash Flow Multi-color Bar */}
      <View style={styles.barCard}>
        <Text style={styles.barTitle}>CASH FLOW PROGRESS</Text>
        <View style={styles.multiBar}>
          <View style={[styles.barSegment, { width: '63%', backgroundColor: '#121212' }]} />
          <View style={[styles.barSegment, { width: '16%', backgroundColor: Colors.accent }]} />
          <View style={[styles.barSegment, { width: '21%', backgroundColor: Colors.accent2 }]} />
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>■ Received 63%</Text>
          <Text style={[styles.legendText, { color: Colors.accent }]}>■ Pending 16%</Text>
          <Text style={[styles.legendText, { color: Colors.accent2 }]}>■ Upcoming 21%</Text>
        </View>
      </View>

      {/* 4. Collections Breakdown */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>COLLECTIONS BREAKDOWN</Text>
      </View>

      <View style={styles.listCard}>
        {COLLECTIONS.map((c, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.clientCol}>
              <Text style={styles.clientName}>{c.client}</Text>
              <Text style={styles.pkgName}>{c.pkg}</Text>
            </View>

            <View style={styles.amountCol}>
              <Text style={styles.amountText}>{fmt(c.amount)}</Text>
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
          </View>
        ))}
      </View>

      {/* 5. Remind All Button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.remindBtn}
          onPress={onOpenRemindSheet}
          activeOpacity={0.8}
        >
          <Text style={styles.remindBtnText}>REMIND 2 CLIENTS ABOUT PENDING BALANCE</Text>
        </TouchableOpacity>
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
  inkHeaderCard: {
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.deep,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.5,
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
    shadowColor: '#000000',
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
    fontSize: 9,
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
    fontSize: 9,
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
    shadowColor: '#000000',
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
    marginTop: 10,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#121212',
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
  listCard: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  clientCol: {
    flex: 1,
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
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.6)',
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
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remindBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
});
