import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { fmt } from '../data/prototypeData';

interface ExpensesScreenProps {
  onGoBack: () => void;
}

const EXPENSE_CATS = [
  { name: 'Makeup products', amount: 14000, pct: '100%', isHigh: true },
  { name: 'Hair products', amount: 6500, pct: '46%', isHigh: false },
  { name: 'Travel', amount: 5800, pct: '41%', isHigh: false },
  { name: 'Saree materials', amount: 4700, pct: '34%', isHigh: false },
  { name: 'Staff', amount: 4000, pct: '29%', isHigh: false },
];

const RECENT_EXPENSES = [
  { date: '12 Sep', name: 'Airbrush foundation set', cat: 'Makeup products', amount: 4500 },
  { date: '11 Sep', name: 'Cab — Neelambur', cat: 'Travel', amount: 950 },
  { date: '09 Sep', name: 'Hair serum + setting spray', cat: 'Hair products', amount: 2100 },
  { date: '06 Sep', name: 'Assistant — 2 events', cat: 'Staff', amount: 4000 },
  { date: '03 Sep', name: 'Saree pins + petticoats', cat: 'Saree materials', amount: 1800 },
];

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({ onGoBack }) => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Header Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.kicker}>SEPTEMBER 2026 · TOTAL SPENT</Text>
        <Text style={styles.totalValue}>{fmt(35000)}</Text>
      </View>

      {/* 2. Category Breakdown with Visual Bars */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>BY CATEGORY</Text>
      </View>

      <View style={styles.card}>
        {EXPENSE_CATS.map((cat, i) => (
          <View key={i} style={styles.catRow}>
            <View style={styles.catHeaderRow}>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catAmount}>{fmt(cat.amount)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: cat.pct as any,
                    backgroundColor: cat.isHigh ? Colors.accent : Colors.accent2,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* 3. Logged Expenses List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT EXPENSES</Text>
      </View>

      <View style={styles.card}>
        {RECENT_EXPENSES.map((exp, idx) => (
          <View key={idx} style={styles.expenseRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateText}>{exp.date}</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.expName}>{exp.name}</Text>
              <Text style={styles.expCat}>{exp.cat}</Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.expAmount}>{fmt(exp.amount)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.btnContainer}>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => Alert.alert('Log Expense', 'Expense logger ready.')}
          activeOpacity={0.8}
        >
          <Text style={styles.logBtnText}>＋ LOG EXPENSE</Text>
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
  totalValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.5,
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
  card: {
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
  catRow: {
    marginBottom: 14,
  },
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121212',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
  },
  barTrack: {
    height: 7,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 7,
    borderRadius: 4,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
  },
  dateCol: {
    width: 60,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.55)',
  },
  nameCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  expName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  expCat: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.5)',
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  expAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  btnContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  logBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#ffffff',
  },
});
