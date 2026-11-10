import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import {
  Booking,
  QUOTES,
  fmt,
} from '../data/prototypeData';

interface HomeScreenProps {
  bookings: Booking[];
  onOpenBooking: (bookingId: string) => void;
  onOpenOrders: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  bookings,
  onOpenBooking,
  onOpenOrders,
}) => {
  // 1. Animated Quote vertical transition
  const [quoteIndex, setQuoteIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      // Step A: Slide up and fade out current quote
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -26,
          duration: 340,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Step B: Advance quote
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        // Step C: Position below
        translateY.setValue(26);
        // Step D: Slide in from below and fade in
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 7500);

    return () => clearInterval(timer);
  }, []);

  const currentQuote = QUOTES[quoteIndex] || QUOTES[0];

  // 2. Dynamic Artist Name from AsyncStorage
  const [artistName, setArtistName] = useState('Artist');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('@shilpi_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.ownerName && parsed.ownerName.trim()) {
            setArtistName(parsed.ownerName.trim());
          } else if (parsed.businessName && parsed.businessName.trim()) {
            setArtistName(parsed.businessName.trim());
          }
        }
      } catch (e) {}
    };
    loadProfile();
  }, []);

  // 3. Live Dynamic Date
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const fullMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const currentDow = dayNames[now.getDay()];
  const currentDay = now.getDate();
  const currentMonthShort = monthNames[now.getMonth()];
  const currentMonthLong = fullMonthNames[now.getMonth()];
  const currentYear = now.getFullYear();

  const [calOpen, setCalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [calMonth, setCalMonth] = useState(`${currentMonthLong} ${currentYear}`);

  // Dynamic 14-day calendar strip
  const twoWeeksDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dayNum = d.getDate();
    const dow = dayNames[d.getDay()].charAt(0);
    const mShort = monthNames[d.getMonth()];
    const dots = bookings.filter(
      (b) => b.day === dayNum && b.month === mShort && b.status !== 'Closed'
    ).length;
    return { num: dayNum, dow, month: mShort, dots };
  });

  // Dynamic Full Month days calculation
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthLead = Array.from({ length: firstDayOfMonth }, () => null);
  const monthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  const getDotsForDay = (d: number) => {
    return bookings.filter(
      (b) => b.month === currentMonthShort && b.day === d && b.status !== 'Closed'
    ).length;
  };

  const selectedDayBookings = bookings.filter(
    (b) => b.day === selectedDay && b.status !== 'Closed'
  );

  const thisWeekBookings = bookings.filter((b) => b.status === 'Upcoming');

  const laterThisMonthBookings = bookings.filter(
    (b) => b.month === currentMonthShort && b.day > currentDay + 7 && b.status === 'Upcoming'
  );

  // 4. Dynamic KPI Calculations
  const thisMonthBookings = bookings.filter(
    (b) => b.status !== 'Closed'
  );

  const toCollect = bookings
    .filter((b) => b.status === 'Upcoming')
    .reduce((sum, b) => {
      const bTotal = b.items.reduce((s, item) => s + item.price, 0) + (b.travel || 0);
      const bBal = Math.max(0, bTotal - (b.advance || 0));
      return sum + bBal;
    }, 0);

  const monthSales = thisMonthBookings.reduce((sum, b) => {
    const bTotal = b.items.reduce((s, item) => s + item.price, 0) + (b.travel || 0);
    return sum + bTotal;
  }, 0);

  const monthExpenses = 0;
  const monthProfit = Math.max(0, monthSales - monthExpenses);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Good morning Ink Card */}
      <View style={styles.inkCard}>
        <View>
          <Text style={styles.kicker}>GOOD MORNING</Text>
          <Text style={styles.artistName}>{artistName}</Text>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>{currentDow}</Text>
          <Text style={styles.dateNumber}>{currentDay} {currentMonthShort}</Text>
          <Text style={styles.dateYear}>{currentYear}</Text>
        </View>
      </View>

      {/* 2. Animated Inspirational Quote Card with vertical transition */}
      <View style={styles.quoteCard}>
        <View style={styles.quoteAccentBar} />
        <View style={styles.quoteContainer}>
          <Animated.View
            style={[
              styles.quoteAnimatedBox,
              {
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <Text style={styles.quoteTitle} numberOfLines={2}>
              {currentQuote.title}
            </Text>
            <Text style={styles.quoteSubtitle} numberOfLines={2}>
              {currentQuote.subtitle}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* 3. 6-KPI Metrics Grid (100% dynamic from real data) */}
      <View style={styles.statsGrid}>
        {/* Row 1 */}
        <View style={styles.statCardWhite}>
          <Text style={styles.statLabel}>THIS WEEK</Text>
          <Text style={styles.statValue}>
            {thisWeekBookings.length} {thisWeekBookings.length === 1 ? 'booking' : 'bookings'}
          </Text>
        </View>
        <View style={styles.statCardWhite}>
          <Text style={styles.statLabel}>THIS MONTH</Text>
          <Text style={styles.statValue}>
            {thisMonthBookings.length} {thisMonthBookings.length === 1 ? 'booking' : 'bookings'}
          </Text>
        </View>
        <View style={styles.statCardPink}>
          <Text style={styles.statLabelPink}>TO COLLECT</Text>
          <Text style={styles.statValuePink}>{fmt(toCollect)}</Text>
        </View>

        {/* Row 2 */}
        <View style={styles.statCardWhite}>
          <Text style={styles.statLabel}>{currentMonthShort.toUpperCase()} SALES</Text>
          <Text style={styles.statValue}>{fmt(monthSales)}</Text>
        </View>
        <View style={styles.statCardWhite}>
          <Text style={styles.statLabel}>{currentMonthShort.toUpperCase()} EXPENSES</Text>
          <Text style={styles.statValue}>{fmt(monthExpenses)}</Text>
        </View>
        <View style={styles.statCardPeach}>
          <Text style={styles.statLabel}>{currentMonthShort.toUpperCase()} PROFIT</Text>
          <Text style={styles.statValue}>{fmt(monthProfit)}</Text>
        </View>
      </View>

      {/* 4. This Week Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          THIS WEEK · {thisWeekBookings.length} {thisWeekBookings.length === 1 ? 'BOOKING' : 'BOOKINGS'}
        </Text>
        {thisWeekBookings.length > 0 && (
          <TouchableOpacity onPress={onOpenOrders} activeOpacity={0.7}>
            <Text style={styles.allLink}>ALL</Text>
          </TouchableOpacity>
        )}
      </View>

      {thisWeekBookings.length > 0 ? (
        <View style={styles.bookingListCard}>
          {thisWeekBookings.map((b) => {
            const total = b.items.reduce((sum, item) => sum + item.price, 0) + b.travel;
            const balance = total - b.advance;

            return (
              <TouchableOpacity
                key={b.id}
                style={styles.bookingRow}
                onPress={() => onOpenBooking(b.id)}
                activeOpacity={0.7}
              >
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{b.time}</Text>
                  <Text style={styles.meridiemText}>{b.meridiem}</Text>
                </View>

                <View style={styles.bookingDetails}>
                  <Text style={styles.clientName}>{b.client}</Text>
                  <Text style={styles.packagesText}>
                    {b.items.map((i) => i.name).join(' + ')}
                  </Text>
                  <Text style={styles.venueText}>{b.venue}</Text>
                </View>

                <View style={styles.amountColumn}>
                  <Text style={styles.totalAmount}>{fmt(total)}</Text>
                  <Text
                    style={[
                      styles.balancePill,
                      balance > 0 ? styles.balanceDueText : styles.paidText,
                    ]}
                  >
                    {balance > 0 ? `${fmt(balance)} due` : 'Paid'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardTitle}>No bookings this week</Text>
          <Text style={styles.emptyCardSub}>
            Tap the ＋ button below to create your first client booking.
          </Text>
        </View>
      )}

      {/* 5. Collapsible Calendar */}
      <TouchableOpacity
        style={styles.calendarToggleRow}
        onPress={() => setCalOpen(!calOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>MY CALENDAR</Text>
        <View style={styles.calendarToggleRight}>
          <Text style={styles.calendarToggleLabel}>
            {calOpen ? 'TWO WEEKS' : 'FULL MONTH'}
          </Text>
          <Text style={[styles.calendarChevron, calOpen && styles.chevronRotated]}>
            ▼
          </Text>
        </View>
      </TouchableOpacity>

      {/* Collapsed 14-day strip */}
      {!calOpen && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.twoWeeksStrip}
        >
          {twoWeeksDays.map((d) => {
            const isToday = d.num === currentDay;
            const isSel = selectedDay === d.num;

            return (
              <TouchableOpacity
                key={d.num}
                style={[
                  styles.stripCell,
                  isToday && styles.stripCellToday,
                  isSel && !isToday && styles.stripCellSelected,
                ]}
                onPress={() => setSelectedDay(d.num)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.stripDow,
                    isToday ? styles.stripDowToday : styles.stripDowDefault,
                  ]}
                >
                  {d.dow}
                </Text>
                <Text
                  style={[
                    styles.stripNum,
                    isToday ? styles.stripNumToday : styles.stripNumDefault,
                  ]}
                >
                  {d.num}
                </Text>
                <View style={styles.dotsRow}>
                  {Array.from({ length: d.dots }).map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        isToday ? styles.dotWhite : styles.dotPink,
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Expanded Full Month Grid */}
      {calOpen && (
        <View style={styles.expandedCalendarCard}>
          <View style={styles.monthHeaderRow}>
            <TouchableOpacity onPress={() => {}} style={styles.monthNavBtn}>
              <Text style={styles.monthNavText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{calMonth.toUpperCase()}</Text>
            <TouchableOpacity onPress={() => {}} style={styles.monthNavBtn}>
              <Text style={styles.monthNavText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* DOW headers */}
          <View style={styles.dowRow}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <Text key={day} style={styles.dowLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Day Grid */}
          <View style={styles.monthGrid}>
            {monthLead.map((_, i) => (
              <View key={`lead-${i}`} style={styles.blankCell} />
            ))}
            {monthDays.map((d) => {
              const dots = getDotsForDay(d);
              const isToday = d === currentDay;
              const isSel = selectedDay === d;

              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.monthCell,
                    isSel && styles.monthCellSelected,
                    isToday && !isSel && styles.monthCellToday,
                  ]}
                  onPress={() => setSelectedDay(d)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.monthCellNum,
                      isSel && styles.textWhite,
                      isToday && !isSel && styles.textPink,
                    ]}
                  >
                    {d}
                  </Text>
                  <View style={styles.dotsRow}>
                    {Array.from({ length: dots }).map((_, dotIdx) => (
                      <View
                        key={dotIdx}
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

          {/* Selected day booking preview inside calendar */}
          <View style={styles.selectedDayBox}>
            <Text style={styles.selectedDayTitle}>
              {selectedDayBookings.length} BOOKING
              {selectedDayBookings.length === 1 ? '' : 'S'} ON {selectedDay} {currentMonthShort.toUpperCase()}
            </Text>
            {selectedDayBookings.length > 0 ? (
              selectedDayBookings.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.selectedDayItem}
                  onPress={() => onOpenBooking(b.id)}
                >
                  <Text style={styles.selectedDayTime}>{b.time} {b.meridiem}</Text>
                  <Text style={styles.selectedDayClient}>{b.client}</Text>
                  <Text style={styles.selectedDayVenue}>{b.venue}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.selectedDayEmptyText}>
                No bookings scheduled for this date.
              </Text>
            )}
          </View>
        </View>
      )}

      {/* 6. Later this month (only if bookings exist) */}
      {laterThisMonthBookings.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>LATER THIS MONTH</Text>
          </View>

          <View style={styles.bookingListCard}>
            {laterThisMonthBookings.map((b) => {
              const total = b.items.reduce((sum, item) => sum + item.price, 0) + b.travel;
              const balance = total - b.advance;

              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.bookingRow}
                  onPress={() => onOpenBooking(b.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeText}>{b.day} {b.month}</Text>
                    <Text style={styles.meridiemText}>{b.time} {b.meridiem}</Text>
                  </View>

                  <View style={styles.bookingDetails}>
                    <Text style={styles.clientName}>{b.client}</Text>
                    <Text style={styles.packagesText}>
                      {b.items.map((i) => i.name).join(' + ')}
                    </Text>
                    <Text style={styles.venueText}>{b.venue}</Text>
                  </View>

                  <View style={styles.amountColumn}>
                    <Text style={styles.totalAmount}>{fmt(total)}</Text>
                    <Text
                      style={[
                        styles.balancePill,
                        balance > 0 ? styles.balanceDueText : styles.paidText,
                      ]}
                    >
                      {balance > 0 ? `${fmt(balance)} due` : 'Paid'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

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
    paddingBottom: 110,
  },
  inkCard: {
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.deep,
    fontWeight: '700',
  },
  artistName: {
    fontSize: 30,
    letterSpacing: -0.5,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  dateBlock: {
    alignItems: 'flex-end',
  },
  dateDay: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  dateYear: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quoteCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteAccentBar: {
    width: 3.5,
    height: 48,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  quoteContainer: {
    flex: 1,
    height: 52,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  quoteAnimatedBox: {
    height: 52,
    justifyContent: 'center',
  },
  quoteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
    lineHeight: 18,
  },
  quoteSubtitle: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 2,
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginHorizontal: 16,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.2,
  },
  emptyCardSub: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.55)',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 17,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  statCardWhite: {
    width: '31.5%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statCardPink: {
    width: '31.5%',
    backgroundColor: Colors.accent,
    padding: 12,
    borderRadius: 18,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardPeach: {
    width: '31.5%',
    backgroundColor: Colors.tint,
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(18, 18, 18, 0.55)',
    fontWeight: '600',
    minHeight: 20,
  },
  statLabelPink: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    minHeight: 20,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121212',
    marginTop: 2,
  },
  statValuePink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
  },
  allLink: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: Colors.deep,
  },
  bookingListCard: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  timeColumn: {
    width: 68,
    borderRightWidth: 1,
    borderRightColor: 'rgba(18, 18, 18, 0.07)',
    paddingRight: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  meridiemText: {
    fontSize: 9.5,
    color: 'rgba(18, 18, 18, 0.55)',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 1,
  },
  bookingDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  clientName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  packagesText: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.7)',
    marginTop: 2,
  },
  venueText: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.45)',
    marginTop: 2,
  },
  amountColumn: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  balancePill: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 0.6,
  },
  balanceDueText: {
    color: Colors.deep,
  },
  paidText: {
    color: 'rgba(18, 18, 18, 0.45)',
  },
  calendarToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  calendarToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarToggleLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.deep,
    textTransform: 'uppercase',
  },
  calendarChevron: {
    fontSize: 10,
    color: Colors.accent,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  twoWeeksStrip: {
    paddingHorizontal: 14,
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  stripCell: {
    width: 44,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripCellToday: {
    backgroundColor: Colors.accent,
  },
  stripCellSelected: {
    backgroundColor: Colors.tint,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  stripDow: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stripDowDefault: {
    color: 'rgba(18, 18, 18, 0.55)',
  },
  stripDowToday: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  stripNum: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  stripNumDefault: {
    color: '#121212',
  },
  stripNumToday: {
    color: '#ffffff',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    height: 4,
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
  expandedCalendarCard: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    marginHorizontal: 16,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthNavText: {
    fontSize: 20,
    color: '#ffffff',
    lineHeight: 20,
  },
  monthTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#ffffff',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  dowLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(18, 18, 18, 0.45)',
    width: 42,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  blankCell: {
    width: 42,
    height: 46,
  },
  monthCell: {
    width: 42,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  monthCellSelected: {
    backgroundColor: Colors.accent,
  },
  monthCellToday: {
    backgroundColor: Colors.tint,
  },
  monthCellNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
  },
  textWhite: {
    color: '#ffffff',
  },
  textPink: {
    color: Colors.accent,
  },
  selectedDayBox: {
    backgroundColor: Colors.tint,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
  },
  selectedDayTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.deep,
    marginBottom: 6,
  },
  selectedDayItem: {
    paddingVertical: 4,
  },
  selectedDayTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#121212',
  },
  selectedDayClient: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121212',
  },
  selectedDayVenue: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.55)',
  },
  selectedDayEmptyText: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.55)',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
});
