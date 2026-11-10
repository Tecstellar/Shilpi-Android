import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
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
  // Quote rolling index
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [calOpen, setCalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(14);
  const [calMonth, setCalMonth] = useState('September 2026');

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const currentQuote = QUOTES[quoteIndex];

  // 14-day strip numbers (13 Sep to 26 Sep)
  const twoWeeksDays = [
    { num: 13, dow: 'S', dots: 0 },
    { num: 14, dow: 'M', dots: 2 },
    { num: 15, dow: 'T', dots: 0 },
    { num: 16, dow: 'W', dots: 0 },
    { num: 17, dow: 'T', dots: 0 },
    { num: 18, dow: 'F', dots: 1 },
    { num: 19, dow: 'S', dots: 0 },
    { num: 20, dow: 'S', dots: 0 },
    { num: 21, dow: 'M', dots: 0 },
    { num: 22, dow: 'T', dots: 1 },
    { num: 23, dow: 'W', dots: 0 },
    { num: 24, dow: 'T', dots: 0 },
    { num: 25, dow: 'F', dots: 0 },
    { num: 26, dow: 'S', dots: 0 },
  ];

  // Month grid for Sept 2026 (Starts on Tuesday, 30 days)
  // lead 2 blanks for Sun, Mon
  const monthLead = [null, null];
  const monthDays = Array.from({ length: 30 }, (_, i) => i + 1);

  const getDotsForDay = (d: number) => {
    return bookings.filter((b) => b.month === 'Sep' && b.day === d && b.status !== 'Closed').length;
  };

  const selectedDayBookings = bookings.filter(
    (b) => b.month === 'Sep' && b.day === selectedDay && b.status !== 'Closed'
  );

  const thisWeekBookings = bookings.filter(
    (b) => b.month === 'Sep' && b.day <= 18 && b.status === 'Upcoming'
  );

  const laterThisMonthBookings = bookings.filter(
    (b) => b.month === 'Sep' && b.day > 18 && b.status === 'Upcoming'
  );

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
          <Text style={styles.artistName}>Shilpa R.</Text>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>Mon</Text>
          <Text style={styles.dateNumber}>14 Sep</Text>
          <Text style={styles.dateYear}>2026</Text>
        </View>
      </View>

      {/* 2. Rolling Inspirational Quote Card */}
      <View style={styles.quoteCard}>
        <View style={styles.quoteAccentBar} />
        <View style={styles.quoteContent}>
          <Text style={styles.quoteTitle}>{currentQuote.title}</Text>
          <Text style={styles.quoteSubtitle}>{currentQuote.subtitle}</Text>
        </View>
      </View>

      {/* 3. 6-KPI Metrics Grid */}
      <View style={styles.statsGrid}>
        {/* Row 1 */}
        <View style={styles.statCardWhite}>
          <Text style={styles.statLabel}>THIS WEEK</Text>
          <Text style={styles.statValue}>3 bookings</Text>
        </View>
        <View style={styles.statCardWhite}>
          <Text style={styles.statLabel}>THIS MONTH</Text>
          <Text style={styles.statValue}>11 bookings</Text>
        </View>
        <View style={styles.statCardPink}>
          <Text style={styles.statLabelPink}>TO COLLECT</Text>
          <Text style={styles.statValuePink}>{fmt(18000)}</Text>
        </View>

        {/* Row 2 */}
        <View style={styles.statCardWhite}>
          <Text style={styles.statLabel}>SEPT SALES</Text>
          <Text style={styles.statValue}>{fmt(125000)}</Text>
        </View>
        <View style={styles.statCardWhite}>
          <Text style={styles.statLabel}>SEPT EXPENSES</Text>
          <Text style={styles.statValue}>{fmt(35000)}</Text>
        </View>
        <View style={styles.statCardPeach}>
          <Text style={styles.statLabel}>SEPT PROFIT</Text>
          <Text style={styles.statValue}>{fmt(90000)}</Text>
        </View>
      </View>

      {/* 4. This Week Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>THIS WEEK · 3 BOOKINGS</Text>
        <TouchableOpacity onPress={onOpenOrders} activeOpacity={0.7}>
          <Text style={styles.allLink}>ALL</Text>
        </TouchableOpacity>
      </View>

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
            const isToday = d.num === 14;
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
              const isToday = d === 14;
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
              {selectedDayBookings.length === 1 ? '' : 'S'} ON {selectedDay} SEP
            </Text>
            {selectedDayBookings.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.selectedDayItem}
                onPress={() => onOpenBooking(b.id)}
              >
                <Text style={styles.selectedDayTime}>{b.time} {b.meridiem}</Text>
                <Text style={styles.selectedDayClient}>{b.client}</Text>
                <Text style={styles.selectedDayVenue}>{b.venue}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 6. Later this month */}
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
                <Text style={styles.timeText}>{b.day} Sep</Text>
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
  quoteContent: {
    flex: 1,
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
});
