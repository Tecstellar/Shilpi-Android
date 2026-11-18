import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Booking, fmt, first } from '../data/prototypeData';
import { useTheme } from '../theme/ThemeContext';

interface ClearDueModalProps {
  visible: boolean;
  booking: Booking | null;
  clientName?: string;
  onClose: () => void;
  onConfirmPayment: (
    bookingId: string,
    amount: number,
    paymentMode: string,
    notes?: string
  ) => Promise<boolean | void> | boolean | void;
}

// ----------------- Bespoke Luxury Vector Icons ----------------- //

const UpiVectorIcon = ({ color = '#4F46E5', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CashVectorIcon = ({ color = '#059669', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2"
      y="5"
      width="20"
      height="14"
      rx="3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
    <Line x1="6" y1="9" x2="6.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="18" y1="15" x2="18.01" y2="15" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const CardVectorIcon = ({ color = '#0284C7', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2"
      y="5"
      width="20"
      height="14"
      rx="3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="6" y1="15" x2="10" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="14" y1="15" x2="16" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BankVectorIcon = ({ color = '#475569', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 21H21M3 10H21M5 10V18M9 10V18M15 10V18M19 10V18M12 3L2 8V10H22V8L12 3Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon = ({
  color = '#64748B',
  size = 16,
  open = false,
}: {
  color?: string;
  size?: number;
  open?: boolean;
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
  >
    <Path
      d="M6 9L12 15L18 9"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({ color = '#ffffff', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PAYMENT_MODES = [
  {
    id: 'upi',
    label: 'UPI / GPay / PhonePe',
    sublabel: 'Instant digital QR & mobile payment',
    iconColor: '#4F46E5',
    iconBg: '#EEF2FF',
    Icon: UpiVectorIcon,
  },
  {
    id: 'cash',
    label: 'Cash in Hand',
    sublabel: 'Physical currency collected at studio',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    Icon: CashVectorIcon,
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    sublabel: 'POS machine swipe or card payment',
    iconColor: '#0284C7',
    iconBg: '#F0F9FF',
    Icon: CardVectorIcon,
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer / NEFT',
    sublabel: 'Direct IMPS / NEFT account credit',
    iconColor: '#475569',
    iconBg: '#F1F5F9',
    Icon: BankVectorIcon,
  },
];

export const ClearDueModal: React.FC<ClearDueModalProps> = ({
  visible,
  booking,
  clientName,
  onClose,
  onConfirmPayment,
}) => {
  const { colors } = useTheme();

  const total = useMemo(() => {
    if (!booking) return 0;
    return (
      booking.items.reduce((sum, item) => sum + item.price, 0) + (booking.travel || 0)
    );
  }, [booking]);

  const advance = booking ? booking.advance || 0 : 0;
  const currentDue = Math.max(0, total - advance);

  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('upi');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [quickOption, setQuickOption] = useState<'full' | 'half' | 'custom'>('full');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (visible && booking) {
      setAmountStr(String(currentDue));
      setQuickOption('full');
      setSelectedMode('upi');
      setDropdownOpen(false);
      setSubmitting(false);
    }
  }, [visible, booking, currentDue]);

  const parsedAmount = useMemo(() => {
    const raw = amountStr.replace(/\D/g, '');
    return parseInt(raw, 10) || 0;
  }, [amountStr]);

  const remainingAfter = Math.max(0, currentDue - parsedAmount);
  const isValid = parsedAmount > 0 && parsedAmount <= currentDue;

  const handleSelectFull = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setAmountStr(String(currentDue));
    setQuickOption('full');
  };

  const handleSelectHalf = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const half = Math.round(currentDue / 2);
    setAmountStr(String(half));
    setQuickOption('half');
  };

  const handleChangeCustom = (txt: string) => {
    const numeric = txt.replace(/\D/g, '');
    setAmountStr(numeric);
    setQuickOption('custom');
  };

  const handleConfirm = async () => {
    if (!booking || !isValid || submitting) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setSubmitting(true);
    try {
      await onConfirmPayment(
        booking.id,
        parsedAmount,
        selectedMode,
        quickOption === 'full'
          ? 'Full balance settled'
          : `Partial due payment: ₹${parsedAmount}`
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const targetClient = clientName || (booking ? first(booking.client) : 'Client');
  const halfDueVal = Math.round(currentDue / 2);
  const activeModeObj = PAYMENT_MODES.find((m) => m.id === selectedMode) || PAYMENT_MODES[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetContainer}
          >
            <View style={styles.card}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.headerKicker}>PAYMENT LEDGER</Text>
                    <Text style={styles.headerTitle}>Clear Due · {targetClient}</Text>
                    {booking ? (
                      <Text style={styles.headerSub}>
                        {booking.day && booking.month ? `${booking.day} ${booking.month}` : String(booking.bookingDate || '').split('T')[0]} · {booking.items[0]?.name || 'Booking'}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2.4}>
                      <Path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>

                {/* Outstanding Due Hero Banner */}
                <View style={styles.dueHeroBanner}>
                  <View style={styles.dueHeroCol}>
                    <Text style={styles.dueHeroLabel}>TOTAL BILL</Text>
                    <Text style={styles.dueHeroVal}>{fmt(total)}</Text>
                  </View>
                  <View style={styles.dueHeroDivider} />
                  <View style={styles.dueHeroCol}>
                    <Text style={styles.dueHeroLabel}>ALREADY PAID</Text>
                    <Text style={styles.dueHeroVal}>{fmt(advance)}</Text>
                  </View>
                  <View style={styles.dueHeroDivider} />
                  <View style={styles.dueHeroCol}>
                    <Text style={[styles.dueHeroLabel, { color: '#ef4444' }]}>CURRENT DUE</Text>
                    <Text style={[styles.dueHeroVal, { color: '#ef4444', fontWeight: '800' }]}>
                      {fmt(currentDue)}
                    </Text>
                  </View>
                </View>

                {/* Quick Preset Buttons (Full / Half) */}
                <Text style={styles.sectionLabel}>SELECT AMOUNT</Text>
                <View style={styles.quickOptionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.quickOptionBtn,
                      quickOption === 'full' && [styles.quickOptionBtnActive, { borderColor: colors.accent }],
                    ]}
                    onPress={handleSelectFull}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.quickOptionText,
                        quickOption === 'full' && [styles.quickOptionTextActive, { color: colors.accent }],
                      ]}
                    >
                      Full Due ({fmt(currentDue)})
                    </Text>
                  </TouchableOpacity>

                  {halfDueVal > 0 && halfDueVal < currentDue && (
                    <TouchableOpacity
                      style={[
                        styles.quickOptionBtn,
                        quickOption === 'half' && [styles.quickOptionBtnActive, { borderColor: colors.accent }],
                      ]}
                      onPress={handleSelectHalf}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.quickOptionText,
                          quickOption === 'half' && [styles.quickOptionTextActive, { color: colors.accent }],
                        ]}
                      >
                        Half Due ({fmt(halfDueVal)})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Amount Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amountStr}
                    onChangeText={handleChangeCustom}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    maxLength={7}
                    selectTextOnFocus
                  />
                </View>

                {/* Dynamic Due Breakdown After Payment */}
                <View style={styles.breakdownBox}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Collecting Now (Revenue):</Text>
                    <Text style={[styles.breakdownVal, { color: '#16a34a' }]}>
                      + {fmt(parsedAmount)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Remaining Balance in Due:</Text>
                    <Text
                      style={[
                        styles.breakdownVal,
                        { color: remainingAfter > 0 ? '#ef4444' : '#16a34a' },
                      ]}
                    >
                      {remainingAfter > 0 ? fmt(remainingAfter) : '₹0 (Fully Paid ✓)'}
                    </Text>
                  </View>
                </View>

                {/* Luxury Payment Method Dropdown */}
                <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
                
                {/* Dropdown Trigger */}
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    dropdownOpen && { borderColor: colors.accent, backgroundColor: '#ffffff' },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setDropdownOpen((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Payment method dropdown, currently ${activeModeObj.label}`}
                >
                  <View style={styles.dropdownTriggerLeft}>
                    <View style={[styles.dropdownIconBadge, { backgroundColor: activeModeObj.iconBg }]}>
                      <activeModeObj.Icon color={activeModeObj.iconColor} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownSelectedLabel}>{activeModeObj.label}</Text>
                      <Text style={styles.dropdownSelectedSub}>{activeModeObj.sublabel}</Text>
                    </View>
                  </View>
                  <View style={styles.chevronWrap}>
                    <ChevronDownIcon color="#64748B" size={17} open={dropdownOpen} />
                  </View>
                </TouchableOpacity>

                {/* Dropdown Expansion Options */}
                {dropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {PAYMENT_MODES.map((mode, idx) => {
                      const isSelected = selectedMode === mode.id;
                      return (
                        <TouchableOpacity
                          key={mode.id}
                          style={[
                            styles.dropdownOptionRow,
                            idx < PAYMENT_MODES.length - 1 && styles.dropdownOptionBorder,
                            isSelected && { backgroundColor: `${colors.accent}0D` },
                          ]}
                          onPress={() => {
                            try {
                              Haptics.selectionAsync();
                            } catch {}
                            setSelectedMode(mode.id);
                            setDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.dropdownOptionBadge, { backgroundColor: mode.iconBg }]}>
                            <mode.Icon color={mode.iconColor} size={16} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.dropdownOptionTitle,
                                isSelected && { color: colors.accent, fontWeight: '800' },
                              ]}
                            >
                              {mode.label}
                            </Text>
                            <Text style={styles.dropdownOptionSub}>{mode.sublabel}</Text>
                          </View>
                          {isSelected && (
                            <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
                              <CheckIcon color="#ffffff" size={11} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      { backgroundColor: colors.accent },
                      (!isValid || submitting) && styles.confirmBtnDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={!isValid || submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.confirmBtnText}>
                        CONFIRM {fmt(parsedAmount)}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    maxHeight: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  dueHeroCol: {
    alignItems: 'center',
    flex: 1,
  },
  dueHeroDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
  },
  dueHeroLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  dueHeroVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 3,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  quickOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickOptionBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickOptionBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
  },
  quickOptionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  quickOptionTextActive: {
    fontWeight: '800',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    padding: 0,
  },
  breakdownBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Dropdown Styles
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSelectedLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  dropdownSelectedSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginTop: -4,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownOptionBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownOptionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  dropdownOptionSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.6,
  },
  confirmBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
});
