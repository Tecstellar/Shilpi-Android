import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../theme/colors';
import {
  Client,
  PackageGroup,
  Booking,
  fmt,
  first,
} from '../data/prototypeData';

const CheckVectorIcon = () => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_PRESETS = ['6:00 AM', '7:30 AM', '10:00 AM', '2:00 PM', '5:00 PM'];

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
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [advanceText, setAdvanceText] = useState('');
  const [travelText, setTravelText] = useState('');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');

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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
              activeOpacity={0.8}
            >
              <Text style={styles.newClientText}>＋ New client</Text>
            </TouchableOpacity>
          </ScrollView>
          {clients.length === 0 && (
            <Text style={styles.emptyClientHint}>
              No clients saved yet. Tap "+ New client" to add one first.
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
            >
              <Text style={styles.monthNavText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {displayedMonthLong.toUpperCase()} {displayedYear}
            </Text>
            <TouchableOpacity
              onPress={() => setMonthOffset((prev) => prev + 1)}
              style={styles.monthNavBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.monthNavText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dowRow}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <Text key={d} style={styles.dowLabel}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {monthLead.map((_, i) => (
              <View key={`lead-${i}`} style={styles.blankCell} />
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {TIME_PRESETS.map((preset) => {
              const isSel = time.trim().toUpperCase() === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.timeChip, isSel && styles.timeChipActive]}
                  onPress={() => setTime(preset)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      isSel && styles.timeChipTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TextInput
            style={[styles.textInput, { marginTop: 10 }]}
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 6:30 AM"
            placeholderTextColor="rgba(18, 18, 18, 0.38)"
          />
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

          <View style={styles.twoColRow}>
            <View style={[styles.inputField, { flex: 1 }]}>
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

            <View style={[styles.inputField, { flex: 1 }]}>
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
        <View style={styles.summaryBar}>
          <View style={styles.summaryTextCol}>
            <Text style={styles.summaryLabel}>TOTAL: {fmt(grandTotal)}</Text>
            <Text style={styles.summaryBalance}>
              Balance due: {fmt(balance)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>SAVE BOOKING</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  scrollContent: {
    paddingBottom: 32,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  clientChipActive: {
    backgroundColor: Colors.accent,
  },
  clientChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121212',
  },
  clientChipTextActive: {
    color: '#ffffff',
  },
  newClientChip: {
    backgroundColor: Colors.tint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  newClientText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deep,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121212',
    marginTop: -2,
  },
  monthTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#121212',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  dowLabel: {
    width: '14.2%',
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
    width: '14.28%',
    height: 44,
  },
  monthCell: {
    width: '14.28%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  monthCellSelected: {
    backgroundColor: Colors.accent,
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
    color: Colors.accent,
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
    backgroundColor: Colors.accent,
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
    backgroundColor: Colors.tint,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  busyBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deep,
    marginBottom: 4,
  },
  busyBannerSub: {
    fontSize: 12,
    color: '#121212',
    marginTop: 2,
  },
  timeChip: {
    backgroundColor: '#f4f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  timeChipActive: {
    backgroundColor: '#121212',
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#121212',
  },
  timeChipTextActive: {
    color: '#ffffff',
  },
  groupBlock: {
    marginTop: 8,
  },
  groupHeader: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.deep,
    marginBottom: 6,
  },
  pkgToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    marginBottom: 6,
  },
  pkgToggleRowActive: {
    backgroundColor: Colors.accent,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
  },
  pkgName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#121212',
  },
  pkgPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
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
    backgroundColor: Colors.tint,
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
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
});
