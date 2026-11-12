import React, { useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Booking, ReminderRecord, first } from '../data/prototypeData';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const REMINDER_KINDS = [
  'Payment',
  'Product purchase',
  'Travel',
  'Instagram',
  'Client follow-up',
  'Booking preparation',
  'Advance payment',
  'General',
];

const QUICK_TEMPLATES: Array<{ label: string; text: string; kind: string }> = [
  { label: 'Balance follow-up', text: 'Collect pending balance from ', kind: 'Payment' },
  { label: 'Buy products', text: 'Buy studio products — ', kind: 'Product purchase' },
  { label: 'Leave for venue', text: 'Leave for venue — ', kind: 'Travel' },
  { label: 'Post bridal reel', text: 'Post bridal look reel on Instagram', kind: 'Instagram' },
  { label: 'Prep bridal kit', text: 'Prep kit and brushes for ', kind: 'Booking preparation' },
];

const TIME_PRESETS = [
  { label: '9:00 AM', hour: 9, minute: 0, period: 'AM' as const },
  { label: '11:00 AM', hour: 11, minute: 0, period: 'AM' as const },
  { label: '2:30 PM', hour: 2, minute: 30, period: 'PM' as const },
  { label: '6:00 PM', hour: 6, minute: 0, period: 'PM' as const },
];

const CheckVectorIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoreVerticalIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="rgba(18, 18, 18, 0.45)">
    <Circle cx={12} cy={5} r={1.8} />
    <Circle cx={12} cy={12} r={1.8} />
    <Circle cx={12} cy={19} r={1.8} />
  </Svg>
);

const ClockIcon = ({ color = Colors.accent, size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1}>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronIcon = ({
  dir = 'right',
  color = 'rgba(18, 18, 18, 0.45)',
  size = 15,
}: {
  dir?: 'up' | 'down' | 'right';
  color?: string;
  size?: number;
}) => {
  const d =
    dir === 'up'
      ? 'M18 15l-6-6-6 6'
      : dir === 'down'
      ? 'M6 9l6 6 6-6'
      : 'M9 18l6-6-6-6';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
      <Path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

function toLocalDateStr(d: Date): string {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

function addDaysLocal(base: Date, days: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return d;
}

function formatTime12h(d: Date): string {
  let hrs = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const period = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12 || 12;
  return `${hrs}:${mins} ${period}`;
}

function formatReadableDate(isoDateStr: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDateStr.trim());
  if (!m) return isoDateStr;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (isNaN(d.getTime())) return isoDateStr;
  return `${SHORT_DAYS[d.getDay()]}, ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
}

function buildIsoFromLocalDateAndTime(
  dateStr: string,
  hour12: number,
  minute: number,
  period: 'AM' | 'PM'
): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return new Date().toISOString();
  let hr24 = hour12 % 12;
  if (period === 'PM') hr24 += 12;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hr24, minute, 0, 0);
  return dt.toISOString();
}

export interface ReminderPayload {
  text: string;
  kind: string;
  remindAt: string;
  bookingId?: string | null;
}

interface RemindersScreenProps {
  reminders: ReminderRecord[];
  bookings?: Booking[];
  onAddReminder: (payload: ReminderPayload) => Promise<void>;
  onToggleReminder: (id: string) => Promise<void> | void;
  onUpdateReminder?: (id: string, payload: ReminderPayload) => Promise<void>;
  onDeleteReminder?: (id: string) => Promise<void> | void;
  onGoBack: () => void;
}

interface ReminderGroupBucket {
  key: string;
  label: string;
  isToday?: boolean;
  showDatePrefix?: boolean;
  items: ReminderRecord[];
}

export const RemindersScreen: React.FC<RemindersScreenProps> = ({
  reminders,
  bookings = [],
  onAddReminder,
  onToggleReminder,
  onUpdateReminder,
  onDeleteReminder,
}) => {
  const insets = useSafeAreaInsets();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReminderRecord | null>(null);
  const [menuItem, setMenuItem] = useState<ReminderRecord | null>(null);

  const [text, setText] = useState('');
  const [kind, setKind] = useState('Payment');
  const [dateStr, setDateStr] = useState(() => toLocalDateStr(new Date()));
  const [showCustomDateInput, setShowCustomDateInput] = useState(false);
  const [pickerHour, setPickerHour] = useState(10);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>('AM');
  const [showTimeDial, setShowTimeDial] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = toLocalDateStr(todayStart);
  const tomorrowStart = addDaysLocal(todayStart, 1);
  const tomorrowKey = toLocalDateStr(tomorrowStart);
  const weekEnd = addDaysLocal(todayStart, 7);

  const quickDateChoices = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDaysLocal(base, i);
      const iso = toLocalDateStr(d);
      const label =
        i === 0
          ? `Today · ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`
          : i === 1
          ? `Tomorrow · ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`
          : `${SHORT_DAYS[d.getDay()]} · ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
      return { iso, label };
    });
  }, []);

  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'Upcoming').slice(0, 8),
    [bookings]
  );

  const bookingLookup = useMemo(() => {
    const map: Record<string, Booking> = {};
    for (const b of bookings) {
      map[b.id] = b;
    }
    return map;
  }, [bookings]);

  const groupedReminders = useMemo<ReminderGroupBucket[]>(() => {
    const overdue: ReminderRecord[] = [];
    const todayItems: ReminderRecord[] = [];
    const tomorrowItems: ReminderRecord[] = [];
    const weekItems: ReminderRecord[] = [];
    const upcomingItems: ReminderRecord[] = [];

    const sorted = [...reminders].sort(
      (a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
    );

    for (const r of sorted) {
      const dt = new Date(r.remindAt);
      if (isNaN(dt.getTime())) {
        todayItems.push(r);
        continue;
      }
      const itemDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const itemKey = toLocalDateStr(itemDay);

      if (itemKey < todayKey) {
        overdue.push(r);
      } else if (itemKey === todayKey) {
        todayItems.push(r);
      } else if (itemKey === tomorrowKey) {
        tomorrowItems.push(r);
      } else if (itemDay <= weekEnd) {
        weekItems.push(r);
      } else {
        upcomingItems.push(r);
      }
    }

    const buckets: ReminderGroupBucket[] = [];
    if (overdue.length > 0) {
      buckets.push({
        key: 'overdue',
        label: 'Earlier',
        showDatePrefix: true,
        items: overdue,
      });
    }
    if (todayItems.length > 0) {
      buckets.push({
        key: 'today',
        label: `Today · ${todayStart.getDate()} ${SHORT_MONTHS[todayStart.getMonth()]}`,
        isToday: true,
        items: todayItems,
      });
    }
    if (tomorrowItems.length > 0) {
      buckets.push({
        key: 'tomorrow',
        label: `Tomorrow · ${tomorrowStart.getDate()} ${SHORT_MONTHS[tomorrowStart.getMonth()]}`,
        items: tomorrowItems,
      });
    }
    if (weekItems.length > 0) {
      buckets.push({
        key: 'week',
        label: 'This week',
        showDatePrefix: true,
        items: weekItems,
      });
    }
    if (upcomingItems.length > 0) {
      buckets.push({
        key: 'upcoming',
        label: 'Upcoming',
        showDatePrefix: true,
        items: upcomingItems,
      });
    }
    return buckets;
  }, [reminders, todayKey, tomorrowKey]);

  const resetForm = () => {
    setEditingItem(null);
    setText('');
    setKind('Payment');
    setDateStr(toLocalDateStr(new Date()));
    setShowCustomDateInput(false);
    setPickerHour(10);
    setPickerMinute(0);
    setPickerPeriod('AM');
    setShowTimeDial(false);
    setSelectedBookingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ReminderRecord) => {
    setMenuItem(null);
    setEditingItem(item);
    setText(item.text);
    setKind(item.kind || 'General');
    const dt = new Date(item.remindAt);
    if (!isNaN(dt.getTime())) {
      const itemIso = toLocalDateStr(dt);
      setDateStr(itemIso);
      const inQuickList = quickDateChoices.some((q) => q.iso === itemIso);
      setShowCustomDateInput(!inQuickList);
      let hrs = dt.getHours();
      const mins = dt.getMinutes();
      setPickerPeriod(hrs >= 12 ? 'PM' : 'AM');
      hrs = hrs % 12 || 12;
      setPickerHour(hrs);
      setPickerMinute(mins);
    } else {
      setDateStr(toLocalDateStr(new Date()));
      setShowCustomDateInput(false);
    }
    setShowTimeDial(false);
    setSelectedBookingId(item.bookingId || null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      Alert.alert(
        'Reminder Required',
        'Please enter what you want to be reminded about.'
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format (e.g. 2026-11-12).');
      return;
    }

    const remindAt = buildIsoFromLocalDateAndTime(
      dateStr.trim(),
      pickerHour,
      pickerMinute,
      pickerPeriod
    );

    const payload: ReminderPayload = {
      text: trimmedText,
      kind,
      remindAt,
      bookingId: selectedBookingId,
    };

    setSaving(true);
    try {
      if (editingItem && onUpdateReminder) {
        await onUpdateReminder(editingItem.id, payload);
      } else {
        await onAddReminder(payload);
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      Alert.alert('Could Not Save Reminder', err?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: ReminderRecord) => {
    setMenuItem(null);
    if (!onDeleteReminder) return;
    Alert.alert('Delete Reminder', `Remove "${item.text}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeleteReminder(item.id),
      },
    ]);
  };

  const formattedTimeLabel = `${pickerHour}:${String(pickerMinute).padStart(2, '0')} ${pickerPeriod}`;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 90 },
        ]}
      >
        {groupedReminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptySub}>
              Keep track of balance follow-ups, product restocks, travel times, and bridal prep.
            </Text>
          </View>
        ) : (
          groupedReminders.map((group) => (
            <View key={group.key} style={styles.groupSection}>
              <View
                style={[
                  styles.groupHeader,
                  group.isToday ? styles.groupHeaderToday : styles.groupHeaderDefault,
                ]}
              >
                <Text
                  style={[
                    styles.groupLabel,
                    group.isToday ? styles.textWhite : styles.textInk,
                  ]}
                >
                  {group.label.toUpperCase()}
                </Text>
              </View>

              <View style={styles.groupCard}>
                {group.items.map((item, idx) => {
                  const isDone = !!item.isCompleted;
                  const dt = new Date(item.remindAt);
                  const timePart = isNaN(dt.getTime()) ? '' : formatTime12h(dt);
                  const datePart =
                    group.showDatePrefix && !isNaN(dt.getTime())
                      ? `${dt.getDate()} ${SHORT_MONTHS[dt.getMonth()]} · `
                      : '';
                  const linkedBooking = item.bookingId ? bookingLookup[item.bookingId] : undefined;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.reminderRow,
                        idx === group.items.length - 1 && styles.reminderRowLast,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.reminderToggleArea}
                        onPress={() => onToggleReminder(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkBox, isDone && styles.checkBoxDone]}>
                          {isDone && <CheckVectorIcon />}
                        </View>

                        <View style={styles.reminderDetails}>
                          <Text
                            style={[
                              styles.reminderText,
                              isDone && styles.reminderTextDone,
                            ]}
                          >
                            {item.text}
                          </Text>
                          <Text style={styles.reminderMeta}>
                            {datePart}
                            {timePart ? `${timePart} · ` : ''}
                            {item.kind || 'General'}
                            {linkedBooking ? ` · ${first(linkedBooking.client)}` : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.moreBtn}
                        onPress={() => setMenuItem(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={`Options for ${item.text}`}
                        activeOpacity={0.7}
                      >
                        <MoreVerticalIcon />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={styles.addBtnContainer}>
          <TouchableOpacity
            style={styles.addReminderBtn}
            onPress={handleOpenCreate}
            activeOpacity={0.85}
          >
            <Text style={styles.addReminderBtnText}>＋ ADD REMINDER</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Row Action Menu Modal */}
      <Modal
        visible={!!menuItem}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuItem(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuItem(null)}
        >
          <View
            style={[
              styles.menuSheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            {menuItem && (
              <>
                <Text style={styles.menuTitle} numberOfLines={2}>
                  {menuItem.text}
                </Text>

                <TouchableOpacity
                  style={styles.menuOptionBtn}
                  onPress={() => {
                    const target = menuItem;
                    setMenuItem(null);
                    onToggleReminder(target.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuOptionText}>
                    {menuItem.isCompleted ? 'Mark as Pending' : 'Mark as Done'}
                  </Text>
                </TouchableOpacity>

                {onUpdateReminder && (
                  <TouchableOpacity
                    style={styles.menuOptionBtn}
                    onPress={() => handleOpenEdit(menuItem)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.menuOptionText}>Edit Reminder</Text>
                  </TouchableOpacity>
                )}

                {onDeleteReminder && (
                  <TouchableOpacity
                    style={[styles.menuOptionBtn, styles.menuDeleteBtn]}
                    onPress={() => confirmDelete(menuItem)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.menuDeleteText}>Delete Reminder</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.menuCancelBtn}
                  onPress={() => setMenuItem(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.menuCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create / Edit Reminder Form Bottom Sheet */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.handleBar} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.modalKicker}>
                  {editingItem ? 'UPDATE REMINDER' : 'NEW STUDIO REMINDER'}
                </Text>
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Reminder' : 'Create Reminder'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeChip}
                onPress={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.75}
              >
                <Text style={styles.closeChipText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Quick Fill Templates */}
              {!editingItem && (
                <>
                  <Text style={styles.fieldLabel}>QUICK TEMPLATES</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalPillsRow}
                  >
                    {QUICK_TEMPLATES.map((tpl) => (
                      <TouchableOpacity
                        key={tpl.label}
                        style={styles.templateChip}
                        onPress={() => {
                          setText(tpl.text);
                          setKind(tpl.kind);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.templateChipText}>＋ {tpl.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Reminder Text */}
              <Text style={styles.fieldLabel}>WHAT TO REMIND *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Collect ₹5,000 balance from Priya"
                placeholderTextColor="rgba(18, 18, 18, 0.38)"
                maxLength={130}
                value={text}
                onChangeText={setText}
              />

              {/* Category (Prototype Kind) */}
              <Text style={styles.fieldLabel}>CATEGORY *</Text>
              <View style={styles.chipsWrap}>
                {REMINDER_KINDS.map((opt) => {
                  const active = kind === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.catChip, active && styles.catChipActive]}
                      onPress={() => setKind(opt)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date Selector */}
              <View style={styles.labelWithPreviewRow}>
                <Text style={styles.fieldLabel}>DATE *</Text>
                <Text style={styles.datePreviewText}>{formatReadableDate(dateStr)}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalPillsRow}
              >
                {quickDateChoices.map((dChoice) => {
                  const active = !showCustomDateInput && dateStr === dChoice.iso;
                  return (
                    <TouchableOpacity
                      key={dChoice.iso}
                      style={[styles.dateChip, active && styles.dateChipActive]}
                      onPress={() => {
                        setShowCustomDateInput(false);
                        setDateStr(dChoice.iso);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>
                        {dChoice.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.dateChip, showCustomDateInput && styles.dateChipActive]}
                  onPress={() => setShowCustomDateInput((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      showCustomDateInput && styles.dateChipTextActive,
                    ]}
                  >
                    Custom date
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {showCustomDateInput && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(18, 18, 18, 0.38)"
                  value={dateStr}
                  onChangeText={setDateStr}
                />
              )}

              {/* Time Selector */}
              <Text style={styles.fieldLabel}>TIME *</Text>
              <TouchableOpacity
                style={styles.timeTriggerRow}
                onPress={() => setShowTimeDial((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={styles.timeTriggerLeft}>
                  <View style={styles.timeClockBadge}>
                    <ClockIcon />
                  </View>
                  <Text style={styles.timeTriggerValue}>{formattedTimeLabel}</Text>
                </View>
                <View style={styles.timeChangeCue}>
                  <Text style={styles.timeChangeText}>
                    {showTimeDial ? 'Done' : 'Change'}
                  </Text>
                  <ChevronIcon dir={showTimeDial ? 'up' : 'right'} />
                </View>
              </TouchableOpacity>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.horizontalPillsRow, { marginTop: 8 }]}
              >
                {TIME_PRESETS.map((preset) => {
                  const active =
                    pickerHour === preset.hour &&
                    pickerMinute === preset.minute &&
                    pickerPeriod === preset.period;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[styles.presetPill, active && styles.presetPillActive]}
                      onPress={() => {
                        setPickerHour(preset.hour);
                        setPickerMinute(preset.minute);
                        setPickerPeriod(preset.period);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.presetText, active && styles.presetTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Inline 3-Column Drum / Stepper Time Picker */}
              {showTimeDial && (
                <View style={styles.dialCard}>
                  <View style={styles.dialColumnsRow}>
                    {/* Hour Column */}
                    <View style={styles.dialCol}>
                      <Text style={styles.dialColLabel}>HOUR</Text>
                      <View style={styles.dialTrack}>
                        <TouchableOpacity
                          style={styles.dialStepBtn}
                          onPress={() => setPickerHour((h) => (h === 1 ? 12 : h - 1))}
                          activeOpacity={0.7}
                          accessibilityLabel="Previous hour"
                        >
                          <ChevronIcon dir="up" color="rgba(18, 18, 18, 0.6)" size={16} />
                        </TouchableOpacity>
                        <View style={styles.dialActiveBox}>
                          <Text style={styles.dialActiveVal}>
                            {String(pickerHour).padStart(2, '0')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.dialStepBtn}
                          onPress={() => setPickerHour((h) => (h === 12 ? 1 : h + 1))}
                          activeOpacity={0.7}
                          accessibilityLabel="Next hour"
                        >
                          <ChevronIcon dir="down" color="rgba(18, 18, 18, 0.6)" size={16} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.dialColon}>:</Text>

                    {/* Minute Column */}
                    <View style={styles.dialCol}>
                      <Text style={styles.dialColLabel}>MIN</Text>
                      <View style={styles.dialTrack}>
                        <TouchableOpacity
                          style={styles.dialStepBtn}
                          onPress={() => setPickerMinute((m) => (m - 5 + 60) % 60)}
                          activeOpacity={0.7}
                          accessibilityLabel="Previous 5 minutes"
                        >
                          <ChevronIcon dir="up" color="rgba(18, 18, 18, 0.6)" size={16} />
                        </TouchableOpacity>
                        <View style={styles.dialActiveBox}>
                          <Text style={styles.dialActiveVal}>
                            {String(pickerMinute).padStart(2, '0')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.dialStepBtn}
                          onPress={() => setPickerMinute((m) => (m + 5) % 60)}
                          activeOpacity={0.7}
                          accessibilityLabel="Next 5 minutes"
                        >
                          <ChevronIcon dir="down" color="rgba(18, 18, 18, 0.6)" size={16} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* AM/PM Column */}
                    <View style={styles.periodCol}>
                      <Text style={styles.dialColLabel}>AM/PM</Text>
                      <View style={styles.periodStack}>
                        {(['AM', 'PM'] as const).map((p) => {
                          const active = pickerPeriod === p;
                          return (
                            <TouchableOpacity
                              key={p}
                              style={[styles.periodBtn, active && styles.periodBtnActive]}
                              onPress={() => setPickerPeriod(p)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[styles.periodBtnText, active && styles.periodBtnTextActive]}
                              >
                                {p}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Optional Linked Booking */}
              {upcomingBookings.length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>LINK UPCOMING BOOKING (OPTIONAL)</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalPillsRow}
                  >
                    <TouchableOpacity
                      style={[styles.dateChip, selectedBookingId === null && styles.dateChipActive]}
                      onPress={() => setSelectedBookingId(null)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.dateChipText,
                          selectedBookingId === null && styles.dateChipTextActive,
                        ]}
                      >
                        None
                      </Text>
                    </TouchableOpacity>
                    {upcomingBookings.map((b) => {
                      const active = selectedBookingId === b.id;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          style={[styles.dateChip, active && styles.dateChipActive]}
                          onPress={() => setSelectedBookingId(b.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[styles.dateChipText, active && styles.dateChipTextActive]}
                          >
                            {first(b.client)} · {b.day} {b.month}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
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
                    {saving
                      ? 'SAVING...'
                      : editingItem
                      ? 'SAVE CHANGES'
                      : 'SAVE REMINDER'}
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
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  emptySub: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  groupSection: {
    marginTop: 14,
  },
  groupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  groupHeaderToday: {
    backgroundColor: Colors.accent,
  },
  groupHeaderDefault: {
    backgroundColor: Colors.tint,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  textWhite: {
    color: '#ffffff',
  },
  textInk: {
    color: Colors.ink,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 14,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
  },
  reminderRowLast: {
    borderBottomWidth: 0,
  },
  reminderToggleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(18, 18, 18, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkBoxDone: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  reminderDetails: {
    flex: 1,
  },
  reminderText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
    lineHeight: 20,
  },
  reminderTextDone: {
    textDecorationLine: 'line-through',
    color: 'rgba(18, 18, 18, 0.4)',
  },
  reminderMeta: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  moreBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  addBtnContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  addReminderBtn: {
    backgroundColor: Colors.ink,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReminderBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#ffffff',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.45)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    gap: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  menuOptionBtn: {
    backgroundColor: '#f4f4f6',
    minHeight: 46,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  menuOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  menuDeleteBtn: {
    backgroundColor: Colors.tint,
  },
  menuDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
  menuCancelBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  menuCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.55)',
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
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(18, 18, 18, 0.16)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    color: Colors.ink,
    marginTop: 2,
  },
  closeChip: {
    backgroundColor: '#f4f4f6',
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 999,
  },
  closeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 14,
    marginBottom: 6,
  },
  labelWithPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePreviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deep,
    marginTop: 14,
    marginBottom: 6,
  },
  horizontalPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  templateChip: {
    backgroundColor: Colors.tint,
    borderWidth: 1,
    borderColor: Colors.palePinkBorder,
    borderRadius: 999,
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  templateChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.deep,
  },
  input: {
    backgroundColor: Colors.palePink,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 14,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.palePinkBorder,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#f4f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: Colors.tint,
    borderColor: Colors.accent,
  },
  catChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.72)',
  },
  catChipTextActive: {
    color: Colors.deep,
    fontWeight: '700',
  },
  dateChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f4f4f6',
  },
  dateChipActive: {
    backgroundColor: Colors.ink,
  },
  dateChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.72)',
  },
  dateChipTextActive: {
    color: '#ffffff',
  },
  timeTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.palePink,
    borderWidth: 1,
    borderColor: Colors.palePinkBorder,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  timeTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeClockBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTriggerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  timeChangeCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeChangeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.deep,
  },
  presetPill: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#f4f4f6',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: Colors.accent,
  },
  presetText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.ink,
  },
  presetTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dialCard: {
    marginTop: 10,
    backgroundColor: '#f8f8fa',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  dialColumnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dialCol: {
    flex: 1,
    alignItems: 'center',
  },
  periodCol: {
    width: 72,
    alignItems: 'center',
  },
  dialColLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: 'rgba(18, 18, 18, 0.5)',
    marginBottom: 6,
  },
  dialTrack: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  dialStepBtn: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  dialActiveBox: {
    width: '100%',
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: Colors.tint,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialActiveVal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.deep,
  },
  dialColon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 16,
  },
  periodStack: {
    width: '100%',
    gap: 8,
  },
  periodBtn: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  periodBtnActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  periodBtnTextActive: {
    color: '#ffffff',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    marginBottom: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f4f4f6',
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.ink,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
});
