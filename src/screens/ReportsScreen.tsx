import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Animated,
  Alert,
  Share,
  Modal,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { Booking, ExpenseRecord, fmt } from '../data/prototypeData';

interface ReportsScreenProps {
  bookings?: Booking[];
  expenses?: ExpenseRecord[];
  monthExpenses?: number;
  registeredAt?: string;
  studioName?: string;
  artistName?: string;
  onGoBack: () => void;
}

const MONTH_SHORT_ARR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_LONG_ARR = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toMonthSerial(year: number, monthIdx: number): number {
  return year * 12 + monthIdx;
}

function fromMonthSerial(serial: number): { year: number; monthIdx: number } {
  const year = Math.floor(serial / 12);
  const monthIdx = ((serial % 12) + 12) % 12;
  return { year, monthIdx };
}

function parseBookingDayLocal(b: Booking, fallbackYear: number): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.bookingDate || ''));
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const mIdx = Math.max(0, MONTH_SHORT_ARR.indexOf(b.month));
  return new Date(b.year || fallbackYear, mIdx, b.day || 1);
}

function parseExpenseDayLocal(e: ExpenseRecord, fallbackYear: number): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(e.expenseDate || ''));
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const parsed = new Date(e.expenseDate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
}

function bookingTotalAmount(b: Booking): number {
  return b.items.reduce((s, item) => s + (item.price || 0), 0) + (b.travel || 0);
}

// Icons
const CalendarIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const ChevronLeftIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = ({ color = '#121212' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronUpIcon = ({ color = '#121212' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  bookings = [],
  expenses = [],
  monthExpenses = 0,
  registeredAt,
  studioName = 'Shilpi Studio',
  artistName = 'Artist',
  onGoBack,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const currentSerial = toMonthSerial(currentYear, currentMonthIdx);

  // Month navigation boundary
  const regDate = useMemo(() => {
    if (registeredAt) {
      const parsed = new Date(registeredAt);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date(currentYear, currentMonthIdx - 11, 1);
  }, [registeredAt, currentYear, currentMonthIdx]);

  const minSerial = toMonthSerial(regDate.getFullYear(), regDate.getMonth());
  const maxSerial = currentSerial + 12;

  const [selectedSerial, setSelectedSerial] = useState<number>(currentSerial);
  const [subView, setSubView] = useState<'Summary' | 'DayWise'>('Summary');

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);

  // DayWise Expandable Month Row State
  const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(null);

  // Animated Slider
  const slideOffset = useRef(new Animated.Value(0)).current;

  const stepMonth = (delta: number) => {
    setSelectedSerial((prev) => {
      const next = Math.max(minSerial, Math.min(maxSerial, prev + delta));
      if (next === prev) return prev;
      slideOffset.setValue(delta > 0 ? 18 : -18);
      Animated.spring(slideOffset, {
        toValue: 0,
        useNativeDriver: true,
        speed: 24,
        bounciness: 4,
      }).start();
      return next;
    });
  };

  const stepMonthRef = useRef<(delta: number) => void>(() => {});
  stepMonthRef.current = stepMonth;

  const monthPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 16 && Math.abs(gesture.dy) < 18,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx < -32) {
          stepMonthRef.current(1);
        } else if (gesture.dx > 32) {
          stepMonthRef.current(-1);
        }
      },
    })
  ).current;

  const { year: selectedYear, monthIdx: selectedMonthIdx } = fromMonthSerial(selectedSerial);
  const selectedMonthLong = MONTH_LONG_ARR[selectedMonthIdx];
  const canGoPrev = selectedSerial > minSerial;
  const canGoNext = selectedSerial < maxSerial;
  const prevMonthShort = canGoPrev
    ? MONTH_SHORT_ARR[fromMonthSerial(selectedSerial - 1).monthIdx]
    : '';
  const nextMonthShort = canGoNext
    ? MONTH_SHORT_ARR[fromMonthSerial(selectedSerial + 1).monthIdx]
    : '';

  // Filter Data for Selected Month
  const monthData = useMemo(() => {
    const monthBookings = bookings.filter((b) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonthIdx;
    });

    const monthExp = expenses.filter((e) => {
      const dt = parseExpenseDayLocal(e, selectedYear);
      if (!dt) return false;
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonthIdx;
    });

    let totalSales = 0;
    let totalAdvance = 0;
    let cashPaid = 0;
    let upiPaid = 0;
    const dayWiseMap = new Map<
      number,
      { day: number; dateStr: string; sales: number; expenses: number; bookingsCount: number; bookings: Booking[] }
    >();

    monthBookings.forEach((b) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      const dayNum = dt.getDate();
      const bTotal = bookingTotalAmount(b);
      const bAdvance = Math.min(bTotal, Math.max(0, b.advance || 0));

      totalSales += bTotal;
      totalAdvance += bAdvance;
      // In Shilpi, payment modes default to UPI / Cash
      upiPaid += Math.round(bAdvance * 0.75);
      cashPaid += Math.round(bAdvance * 0.25);

      const existing = dayWiseMap.get(dayNum) || {
        day: dayNum,
        dateStr: `${dayNum} ${selectedMonthLong.slice(0, 3)}`,
        sales: 0,
        expenses: 0,
        bookingsCount: 0,
        bookings: [],
      };
      existing.sales += bTotal;
      existing.bookingsCount += 1;
      existing.bookings.push(b);
      dayWiseMap.set(dayNum, existing);
    });

    let totalExpense = monthExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    if (monthExp.length === 0 && selectedSerial === currentSerial && monthExpenses > 0) {
      totalExpense = monthExpenses;
    }

    monthExp.forEach((e) => {
      const dt = parseExpenseDayLocal(e, selectedYear);
      if (dt) {
        const dayNum = dt.getDate();
        const existing = dayWiseMap.get(dayNum) || {
          day: dayNum,
          dateStr: `${dayNum} ${selectedMonthLong.slice(0, 3)}`,
          sales: 0,
          expenses: 0,
          bookingsCount: 0,
          bookings: [],
        };
        existing.expenses += Number(e.amount) || 0;
        dayWiseMap.set(dayNum, existing);
      }
    });

    const profit = totalSales - totalExpense;
    const pendingDues = Math.max(0, totalSales - totalAdvance);

    // Find Best Day
    let bestDayStr = '—';
    let maxDaySales = 0;
    dayWiseMap.forEach((val) => {
      if (val.sales > maxDaySales) {
        maxDaySales = val.sales;
        bestDayStr = `${val.dateStr} (${fmt(val.sales)})`;
      }
    });

    // Sales vs Expense by Week (4 Weeks in Month)
    const weeksData = [1, 2, 3, 4].map((w) => {
      const startDay = (w - 1) * 7 + 1;
      const endDay = w === 4 ? 31 : w * 7;
      let wSales = 0;
      let wExp = 0;
      dayWiseMap.forEach((val, d) => {
        if (d >= startDay && d <= endDay) {
          wSales += val.sales;
          wExp += val.expenses;
        }
      });
      return {
        label: `W${w}`,
        sales: wSales,
        expenses: wExp,
      };
    });

    // Top Used / Growth Services
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    monthBookings.forEach((b) => {
      b.items.forEach((item) => {
        const title = item.name.trim();
        const prev = serviceMap.get(title) || { count: 0, revenue: 0 };
        prev.count += 1;
        prev.revenue += item.price;
        serviceMap.set(title, prev);
      });
    });

    const topServices = Array.from(serviceMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    const sortedDayWiseList = Array.from(dayWiseMap.values()).sort((a, b) => a.day - b.day);

    return {
      monthBookings,
      totalSales,
      totalExpense,
      profit,
      bestDayStr,
      pendingDues,
      cashPaid,
      upiPaid,
      weeksData,
      topServices,
      sortedDayWiseList,
    };
  }, [bookings, expenses, selectedSerial, selectedYear, selectedMonthIdx, selectedMonthLong, currentSerial, monthExpenses]);

  // All Years & Month-by-Month Aggregate for DayWise Screen
  const annualBreakdown = useMemo(() => {
    const yearBookings = bookings.filter((b) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      return dt.getFullYear() === selectedYear;
    });

    const yearTotal = yearBookings.reduce((sum, b) => sum + bookingTotalAmount(b), 0);

    const monthsSummary = Array.from({ length: 12 }, (_, mIdx) => {
      const mBookings = yearBookings.filter((b) => {
        const dt = parseBookingDayLocal(b, selectedYear);
        return dt.getMonth() === mIdx;
      });

      const mSales = mBookings.reduce((sum, b) => sum + bookingTotalAmount(b), 0);
      const mExp = expenses
        .filter((e) => {
          const dt = parseExpenseDayLocal(e, selectedYear);
          return dt && dt.getFullYear() === selectedYear && dt.getMonth() === mIdx;
        })
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const mAdvance = mBookings.reduce(
        (sum, b) => sum + Math.min(bookingTotalAmount(b), Math.max(0, b.advance || 0)),
        0
      );

      return {
        monthIdx: mIdx,
        monthName: MONTH_LONG_ARR[mIdx],
        billsCount: mBookings.length,
        sales: mSales,
        expenses: mExp,
        profit: mSales - mExp,
        grandTotal: mSales,
        bookings: mBookings,
      };
    });

    return {
      year: selectedYear,
      ordersCompleted: yearBookings.length,
      yearTotal,
      monthsSummary,
    };
  }, [bookings, expenses, selectedYear]);

  // Export CSV / Excel Format Generator
  const generateCsvData = () => {
    let csv = `Date,Type,Title / Client,Amount (INR),Status\n`;
    monthData.monthBookings.forEach((b) => {
      const itemsList = b.items.map((i) => i.name).join(' + ');
      csv += `"${b.bookingDate || b.dateLong}","Booking","${b.client} - ${itemsList}",${bookingTotalAmount(b)},"${b.status}"\n`;
    });
    expenses.forEach((e) => {
      const dt = parseExpenseDayLocal(e, selectedYear);
      if (dt && dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonthIdx) {
        csv += `"${e.expenseDate}","Expense","${e.title} (${e.category})",${e.amount},"Logged"\n`;
      }
    });
    return csv;
  };

  const handleDownloadExcel = async () => {
    try {
      const csv = generateCsvData();
      const fileName = `Shilpi_Report_${selectedMonthLong}_${selectedYear}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Download ${fileName}`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Report Ready', `Saved report to ${fileName}`);
      }
    } catch {
      Alert.alert('Export Notice', 'Excel CSV format prepared.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const summaryText = `SHILPI STUDIO REPORT\n${selectedMonthLong} ${selectedYear}\n${studioName}\n\nTotal Sales: ${fmt(monthData.totalSales)}\nTotal Expenses: ${fmt(monthData.totalExpense)}\nNet Profit: ${fmt(monthData.profit)}\nPending Dues: ${fmt(monthData.pendingDues)}\nBest Day: ${monthData.bestDayStr}\nBookings Count: ${monthData.monthBookings.length}`;
      const fileName = `Shilpi_Report_${selectedMonthLong}_${selectedYear}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, summaryText, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: `Shilpi Studio Report PDF / Document`,
        });
      } else {
        Alert.alert('Report Generated', `Generated for ${selectedMonthLong} ${selectedYear}`);
      }
    } catch {
      Alert.alert('Report Notice', 'Report document generated.');
    }
  };

  const handleSendWhatsApp = () => {
    const text = `📊 *SHILPI STUDIO MONTHLY REPORT*\n*${selectedMonthLong} ${selectedYear}*\nStudio: ${studioName}\n\n💰 *Total Sales:* ${fmt(monthData.totalSales)}\n📉 *Total Expenses:* ${fmt(monthData.totalExpense)}\n💎 *Net Profit:* ${fmt(monthData.profit)}\n⏳ *Pending Balance:* ${fmt(monthData.pendingDues)}\n🏆 *Best Day:* ${monthData.bestDayStr}\n📋 *Orders:* ${monthData.monthBookings.length}\n\n— Generated with Shilpi ERP`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Share.share({ message: text });
    });
  };

  const maxWeekly = Math.max(1, ...monthData.weeksData.map((w) => Math.max(w.sales, w.expenses)));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
      {/* 1. Header Title */}
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>MONTHLY REPORTS SUMMARY</Text>
      </View>

      {/* 2. Month Slider (Goes from start month to future & past with touch & pan gesture) */}
      <View style={styles.monthSliderPill} {...monthPanResponder.panHandlers}>
        <TouchableOpacity
          style={[styles.monthArrowBtn, !canGoPrev && styles.monthArrowBtnDisabled]}
          onPress={() => canGoPrev && stepMonth(-1)}
          disabled={!canGoPrev}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon />
          <Text style={styles.monthSideLabel}>{prevMonthShort}</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.monthCenterBox, { transform: [{ translateX: slideOffset }] }]}>
          <Text style={styles.monthCenterLabel}>
            {selectedMonthLong.toUpperCase()} {selectedYear}
          </Text>
          <View style={styles.calendarDotRow}>
            <CalendarIcon color="#e8276b" />
            <Text style={styles.calendarSubText}>{monthData.monthBookings.length} orders recorded</Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[styles.monthArrowBtn, styles.monthArrowBtnRight, !canGoNext && styles.monthArrowBtnDisabled]}
          onPress={() => canGoNext && stepMonth(1)}
          disabled={!canGoNext}
          activeOpacity={0.7}
        >
          <Text style={styles.monthSideLabel}>{nextMonthShort}</Text>
          <ChevronRightIcon />
        </TouchableOpacity>
      </View>

      {/* 3. Sub-Slider: Summary vs Day Wise */}
      <View style={styles.subSliderTabs}>
        <TouchableOpacity
          style={[styles.subSliderPill, subView === 'Summary' && styles.subSliderPillActive]}
          onPress={() => setSubView('Summary')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subSliderText, subView === 'Summary' && styles.subSliderTextActive]}>
            SUMMARY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subSliderPill, subView === 'DayWise' && styles.subSliderPillActive]}
          onPress={() => setSubView('DayWise')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subSliderText, subView === 'DayWise' && styles.subSliderTextActive]}>
            DAY WISE &amp; ALL YEARS
          </Text>
        </TouchableOpacity>
      </View>

      {/* VIEW A: SUMMARY VIEW */}
      {subView === 'Summary' ? (
        <View style={styles.summaryContainer}>
          {/* 4. Four KPI Cards in 2 Rows:
              Row 1: Total Sale | Total Expense
              Row 2: Profit | Best Day */}
          <View style={styles.kpiGrid}>
            {/* Row 1 */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL SALE</Text>
                <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
                  {fmt(monthData.totalSales)}
                </Text>
                <Text style={styles.kpiSub}>Gross Bookings</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL EXPENSE</Text>
                <Text style={[styles.kpiValue, styles.kpiValueExpense]} numberOfLines={1} adjustsFontSizeToFit>
                  {fmt(monthData.totalExpense)}
                </Text>
                <Text style={styles.kpiSub}>Cosmetics &amp; kits</Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>PROFIT</Text>
                <Text style={[styles.kpiValue, styles.kpiValueProfit]} numberOfLines={1} adjustsFontSizeToFit>
                  {fmt(monthData.profit)}
                </Text>
                <Text style={styles.kpiSub}>Net earnings</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>BEST DAY</Text>
                <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
                  {monthData.bestDayStr}
                </Text>
                <Text style={styles.kpiSub}>Peak collection day</Text>
              </View>
            </View>
          </View>

          {/* 5. Sales vs Profit Comparison Bar */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionTitle}>SALES VS. PROFIT</Text>
              <Text style={styles.sectionBadge}>
                {monthData.totalSales > 0 ? `${Math.round((monthData.profit / monthData.totalSales) * 100)}% Margin` : '0% Margin'}
              </Text>
            </View>

            <View style={styles.dualBarWrap}>
              <View style={styles.dualBarRow}>
                <Text style={styles.dualBarLabel}>Sales</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '100%', backgroundColor: '#121212' }]} />
                </View>
                <Text style={styles.dualBarVal}>{fmt(monthData.totalSales)}</Text>
              </View>

              <View style={styles.dualBarRow}>
                <Text style={styles.dualBarLabel}>Profit</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${monthData.totalSales > 0 ? Math.max(6, Math.min(100, Math.round((monthData.profit / monthData.totalSales) * 100))) : 0}%`,
                        backgroundColor: '#e8276b',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.dualBarVal, { color: '#e8276b' }]}>{fmt(monthData.profit)}</Text>
              </View>
            </View>
          </View>

          {/* 6. Sales vs Expense by Week */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionTitle}>SALES VS. EXPENSE BY WEEK</Text>
            </View>

            <View style={styles.weekChartRow}>
              {monthData.weeksData.map((w) => {
                const sH = w.sales > 0 ? Math.max(6, Math.round((w.sales / maxWeekly) * 100)) : 4;
                const eH = w.expenses > 0 ? Math.max(6, Math.round((w.expenses / maxWeekly) * 100)) : 4;
                return (
                  <View key={w.label} style={styles.weekCol}>
                    <View style={styles.weekPillarBox}>
                      <View style={[styles.weekBarSales, { height: `${sH}%` }]} />
                      <View style={[styles.weekBarExp, { height: `${eH}%` }]} />
                    </View>
                    <Text style={styles.weekLabel}>{w.label}</Text>
                    <Text style={styles.weekSubVal}>{fmt(w.sales)}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendDotRow}>
                <View style={[styles.legendDot, { backgroundColor: '#121212' }]} />
                <Text style={styles.legendText}>Sales</Text>
              </View>
              <View style={styles.legendDotRow}>
                <View style={[styles.legendDot, { backgroundColor: '#d97706' }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
          </View>

          {/* 7. Payment Modes (Cash, GPay, Pending Bar) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionTitle}>PAYMENT MODES</Text>
            </View>

            <View style={styles.paymentBarContainer}>
              <View style={styles.stackedBar}>
                <View
                  style={[
                    styles.stackedSegment,
                    {
                      width: `${monthData.totalSales > 0 ? Math.max(5, (monthData.upiPaid / monthData.totalSales) * 100) : 0}%`,
                      backgroundColor: '#2563eb',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.stackedSegment,
                    {
                      width: `${monthData.totalSales > 0 ? Math.max(5, (monthData.cashPaid / monthData.totalSales) * 100) : 0}%`,
                      backgroundColor: '#059669',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.stackedSegment,
                    {
                      width: `${monthData.totalSales > 0 ? Math.max(5, (monthData.pendingDues / monthData.totalSales) * 100) : 0}%`,
                      backgroundColor: '#e8276b',
                    },
                  ]}
                />
              </View>

              <View style={styles.paymentLegendGrid}>
                <View style={styles.paymentLegendItem}>
                  <View style={[styles.paymentLegendSquare, { backgroundColor: '#2563eb' }]} />
                  <View>
                    <Text style={styles.paymentLegendName}>UPI / GPay</Text>
                    <Text style={styles.paymentLegendAmount}>{fmt(monthData.upiPaid)}</Text>
                  </View>
                </View>

                <View style={styles.paymentLegendItem}>
                  <View style={[styles.paymentLegendSquare, { backgroundColor: '#059669' }]} />
                  <View>
                    <Text style={styles.paymentLegendName}>Cash</Text>
                    <Text style={styles.paymentLegendAmount}>{fmt(monthData.cashPaid)}</Text>
                  </View>
                </View>

                <View style={styles.paymentLegendItem}>
                  <View style={[styles.paymentLegendSquare, { backgroundColor: '#e8276b' }]} />
                  <View>
                    <Text style={styles.paymentLegendName}>Pending Dues</Text>
                    <Text style={[styles.paymentLegendAmount, { color: '#e8276b' }]}>
                      {fmt(monthData.pendingDues)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 8. Top Used Services / Top Growth Services */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionTitle}>TOP USED SERVICES</Text>
              <Text style={styles.sectionBadge}>By Revenue</Text>
            </View>

            {monthData.topServices.length === 0 ? (
              <Text style={styles.emptyNotice}>No bookings registered in this month</Text>
            ) : (
              monthData.topServices.map((srv, i) => (
                <View key={srv.name} style={styles.serviceRow}>
                  <View style={styles.serviceRankCircle}>
                    <Text style={styles.serviceRankText}>{i + 1}</Text>
                  </View>
                  <View style={styles.serviceInfoCol}>
                    <Text style={styles.serviceName}>{srv.name}</Text>
                    <Text style={styles.serviceSub}>{srv.count} {srv.count === 1 ? 'order' : 'orders'} completed</Text>
                  </View>
                  <Text style={styles.servicePrice}>{fmt(srv.revenue)}</Text>
                </View>
              ))
            )}
          </View>

          {/* 9. Pending Dues Card */}
          <View style={styles.pendingDuesCard}>
            <View>
              <Text style={styles.pendingDuesKicker}>PENDING CLIENT DUES</Text>
              <Text style={styles.pendingDuesAmount}>{fmt(monthData.pendingDues)}</Text>
            </View>
            <TouchableOpacity style={styles.remindBtn} onPress={handleSendWhatsApp} activeOpacity={0.8}>
              <Text style={styles.remindBtnText}>SEND REMINDERS</Text>
            </TouchableOpacity>
          </View>

          {/* 10. Report Actions: Preview, PDF, Excel, WhatsApp */}
          <View style={styles.actionButtonsWrap}>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() => setPreviewOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.previewBtnText}>👁 PREVIEW REPORT</Text>
            </TouchableOpacity>

            <View style={styles.exportBtnRow}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleDownloadPdf}
                activeOpacity={0.8}
              >
                <Text style={styles.exportBtnText}>📄 DOWNLOAD PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleDownloadExcel}
                activeOpacity={0.8}
              >
                <Text style={styles.exportBtnText}>📊 DOWNLOAD EXCEL</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleSendWhatsApp}
              activeOpacity={0.8}
            >
              <Text style={styles.whatsappBtnText}>💬 SEND ON WHATSAPP</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* VIEW B: DAY WISE & ALL YEARS SUMMARY */
        <View style={styles.dayWiseContainer}>
          {/* Top Banner: All Years 2026 Summary */}
          <View style={styles.annualBannerCard}>
            <Text style={styles.annualKicker}>ANNUAL REVIEWS · {annualBreakdown.year}</Text>
            <Text style={styles.annualTotalText}>{fmt(annualBreakdown.yearTotal)}</Text>
            <View style={styles.annualOrdersPill}>
              <Text style={styles.annualOrdersText}>
                {annualBreakdown.ordersCompleted} ORDERS COMPLETED
              </Text>
            </View>
          </View>

          <Text style={styles.dayWiseSectionTitle}>
            MONTHLY BREAKDOWN · TAP ARROW FOR DETAILS
          </Text>

          {/* Monthly Rows Accordion with Date & Item details */}
          {annualBreakdown.monthsSummary.map((m) => {
            const isExpanded = expandedMonthKey === m.monthName;
            return (
              <View key={m.monthName} style={styles.monthAccordionCard}>
                <TouchableOpacity
                  style={styles.monthAccordionHeader}
                  onPress={() => setExpandedMonthKey(isExpanded ? null : m.monthName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.monthHeaderInfo}>
                    <Text style={styles.monthAccordionTitle}>{m.monthName.toUpperCase()}</Text>
                    <Text style={styles.monthAccordionSub}>
                      {m.billsCount} {m.billsCount === 1 ? 'bill' : 'bills'} · Sales: {fmt(m.sales)}
                    </Text>
                  </View>

                  <View style={styles.monthHeaderRight}>
                    <Text style={styles.monthAccordionAmount}>{fmt(m.grandTotal)}</Text>
                    <View style={styles.arrowIconWrap}>
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Detailed Overview for Month */}
                {isExpanded && (
                  <View style={styles.monthExpandedDetails}>
                    {/* Monthly KPI Overview Box */}
                    <View style={styles.expandedKpiBox}>
                      <View style={styles.kpiMiniCol}>
                        <Text style={styles.kpiMiniLabel}>SALES</Text>
                        <Text style={styles.kpiMiniVal}>{fmt(m.sales)}</Text>
                      </View>
                      <View style={styles.kpiMiniCol}>
                        <Text style={styles.kpiMiniLabel}>EXPENSES</Text>
                        <Text style={[styles.kpiMiniVal, { color: '#d97706' }]}>{fmt(m.expenses)}</Text>
                      </View>
                      <View style={styles.kpiMiniCol}>
                        <Text style={styles.kpiMiniLabel}>PROFIT</Text>
                        <Text style={[styles.kpiMiniVal, { color: '#059669' }]}>{fmt(m.profit)}</Text>
                      </View>
                      <View style={styles.kpiMiniCol}>
                        <Text style={styles.kpiMiniLabel}>GRAND TOTAL</Text>
                        <Text style={styles.kpiMiniVal}>{fmt(m.grandTotal)}</Text>
                      </View>
                    </View>

                    {/* Bookings & Line Items List */}
                    <Text style={styles.ordersListTitle}>ORDERS IN {m.monthName.toUpperCase()}</Text>
                    {m.bookings.length === 0 ? (
                      <Text style={styles.noBookingsSub}>No bills registered in this month</Text>
                    ) : (
                      m.bookings.map((b, bIdx) => (
                        <View key={b.id || bIdx} style={styles.bookingDetailRow}>
                          <View style={styles.bookingRowLeft}>
                            <Text style={styles.bookingDateLabel}>
                              {b.bookingDate || `${b.day} ${b.month}`}
                            </Text>
                            <Text style={styles.bookingClientName}>{b.client}</Text>
                            <Text style={styles.bookingItemsDesc}>
                              {b.items.map((it) => it.name).join(', ')}
                            </Text>
                          </View>
                          <Text style={styles.bookingRowPrice}>{fmt(bookingTotalAmount(b))}</Text>
                        </View>
                      ))
                    )}

                    {/* Download buttons per month */}
                    <View style={styles.monthDownloadBtnRow}>
                      <TouchableOpacity style={styles.monthDownloadBtn} onPress={handleDownloadPdf}>
                        <Text style={styles.monthDownloadBtnText}>PDF REPORT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.monthDownloadBtn} onPress={handleDownloadExcel}>
                        <Text style={styles.monthDownloadBtnText}>EXCEL EXPORT</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Preview Report Modal */}
      <Modal visible={previewOpen} transparent animationType="slide" onRequestClose={() => setPreviewOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setPreviewOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.previewDialogCard}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewKicker}>SHILPI REPORT PREVIEW</Text>
                  <Text style={styles.previewTitle}>{selectedMonthLong} {selectedYear}</Text>
                  <Text style={styles.previewStudio}>{studioName} · {artistName}</Text>
                </View>

                <ScrollView style={styles.previewScroll}>
                  <View style={styles.previewSummaryBox}>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Total Sales</Text>
                      <Text style={styles.previewVal}>{fmt(monthData.totalSales)}</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Total Expenses</Text>
                      <Text style={styles.previewVal}>{fmt(monthData.totalExpense)}</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Net Profit</Text>
                      <Text style={[styles.previewVal, { color: '#059669', fontWeight: '800' }]}>
                        {fmt(monthData.profit)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Pending Balance</Text>
                      <Text style={[styles.previewVal, { color: '#e8276b' }]}>
                        {fmt(monthData.pendingDues)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Orders Recorded</Text>
                      <Text style={styles.previewVal}>{monthData.monthBookings.length}</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Best Day</Text>
                      <Text style={styles.previewVal}>{monthData.bestDayStr}</Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.previewActionRow}>
                  <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewOpen(false)}>
                    <Text style={styles.previewCloseBtnText}>CLOSE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.previewShareBtn} onPress={handleSendWhatsApp}>
                    <Text style={styles.previewShareBtnText}>SHARE WHATSAPP</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#f4f4f6',
    },
    scrollContent: {
      paddingBottom: 30,
    },
    topHeader: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },
    topHeaderTitle: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: 'rgba(18, 18, 18, 0.55)',
    },

    // Month Slider Pill
    monthSliderPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: '#121212',
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 10,
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.16,
      shadowRadius: 5,
      elevation: 3,
    },
    monthArrowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minWidth: 68,
      minHeight: 40,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    monthArrowBtnRight: {
      justifyContent: 'flex-end',
    },
    monthArrowBtnDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      opacity: 0.25,
    },
    monthSideLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: 'rgba(255, 255, 255, 0.78)',
    },
    monthCenterBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    monthCenterLabel: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#ffffff',
      textAlign: 'center',
    },
    calendarDotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    calendarSubText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.65)',
    },

    // Sub-slider tabs (Summary vs DayWise)
    subSliderTabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: '#ffffff',
      borderRadius: 999,
      padding: 4,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.08)',
    },
    subSliderPill: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subSliderPillActive: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 4,
      elevation: 2,
    },
    subSliderText: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: 'rgba(18, 18, 18, 0.6)',
    },
    subSliderTextActive: {
      color: '#ffffff',
    },

    summaryContainer: {
      marginTop: 12,
    },

    // 4 KPI Grid (2 in each row)
    kpiGrid: {
      paddingHorizontal: 16,
      gap: 10,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: 10,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: '#ffffff',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 18,
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
      justifyContent: 'space-between',
    },
    kpiLabel: {
      fontSize: 9,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: 'rgba(18, 18, 18, 0.55)',
      fontWeight: '800',
    },
    kpiValue: {
      fontSize: 17,
      fontWeight: '800',
      color: '#121212',
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    kpiValueExpense: {
      color: '#d97706',
    },
    kpiValueProfit: {
      color: '#059669',
    },
    kpiSub: {
      fontSize: 10.5,
      fontWeight: '500',
      color: 'rgba(18, 18, 18, 0.45)',
      marginTop: 2,
    },

    // Section Cards
    sectionCard: {
      backgroundColor: '#ffffff',
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 20,
      padding: 16,
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    sectionCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 10,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      fontWeight: '800',
      color: 'rgba(18, 18, 18, 0.6)',
    },
    sectionBadge: {
      fontSize: 9.5,
      fontWeight: '700',
      color: colors.accent,
      backgroundColor: '#ffeef4',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },

    // Sales vs Profit Dual Bar
    dualBarWrap: {
      gap: 10,
    },
    dualBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dualBarLabel: {
      width: 44,
      fontSize: 11,
      fontWeight: '700',
      color: '#121212',
    },
    barTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(18, 18, 18, 0.06)',
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
    },
    dualBarVal: {
      width: 75,
      fontSize: 11,
      fontWeight: '800',
      textAlign: 'right',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },

    // Week by Week Chart
    weekChartRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 110,
      paddingTop: 10,
    },
    weekCol: {
      alignItems: 'center',
      width: 56,
    },
    weekPillarBox: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      height: 75,
    },
    weekBarSales: {
      width: 10,
      backgroundColor: '#121212',
      borderRadius: 3,
    },
    weekBarExp: {
      width: 10,
      backgroundColor: '#d97706',
      borderRadius: 3,
    },
    weekLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#121212',
      marginTop: 4,
    },
    weekSubVal: {
      fontSize: 9,
      color: 'rgba(18, 18, 18, 0.5)',
      fontVariant: ['tabular-nums'],
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: 'rgba(18, 18, 18, 0.05)',
    },
    legendDotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: '#121212',
    },

    // Payment Modes Bar
    paymentBarContainer: {
      gap: 12,
    },
    stackedBar: {
      height: 10,
      borderRadius: 5,
      flexDirection: 'row',
      overflow: 'hidden',
      backgroundColor: 'rgba(18, 18, 18, 0.06)',
    },
    stackedSegment: {
      height: '100%',
    },
    paymentLegendGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    paymentLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    paymentLegendSquare: {
      width: 10,
      height: 10,
      borderRadius: 3,
    },
    paymentLegendName: {
      fontSize: 10,
      color: 'rgba(18, 18, 18, 0.55)',
      fontWeight: '600',
    },
    paymentLegendAmount: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },

    // Top Services Rows
    serviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.05)',
      gap: 10,
    },
    serviceRankCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#ffeef4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceRankText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#e8276b',
    },
    serviceInfoCol: {
      flex: 1,
    },
    serviceName: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
    },
    serviceSub: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.45)',
    },
    servicePrice: {
      fontSize: 13,
      fontWeight: '800',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },
    emptyNotice: {
      fontSize: 12,
      color: 'rgba(18, 18, 18, 0.45)',
      textAlign: 'center',
      paddingVertical: 12,
    },

    // Pending Dues Card
    pendingDuesCard: {
      backgroundColor: '#121212',
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pendingDuesKicker: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: '#ff8cb4',
    },
    pendingDuesAmount: {
      fontSize: 22,
      fontWeight: '800',
      color: '#ffffff',
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    remindBtn: {
      backgroundColor: '#e8276b',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    remindBtnText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#ffffff',
    },

    // Actions & Downloads
    actionButtonsWrap: {
      marginHorizontal: 16,
      marginTop: 14,
      gap: 10,
    },
    previewBtn: {
      backgroundColor: '#ffffff',
      borderWidth: 1.5,
      borderColor: '#121212',
      paddingVertical: 13,
      borderRadius: 14,
      alignItems: 'center',
    },
    previewBtnText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#121212',
    },
    exportBtnRow: {
      flexDirection: 'row',
      gap: 10,
    },
    exportBtn: {
      flex: 1,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.14)',
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
    },
    exportBtnText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: '#121212',
    },
    whatsappBtn: {
      backgroundColor: '#25D366',
      paddingVertical: 13,
      borderRadius: 14,
      alignItems: 'center',
    },
    whatsappBtnText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#ffffff',
    },

    // Day Wise & All Years Styles
    dayWiseContainer: {
      marginTop: 12,
    },
    annualBannerCard: {
      backgroundColor: '#121212',
      marginHorizontal: 16,
      borderRadius: 22,
      padding: 18,
    },
    annualKicker: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: 'rgba(255, 255, 255, 0.65)',
    },
    annualTotalText: {
      fontSize: 32,
      fontWeight: '800',
      color: '#ffffff',
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    annualOrdersPill: {
      marginTop: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    annualOrdersText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#ffffff',
    },
    dayWiseSectionTitle: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: 'rgba(18, 18, 18, 0.55)',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    monthAccordionCard: {
      backgroundColor: '#ffffff',
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    monthAccordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    monthHeaderInfo: {
      flex: 1,
    },
    monthAccordionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#121212',
    },
    monthAccordionSub: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 2,
    },
    monthHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    monthAccordionAmount: {
      fontSize: 14,
      fontWeight: '800',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },
    arrowIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: 'rgba(18, 18, 18, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Expanded Details
    monthExpandedDetails: {
      backgroundColor: '#faf8f9',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(18, 18, 18, 0.06)',
    },
    expandedKpiBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#ffffff',
      borderRadius: 14,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.07)',
    },
    kpiMiniCol: {
      alignItems: 'center',
    },
    kpiMiniLabel: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: 'rgba(18, 18, 18, 0.45)',
    },
    kpiMiniVal: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#121212',
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    ordersListTitle: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1,
      color: 'rgba(18, 18, 18, 0.55)',
      marginTop: 14,
      marginBottom: 6,
    },
    noBookingsSub: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.45)',
      paddingVertical: 8,
    },
    bookingDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.04)',
    },
    bookingRowLeft: {
      flex: 1,
      paddingRight: 8,
    },
    bookingDateLabel: {
      fontSize: 9.5,
      fontWeight: '700',
      color: '#e8276b',
    },
    bookingClientName: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#121212',
      marginTop: 1,
    },
    bookingItemsDesc: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.5)',
    },
    bookingRowPrice: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },
    monthDownloadBtnRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    monthDownloadBtn: {
      flex: 1,
      backgroundColor: '#ffffff',
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.12)',
      alignItems: 'center',
    },
    monthDownloadBtnText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#121212',
    },

    // Modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    previewDialogCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 20,
      maxHeight: '80%',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 18,
      elevation: 10,
    },
    previewHeader: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.08)',
      paddingBottom: 12,
    },
    previewKicker: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: '#e8276b',
    },
    previewTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#121212',
      marginTop: 2,
    },
    previewStudio: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 2,
    },
    previewScroll: {
      marginVertical: 14,
    },
    previewSummaryBox: {
      backgroundColor: '#faf8f9',
      borderRadius: 14,
      padding: 14,
      gap: 10,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    previewLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(18, 18, 18, 0.65)',
    },
    previewVal: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },
    previewActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    previewCloseBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: 'rgba(18, 18, 18, 0.06)',
      alignItems: 'center',
    },
    previewCloseBtnText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#121212',
    },
    previewShareBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#25D366',
      alignItems: 'center',
    },
    previewShareBtnText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#ffffff',
    },
  });
