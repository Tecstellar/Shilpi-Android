import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import {
  Client,
  PackageGroup,
  Booking,
  fmt,
  first,
} from '../data/prototypeData';

const ScalePressable: React.FC<{
  onPress: () => void;
  style?: any;
  containerStyle?: any;
  accessibilityLabel?: string;
  children: React.ReactNode;
}> = ({ onPress, style, containerStyle, accessibilityLabel, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (val: number) => {
    Animated.spring(scale, {
      toValue: val,
      useNativeDriver: true,
      speed: 28,
      bounciness: 4,
    }).start();
  };
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.975)}
      onPressOut={() => animateTo(1)}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

const CheckVectorIcon = () => {
  const { colors } = useTheme();
  return (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
  );
};

const ClockVectorIcon = ({ color = '#121212', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1}>
    <Circle cx="12" cy="12" r="9" />
    <Polyline points="12 7 12 12 15.5 14" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronVectorIcon = ({
  dir,
  color = '#121212',
  size = 18,
}: {
  dir: 'left' | 'right' | 'up' | 'down';
  color?: string;
  size?: number;
}) => {
  const d =
    dir === 'left'
      ? 'M15 18l-6-6 6-6'
      : dir === 'right'
        ? 'M9 18l6-6-6-6'
        : dir === 'up'
          ? 'M18 15l-6-6-6 6'
          : 'M6 9l6 6 6-6';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.3}>
      <Path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const PlusSmallVectorIcon = () => {
  const { colors } = useTheme();
  return (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.deep} strokeWidth={2.5}>
    <Line x1={12} y1={5} x2={12} y2={19} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} strokeLinecap="round" />
  </Svg>
  );
};

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_PRESETS: { label: string; hour: number; minute: number; period: 'AM' | 'PM' }[] = [
  { label: '6:00 AM', hour: 6, minute: 0, period: 'AM' },
  { label: '8:30 AM', hour: 8, minute: 30, period: 'AM' },
  { label: '11:00 AM', hour: 11, minute: 0, period: 'AM' },
  { label: '4:30 PM', hour: 4, minute: 30, period: 'PM' },
];

interface NewBookingScreenProps {
  clients: Client[];
  packageGroups: PackageGroup[];
  bookings?: Booking[];
  initialDay?: number;
  initialMonth?: string;
  initialYear?: number;
  initialClientName?: string;
  onSaveBooking: (newBooking: Partial<Booking>) => void;
  onGoBack: () => void;
  onStartNewClient: () => void;
}

export const NewBookingScreen: React.FC<NewBookingScreenProps> = ({
  clients,
  packageGroups,
  bookings = [],
  initialDay,
  initialMonth,
  initialYear,
  initialClientName,
  onSaveBooking,
  onStartNewClient,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width < 380 || fontScale > 1.15;
  const boundedWidth = Math.min(width, 680);
  const calendarCellWidth = Math.max(34, Math.floor((boundedWidth - 64) / 7));

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const resolvedInitMonthIdx = initialMonth
    ? Math.max(0, MONTH_SHORT.indexOf(initialMonth))
    : currentMonthIdx;
  const resolvedInitYear = initialYear || currentYear;

  const [selectedClient, setSelectedClient] = useState<string>(
    initialClientName || clients[0]?.name || ''
  );
  const [monthOffset, setMonthOffset] = useState<number>(
    initialMonth || initialYear
      ? (resolvedInitYear - currentYear) * 12 + (resolvedInitMonthIdx - currentMonthIdx)
      : 0
  );
  const [selectedDay, setSelectedDay] = useState<number>(initialDay || currentDay);
  const [selectedMonthShort, setSelectedMonthShort] = useState<string>(
    initialMonth || MONTH_SHORT[currentMonthIdx]
  );
  const [selectedYear, setSelectedYear] = useState<number>(resolvedInitYear);

  const [time, setTime] = useState('6:30 AM');
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [pickerHour, setPickerHour] = useState(6);
  const [pickerMinute, setPickerMinute] = useState(30);
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>('AM');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [advanceText, setAdvanceText] = useState('');
  const [travelText, setTravelText] = useState('');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');

  const openTimePicker = () => {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      const hr = Math.min(12, Math.max(1, parseInt(match[1], 10)));
      const min = Math.min(59, Math.max(0, parseInt(match[2], 10)));
      setPickerHour(hr);
      setPickerMinute(min);
      setPickerPeriod(match[3].toUpperCase() === 'PM' ? 'PM' : 'AM');
    }
    setTimeModalVisible(true);
  };

  const confirmTimePicker = () => {
    const formatted = `${pickerHour}:${String(pickerMinute).padStart(2, '0')} ${pickerPeriod}`;
    setTime(formatted);
    setTimeModalVisible(false);
  };

  useEffect(() => {
    if (initialClientName) {
      setSelectedClient(initialClientName);
    } else if (!selectedClient && clients.length > 0) {
      setSelectedClient(clients[0].name);
    }
  }, [initialClientName, clients]);

  useEffect(() => {
    if (initialDay) {
      setSelectedDay(initialDay);
    }
    if (initialYear) {
      setSelectedYear(initialYear);
    }
    if (initialMonth) {
      const idx = MONTH_SHORT.indexOf(initialMonth);
      if (idx >= 0) {
        const yr = initialYear || currentYear;
        setSelectedMonthShort(initialMonth);
        setMonthOffset((yr - currentYear) * 12 + (idx - currentMonthIdx));
      }
    }
  }, [initialDay, initialMonth, initialYear]);

  // Calendar grid calculations
  const displayedDate = new Date(currentYear, currentMonthIdx + monthOffset, 1);
  const displayedMonthIdx = displayedDate.getMonth();
  const displayedMonthShort = MONTH_SHORT[displayedMonthIdx];
  const displayedMonthLong = MONTH_LONG[displayedMonthIdx];
  const displayedYear = displayedDate.getFullYear();

  const firstDayOfMonth = new Date(displayedYear, displayedMonthIdx, 1).getDay();
  const daysInMonth = new Date(displayedYear, displayedMonthIdx + 1, 0).getDate();
  const monthLead = Array.from({ length: firstDayOfMonth }, () => null);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getBookingsForDate = (day: number, monthShort: string, yearNum: number) =>
    bookings.filter(
      (b) =>
        b.day === day &&
        b.month === monthShort &&
        (!b.year || b.year === yearNum) &&
        b.status !== 'Closed'
    );

  const selectedDayBookings = getBookingsForDate(
    selectedDay,
    selectedMonthShort,
    selectedYear
  );

  // Flatten package items from studio's packageGroups
  const allItems = packageGroups.reduce(
    (acc, g) => acc.concat(g.items),
    [] as { name: string; price: number }[]
  );

  const togglePackage = (pkgName: string) => {
    setSelectedPackages((prev) =>
      prev.includes(pkgName) ? prev.filter((p) => p !== pkgName) : [...prev, pkgName]
    );
  };

  const travel = parseInt(travelText.replace(/[^0-9]/g, '') || '0', 10);
  const advance = parseInt(advanceText.replace(/[^0-9]/g, '') || '0', 10);
  const packagesTotal = allItems
    .filter((item) => selectedPackages.includes(item.name))
    .reduce((sum, item) => sum + item.price, 0);

  const grandTotal = packagesTotal + travel;
  const balance = Math.max(grandTotal - advance, 0);

  const handleSelectCalendarDay = (day: number) => {
    setSelectedDay(day);
    setSelectedMonthShort(displayedMonthShort);
    setSelectedYear(displayedYear);
  };

  const handleSave = () => {
    if (!selectedClient.trim()) {
      Alert.alert(
        'Select Client',
        'Please select a client or tap "+ New client" to add one first.'
      );
      return;
    }

    const pickedMonthIdx = Math.max(0, MONTH_SHORT.indexOf(selectedMonthShort));
    const pickedDate = new Date(selectedYear, pickedMonthIdx, selectedDay);
    const dow = DAY_NAMES[pickedDate.getDay()];
    const mmStr = String(pickedMonthIdx + 1).padStart(2, '0');
    const ddStr = String(selectedDay).padStart(2, '0');
    const bookingDateIso = `${selectedYear}-${mmStr}-${ddStr}`;

    const cleanTime = time.trim() || '6:30 AM';
    const isPm = cleanTime.toUpperCase().includes('PM');
    const timePart = cleanTime.replace(/\s*(AM|PM)/i, '').trim() || '6:30';

    const selectedItems = allItems.filter((i) => selectedPackages.includes(i.name));
    const matchedClient = clients.find((c) => c.name === selectedClient);

    onSaveBooking({
      ref: `Booking #${Math.floor(1000 + Math.random() * 9000)}`,
      client: selectedClient.trim(),
      clientId: matchedClient ? String(matchedClient.id) : undefined,
      bookingDate: bookingDateIso,
      day: selectedDay,
      month: selectedMonthShort,
      year: selectedYear,
      dateLong: `${dow} ${selectedDay} ${selectedMonthShort} ${selectedYear}`,
      time: timePart,
      meridiem: isPm ? 'PM' : 'AM',
      items:
        selectedItems.length > 0
          ? selectedItems
          : [{ name: 'Custom Makeup Look', price: 0 }],
      travel,
      advance,
      status: 'Upcoming',
      venue: venue.trim() || 'Studio / Client Residence',
      address: venue.trim() || '',
      notes: notes.trim(),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 84 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveInner}>
        {/* 1. Client Selector + New Client */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {clients.map((c) => {
              const isSel = selectedClient === c.name;
              return (
                <TouchableOpacity
                  key={String(c.id)}
                  style={[styles.clientChip, isSel && styles.clientChipActive]}
                  onPress={() => setSelectedClient(c.name)}
                  hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.clientChipText,
                      isSel && styles.clientChipTextActive,
                    ]}
                  >
                    {first(c.name)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.newClientChip}
              onPress={onStartNewClient}
              hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
              activeOpacity={0.8}
            >
              <PlusSmallVectorIcon />
              <Text style={styles.newClientText}>New client</Text>
            </TouchableOpacity>
          </ScrollView>
          {clients.length === 0 && (
            <Text style={styles.emptyClientHint}>
              No clients saved yet. Tap "New client" to add one first.
            </Text>
          )}
        </View>

        {/* 2. Full Month Calendar & Date Availability */}
        <View style={styles.sectionCard}>
          <View style={styles.monthHeaderRow}>
            <TouchableOpacity
              onPress={() => setMonthOffset((prev) => prev - 1)}
              style={styles.monthNavBtn}
              activeOpacity={0.7}
              accessibilityLabel="Previous month"
            >
              <ChevronVectorIcon dir="left" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {displayedMonthLong.toUpperCase()} {displayedYear}
            </Text>
            <TouchableOpacity
              onPress={() => setMonthOffset((prev) => prev + 1)}
              style={styles.monthNavBtn}
              activeOpacity={0.7}
              accessibilityLabel="Next month"
            >
              <ChevronVectorIcon dir="right" />
            </TouchableOpacity>
          </View>

          <View style={styles.dowRow}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <Text key={d} style={[styles.dowLabel, { width: calendarCellWidth }]}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {monthLead.map((_, i) => (
              <View key={`lead-${i}`} style={[styles.blankCell, { width: calendarCellWidth }]} />
            ))}
            {monthDays.map((d) => {
              const dayList = getBookingsForDate(
                d,
                displayedMonthShort,
                displayedYear
              );
              const isToday =
                d === currentDay &&
                displayedMonthIdx === currentMonthIdx &&
                displayedYear === currentYear;
              const isSel =
                selectedDay === d &&
                selectedMonthShort === displayedMonthShort &&
                selectedYear === displayedYear;
              const isPast =
                displayedYear < currentYear ||
                (displayedYear === currentYear &&
                  (displayedMonthIdx < currentMonthIdx ||
                    (displayedMonthIdx === currentMonthIdx && d < currentDay)));

              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.monthCell,
                    { width: calendarCellWidth },
                    isToday && !isSel && styles.monthCellToday,
                    isSel && styles.monthCellSelected,
                  ]}
                  onPress={() => handleSelectCalendarDay(d)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.monthCellNum,
                      isPast && !isSel && styles.monthCellNumPast,
                      isToday && !isSel && styles.textPink,
                      isSel && styles.textWhite,
                    ]}
                  >
                    {d}
                  </Text>
                  <View style={styles.dotsRow}>
                    {dayList.slice(0, 3).map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.dot,
                          isSel ? styles.dotWhite : styles.dotPink,
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Availability Status Banner */}
          {selectedDayBookings.length === 0 ? (
            <View style={styles.freeBanner}>
              <View style={styles.freeDot} />
              <Text style={styles.freeBannerText}>
                {selectedDay} {selectedMonthShort} is free — Nothing booked yet
              </Text>
            </View>
          ) : (
            <View style={styles.busyBanner}>
              <Text style={styles.busyBannerTitle}>
                {selectedDayBookings.length}{' '}
                {selectedDayBookings.length === 1 ? 'booking' : 'bookings'} on{' '}
                {selectedDay} {selectedMonthShort}
              </Text>
              {selectedDayBookings.map((b) => (
                <Text key={b.id} style={styles.busyBannerSub}>
                  • {b.time} {b.meridiem} · {b.client}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* 3. Time Picker */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>TIME</Text>
          <ScalePressable
            style={styles.timePickerTrigger}
            onPress={openTimePicker}
            accessibilityLabel={`Session time ${time}, tap to change`}
          >
            <View style={styles.timePickerLeft}>
              <View style={styles.timeClockBadge}>
                <ClockVectorIcon color={colors.accent} size={17} />
              </View>
              <Text style={styles.timePickerValue} numberOfLines={1}>
                {time}
              </Text>
            </View>
            <View style={styles.timeChangeCue}>
              <Text style={styles.timeChangeText}>Change</Text>
              <ChevronVectorIcon dir="right" color="rgba(18, 18, 18, 0.45)" size={15} />
            </View>
          </ScalePressable>
        </View>

        {/* 4. Select Services & Packages */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SELECT PACKAGES & SERVICES</Text>
          {packageGroups.map((group) => (
            <View key={group.name} style={styles.groupBlock}>
              <Text style={styles.groupHeader}>{group.name.toUpperCase()}</Text>
              {group.items.map((pkg) => {
                const isChecked = selectedPackages.includes(pkg.name);
                return (
                  <TouchableOpacity
                    key={pkg.name}
                    style={[
                      styles.pkgToggleRow,
                      isChecked && styles.pkgToggleRowActive,
                    ]}
                    onPress={() => togglePackage(pkg.name)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[styles.checkbox, isChecked && styles.checkboxActive]}
                    >
                      {isChecked && <CheckVectorIcon />}
                    </View>
                    <Text style={[styles.pkgName, isChecked && styles.textWhite]}>
                      {pkg.name}
                    </Text>
                    <Text style={[styles.pkgPrice, isChecked && styles.textWhite]}>
                      {fmt(pkg.price)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* 5. Advance, Travel Charges, Venue & Notes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PAYMENTS, VENUE & NOTES</Text>

          <View style={[styles.twoColRow, isCompact && styles.twoColStacked]}>
            <View style={[styles.inputField, !isCompact && styles.flex1MinZero]}>
              <Text style={styles.inputLabel}>Advance (₹)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                value={advanceText}
                onChangeText={setAdvanceText}
              />
            </View>

            <View style={[styles.inputField, !isCompact && styles.flex1MinZero]}>
              <Text style={styles.inputLabel}>Travel Charges (₹)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                value={travelText}
                onChangeText={setTravelText}
              />
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Venue / Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Sri Kamatchi Mahal, RS Puram"
              placeholderTextColor="rgba(18, 18, 18, 0.35)"
              value={venue}
              onChangeText={setVenue}
            />
          </View>

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Skin prep notes, saree draping, hair extensions..."
              placeholderTextColor="rgba(18, 18, 18, 0.35)"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* 6. Summary & Save Booking Bar */}
        <View style={[styles.summaryBar, isCompact && styles.summaryBarCompact]}>
          <View style={styles.summaryTextCol}>
            <Text style={styles.summaryLabel} numberOfLines={1}>
              Total: {fmt(grandTotal)}
            </Text>
            <Text style={styles.summaryBalance} numberOfLines={1}>
              Balance due: {fmt(balance)}
            </Text>
          </View>

          <ScalePressable
            style={[styles.saveBtn, isCompact && styles.saveBtnFull]}
            onPress={handleSave}
            accessibilityLabel="Save booking"
          >
            <Text style={styles.saveBtnText}>SAVE BOOKING</Text>
          </ScalePressable>
        </View>
        </View>
      </ScrollView>

      {/* Interactive 3-Column Roller Time Picker Modal */}
      <Modal
        visible={timeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.timeModalCard}>
            <View style={styles.timeModalHeader}>
              <View style={styles.timeModalHeaderText}>
                <Text style={styles.timeModalTitle}>Session Start Time</Text>
                <Text style={styles.timeModalSub}>Choose hour, minute & period</Text>
              </View>
              <View style={styles.timeReadoutPill}>
                <Text style={styles.timeReadoutText}>
                  {pickerHour}:{String(pickerMinute).padStart(2, '0')} {pickerPeriod}
                </Text>
              </View>
            </View>

            {/* Quick Studio Presets */}
            <View style={styles.presetRow}>
              {TIME_PRESETS.map((preset) => {
                const isActive =
                  pickerHour === preset.hour &&
                  pickerMinute === preset.minute &&
                  pickerPeriod === preset.period;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.presetPill, isActive && styles.presetPillActive]}
                    onPress={() => {
                      setPickerHour(preset.hour);
                      setPickerMinute(preset.minute);
                      setPickerPeriod(preset.period);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Clean 3-Column Drum / Stepper Selector */}
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
                    <ChevronVectorIcon dir="up" color="rgba(18, 18, 18, 0.55)" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPickerHour((h) => (h === 1 ? 12 : h - 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dialGhostVal}>
                      {String(pickerHour === 1 ? 12 : pickerHour - 1).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.dialActiveBox}>
                    <Text style={styles.dialActiveVal}>{String(pickerHour).padStart(2, '0')}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPickerHour((h) => (h === 12 ? 1 : h + 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dialGhostVal}>
                      {String(pickerHour === 12 ? 1 : pickerHour + 1).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dialStepBtn}
                    onPress={() => setPickerHour((h) => (h === 12 ? 1 : h + 1))}
                    activeOpacity={0.7}
                    accessibilityLabel="Next hour"
                  >
                    <ChevronVectorIcon dir="down" color="rgba(18, 18, 18, 0.55)" size={16} />
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
                    <ChevronVectorIcon dir="up" color="rgba(18, 18, 18, 0.55)" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPickerMinute((m) => (m - 5 + 60) % 60)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dialGhostVal}>
                      {String((pickerMinute - 5 + 60) % 60).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.dialActiveBox}>
                    <Text style={styles.dialActiveVal}>
                      {String(pickerMinute).padStart(2, '0')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPickerMinute((m) => (m + 5) % 60)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dialGhostVal}>
                      {String((pickerMinute + 5) % 60).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dialStepBtn}
                    onPress={() => setPickerMinute((m) => (m + 5) % 60)}
                    activeOpacity={0.7}
                    accessibilityLabel="Next 5 minutes"
                  >
                    <ChevronVectorIcon dir="down" color="rgba(18, 18, 18, 0.55)" size={16} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Period Column */}
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
                        <Text style={[styles.periodBtnText, active && styles.periodBtnTextActive]}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.fineStepperRow}>
                  <TouchableOpacity
                    style={styles.fineStepBtn}
                    onPress={() => setPickerMinute((m) => (m + 59) % 60)}
                    activeOpacity={0.75}
                    accessibilityLabel="Minus 1 minute"
                  >
                    <Text style={styles.fineStepText}>-1m</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fineStepBtn}
                    onPress={() => setPickerMinute((m) => (m + 1) % 60)}
                    activeOpacity={0.75}
                    accessibilityLabel="Plus 1 minute"
                  >
                    <Text style={styles.fineStepText}>+1m</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTimeModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmTimePicker}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>SET TIME</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  flex1: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  scrollContent: {
    flexGrow: 1,
  },
  responsiveInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clientChip: {
    backgroundColor: '#f4f4f6',
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: 'center',
  },
  clientChipActive: {
    backgroundColor: colors.accent,
  },
  clientChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#121212',
  },
  clientChipTextActive: {
    color: '#ffffff',
  },
  newClientChip: {
    backgroundColor: colors.tint,
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  newClientText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.deep,
  },
  emptyClientHint: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 10,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f4f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#121212',
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dowLabel: {
    textAlign: 'center',
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.45)',
    letterSpacing: 0.5,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  blankCell: {
    height: 46,
  },
  monthCell: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellToday: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  monthCellSelected: {
    backgroundColor: colors.accent,
  },
  monthCellNum: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  monthCellNumPast: {
    color: 'rgba(18, 18, 18, 0.35)',
  },
  textWhite: {
    color: '#ffffff',
  },
  textPink: {
    color: colors.accent,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotPink: {
    backgroundColor: colors.accent,
  },
  dotWhite: {
    backgroundColor: '#ffffff',
  },
  freeBanner: {
    marginTop: 12,
    backgroundColor: '#eaf8ef',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1f8b4c',
  },
  freeBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#186d3b',
  },
  busyBanner: {
    marginTop: 12,
    backgroundColor: colors.tint,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  busyBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.deep,
    marginBottom: 4,
  },
  busyBannerSub: {
    fontSize: 12,
    color: '#121212',
    marginTop: 2,
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    backgroundColor: '#f7f7f9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  timePickerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeClockBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.tint2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timePickerValue: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#121212',
  },
  timeChangeCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  timeChangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.55)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timeModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
  },
  timeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  timeModalHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  timeModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121212',
  },
  timeModalSub: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  timeReadoutPill: {
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexShrink: 0,
  },
  timeReadoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetPill: {
    backgroundColor: '#f4f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  presetPillActive: {
    backgroundColor: colors.tint2,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.72)',
  },
  presetTextActive: {
    color: colors.deep,
    fontWeight: '700',
  },
  dialColumnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  dialColLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: 'rgba(18, 18, 18, 0.45)',
    marginBottom: 6,
  },
  dialTrack: {
    width: '100%',
    backgroundColor: '#f6f6f8',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  dialStepBtn: {
    width: '100%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialGhostVal: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.28)',
    paddingVertical: 3,
    fontVariant: ['tabular-nums'],
  },
  dialActiveBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.palePinkBorder,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dialActiveVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#121212',
    fontVariant: ['tabular-nums'],
  },
  dialColon: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.35)',
    paddingTop: 18,
  },
  periodCol: {
    width: 78,
    flexShrink: 0,
    alignItems: 'center',
  },
  periodStack: {
    width: '100%',
    backgroundColor: '#f6f6f8',
    borderRadius: 18,
    padding: 5,
    gap: 6,
  },
  periodBtn: {
    minHeight: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.accent,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.6)',
  },
  periodBtnTextActive: {
    color: '#ffffff',
  },
  fineStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  fineStepBtn: {
    flex: 1,
    backgroundColor: colors.tint2,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  fineStepText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.deep,
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#f4f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#121212',
  },
  modalConfirmBtn: {
    flex: 1.4,
    minHeight: 48,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
  groupBlock: {
    marginTop: 8,
  },
  groupHeader: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.deep,
    marginBottom: 6,
  },
  pkgToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    marginBottom: 8,
  },
  pkgToggleRowActive: {
    backgroundColor: colors.accent,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  checkboxActive: {
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
  },
  pkgName: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#121212',
  },
  pkgPrice: {
    flexShrink: 0,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  twoColStacked: {
    flexDirection: 'column',
    gap: 0,
  },
  flex1MinZero: {
    flex: 1,
    minWidth: 0,
  },
  inputField: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.6)',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.tint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  notesInput: {
    minHeight: 74,
    paddingTop: 10,
  },
  summaryBar: {
    backgroundColor: '#121212',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryBarCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  summaryTextCol: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '600',
  },
  summaryBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  saveBtn: {
    minHeight: 48,
    backgroundColor: colors.accent,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  saveBtnFull: {
    width: '100%',
  },
  saveBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
});
