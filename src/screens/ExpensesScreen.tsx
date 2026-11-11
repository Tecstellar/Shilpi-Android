import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { ExpenseRecord, fmt } from '../data/prototypeData';

const TrashIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(18, 18, 18, 0.4)" strokeWidth={2}>
    <Path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={10} y1={11} x2={10} y2={17} strokeLinecap="round" />
    <Line x1={14} y1={11} x2={14} y2={17} strokeLinecap="round" />
  </Svg>
);

const EXPENSE_CATEGORY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'cosmetics', label: 'Makeup products' },
  { key: 'hair_products', label: 'Hair products' },
  { key: 'travel', label: 'Travel' },
  { key: 'saree_materials', label: 'Saree materials' },
  { key: 'salary', label: 'Staff' },
  { key: 'other', label: 'Other' },
];

const LONG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toIsoDateLocal = (d: Date): string => {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
};

interface ExpensesScreenProps {
  expenses: ExpenseRecord[];
  onAddExpense: (payload: {
    title: string;
    category: string;
    amount: number;
    expenseDate: string;
    notes?: string;
  }) => Promise<void>;
  onDeleteExpense?: (expenseId: string) => Promise<void>;
  onGoBack: () => void;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentMonthLong = LONG_MONTHS[currentMonthIdx];
  const currentMonthPrefix = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cosmetics');
  const [amountText, setAmountText] = useState('');
  const [expenseDate, setExpenseDate] = useState(toIsoDateLocal(now));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const monthExpenses = expenses.filter((e) =>
    String(e.expenseDate || '').startsWith(currentMonthPrefix)
  );
  const totalSpent = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Aggregate real category totals for current month
  const categorySums = EXPENSE_CATEGORY_OPTIONS.map((opt) => {
    const amount = monthExpenses
      .filter((e) => e.category === opt.key)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    return { key: opt.key, name: opt.label, amount };
  }).filter((c) => c.amount > 0 || ['cosmetics', 'hair_products', 'travel', 'saree_materials', 'salary'].includes(c.key));

  const maxCatAmount = Math.max(1, ...categorySums.map((c) => c.amount));
  const highestAmount = Math.max(...categorySums.map((c) => c.amount));

  const resetForm = () => {
    setTitle('');
    setCategory('cosmetics');
    setAmountText('');
    setExpenseDate(toIsoDateLocal(new Date()));
    setNotes('');
  };

  const handleOpenForm = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const numericAmount = parseFloat(amountText.replace(/,/g, '').trim());

    if (!trimmedTitle) {
      Alert.alert('Expense Title Required', 'Please enter what you spent on (e.g. Airbrush foundation).');
      return;
    }
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Valid Amount Required', 'Please enter an expense amount greater than ₹0.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate.trim())) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format (e.g. 2026-11-11).');
      return;
    }

    setSaving(true);
    try {
      await onAddExpense({
        title: trimmedTitle,
        category,
        amount: Math.round(numericAmount),
        expenseDate: expenseDate.trim(),
        notes: notes.trim() || undefined,
      });
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      Alert.alert('Could Not Save Expense', err?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: ExpenseRecord) => {
    if (!onDeleteExpense) return;
    Alert.alert(
      'Delete Expense',
      `Remove "${item.title}" (${fmt(item.amount)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteExpense(item.id),
        },
      ]
    );
  };

  const todayIso = toIsoDateLocal(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayIso = toIsoDateLocal(yesterdayDate);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        {/* 1. Header Card */}
        <View style={styles.inkHeaderCard}>
          <Text style={styles.kicker}>
            {currentMonthLong.toUpperCase()} {currentYear} · TOTAL SPENT
          </Text>
          <Text style={styles.totalValue}>{fmt(totalSpent)}</Text>
        </View>

        {/* 2. Category Breakdown with Visual Bars */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BY CATEGORY</Text>
        </View>

        <View style={styles.card}>
          {categorySums.map((cat) => {
            const pct = cat.amount > 0 ? Math.max(6, Math.round((cat.amount / maxCatAmount) * 100)) : 0;
            const isTop = cat.amount > 0 && cat.amount === highestAmount;
            return (
              <View key={cat.key} style={styles.catRow}>
                <View style={styles.catHeaderRow}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catAmount}>{fmt(cat.amount)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${pct}%` as any,
                        backgroundColor: isTop ? Colors.accent : Colors.accent2,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* 3. Logged Expenses List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT EXPENSES</Text>
        </View>

        {expenses.length > 0 ? (
          <View style={styles.card}>
            {expenses.map((exp, idx) => (
              <View
                key={exp.id}
                style={[
                  styles.expenseRow,
                  idx === expenses.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.dateCol}>
                  <Text style={styles.dateText}>{exp.dateLabel}</Text>
                </View>
                <View style={styles.nameCol}>
                  <Text style={styles.expName}>{exp.title}</Text>
                  <Text style={styles.expCat}>
                    {exp.categoryLabel}
                    {exp.notes ? ` · ${exp.notes}` : ''}
                  </Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.expAmount}>{fmt(exp.amount)}</Text>
                </View>
                {onDeleteExpense && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(exp)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <TrashIcon />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No expenses logged yet</Text>
            <Text style={styles.emptySub}>
              Track makeup products, hair kits, travel, and staff costs so your monthly profit is accurate.
            </Text>
          </View>
        )}

        {/* 4. Action Button */}
        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={styles.logBtn}
            onPress={handleOpenForm}
            activeOpacity={0.85}
          >
            <Text style={styles.logBtnText}>＋ LOG EXPENSE</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Log Expense Form Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalKicker}>NEW STUDIO EXPENSE</Text>
                <Text style={styles.modalTitle}>Log Expense</Text>
              </View>
              <TouchableOpacity
                style={styles.closeChip}
                onPress={() => setModalOpen(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.closeChipText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>ITEM / DESCRIPTION *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Airbrush foundation, Cab — RS Puram"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.fieldLabel}>CATEGORY *</Text>
              <View style={styles.chipsWrap}>
                {EXPENSE_CATEGORY_OPTIONS.map((opt) => {
                  const active = category === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.catChip, active && styles.catChipActive]}
                      onPress={() => setCategory(opt.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>AMOUNT (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2500"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                keyboardType="numeric"
                value={amountText}
                onChangeText={(txt) => setAmountText(txt.replace(/[^0-9.]/g, ''))}
              />

              <Text style={styles.fieldLabel}>DATE *</Text>
              <View style={styles.dateQuickRow}>
                <TouchableOpacity
                  style={[styles.dateChip, expenseDate === todayIso && styles.dateChipActive]}
                  onPress={() => setExpenseDate(todayIso)}
                >
                  <Text style={[styles.dateChipText, expenseDate === todayIso && styles.dateChipTextActive]}>
                    Today ({todayIso})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateChip, expenseDate === yesterdayIso && styles.dateChipActive]}
                  onPress={() => setExpenseDate(yesterdayIso)}
                >
                  <Text style={[styles.dateChipText, expenseDate === yesterdayIso && styles.dateChipTextActive]}>
                    Yesterday
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                value={expenseDate}
                onChangeText={setExpenseDate}
              />

              <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, { minHeight: 68, textAlignVertical: 'top' }]}
                placeholder="Vendor name, event reference, etc."
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalOpen(false)}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.65 }]}
                  onPress={handleSubmit}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>
                    {saving ? 'SAVING...' : 'SAVE EXPENSE'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
    width: 58,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.55)',
    textTransform: 'uppercase',
  },
  nameCol: {
    flex: 1,
    paddingHorizontal: 8,
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
  deleteBtn: {
    marginLeft: 10,
    padding: 4,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  emptySub: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.55)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: '88%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalKicker: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.deep,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121212',
    marginTop: 2,
  },
  closeChip: {
    backgroundColor: '#f4f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  closeChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#121212',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f7f7f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f4f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: '#ffeef4',
    borderColor: Colors.accent,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.7)',
  },
  catChipTextActive: {
    color: Colors.deep,
    fontWeight: '700',
  },
  dateQuickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f4f4f6',
  },
  dateChipActive: {
    backgroundColor: '#121212',
  },
  dateChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.7)',
  },
  dateChipTextActive: {
    color: '#ffffff',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f4f4f6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#121212',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
});
