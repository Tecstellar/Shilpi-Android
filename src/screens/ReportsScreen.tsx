import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { Booking, ExpenseRecord, fmt } from '../data/prototypeData';
import {
  openWhatsAppDirect,
  getPaymentReminderMessage,
} from '../utils/whatsappHelper';

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

function formatBookingDisplayDate(b: Booking, fallbackYear?: number): string {
  if (b.day && b.month) {
    const yr = b.year || fallbackYear || '';
    return `${b.day} ${b.month}${yr ? ` ${yr}` : ''}`.trim();
  }
  const raw = String(b.bookingDate || '');
  if (raw) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (m) {
      const yr = Number(m[1]);
      const mIdx = Number(m[2]) - 1;
      const day = Number(m[3]);
      return `${day} ${MONTH_SHORT_ARR[mIdx] || ''} ${yr}`;
    }
    return raw.split('T')[0];
  }
  if (b.dateLong) {
    return b.dateLong.split('T')[0];
  }
  return '—';
}

// Premium Vector Icons
const CalendarIcon = ({ color = '#ffffff', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const ChevronLeftIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronUpIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EyeIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const PdfDocumentIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
    <Line x1="10" y1="9" x2="8" y2="9" />
  </Svg>
);

const ExcelTableIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <Line x1="3" y1="9" x2="21" y2="9" />
    <Line x1="3" y1="15" x2="21" y2="15" />
    <Line x1="9" y1="3" x2="9" y2="21" />
    <Line x1="15" y1="3" x2="15" y2="21" />
  </Svg>
);

const WhatsAppIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </Svg>
);

const CloseIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
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
    return new Date(currentYear, currentMonthIdx, 1);
  }, [registeredAt, currentYear, currentMonthIdx]);

  const minSerial = toMonthSerial(regDate.getFullYear(), regDate.getMonth());
  const maxSerial = currentSerial + 12;

  // TOP-LEVEL SLIDER: 'Monthly' vs 'Summary'
  const [topTab, setTopTab] = useState<'Monthly' | 'Summary'>('Monthly');

  // Month Slider State for Monthly View
  const [selectedSerial, setSelectedSerial] = useState<number>(() => Math.max(minSerial, currentSerial));

  useEffect(() => {
    setSelectedSerial((prev) => Math.max(minSerial, prev));
  }, [minSerial]);

  // SUB-TAB inside Monthly View: 'Overview' vs 'DayWise'
  const [monthlySubTab, setMonthlySubTab] = useState<'Overview' | 'DayWise'>('Overview');

  // Summary Slider State: Year expansion and active month expansion (defaultly collapsed / hidden)
  const [summaryYearExpanded, setSummaryYearExpanded] = useState<boolean>(false);
  const [expandedSummaryMonth, setExpandedSummaryMonth] = useState<number | null>(null);

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // Debounce/Lock states for exports to prevent concurrent sharing rejection
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Animated Month Slider
  const slideOffset = useRef(new Animated.Value(0)).current;

  const stepMonth = (delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
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

  // Data for the active selected month in "Monthly Reports"
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

    // Best Day
    let bestDayStr = '—';
    let maxDaySales = 0;
    dayWiseMap.forEach((val) => {
      if (val.sales > maxDaySales) {
        maxDaySales = val.sales;
        bestDayStr = `${val.dateStr} (${fmt(val.sales)})`;
      }
    });

    // 4 Weeks in Month
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

  // Chronologically sorted bookings for the Day Wise Table
  const tableBookings = useMemo(() => {
    return [...monthData.monthBookings].sort((a, b) => {
      const dtA = parseBookingDayLocal(a, selectedYear).getTime();
      const dtB = parseBookingDayLocal(b, selectedYear).getTime();
      return dtA - dtB;
    });
  }, [monthData.monthBookings, selectedYear]);

  // Annual Summary for the "Summary" slider (All Years / 2026 -> Months -> Date/Item Details)
  const annualSummary = useMemo(() => {
    const regYear = regDate.getFullYear();
    const regMonthIdx = regDate.getMonth();

    const yearBookings = bookings.filter((b) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      if (dt.getFullYear() !== selectedYear) return false;
      // Do not include dates before registration
      if (selectedYear === regYear && dt.getMonth() < regMonthIdx) return false;
      if (selectedYear < regYear) return false;
      return true;
    });

    const yearTotalSales = yearBookings.reduce((sum, b) => sum + bookingTotalAmount(b), 0);
    const yearExpenses = expenses
      .filter((e) => {
        const dt = parseExpenseDayLocal(e, selectedYear);
        if (!dt || dt.getFullYear() !== selectedYear) return false;
        if (selectedYear === regYear && dt.getMonth() < regMonthIdx) return false;
        if (selectedYear < regYear) return false;
        return true;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const yearProfit = yearTotalSales - yearExpenses;

    // Determine the start month for the year
    // If selectedYear is the registration year, start STRICTLY from regMonthIdx (e.g. November)
    // If selectedYear is before registration year, no months should exist
    // If selectedYear is after registration year, start from January (0)
    const startMonthIdx = selectedYear === regYear ? regMonthIdx : selectedYear > regYear ? 0 : 12;

    const months: Array<{
      monthIdx: number;
      monthName: string;
      monthShort: string;
      billsCount: number;
      sales: number;
      expenses: number;
      profit: number;
      grandTotal: number;
      bookings: Booking[];
    }> = [];

    for (let mIdx = startMonthIdx; mIdx < 12; mIdx++) {
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

      const mProfit = mSales - mExp;

      months.push({
        monthIdx: mIdx,
        monthName: MONTH_LONG_ARR[mIdx],
        monthShort: MONTH_SHORT_ARR[mIdx],
        billsCount: mBookings.length,
        sales: mSales,
        expenses: mExp,
        profit: mProfit,
        grandTotal: mSales,
        bookings: mBookings,
      });
    }

    return {
      year: selectedYear,
      ordersCompleted: yearBookings.length,
      yearTotalSales,
      yearExpenses,
      yearProfit,
      months,
    };
  }, [bookings, expenses, selectedYear, regDate]);

  // Export Report Helpers (Native PDF & Native Excel .xls)
  const generateReportHtml = (
    mName: string,
    targetYear: number,
    sales: number,
    exp: number,
    profit: number,
    dues: number,
    bList: Booking[],
    studio: string
  ) => {
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const ordersRows = bList.length > 0 ? bList.map((b, idx) => {
      const itemsList = b.items.map((i) => i.name).join(', ') || 'Photography / Video Service';
      const total = bookingTotalAmount(b);
      const paid = (b as any).paidAmount !== undefined ? (b as any).paidAmount : (b.advance || 0);
      const due = Math.max(0, total - paid);
      return `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; font-size: 13px; color: #64748B; font-weight: 600;">#${idx + 1}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #1E293B; font-weight: 600;">${formatBookingDisplayDate(b, targetYear)}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #0F172A; font-weight: 700;">${b.client}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #334155;">${itemsList}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 700; color: #0F172A;">₹${total.toLocaleString('en-IN')}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 600; color: ${due > 0 ? '#DC2626' : '#16A34A'};">
            ${due > 0 ? `₹${due.toLocaleString('en-IN')}` : '₹0'}
          </td>
          <td style="padding: 10px 12px; font-size: 12px; text-align: center;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; background: #F1F5F9; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 11px;">${b.status}</span>
          </td>
        </tr>
      `;
    }).join('') : `
      <tr>
        <td colspan="7" style="padding: 24px; text-align: center; color: #94A3B8; font-size: 14px;">No transactions recorded for this period.</td>
      </tr>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Shilpi Studio Report - ${mName} ${targetYear}</title>
          <style>
            @page {
              margin: 15mm;
              size: A4 portrait;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0F172A;
              background: #FFFFFF;
              margin: 0;
              padding: 0;
              line-height: 1.5;
            }
            .header-box {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0F172A;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand-name {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: -0.5px;
              color: #0F172A;
              margin: 0;
              text-transform: uppercase;
            }
            .brand-subtitle {
              font-size: 12px;
              color: #64748B;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin-top: 4px;
            }
            .period-title {
              font-size: 20px;
              font-weight: 800;
              color: #FF2E93;
              text-align: right;
              margin: 0;
            }
            .generated-date {
              font-size: 11px;
              color: #64748B;
              text-align: right;
              margin-top: 4px;
            }
            .kpi-container {
              display: flex;
              gap: 12px;
              margin-bottom: 28px;
            }
            .kpi-card {
              flex: 1;
              padding: 14px;
              border-radius: 10px;
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
            }
            .kpi-label {
              font-size: 10px;
              font-weight: 700;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .kpi-value {
              font-size: 18px;
              font-weight: 900;
              color: #0F172A;
            }
            .table-heading {
              font-size: 14px;
              font-weight: 800;
              color: #0F172A;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            thead th {
              background-color: #0F172A;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 12px;
              text-align: left;
            }
            .footer-box {
              margin-top: 24px;
              border-top: 1px solid #E2E8F0;
              padding-top: 12px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #94A3B8;
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <h1 class="brand-name">${studio || 'SHILPI STUDIO'}</h1>
              <div class="brand-subtitle">MONTHLY BUSINESS PERFORMANCE REPORT</div>
            </div>
            <div>
              <div class="period-title">${mName} ${targetYear}</div>
              <div class="generated-date">Exported on ${dateStr}</div>
            </div>
          </div>

          <div class="kpi-container">
            <div class="kpi-card">
              <div class="kpi-label">Total Sales</div>
              <div class="kpi-value">₹${sales.toLocaleString('en-IN')}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Expenses</div>
              <div class="kpi-value">₹${exp.toLocaleString('en-IN')}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Net Profit</div>
              <div class="kpi-value" style="color: ${profit >= 0 ? '#16A34A' : '#DC2626'};">₹${profit.toLocaleString('en-IN')}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Pending Dues</div>
              <div class="kpi-value" style="color: ${dues > 0 ? '#D97706' : '#16A34A'};">₹${dues.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div class="table-heading">Bookings & Orders List (${bList.length})</div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px;">#</th>
                <th>Date</th>
                <th>Client</th>
                <th>Services / Items</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: right;">Pending Due</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${ordersRows}
            </tbody>
          </table>

          <div class="footer-box">
            <div>Generated by Shilpi Studio Management ERP</div>
            <div>Official Business Document</div>
          </div>
        </body>
      </html>
    `;
  };

  const generateMonthExcel = (
    mName: string,
    targetYear: number,
    sales: number,
    exp: number,
    profit: number,
    dues: number,
    bList: Booking[],
    studio: string
  ) => {
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const esc = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines: string[] = [];

    // Header & Studio Metadata
    lines.push(`${esc(studio || 'SHILPI STUDIO')}`);
    lines.push(`${esc(`Monthly Business Performance Report — ${mName} ${targetYear}`)}`);
    lines.push(`${esc(`Report Generated: ${dateStr}`)}`);
    lines.push('');

    // Financial KPI Summary Block
    lines.push(`${esc('FINANCIAL KPI OVERVIEW')},${esc('AMOUNT (INR)')},${esc('REMARKS')}`);
    lines.push(`${esc('Total Gross Sales')},${sales},${esc('Gross revenue from client bookings')}`);
    lines.push(`${esc('Total Studio Expenses')},${exp},${esc('Studio operational and staff expenses')}`);
    lines.push(`${esc('Net Profit')},${profit},${esc(profit >= 0 ? 'Operating Profit' : 'Operating Deficit')}`);
    lines.push(`${esc('Pending Client Dues')},${dues},${esc('Uncollected customer balance dues')}`);
    lines.push('');

    // Booking Details Section
    lines.push(`${esc('BOOKING TRANSACTIONS BREAKDOWN')}`);
    lines.push(
      [
        esc('#'),
        esc('Date'),
        esc('Client Name'),
        esc('Contact Number'),
        esc('Services / Items'),
        esc('Payment Mode'),
        esc('Total Amount (INR)'),
        esc('Paid Amount (INR)'),
        esc('Balance Due (INR)'),
        esc('Status'),
      ].join(',')
    );

    if (bList.length === 0) {
      lines.push(`${esc('No bookings recorded for this month.')},,,,,,,,,`);
    } else {
      bList.forEach((b, idx) => {
        const itemsList = b.items.map((i) => i.name).join(' + ') || 'Service';
        const total = bookingTotalAmount(b);
        const paid = (b as any).paidAmount !== undefined ? (b as any).paidAmount : (b.advance || 0);
        const due = Math.max(0, total - paid);
        const phone = (b as any).phone || (b as any).clientPhone || '';
        const payMethod = (b as any).paymentMethod || (b as any).mode || (paid >= total ? 'Full' : 'Partial');

        lines.push(
          [
            esc(idx + 1),
            esc(formatBookingDisplayDate(b, targetYear)),
            esc(b.client),
            esc(phone),
            esc(itemsList),
            esc(payMethod),
            total,
            paid,
            due,
            esc(b.status),
          ].join(',')
        );
      });

      const totOrdersAmount = bList.reduce((acc, b) => acc + bookingTotalAmount(b), 0);
      const totPaidAmount = bList.reduce(
        (acc, b) => acc + ((b as any).paidAmount !== undefined ? (b as any).paidAmount : (b.advance || 0)),
        0
      );
      const totDueAmount = Math.max(0, totOrdersAmount - totPaidAmount);
      lines.push('');
      lines.push(
        [
          esc('TOTAL'),
          esc(''),
          esc(`${bList.length} Bookings`),
          esc(''),
          esc(''),
          esc(''),
          totOrdersAmount,
          totPaidAmount,
          totDueAmount,
          esc(''),
        ].join(',')
      );
    }

    // Prepend UTF-8 Byte Order Mark so Excel Mobile / Desktop, Google Sheets & Numbers parse as UTF-8
    return '\uFEFF' + lines.join('\r\n');
  };

  const handleDownloadExcel = async (customMonthName?: string, customBookings?: Booking[]) => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const mName = customMonthName || selectedMonthLong;
      const bList =
        customBookings ||
        (customMonthName
          ? annualSummary.months.find((x: any) => x.monthName === customMonthName)?.bookings || []
          : monthData.monthBookings);

      let sales = monthData.totalSales;
      let exp = monthData.totalExpense;
      let profit = monthData.profit;
      let dues = monthData.pendingDues;
      if (customMonthName) {
        const foundM = annualSummary.months.find((x: any) => x.monthName === customMonthName);
        if (foundM) {
          sales = foundM.sales;
          exp = foundM.expenses;
          profit = foundM.profit;
          dues = bList.reduce((acc: number, b: Booking) => {
            const tot = bookingTotalAmount(b);
            const pd = (b as any).paidAmount !== undefined ? (b as any).paidAmount : (b.advance || 0);
            return acc + Math.max(0, tot - pd);
          }, 0);
        }
      }

      const csvContent = generateMonthExcel(mName, selectedYear, sales, exp, profit, dues, bList, studioName || '');
      const fileName = `Shilpi_Report_${mName}_${selectedYear}.csv`;
      const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

      try {
        const info = await FileSystem.getInfoAsync(targetUri);
        if (info.exists) {
          await FileSystem.deleteAsync(targetUri, { idempotent: true });
        }
      } catch (checkErr) {
        console.warn('File existence check warning:', checkErr);
      }

      await FileSystem.writeAsStringAsync(targetUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      let shareableUri = targetUri;
      if (Platform.OS === 'android') {
        try {
          shareableUri = await FileSystem.getContentUriAsync(targetUri);
        } catch (contentErr) {
          console.warn('Could not resolve content URI for CSV:', contentErr);
          shareableUri = targetUri;
        }
      }

      if (await Sharing.isAvailableAsync()) {
        try {
          await Sharing.shareAsync(shareableUri, {
            mimeType: 'text/csv',
            dialogTitle: `Download ${fileName}`,
            UTI: 'public.comma-separated-values-text',
          });
        } catch (shareErr) {
          console.warn('Excel share error or dismiss:', shareErr);
          Alert.alert('Report Ready', `Spreadsheet created as ${fileName}`);
        }
      } else {
        Alert.alert('Report Ready', `Saved spreadsheet to ${fileName}`);
      }
    } catch (error) {
      console.error('Error generating Excel export:', error);
      Alert.alert('Export Notice', 'Could not generate Excel spreadsheet. Please try again.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadPdf = async (
    customMonthName?: string,
    customSales?: number,
    customExp?: number,
    customProfit?: number,
    customBookings?: Booking[]
  ) => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const mName = customMonthName || selectedMonthLong;
      const bList =
        customBookings ||
        (customMonthName
          ? annualSummary.months.find((x: any) => x.monthName === customMonthName)?.bookings || []
          : monthData.monthBookings);
      const sales = customSales !== undefined ? customSales : monthData.totalSales;
      const exp = customExp !== undefined ? customExp : monthData.totalExpense;
      const profit = customProfit !== undefined ? customProfit : monthData.profit;
      const dues = bList.reduce((acc: number, b: Booking) => {
        const tot = bookingTotalAmount(b);
        const pd = (b as any).paidAmount !== undefined ? (b as any).paidAmount : (b.advance || 0);
        return acc + Math.max(0, tot - pd);
      }, 0);

      const html = generateReportHtml(mName, selectedYear, sales, exp, profit, dues, bList, studioName || '');

      // 1. Generate PDF file via expo-print
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // 2. Put file in cacheDirectory with official report filename
      const fileName = `Shilpi_Report_${mName}_${selectedYear}.pdf`;
      const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

      let localUri = uri;
      try {
        const info = await FileSystem.getInfoAsync(targetUri);
        if (info.exists) {
          await FileSystem.deleteAsync(targetUri, { idempotent: true });
        }
        await FileSystem.copyAsync({ from: uri, to: targetUri });
        localUri = targetUri;
      } catch (copyErr) {
        console.warn('Could not copy PDF to cache target, using print cache URI:', copyErr);
        localUri = uri;
      }

      // 3. Resolve Android content URI for FileProvider compatibility
      let shareableUri = localUri;
      if (Platform.OS === 'android') {
        try {
          shareableUri = await FileSystem.getContentUriAsync(localUri);
        } catch (contentErr) {
          console.warn('Could not resolve content URI for PDF:', contentErr);
          shareableUri = localUri;
        }
      }

      // 4. Try native sharing first, gracefully catch if rejected or dismissed
      let shareSucceeded = false;
      if (await Sharing.isAvailableAsync()) {
        try {
          await Sharing.shareAsync(shareableUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Download ${fileName}`,
            UTI: '.pdf',
          });
          shareSucceeded = true;
        } catch (shareErr) {
          console.warn('Sharing.shareAsync rejected or dismissed, opening Print fallback:', shareErr);
        }
      }

      // 5. Permanent, 100% reliable fallback: Native OS Print / Save as PDF dialog
      if (!shareSucceeded) {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Report Notice', 'Could not generate PDF report. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    const text = `📊 *SHILPI STUDIO MONTHLY REPORT*\n*${selectedMonthLong} ${selectedYear}*\nStudio: ${studioName}\n\n💰 *Total Sales:* ${fmt(monthData.totalSales)}\n📉 *Total Expenses:* ${fmt(monthData.totalExpense)}\n💎 *Net Profit:* ${fmt(monthData.profit)}\n⏳ *Pending Balance:* ${fmt(monthData.pendingDues)}\n🏆 *Best Day:* ${monthData.bestDayStr}\n📋 *Orders:* ${monthData.monthBookings.length}\n\n— Generated with Shilpi ERP`;
    openWhatsAppDirect(undefined, text);
  };

  const handleSendDueReminders = () => {
    const unpaid = monthData.monthBookings.filter((b) => {
      const total = bookingTotalAmount(b);
      const paid = (b as any).paidAmount !== undefined ? (b as any).paidAmount : (b.advance || 0);
      return total - paid > 0;
    });

    if (unpaid.length === 0) {
      Alert.alert('No Dues', 'All client balances are settled for this month.');
      return;
    }

    const target = unpaid[0];
    const targetTotal = bookingTotalAmount(target);
    const targetPaid = (target as any).paidAmount !== undefined ? (target as any).paidAmount : (target.advance || 0);
    const targetDue = Math.max(0, targetTotal - targetPaid);
    const serviceNames = target.items.map((i) => i.name).join(' + ') || 'Styling';

    const match = `${(target as any).phone || (target as any).clientPhone || ''} ${target.notes || ''} ${target.address || ''}`.match(/(?:\+91|0)?[6-9]\d{9}/);
    const phone = match ? match[0] : undefined;

    const msg = getPaymentReminderMessage({
      clientName: target.client,
      dateLong: target.dateLong,
      serviceNames,
      dueAmount: targetDue,
      artistName: artistName || 'Artist',
      studioName: studioName || 'Shilpi Studio',
    });

    openWhatsAppDirect(phone, msg);
  };

  const maxWeekly = Math.max(1, ...monthData.weeksData.map((w) => Math.max(w.sales, w.expenses)));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
      {/* 1. TOP-LEVEL SLIDER / SWITCHER: Monthly Reports vs Summary */}
      <View style={styles.topTabsContainer}>
        <TouchableOpacity
          style={[styles.topTabBtn, topTab === 'Monthly' && styles.topTabBtnActive]}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setTopTab('Monthly');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.topTabText, topTab === 'Monthly' && styles.topTabTextActive]}>
            MONTHLY REPORTS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, topTab === 'Summary' && styles.topTabBtnActive]}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setTopTab('Summary');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.topTabText, topTab === 'Summary' && styles.topTabTextActive]}>
            SUMMARY
          </Text>
        </TouchableOpacity>
      </View>

      {/* =========================================================================
          SECTION 1: MONTHLY REPORTS (Month slider, Overview & Day Wise)
          ========================================================================= */}
      {topTab === 'Monthly' ? (
        <View>
          {/* A. Month Slider (November, past & future months with pan responder) */}
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

          {/* B. Sub-Slider inside Monthly Reports: Overview vs Day Wise */}
          <View style={styles.subSliderTabs}>
            <TouchableOpacity
              style={[styles.subSliderPill, monthlySubTab === 'Overview' && styles.subSliderPillActive]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setMonthlySubTab('Overview');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.subSliderText, monthlySubTab === 'Overview' && styles.subSliderTextActive]}>
                OVERVIEW
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subSliderPill, monthlySubTab === 'DayWise' && styles.subSliderPillActive]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setMonthlySubTab('DayWise');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.subSliderText, monthlySubTab === 'DayWise' && styles.subSliderTextActive]}>
                DAY WISE
              </Text>
            </TouchableOpacity>
          </View>

          {monthlySubTab === 'Overview' ? (
            /* SUB-VIEW 1: OVERVIEW WITH ALL KPIS, CHARTS & ACTIONS */
            <View style={styles.monthlyContentContainer}>
              {/* Four KPI Cards:
                  Row 1: Total Sale | Total Expense
                  Row 2: Profit | Best Day */}
              <View style={styles.kpiGrid}>
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

              {/* Sales vs Profit */}
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

              {/* Sales vs Expense by Week */}
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

              {/* Payment Modes */}
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
                          backgroundColor: '#0f172a',
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.stackedSegment,
                        {
                          width: `${monthData.totalSales > 0 ? Math.max(5, (monthData.cashPaid / monthData.totalSales) * 100) : 0}%`,
                          backgroundColor: '#64748b',
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.stackedSegment,
                        {
                          width: `${monthData.totalSales > 0 ? Math.max(5, (monthData.pendingDues / monthData.totalSales) * 100) : 0}%`,
                          backgroundColor: '#cbd5e1',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.paymentLegendGrid}>
                    <View style={styles.paymentLegendItem}>
                      <View style={[styles.paymentLegendSquare, { backgroundColor: '#0f172a' }]} />
                      <View>
                        <Text style={styles.paymentLegendName}>UPI / Online</Text>
                        <Text style={styles.paymentLegendAmount}>{fmt(monthData.upiPaid)}</Text>
                      </View>
                    </View>

                    <View style={styles.paymentLegendItem}>
                      <View style={[styles.paymentLegendSquare, { backgroundColor: '#64748b' }]} />
                      <View>
                        <Text style={styles.paymentLegendName}>Cash</Text>
                        <Text style={styles.paymentLegendAmount}>{fmt(monthData.cashPaid)}</Text>
                      </View>
                    </View>

                    <View style={styles.paymentLegendItem}>
                      <View style={[styles.paymentLegendSquare, { backgroundColor: '#cbd5e1' }]} />
                      <View>
                        <Text style={styles.paymentLegendName}>Pending Dues</Text>
                        <Text style={[styles.paymentLegendAmount, { color: '#64748b' }]}>
                          {fmt(monthData.pendingDues)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Top Used Services */}
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

              {/* Pending Dues */}
              <View style={styles.pendingDuesCard}>
                <View>
                  <Text style={styles.pendingDuesKicker}>PENDING CLIENT DUES</Text>
                  <Text style={styles.pendingDuesAmount}>{fmt(monthData.pendingDues)}</Text>
                </View>
                <TouchableOpacity style={styles.remindBtn} onPress={handleSendDueReminders} activeOpacity={0.8}>
                  <WhatsAppIcon color="#ffffff" size={14} />
                  <Text style={styles.remindBtnText}>SEND REMINDERS</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons: Preview, PDF, Excel, WhatsApp with Premium Vector Icons */}
              <View style={styles.actionButtonsWrap}>
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => setPreviewOpen(true)}
                  activeOpacity={0.8}
                >
                  <EyeIcon color="#121212" size={17} />
                  <Text style={styles.previewBtnText}>PREVIEW REPORT</Text>
                </TouchableOpacity>

                <View style={styles.exportBtnRow}>
                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => handleDownloadPdf()}
                    activeOpacity={0.8}
                  >
                    <PdfDocumentIcon color="#121212" size={16} />
                    <Text style={styles.exportBtnText}>DOWNLOAD PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => handleDownloadExcel()}
                    activeOpacity={0.8}
                  >
                    <ExcelTableIcon color="#121212" size={16} />
                    <Text style={styles.exportBtnText}>DOWNLOAD EXCEL</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={handleSendWhatsApp}
                  activeOpacity={0.8}
                >
                  <WhatsAppIcon color="#ffffff" size={18} />
                  <Text style={styles.whatsappBtnText}>SEND ON WHATSAPP</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* SUB-VIEW 2: DAY WISE TABLE OF CURRENT MONTH (Table with Name, Date, Amount) */
            <View style={styles.dayWiseMonthContainer}>
              <View style={styles.dayWiseMonthHeader}>
                <Text style={styles.dayWiseMonthKicker}>
                  DAY WISE · {selectedMonthLong.toUpperCase()} {selectedYear}
                </Text>
                <Text style={styles.dayWiseMonthSub}>
                  Slide the month selector above to switch months
                </Text>
              </View>

              <View style={styles.dayWiseTableCard}>
                {/* Table Header Row */}
                <View style={styles.dayWiseTableHeaderRow}>
                  <Text style={[styles.dayWiseTableColHeader, styles.colName]}>NAME</Text>
                  <Text style={[styles.dayWiseTableColHeader, styles.colDate]}>DATE</Text>
                  <Text style={[styles.dayWiseTableColHeader, styles.colAmount]}>AMOUNT</Text>
                </View>

                {/* Table Body */}
                {tableBookings.length === 0 ? (
                  <View style={styles.tableEmptyRow}>
                    <Text style={styles.tableEmptyText}>No bookings recorded for {selectedMonthLong} {selectedYear}</Text>
                  </View>
                ) : (
                  tableBookings.map((b, idx) => {
                    const dt = parseBookingDayLocal(b, selectedYear);
                    const dateStr = `${dt.getDate()} ${MONTH_SHORT_ARR[dt.getMonth()]}`;
                    const amountVal = bookingTotalAmount(b);
                    const isLast = idx === tableBookings.length - 1;
                    const isAlt = idx % 2 === 1;

                    return (
                      <View
                        key={b.id || idx}
                        style={[
                          styles.dayWiseTableRow,
                          isAlt && styles.dayWiseTableRowAlt,
                          isLast && styles.dayWiseTableRowLast,
                        ]}
                      >
                        <View style={styles.colNameCell}>
                          <Text style={styles.tableClientName} numberOfLines={1}>{b.client}</Text>
                          <Text style={styles.tableServiceSub} numberOfLines={1}>
                            {b.items.map((it) => it.name).join(', ') || 'Custom Package'}
                          </Text>
                        </View>

                        <View style={styles.colDateCell}>
                          <Text style={styles.tableDateText}>{dateStr}</Text>
                        </View>

                        <View style={styles.colAmountCell}>
                          <Text style={styles.tableAmountText}>{fmt(amountVal)}</Text>
                        </View>
                      </View>
                    );
                  })
                )}

                {/* Table Footer Summary Row */}
                {tableBookings.length > 0 && (
                  <View style={styles.dayWiseTableFooterRow}>
                    <View style={styles.colNameCell}>
                      <Text style={styles.tableFooterLabel}>TOTAL ({tableBookings.length} {tableBookings.length === 1 ? 'BILL' : 'BILLS'})</Text>
                    </View>
                    <View style={styles.colDateCell}>
                      <Text style={styles.tableFooterSub}>{selectedMonthLong.slice(0, 3)}</Text>
                    </View>
                    <View style={styles.colAmountCell}>
                      <Text style={styles.tableFooterAmount}>{fmt(monthData.totalSales)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      ) : (
        /* =========================================================================
           SECTION 2: SUMMARY (All Years 2026 -> Months -> Date & Items Details)
           ========================================================================= */
        <View style={styles.summarySliderContainer}>
          {/* A. Only ONE container that contains 2026 with arrow on right, NO 'collapse' word */}
          <TouchableOpacity
            style={styles.yearContainerCard}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setSummaryYearExpanded(!summaryYearExpanded);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.yearCardLeft}>
              <Text style={styles.yearNumberText}>{annualSummary.year}</Text>
              <Text style={styles.yearSubText}>
                {annualSummary.ordersCompleted} {annualSummary.ordersCompleted === 1 ? 'Bill' : 'Bills'} · {fmt(annualSummary.yearTotalSales)}
              </Text>
            </View>

            <View style={styles.yearArrowWrap}>
              {summaryYearExpanded ? (
                <ChevronUpIcon color="#ffffff" size={18} />
              ) : (
                <ChevronDownIcon color="#ffffff" size={18} />
              )}
            </View>
          </TouchableOpacity>

          {/* B. Months List inside the Year */}
          {summaryYearExpanded && (
            <View style={styles.monthsAccordionList}>
              <Text style={styles.monthsAccordionKicker}>
                ALL MONTHS IN {annualSummary.year}
              </Text>

              {annualSummary.months.map((m) => {
                const isMonthOpen = expandedSummaryMonth === m.monthIdx;
                return (
                  <View key={m.monthName} style={styles.summaryMonthCard}>
                    <TouchableOpacity
                      style={styles.summaryMonthHeader}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setExpandedSummaryMonth(isMonthOpen ? null : m.monthIdx);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryMonthTitle}>{m.monthName.toUpperCase()}</Text>
                        <Text style={styles.summaryMonthBillsSub}>
                          {m.billsCount} {m.billsCount === 1 ? 'bill' : 'bills'}
                        </Text>
                      </View>

                      <View style={styles.summaryMonthRightCol}>
                        <Text style={styles.summaryMonthAmount}>{fmt(m.grandTotal)}</Text>
                        <View style={styles.arrowIconWrap}>
                          {isMonthOpen ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* C. Monthly Overview on Click:
                        Total Sales, Expenses, Profit, Grand Total + Date & Items Details */}
                    {isMonthOpen && (
                      <View style={styles.monthlyOverviewBox}>
                        {/* 4 Financial Totals Box */}
                        <View style={styles.fourTotalsRow}>
                          <View style={styles.totalMiniItem}>
                            <Text style={styles.totalMiniLabel}>TOTAL SALES</Text>
                            <Text style={styles.totalMiniVal}>{fmt(m.sales)}</Text>
                          </View>
                          <View style={styles.totalMiniItem}>
                            <Text style={styles.totalMiniLabel}>EXPENSES</Text>
                            <Text style={[styles.totalMiniVal, { color: '#64748b' }]}>{fmt(m.expenses)}</Text>
                          </View>
                          <View style={styles.totalMiniItem}>
                            <Text style={styles.totalMiniLabel}>PROFIT</Text>
                            <Text style={[styles.totalMiniVal, { color: '#0f172a' }]}>{fmt(m.profit)}</Text>
                          </View>
                          <View style={styles.totalMiniItem}>
                            <Text style={styles.totalMiniLabel}>GRAND TOTAL</Text>
                            <Text style={styles.totalMiniVal}>{fmt(m.grandTotal)}</Text>
                          </View>
                        </View>

                        {/* Detailed Date and Items List */}
                        <Text style={styles.detailedItemsTitle}>
                          BILLS &amp; LINE ITEMS ({m.bookings.length})
                        </Text>
                        {m.bookings.length === 0 ? (
                          <Text style={styles.noBookingsText}>No orders registered in {m.monthName}</Text>
                        ) : (
                          m.bookings.map((b, bIdx) => (
                            <View key={b.id || bIdx} style={styles.detailedBookingRow}>
                              <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={styles.detailedBookingDate}>
                                  {formatBookingDisplayDate(b, annualSummary.year)}
                                </Text>
                                <Text style={styles.detailedBookingClient}>{b.client}</Text>
                                <Text style={styles.detailedBookingItems}>
                                  {b.items.map((it) => `${it.name} (${fmt(it.price)})`).join(', ')}
                                </Text>
                              </View>
                              <Text style={styles.detailedBookingTotal}>
                                {fmt(bookingTotalAmount(b))}
                              </Text>
                            </View>
                          ))
                        )}

                        {/* Download Excel & PDF Buttons with vector icons */}
                        <View style={styles.monthDownloadBtnRow}>
                          <TouchableOpacity
                            style={styles.monthDownloadBtn}
                            onPress={() => handleDownloadPdf(m.monthName, m.sales, m.expenses, m.profit, m.bookings)}
                            activeOpacity={0.8}
                          >
                            <PdfDocumentIcon color="#121212" size={15} />
                            <Text style={styles.monthDownloadBtnText}>PDF REPORT</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.monthDownloadBtn}
                            onPress={() => handleDownloadExcel(m.monthName, m.bookings)}
                            activeOpacity={0.8}
                          >
                            <ExcelTableIcon color="#121212" size={15} />
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
        </View>
      )}

      {/* Preview Modal */}
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
                      <Text style={[styles.previewVal, { color: '#0f172a', fontWeight: '800' }]}>
                        {fmt(monthData.profit)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Pending Balance</Text>
                      <Text style={[styles.previewVal, { color: '#64748b' }]}>
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
                    <CloseIcon color="#121212" size={14} />
                    <Text style={styles.previewCloseBtnText}>CLOSE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.previewShareBtn} onPress={handleSendWhatsApp}>
                    <WhatsAppIcon color="#ffffff" size={16} />
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

    // Top-level Slider / Tabs
    topTabsContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 14,
      backgroundColor: '#ffffff',
      borderRadius: 999,
      padding: 4,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.08)',
    },
    topTabBtn: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topTabBtnActive: {
      backgroundColor: '#121212',
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    topTabText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: 'rgba(18, 18, 18, 0.6)',
    },
    topTabTextActive: {
      color: '#ffffff',
    },

    // Month Slider Pill
    monthSliderPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginTop: 12,
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

    // Sub-slider tabs inside Monthly View (Overview vs Day Wise)
    subSliderTabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 10,
      backgroundColor: '#ffffff',
      borderRadius: 999,
      padding: 3,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.08)',
    },
    subSliderPill: {
      flex: 1,
      paddingVertical: 9,
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
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: 'rgba(18, 18, 18, 0.6)',
    },
    subSliderTextActive: {
      color: '#ffffff',
    },

    monthlyContentContainer: {
      marginTop: 10,
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

    // Dual Bar
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

    // Payment Modes
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

    // Top Services
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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

    // Action Buttons
    actionButtonsWrap: {
      marginHorizontal: 16,
      marginTop: 14,
      gap: 10,
    },
    previewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#ffffff',
      borderWidth: 1.5,
      borderColor: '#121212',
      paddingVertical: 13,
      borderRadius: 14,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.14)',
      paddingVertical: 12,
      borderRadius: 14,
    },
    exportBtnText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: '#121212',
    },
    whatsappBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#25D366',
      paddingVertical: 13,
      borderRadius: 14,
    },
    whatsappBtnText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#ffffff',
    },

    // Day Wise in Monthly Reports (Table: Name, Date, Amount)
    dayWiseMonthContainer: {
      marginTop: 10,
      paddingHorizontal: 16,
    },
    dayWiseMonthHeader: {
      marginBottom: 10,
    },
    dayWiseMonthKicker: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: '#121212',
    },
    dayWiseMonthSub: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 2,
    },
    dayWiseTableCard: {
      backgroundColor: '#ffffff',
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.08)',
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    dayWiseTableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#121212',
      paddingVertical: 11,
      paddingHorizontal: 14,
    },
    dayWiseTableColHeader: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#ffffff',
    },
    colName: {
      flex: 2,
    },
    colDate: {
      flex: 1,
      textAlign: 'center',
    },
    colAmount: {
      flex: 1.2,
      textAlign: 'right',
    },
    dayWiseTableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.05)',
      backgroundColor: '#ffffff',
    },
    dayWiseTableRowAlt: {
      backgroundColor: '#fafafb',
    },
    dayWiseTableRowLast: {
      borderBottomWidth: 0,
    },
    colNameCell: {
      flex: 2,
      paddingRight: 6,
    },
    colDateCell: {
      flex: 1,
      alignItems: 'center',
    },
    colAmountCell: {
      flex: 1.2,
      alignItems: 'flex-end',
    },
    tableClientName: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
    },
    tableServiceSub: {
      fontSize: 10,
      color: 'rgba(18, 18, 18, 0.48)',
      marginTop: 2,
    },
    tableDateText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: '#475569',
      backgroundColor: 'rgba(18, 18, 18, 0.04)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    tableAmountText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },
    tableEmptyRow: {
      paddingVertical: 24,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableEmptyText: {
      fontSize: 12,
      color: 'rgba(18, 18, 18, 0.45)',
      textAlign: 'center',
    },
    dayWiseTableFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f1f1f4',
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderTopWidth: 1.5,
      borderTopColor: 'rgba(18, 18, 18, 0.1)',
    },
    tableFooterLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#121212',
    },
    tableFooterSub: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#64748b',
    },
    tableFooterAmount: {
      fontSize: 13.5,
      fontWeight: '900',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },

    // SUMMARY (One 2026 container with arrow on right, no 'collapse' text)
    summarySliderContainer: {
      marginTop: 12,
    },
    yearContainerCard: {
      backgroundColor: '#121212',
      marginHorizontal: 16,
      borderRadius: 22,
      paddingVertical: 18,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    yearCardLeft: {
      flex: 1,
    },
    yearNumberText: {
      fontSize: 28,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.5,
      fontVariant: ['tabular-nums'],
    },
    yearSubText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.7)',
      marginTop: 2,
    },
    yearArrowWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    monthsAccordionList: {
      marginTop: 14,
    },
    monthsAccordionKicker: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: 'rgba(18, 18, 18, 0.55)',
      marginHorizontal: 16,
      marginBottom: 8,
    },
    summaryMonthCard: {
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
    summaryMonthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    summaryMonthTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#121212',
    },
    summaryMonthBillsSub: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 2,
    },
    summaryMonthRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    summaryMonthAmount: {
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

    // Monthly Overview Box inside Summary
    monthlyOverviewBox: {
      backgroundColor: '#faf8f9',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(18, 18, 18, 0.06)',
    },
    fourTotalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#ffffff',
      borderRadius: 14,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.07)',
    },
    totalMiniItem: {
      alignItems: 'center',
    },
    totalMiniLabel: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: 'rgba(18, 18, 18, 0.45)',
    },
    totalMiniVal: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#121212',
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    detailedItemsTitle: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1,
      color: 'rgba(18, 18, 18, 0.55)',
      marginTop: 14,
      marginBottom: 6,
    },
    noBookingsText: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.45)',
      paddingVertical: 8,
    },
    detailedBookingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.04)',
    },
    detailedBookingDate: {
      fontSize: 9.5,
      fontWeight: '700',
      color: '#e8276b',
    },
    detailedBookingClient: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#121212',
      marginTop: 1,
    },
    detailedBookingItems: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.5)',
    },
    detailedBookingTotal: {
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#ffffff',
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.12)',
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: 'rgba(18, 18, 18, 0.06)',
    },
    previewCloseBtnText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#121212',
    },
    previewShareBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#25D366',
    },
    previewShareBtnText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#ffffff',
    },
  });
