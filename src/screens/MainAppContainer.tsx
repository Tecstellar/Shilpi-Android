import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import {
  requestNotificationPermissions,
  scheduleReminderNotification,
  cancelReminderNotification,
} from '../services/notificationService';
import {
  INITIAL_PKG_GROUPS,
  Client,
  Booking,
  ExpenseRecord,
  ReminderRecord,
  PackageGroup,
  NotificationItem,
  fmt,
  first,
  normalizePhoneKey,
} from '../data/prototypeData';

import { TopHeader } from '../components/TopHeader';
import { BottomTabBar, TabType } from '../components/BottomTabBar';
import { DrawerMenu } from '../components/DrawerMenu';
import { ActionBottomSheet, ActionSheetData } from '../components/ActionBottomSheet';
import { ExitConfirmModal } from '../components/ExitConfirmModal';
import {
  openWhatsAppDirect,
  getBookingConfirmationMessage,
  getBookingReminderMessage,
  getPaymentReminderMessage,
  getClientDirectMessage,
} from '../utils/whatsappHelper';

import { HomeScreen } from './HomeScreen';
import { ClientsScreen } from './ClientsScreen';
import { ClientDetailScreen } from './ClientDetailScreen';
import { OrdersScreen } from './OrdersScreen';
import { OrderDetailScreen } from './OrderDetailScreen';
import { NewBookingScreen } from './NewBookingScreen';
import { NewClientScreen } from './NewClientScreen';
import { PaymentsScreen } from './PaymentsScreen';
import { PackagesScreen } from './PackagesScreen';
import { GalleryScreen } from './GalleryScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { RemindersScreen } from './RemindersScreen';
import { ExpensesScreen } from './ExpensesScreen';
import { ReportsScreen } from './ReportsScreen';
import { SubscriptionScreen } from './SubscriptionScreen';
import { SettingsScreen } from './SettingsScreen';

interface MainAppContainerProps {
  onOpenQrScanner: () => void;
  onLogout: () => void;
}

export const MainAppContainer: React.FC<MainAppContainerProps> = ({
  onOpenQrScanner,
  onLogout,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [selectedClientId, setSelectedClientId] = useState<number | string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [bookingInitialDate, setBookingInitialDate] = useState<number | undefined>();
  const [bookingInitialMonth, setBookingInitialMonth] = useState<string | undefined>();
  const [bookingInitialYear, setBookingInitialYear] = useState<number | undefined>();
  const [bookingClientName, setBookingClientName] = useState<string | undefined>();

  // Drawer & Sheet States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActionSheetData | null>(null);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const screenHistoryRef = useRef<string[]>([]);

  // App Data State — Strictly scoped to authenticated studio (beauticianId)
  const [beauticianId, setBeauticianId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<number>(0);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>(INITIAL_PKG_GROUPS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [artistName, setArtistName] = useState('Artist');
  const [studioName, setStudioName] = useState('Shilpi Studio');
  const [studioLogo, setStudioLogo] = useState<string | undefined>();
  const [studioPhone, setStudioPhone] = useState<string>('');
  const [studioCity, setStudioCity] = useState<string>('');
  const [studioRole, setStudioRole] = useState<string>('Bridal Makeup Artist');
  const [registeredAt, setRegisteredAt] = useState<string | undefined>();
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const isPremium = subscriptionTier === 'pro_monthly' || subscriptionTier === 'pro_annual' || subscriptionTier === 'enterprise';

  // Load storage data on mount & hydrate live studio data from AWS RDS PostgreSQL
  useEffect(() => {
    const loadData = async () => {
      try {
        let resolvedShopId = await AsyncStorage.getItem('@shilpi_beautician_id');

        const storedProfile = await AsyncStorage.getItem('@shilpi_profile');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (!resolvedShopId && parsed.beauticianId) {
            resolvedShopId = parsed.beauticianId;
          }
          if (parsed.ownerName?.trim()) {
            setArtistName(parsed.ownerName.trim());
          } else if (parsed.businessName?.trim()) {
            setArtistName(parsed.businessName.trim());
          }
          if (parsed.businessName?.trim()) {
            setStudioName(parsed.businessName.trim());
          }
          if (parsed.logoUri) {
            setStudioLogo(parsed.logoUri);
          }
          if (parsed.phone) {
            setStudioPhone(parsed.phone);
          }
          if (parsed.city) {
            setStudioCity(parsed.city);
          }
          if (Array.isArray(parsed.businessTypes) && parsed.businessTypes.length > 0) {
            setStudioRole(parsed.businessTypes[0]);
          }
          if (parsed.createdAt) {
            setRegisteredAt(parsed.createdAt);
          }
          if (parsed.subscriptionTier) {
            setSubscriptionTier(parsed.subscriptionTier);
          }
        }

        const storedPackages = await AsyncStorage.getItem('@shilpi_packages');
        if (storedPackages) {
          setPackageGroups(JSON.parse(storedPackages));
        }

        // Request device notification permissions for outside-app reminders
        requestNotificationPermissions().catch(() => {});

        // Hydrate live studio identity from backend (/auth/me)
        try {
          const meRes = await apiClient.get('/auth/me');
          if (meRes.data?.success && meRes.data?.beautician) {
            const b = meRes.data.beautician;
            resolvedShopId = b.id;
            if (b.createdAt) {
              setRegisteredAt(b.createdAt);
            }
            const tierVal = b.subscription?.tier || 'free';
            setSubscriptionTier(tierVal);
            await AsyncStorage.setItem('@shilpi_beautician_id', b.id);
            await AsyncStorage.setItem(
              '@shilpi_profile',
              JSON.stringify({
                beauticianId: b.id,
                ownerName: b.ownerName,
                businessName: b.businessName,
                businessTypes: b.businessTypes || [],
                city: b.city || '',
                address: b.address || '',
                pincode: b.pincode || '',
                phone: b.phone || '',
                logoUri: b.profilePhotoUrl,
                createdAt: b.createdAt,
                subscriptionTier: tierVal,
              })
            );
            if (b.ownerName?.trim()) {
              setArtistName(b.ownerName.trim());
            } else if (b.businessName?.trim()) {
              setArtistName(b.businessName.trim());
            }
            if (b.businessName?.trim()) {
              setStudioName(b.businessName.trim());
            }
            if (b.phone) {
              setStudioPhone(b.phone);
            }
            if (b.city) {
              setStudioCity(b.city);
            }
            if (Array.isArray(b.businessTypes) && b.businessTypes.length > 0) {
              setStudioRole(b.businessTypes[0]);
            }
            if (b.profilePhotoUrl) {
              setStudioLogo(b.profilePhotoUrl);
            }

            if (Array.isArray(meRes.data.packages) && meRes.data.packages.length > 0) {
              const groupedMap = new Map<string, { name: string; price: number }[]>();
              meRes.data.packages.forEach((p: any) => {
                const rawCat = String(p.serviceType || 'Bridal');
                const catName = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
                const list = groupedMap.get(catName) || [];
                list.push({
                  name: p.name,
                  price: Math.round(Number(p.pricePaise || 0) / 100),
                });
                groupedMap.set(catName, list);
              });
              const hydratedGroups: PackageGroup[] = Array.from(groupedMap.entries()).map(
                ([name, items]) => ({ name, items })
              );
              if (hydratedGroups.length > 0) {
                setPackageGroups(hydratedGroups);
                await AsyncStorage.setItem('@shilpi_packages', JSON.stringify(hydratedGroups));
              }
            }
          }
        } catch (meErr: any) {
          if (meErr?.status === 401) {
            Alert.alert('Session Expired', 'Please sign in again to continue.', [
              { text: 'Sign In', onPress: () => onLogout() },
            ]);
            return;
          }
        }

        let loadedBookingsSnapshot: Booking[] = [];
        let loadedNotifs: NotificationItem[] = [];

        if (resolvedShopId) {
          setBeauticianId(resolvedShopId);

          const [storedClients, storedBookings, storedNotifs, storedExpenses, storedReminders] = await Promise.all([
            AsyncStorage.getItem(`@shilpi_clients_${resolvedShopId}`),
            AsyncStorage.getItem(`@shilpi_bookings_${resolvedShopId}`),
            AsyncStorage.getItem(`@shilpi_notifs_${resolvedShopId}`),
            AsyncStorage.getItem(`@shilpi_expenses_${resolvedShopId}`),
            AsyncStorage.getItem(`@shilpi_reminders_${resolvedShopId}`),
          ]);

          if (storedClients) {
            setClients(JSON.parse(storedClients));
          }
          if (storedBookings) {
            loadedBookingsSnapshot = JSON.parse(storedBookings);
            setBookings(loadedBookingsSnapshot);
          }
          if (storedNotifs) {
            loadedNotifs = JSON.parse(storedNotifs);
            setNotifications(loadedNotifs);
          }
          if (storedExpenses) {
            const parsedExp: ExpenseRecord[] = JSON.parse(storedExpenses);
            setExpenses(parsedExp);
            const t = new Date();
            const prefix = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
            setMonthExpenses(
              parsedExp
                .filter((e) => String(e.expenseDate || '').startsWith(prefix))
                .reduce((s, e) => s + (e.amount || 0), 0)
            );
          }
          if (storedReminders) {
            setReminders(JSON.parse(storedReminders));
          }
        }

        const syncMonthEndNotifications = async (
          shopId: string | null,
          currentBookings: Booking[],
          baseNotifs: NotificationItem[]
        ) => {
          const today = new Date();
          const curYr = today.getFullYear();
          const curMo = today.getMonth();
          const curDay = today.getDate();
          const lastDayOfCurMonth = new Date(curYr, curMo + 1, 0).getDate();
          const longMonths = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ];
          const shortMonths = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
          ];

          const nextNotifs = [...baseNotifs];
          let changed = false;

          // 1. On the last day of the active month, publish "Your {Month} report is ready"
          if (curDay === lastDayOfCurMonth) {
            const curReportId = `report-${curYr}-${curMo}`;
            if (!nextNotifs.some((n) => n.id === curReportId)) {
              const curMonthSales = currentBookings
                .filter((b) => b.month === shortMonths[curMo] && (!b.year || b.year === curYr))
                .reduce((s, b) => s + b.items.reduce((isum, i) => isum + i.price, 0) + (b.travel || 0), 0);
              nextNotifs.unshift({
                id: curReportId,
                glyph: '↑',
                title: `Your ${longMonths[curMo]} report is ready`,
                body: `Sales ${fmt(curMonthSales)} for ${longMonths[curMo]} ${curYr}. Tap to open Reports.`,
                time: 'Today',
                to: 'reports',
              });
              changed = true;
            }
          }

          // 2. When a previous month just completed (and has bookings), ensure its report notification exists
          const prevDate = new Date(curYr, curMo - 1, 1);
          const prevYr = prevDate.getFullYear();
          const prevMo = prevDate.getMonth();
          const prevReportId = `report-${prevYr}-${prevMo}`;
          const hadPrevBookings = currentBookings.some(
            (b) => b.month === shortMonths[prevMo] && (!b.year || b.year === prevYr)
          );
          if (hadPrevBookings && !nextNotifs.some((n) => n.id === prevReportId)) {
            const prevSales = currentBookings
              .filter((b) => b.month === shortMonths[prevMo] && (!b.year || b.year === prevYr))
              .reduce((s, b) => s + b.items.reduce((isum, i) => isum + i.price, 0) + (b.travel || 0), 0);
            nextNotifs.unshift({
              id: prevReportId,
              glyph: '↑',
              title: `Your ${longMonths[prevMo]} report is ready`,
              body: `${longMonths[prevMo]} ${prevYr} closed with ${fmt(prevSales)} in sales. Tap to review.`,
              time: `1 ${shortMonths[curMo]}`,
              to: 'reports',
            });
            changed = true;
          }

          if (changed) {
            setNotifications(nextNotifs);
            if (shopId) {
              await AsyncStorage.setItem(
                `@shilpi_notifs_${shopId}`,
                JSON.stringify(nextNotifs)
              );
            }
          }
        };

        // Fetch shop-scoped clients, bookings, expenses, reminders & dashboard metrics directly from AWS RDS PostgreSQL
        try {
          const [clientsRes, bookingsRes, overviewRes, expensesRes, remindersRes] = await Promise.all([
            apiClient.get('/clients'),
            apiClient.get('/bookings').catch(() => null),
            apiClient.get('/dashboard/overview').catch(() => null),
            apiClient.get('/expenses').catch(() => null),
            apiClient.get('/reminders').catch(() => null),
          ]);

          if (remindersRes?.data?.success && Array.isArray(remindersRes.data.data)) {
            const dbReminders: ReminderRecord[] = remindersRes.data.data.map((r: any) => ({
              id: r.id,
              text: r.text,
              kind: r.kind || 'General',
              remindAt: r.remindAt,
              isCompleted: !!r.isCompleted,
              bookingId: r.bookingId || null,
            }));
            setReminders(dbReminders);
            if (resolvedShopId) {
              await AsyncStorage.setItem(
                `@shilpi_reminders_${resolvedShopId}`,
                JSON.stringify(dbReminders)
              );
            }
          }

          if (overviewRes?.data?.success && overviewRes.data?.data?.metrics) {
            const rawExpPaise = Number(overviewRes.data.data.metrics.totalExpensesPaise || 0);
            setMonthExpenses(Math.round(rawExpPaise / 100));
          }

          if (expensesRes?.data?.success && Array.isArray(expensesRes.data.data)) {
            const shortM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dbExpenses: ExpenseRecord[] = expensesRes.data.data.map((e: any) => {
              const dtStr = String(e.expenseDate || '').slice(0, 10);
              const dtObj = new Date(`${dtStr}T00:00:00Z`);
              const dNum = isNaN(dtObj.getUTCDate()) ? '' : String(dtObj.getUTCDate()).padStart(2, '0');
              const mStr = isNaN(dtObj.getUTCMonth()) ? '' : shortM[dtObj.getUTCMonth()] || '';
              return {
                id: e.id,
                title: e.title,
                category: e.category,
                categoryLabel: e.categoryLabel || e.category,
                amount: Math.round(Number(e.amountPaise || 0) / 100),
                expenseDate: dtStr,
                dateLabel: dNum && mStr ? `${dNum} ${mStr}` : dtStr,
                notes: e.notes || '',
              };
            });
            setExpenses(dbExpenses);
            const t = new Date();
            const curPrefix = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
            setMonthExpenses(
              dbExpenses
                .filter((e) => e.expenseDate.startsWith(curPrefix))
                .reduce((sum, e) => sum + e.amount, 0)
            );
            if (resolvedShopId) {
              await AsyncStorage.setItem(
                `@shilpi_expenses_${resolvedShopId}`,
                JSON.stringify(dbExpenses)
              );
            }
          }

          if (clientsRes.data?.success && Array.isArray(clientsRes.data.data)) {
            const dbClients: Client[] = clientsRes.data.data.map((c: any) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              bookings: c._count?.bookings || 0,
              sales: 0,
              profit: 0,
              history: [],
              notes: c.notes || '',
              photoUri: c.profilePhotoUrl || undefined,
              isVip: Boolean(c.isVip),
              isActive: c.isActive !== false,
            }));

            setClients(dbClients);
            if (resolvedShopId) {
              await AsyncStorage.setItem(
                `@shilpi_clients_${resolvedShopId}`,
                JSON.stringify(dbClients)
              );
            }
          }

          if (bookingsRes?.data?.success && Array.isArray(bookingsRes.data.data)) {
            const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dbBookings: Booking[] = bookingsRes.data.data.map((b: any) => {
              const dt = new Date(b.bookingDate);
              const dNum = dt.getUTCDate();
              const mShort = monthShortNames[dt.getUTCMonth()] || 'Sep';
              const yr = dt.getUTCFullYear();
              const dow = dayShortNames[new Date(yr, dt.getUTCMonth(), dNum).getDay()];

              let timeStr = '10:00';
              let meridiemStr = 'AM';
              if (b.startTime) {
                const st = new Date(b.startTime);
                let hrs = st.getHours();
                const mins = String(st.getMinutes()).padStart(2, '0');
                meridiemStr = hrs >= 12 ? 'PM' : 'AM';
                hrs = hrs % 12 || 12;
                timeStr = `${hrs}:${mins}`;
              }

              const rawItems = Array.isArray(b.items) ? b.items : [];
              const travelRow = rawItems.find((i: any) => i.customTitle === 'Travel Charges');
              const travelAmt = travelRow
                ? Math.round(Number(travelRow.totalPricePaise || 0) / 100)
                : 0;
              const pkgItems = rawItems
                .filter((i: any) => i.customTitle !== 'Travel Charges')
                .map((i: any) => ({
                  name: i.customTitle,
                  price: Math.round(Number(i.unitPricePaise || 0) / 100),
                }));

              const statusMapped: 'Upcoming' | 'Completed' | 'Closed' =
                b.status === 'completed'
                  ? 'Closed'
                  : b.status === 'in_progress'
                  ? 'Completed'
                  : 'Upcoming';

              return {
                id: b.id,
                ref: `Booking #${String(b.id).slice(0, 4).toUpperCase()}`,
                client: b.client?.name || 'Client',
                clientId: b.clientId,
                bookingDate: typeof b.bookingDate === 'string' ? b.bookingDate.split('T')[0] : `${yr}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`,
                day: dNum,
                month: mShort,
                year: yr,
                dateLong: `${dow} ${dNum} ${mShort} ${yr}`,
                time: timeStr,
                meridiem: meridiemStr,
                items: pkgItems.length > 0 ? pkgItems : [{ name: 'Bridal Look', price: 0 }],
                travel: travelAmt,
                advance: Math.round(Number(b.advancePaidPaise || 0) / 100),
                status: statusMapped,
                venue: b.eventLocation || 'Studio',
                address: b.eventLocation || '',
                notes: b.notes || '',
              };
            });

            setBookings(dbBookings);
            if (resolvedShopId) {
              await AsyncStorage.setItem(
                `@shilpi_bookings_${resolvedShopId}`,
                JSON.stringify(dbBookings)
              );
            }
            await syncMonthEndNotifications(resolvedShopId, dbBookings, loadedNotifs);
          } else {
            await syncMonthEndNotifications(resolvedShopId, loadedBookingsSnapshot, loadedNotifs);
          }
        } catch (apiErr: any) {
          if (apiErr?.status === 401) {
            Alert.alert('Session Expired', 'Please sign in again to continue.', [
              { text: 'Sign In', onPress: () => onLogout() },
            ]);
          } else {
            console.log('Backend clients fetch warning:', apiErr);
          }
        }
      } catch (e) {
        console.warn('Failed to load storage data:', e);
      }
    };
    loadData();
  }, []);

  const enrichedClients: Client[] = clients.map((c) => {
    const clientBookings = bookings.filter(
      (b) => (b.clientId && String(b.clientId) === String(c.id)) || b.client === c.name
    );
    if (clientBookings.length === 0) return c;
    const totalSales = clientBookings.reduce(
      (sum, b) =>
        sum + b.items.reduce((s, item) => s + item.price, 0) + (b.travel || 0),
      0
    );
    return {
      ...c,
      bookings: Math.max(c.bookings, clientBookings.length),
      sales: totalSales > 0 ? totalSales : c.sales,
      profit: totalSales > 0 ? totalSales : c.profit,
      history: clientBookings.map((b) => ({
        date: `${b.day} ${b.month}`,
        pkg: b.items.map((i) => i.name).join(' + '),
        amount: b.items.reduce((s, item) => s + item.price, 0) + (b.travel || 0),
      })),
    };
  });

  const selectedClient =
    enrichedClients.find((c) => c.id === selectedClientId) || enrichedClients[0] || null;
  const selectedBooking = bookings.find((b) => b.id === selectedOrderId) || bookings[0] || null;

  // Screen titles dictionary matching prototype
  const TITLES: Record<string, string> = {
    home: 'Shilpi',
    clients: 'Clients',
    client: 'Client Profile',
    orders: 'Orders',
    order: 'Booking Details',
    newbooking: 'New Booking',
    newclient: 'Add Client',
    payments: 'Payments',
    packages: 'My Packages',
    gallery: 'My Gallery',
    notifications: 'Notifications',
    reminders: 'Reminders',
    expenses: 'Expenses',
    reports: 'Reports',
    subscription: 'Subscription',
    settings: 'Settings',
  };

  const navigateTo = (nextScreen: string) => {
    if (nextScreen !== currentScreen) {
      screenHistoryRef.current.push(currentScreen);
      setCurrentScreen(nextScreen);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const target = tab === 'earnings' ? 'payments' : tab;
    if (target !== currentScreen) {
      screenHistoryRef.current.push(currentScreen);
      setCurrentScreen(target);
    }
  };

  const handleGoBack = () => {
    if (screenHistoryRef.current.length > 0) {
      const prev = screenHistoryRef.current.pop();
      if (prev) {
        setCurrentScreen(prev);
        if (['home', 'clients', 'orders', 'payments'].includes(prev)) {
          setActiveTab(prev === 'payments' ? 'earnings' : (prev as TabType));
        }
        return;
      }
    }
    // Return to the current active tab or home
    if (currentScreen === 'payments' && activeTab === 'earnings') {
      setActiveTab('home');
      setCurrentScreen('home');
    } else {
      setCurrentScreen(activeTab === 'earnings' ? 'home' : activeTab);
    }
  };

  const handleOpenClient = (clientId: number | string) => {
    setSelectedClientId(clientId);
    navigateTo('client');
  };

  const handleOpenBooking = (bookingId: string) => {
    setSelectedOrderId(bookingId);
    navigateTo('order');
  };

  // Hardware/System Back Button Navigation & Exit Confirmation
  useEffect(() => {
    const handleHardwareBackPress = () => {
      // Priority 1: If exit modal is open, close it
      if (isExitModalVisible) {
        setIsExitModalVisible(false);
        return true;
      }

      // Priority 2: If drawer is open, close it
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        return true;
      }

      // Priority 3: If active action sheet is open, close it
      if (activeSheet) {
        setActiveSheet(null);
        return true;
      }

      // Priority 4: If on any sub-screen or tab other than 'home'
      if (currentScreen !== 'home') {
        if (screenHistoryRef.current.length > 0) {
          const prev = screenHistoryRef.current.pop();
          if (prev) {
            setCurrentScreen(prev);
            if (['home', 'clients', 'orders', 'payments'].includes(prev)) {
              setActiveTab(prev === 'payments' ? 'earnings' : (prev as TabType));
            }
            return true;
          }
        }
        // Fallback: If no history, return to home root
        setActiveTab('home');
        setCurrentScreen('home');
        return true;
      }

      // Priority 5: User is on Home root screen -> prompt custom themed exit modal
      setIsExitModalVisible(true);
      return true; // Prevents default Android app kill
    };

    const backSub = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBackPress
    );

    return () => backSub.remove();
  }, [isExitModalVisible, isDrawerOpen, activeSheet, currentScreen]);

  const handleUpdateBookingStatus = (
    orderId: string,
    status: 'Upcoming' | 'Completed' | 'Closed'
  ) => {
    const updated = bookings.map((b) => (b.id === orderId ? { ...b, status } : b));
    setBookings(updated);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_bookings_${beauticianId}`, JSON.stringify(updated)).catch(() => {});
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(orderId)) {
      const apiStatus =
        status === 'Closed' ? 'completed' : status === 'Completed' ? 'in_progress' : 'confirmed';
      apiClient.patch(`/bookings/${orderId}/status`, { status: apiStatus }).catch(() => {});
    }
  };

  const handleSaveBooking = async (newBookingData: Partial<Booking>) => {
    const tempId = `b_${Date.now()}`;
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = months[now.getMonth()];
    const matchedClient = clients.find(
      (c) =>
        (newBookingData.clientId && String(c.id) === String(newBookingData.clientId)) ||
        c.name === newBookingData.client
    );

    const newBooking: Booking = {
      id: tempId,
      ref: newBookingData.ref || `Booking #${Math.floor(1000 + Math.random() * 9000)}`,
      client: newBookingData.client || 'Client',
      clientId: matchedClient ? String(matchedClient.id) : newBookingData.clientId,
      bookingDate: newBookingData.bookingDate,
      day: newBookingData.day || now.getDate(),
      month: newBookingData.month || currentMonth,
      year: newBookingData.year || now.getFullYear(),
      dateLong: newBookingData.dateLong || `${now.getDate()} ${currentMonth} ${now.getFullYear()}`,
      time: newBookingData.time || '10:00',
      meridiem: newBookingData.meridiem || 'AM',
      items: newBookingData.items || [{ name: 'Bridal Makeup', price: 0 }],
      travel: newBookingData.travel || 0,
      advance: newBookingData.advance || 0,
      status: 'Upcoming',
      venue: newBookingData.venue || 'Studio / Client Residence',
      address: newBookingData.address || '',
      notes: newBookingData.notes || '',
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_bookings_${beauticianId}`, JSON.stringify(updated)).catch(() => {});
    }

    navigateTo('orders');
    setActiveTab('orders');

    // Trigger WhatsApp confirmation sheet with client's name immediately
    const total = newBooking.items.reduce((s, i) => s + i.price, 0) + newBooking.travel;
    const balance = Math.max(0, total - newBooking.advance);
    const serviceNames = newBooking.items.map((i) => i.name).join(' + ') || 'Bridal Look';
    const targetPhone = matchedClient?.phone || getClientPhoneForBooking(newBooking);

    const confirmationMsg = getBookingConfirmationMessage({
      clientName: newBooking.client,
      dateLong: newBooking.dateLong,
      time: newBooking.time,
      meridiem: newBooking.meridiem,
      serviceNames,
      venue: newBooking.venue,
      total,
      advance: newBooking.advance,
      balance,
      notes: newBooking.notes,
      artistName,
      studioName,
    });

    setActiveSheet({
      kicker: 'BOOKING SAVED',
      title: `Send confirmation to ${first(newBooking.client)}?`,
      message: confirmationMsg,
      cta: 'Send on WhatsApp',
      logoUri: studioLogo,
      onConfirm: () => {
        openWhatsAppDirect(targetPhone, confirmationMsg);
      },
    });

    // Persist booking to AWS RDS PostgreSQL when client has a DB UUID
    if (matchedClient && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(matchedClient.id))) {
      try {
        const isoDate =
          newBooking.bookingDate ||
          `${newBooking.year || now.getFullYear()}-${String(Math.max(1, months.indexOf(newBooking.month) + 1)).padStart(2, '0')}-${String(newBooking.day).padStart(2, '0')}`;

        const [hRaw, mRaw] = (newBooking.time || '10:00').split(':');
        let hrs24 = parseInt(hRaw || '10', 10) || 10;
        const mins = parseInt(mRaw || '0', 10) || 0;
        if (newBooking.meridiem === 'PM' && hrs24 < 12) hrs24 += 12;
        if (newBooking.meridiem === 'AM' && hrs24 === 12) hrs24 = 0;
        const startIso = `${isoDate}T${String(hrs24).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00.000Z`;

        const apiItems = newBooking.items.map((item) => ({
          customTitle: item.name,
          quantity: 1,
          unitPricePaise: Math.max(0, Math.round(item.price * 100)),
        }));
        if (newBooking.travel > 0) {
          apiItems.push({
            customTitle: 'Travel Charges',
            quantity: 1,
            unitPricePaise: Math.max(0, Math.round(newBooking.travel * 100)),
          });
        }

        const res = await apiClient.post('/bookings', {
          clientId: String(matchedClient.id),
          bookingDate: isoDate,
          startTime: startIso,
          eventLocation: newBooking.venue,
          advancePaidPaise: Math.max(0, Math.round(newBooking.advance * 100)),
          notes: newBooking.notes || undefined,
          items: apiItems,
        });

        if (res.data?.success && res.data?.data?.id) {
          const savedId = res.data.data.id;
          setBookings((prev) => {
            const synced = prev.map((b) => (b.id === tempId ? { ...b, id: savedId } : b));
            if (beauticianId) {
              AsyncStorage.setItem(`@shilpi_bookings_${beauticianId}`, JSON.stringify(synced)).catch(() => {});
            }
            return synced;
          });
        }
      } catch (bookingErr) {
        console.warn('Backend booking save warning:', bookingErr);
      }
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>, thenCreateBooking?: boolean) => {
    const cleanName = clientData.name?.trim() || '';
    const rawPhone = clientData.phone?.trim() || '';
    const phoneKey = normalizePhoneKey(rawPhone);

    if (!cleanName) {
      Alert.alert('Name Required', 'Please enter the client name.');
      return;
    }
    if (!phoneKey || phoneKey.length < 10) {
      Alert.alert('Mobile Number Required', 'A valid 10-digit mobile number is required.');
      return;
    }

    const existingDup = clients.find((c) => normalizePhoneKey(c.phone) === phoneKey);
    if (existingDup) {
      Alert.alert(
        'Client Already Registered',
        `This client was already registered in the name of "${existingDup.name}".`
      );
      return;
    }

    let clientRecordId: string | number = Date.now();
    const newClient: Client = {
      id: clientRecordId,
      name: cleanName,
      phone: rawPhone,
      bookings: 0,
      sales: 0,
      profit: 0,
      history: [],
      notes: clientData.notes,
      photoUri: clientData.photoUri,
      isActive: true,
    };

    // 1. Persist directly into PostgreSQL Amazon RDS 'clients' table scoped to this studio
    try {
      const res = await apiClient.post('/clients', {
        name: newClient.name,
        phone: newClient.phone,
        notes: newClient.notes || undefined,
        profilePhotoUrl: newClient.photoUri || undefined,
      });

      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.error?.message || 'Failed to save client on server.');
      }

      const saved = res.data.data;
      newClient.id = saved.id;
      newClient.phone = saved.phone || newClient.phone;
      newClient.notes = saved.notes || '';
      newClient.photoUri = saved.profilePhotoUrl || newClient.photoUri;
      newClient.isActive = saved.isActive !== false;
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error?.message || err?.message;
      Alert.alert(
        'Could Not Save Client',
        serverMsg || 'Unable to save client to database. Please try again.'
      );
      return;
    }

    // 2. Update shop-scoped local state and AsyncStorage
    const activeShopId = beauticianId || (await AsyncStorage.getItem('@shilpi_beautician_id'));
    setClients((prev) => {
      const updated = [newClient, ...prev];
      if (activeShopId) {
        AsyncStorage.setItem(`@shilpi_clients_${activeShopId}`, JSON.stringify(updated)).catch(() => {});
      }
      return updated;
    });

    if (thenCreateBooking) {
      setBookingClientName(newClient.name);
      navigateTo('newbooking');
    } else {
      navigateTo('clients');
      setActiveTab('clients');
    }
  };

  const handleImportContacts = async (contacts: { name: string; phone: string }[]) => {
    try {
      const res = await apiClient.post('/clients/import', { contacts });
      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.error?.message || 'Failed to import contacts.');
      }
      const { imported = [], skippedDuplicates = [], skippedInvalid = [] } = res.data.data;

      if (imported.length > 0) {
        const mapped: Client[] = imported.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          bookings: 0,
          sales: 0,
          profit: 0,
          history: [],
          notes: c.notes || '',
          photoUri: c.profilePhotoUrl || undefined,
          isVip: Boolean(c.isVip),
          isActive: c.isActive !== false,
        }));

        const activeShopId = beauticianId || (await AsyncStorage.getItem('@shilpi_beautician_id'));
        setClients((prev) => {
          const updated = [...mapped, ...prev];
          if (activeShopId) {
            AsyncStorage.setItem(`@shilpi_clients_${activeShopId}`, JSON.stringify(updated)).catch(() => {});
          }
          return updated;
        });
      }

      if (skippedDuplicates.length > 0 || skippedInvalid.length > 0) {
        const dupLines = skippedDuplicates
          .slice(0, 3)
          .map((d: any) => `• ${d.phone}: already registered in the name of "${d.existingName}"`)
          .join('\n');
        Alert.alert(
          'Import Summary',
          `Imported ${imported.length} client${imported.length === 1 ? '' : 's'}.` +
            (dupLines ? `\n\nDuplicates skipped:\n${dupLines}` : '') +
            (skippedInvalid.length > 0 ? `\n\n${skippedInvalid.length} missing valid number.` : '')
        );
      } else {
        Alert.alert(
          'Contacts Imported',
          `Added ${imported.length} client${imported.length === 1 ? '' : 's'} to your directory.`
        );
      }

      if (imported.length > 0) {
        navigateTo('clients');
        setActiveTab('clients');
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error?.message || err?.message;
      Alert.alert('Import Failed', serverMsg || 'Could not import selected contacts.');
    }
  };

  const handleAddPackage = (groupName: string, name: string, price: number) => {
    const updated = packageGroups.map((g) =>
      g.name === groupName ? { ...g, items: [...g.items, { name, price }] } : g
    );
    setPackageGroups(updated);
    AsyncStorage.setItem('@shilpi_packages', JSON.stringify(updated)).catch(() => {});
  };

  const handleUpdatePackage = (
    groupName: string,
    oldName: string,
    newName: string,
    newPrice: number,
    newGroupName?: string
  ) => {
    const targetGroup = newGroupName || groupName;
    let updated: PackageGroup[];

    if (targetGroup === groupName) {
      updated = packageGroups.map((g) => {
        if (g.name !== groupName) return g;
        return {
          ...g,
          items: g.items.map((item) =>
            item.name === oldName ? { ...item, name: newName, price: newPrice } : item
          ),
        };
      });
    } else {
      // Moved category
      updated = packageGroups.map((g) => {
        if (g.name === groupName) {
          return { ...g, items: g.items.filter((item) => item.name !== oldName) };
        }
        if (g.name === targetGroup) {
          return { ...g, items: [...g.items, { name: newName, price: newPrice }] };
        }
        return g;
      });
    }

    setPackageGroups(updated);
    AsyncStorage.setItem('@shilpi_packages', JSON.stringify(updated)).catch(() => {});
  };

  const handleDeletePackage = (groupName: string, itemName: string) => {
    const updated = packageGroups.map((g) => {
      if (g.name !== groupName) return g;
      return { ...g, items: g.items.filter((item) => item.name !== itemName) };
    });
    setPackageGroups(updated);
    AsyncStorage.setItem('@shilpi_packages', JSON.stringify(updated)).catch(() => {});
  };

  // Resolves a client phone number from booking record or client database
  const getClientPhoneForBooking = (order: Booking): string => {
    if (order.clientId) {
      const byId = clients.find((c) => String(c.id) === String(order.clientId));
      if (byId && byId.phone) return byId.phone;
    }
    const cleanName = (order.client || '').trim().toLowerCase();
    const byName = clients.find((c) => (c.name || '').trim().toLowerCase() === cleanName);
    if (byName && byName.phone) return byName.phone;

    // Check notes or address for a phone number
    const combined = `${order.notes || ''} ${order.address || ''}`;
    const match = combined.match(/(?:\+91|0)?[6-9]\d{9}/);
    if (match) return match[0];

    return '';
  };

  // WhatsApp Confirm Sheet / Direct Chat Trigger
  const handleOpenConfirmSheet = (order: Booking) => {
    const total = order.items.reduce((s, i) => s + i.price, 0) + (order.travel || 0);
    const balance = Math.max(0, total - (order.advance || 0));
    const serviceNames = order.items.map((i) => i.name).join(' + ') || 'Bridal Styling';
    const clientPhone = getClientPhoneForBooking(order);

    const message = getBookingConfirmationMessage({
      clientName: order.client,
      dateLong: order.dateLong,
      time: order.time,
      meridiem: order.meridiem,
      serviceNames,
      venue: order.venue,
      total,
      advance: order.advance || 0,
      balance,
      notes: order.notes,
      artistName,
      studioName,
    });

    // Directly open client's WhatsApp chat with prefilled template
    openWhatsAppDirect(clientPhone, message);
  };

  // Close Booking Sheet Trigger
  const handleCloseBooking = (order: Booking) => {
    handleUpdateBookingStatus(order.id, 'Closed');
    const serviceLabel = order.items.map((i) => i.name).join(' & ') || 'Client Look';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
    apiClient
      .post('/gallery', {
        title: `${order.client} — ${serviceLabel}`,
        place: order.venue || undefined,
        bookingId: isUuid ? order.id : undefined,
        caption: `Completed ${serviceLabel} for ${first(order.client)} with ${studioName} on Shilpi.`,
      })
      .catch(() => {});

    const clientPhone = getClientPhoneForBooking(order);
    const thankYouMsg = `Thank you *${first(order.client)}*! It was lovely styling you with *${studioName}*. ✨\n\nIf you loved your look, a photo or review would mean the world to us! Looking forward to styling you again soon.\n\nWarm regards,\n*${artistName}*\n*${studioName}*`;

    setActiveSheet({
      kicker: 'WHATSAPP · ORDER CLOSED',
      title: `Thank ${order.client} and ask for review?`,
      message: thankYouMsg,
      cta: 'Send Thank You Note',
      logoUri: studioLogo,
      onConfirm: () => {
        openWhatsAppDirect(clientPhone, thankYouMsg);
      },
    });
  };

  // WhatsApp Direct Client Trigger
  const handleOpenWhatsAppSheet = (clientName: string, phone: string) => {
    const message = getClientDirectMessage({
      clientName,
      artistName,
      studioName,
    });

    // Directly open client's WhatsApp chat with prefilled template
    openWhatsAppDirect(phone, message);
  };

  // Record Partial or Full Due Payment (clears due & records payment in PostgreSQL)
  const handleRecordPayment = async (
    orderId: string,
    amount: number,
    paymentMode: string = 'upi',
    notes?: string
  ): Promise<boolean> => {
    const target = bookings.find((b) => b.id === orderId);
    if (!target) return false;

    const total = target.items.reduce((s, i) => s + i.price, 0) + (target.travel || 0);
    const currentAdvance = target.advance || 0;
    const currentDue = Math.max(0, total - currentAdvance);
    const payAmount = Math.min(amount, currentDue);
    if (payAmount <= 0) return false;

    const newAdvance = currentAdvance + payAmount;
    const remainingDue = Math.max(0, total - newAdvance);

    const updated = bookings.map((b) =>
      b.id === orderId ? { ...b, advance: newAdvance } : b
    );
    setBookings(updated);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_bookings_${beauticianId}`, JSON.stringify(updated)).catch(() => {});
    }

    const payNotif: NotificationItem = {
      id: `pay-${orderId}-${Date.now()}`,
      glyph: '₹',
      title: `Payment received — ${fmt(payAmount)}`,
      body: `${target.client} paid ${fmt(payAmount)}.${
        remainingDue > 0
          ? ` Remaining due: ${fmt(remainingDue)}.`
          : ' Full balance settled!'
      }`,
      time: 'Just now',
      to: 'orders',
    };
    setNotifications((prev) => {
      const next = [payNotif, ...prev];
      if (beauticianId) {
        AsyncStorage.setItem(`@shilpi_notifs_${beauticianId}`, JSON.stringify(next)).catch(() => {});
      }
      return next;
    });

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(orderId)) {
      try {
        const res = await apiClient.post(`/bookings/${orderId}/pay`, {
          amountPaise: Math.round(payAmount * 100),
          paymentMode: paymentMode.toLowerCase(),
          notes: notes || `Payment received: ₹${payAmount}`,
        });
        if (res.data?.success && res.data?.data) {
          const syncedAdvance = Math.round(Number(res.data.data.advancePaidPaise || 0) / 100);
          setBookings((prev) => {
            const next = prev.map((b) => (b.id === orderId ? { ...b, advance: syncedAdvance } : b));
            if (beauticianId) {
              AsyncStorage.setItem(`@shilpi_bookings_${beauticianId}`, JSON.stringify(next)).catch(() => {});
            }
            return next;
          });
        }
      } catch (err) {
        console.warn('Record payment sync warning:', err);
      }
    }

    Alert.alert(
      remainingDue === 0 ? 'Full Balance Cleared 🎉' : 'Payment Recorded',
      `Collected ${fmt(payAmount)} for ${target.client}.${
        remainingDue > 0
          ? ` Remaining due: ${fmt(remainingDue)}.`
          : ' All dues are fully settled!'
      }`
    );

    return true;
  };

  // Mark Booking Fully Paid (clears due in To Collect & records payment in PostgreSQL)
  const handleMarkFullyPaid = async (orderId: string) => {
    const target = bookings.find((b) => b.id === orderId);
    if (!target) return;
    const total = target.items.reduce((s, i) => s + i.price, 0) + (target.travel || 0);
    const balance = Math.max(0, total - (target.advance || 0));
    await handleRecordPayment(orderId, balance, 'upi', 'Full balance settled');
  };

  // Personalized Booking Reminder (Direct to WhatsApp chat with template)
  const handleSendBookingReminder = (order: Booking) => {
    const total = order.items.reduce((s, i) => s + i.price, 0) + (order.travel || 0);
    const balance = Math.max(0, total - (order.advance || 0));
    const serviceNames = order.items.map((i) => i.name).join(' + ') || 'Bridal Appointment';
    const clientPhone = getClientPhoneForBooking(order);

    const message = getBookingReminderMessage({
      clientName: order.client,
      dateLong: order.dateLong,
      time: order.time,
      meridiem: order.meridiem,
      serviceNames,
      venue: order.venue,
      balance,
      artistName,
      studioName,
    });

    // Directly open client's WhatsApp chat with prefilled reminder template
    openWhatsAppDirect(clientPhone, message);
  };

  // Toggle Client VIP status (heart icon in Clients list or Client Detail header)
  const handleToggleClientVip = async (clientId: number | string) => {
    const target = clients.find((c) => String(c.id) === String(clientId));
    if (!target) return;
    const nextVip = !target.isVip;

    const updated = clients.map((c) =>
      String(c.id) === String(clientId) ? { ...c, isVip: nextVip } : c
    );
    setClients(updated);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_clients_${beauticianId}`, JSON.stringify(updated)).catch(() => {});
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(clientId))) {
      try {
        await apiClient.patch(`/clients/${clientId}/vip`, { isVip: nextVip });
      } catch (err) {
        console.warn('Client VIP toggle sync warning:', err);
      }
    }
  };

  const handleUpdateClient = async (
    clientId: number | string,
    payload: { name: string; phone: string; notes: string }
  ): Promise<boolean> => {
    const cleanName = payload.name.trim();
    const rawPhone = payload.phone.trim();
    const phoneKey = normalizePhoneKey(rawPhone);

    if (!cleanName || !phoneKey || phoneKey.length < 10) {
      Alert.alert('Invalid Details', 'Name and valid 10-digit mobile number are required.');
      return false;
    }

    const dup = clients.find(
      (c) => String(c.id) !== String(clientId) && normalizePhoneKey(c.phone) === phoneKey
    );
    if (dup) {
      Alert.alert(
        'Duplicate Mobile Number',
        `This client was already registered in the name of "${dup.name}".`
      );
      return false;
    }

    let nextName = cleanName;
    let nextPhone = rawPhone;
    let nextNotes = payload.notes.trim();

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(clientId))) {
      try {
        const res = await apiClient.patch(`/clients/${clientId}`, {
          name: cleanName,
          phone: rawPhone,
          notes: nextNotes,
        });
        if (!res.data?.success || !res.data?.data) {
          throw new Error(res.data?.error?.message || 'Failed to update client');
        }
        nextName = res.data.data.name || cleanName;
        nextPhone = res.data.data.phone || rawPhone;
        nextNotes = res.data.data.notes || '';
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message || err?.message;
        Alert.alert('Could Not Update Client', msg || 'Please check details and try again.');
        return false;
      }
    }

    const activeShopId = beauticianId || (await AsyncStorage.getItem('@shilpi_beautician_id'));
    const updatedClients = clients.map((c) =>
      String(c.id) === String(clientId)
        ? { ...c, name: nextName, phone: nextPhone, notes: nextNotes }
        : c
    );
    setClients(updatedClients);
    if (activeShopId) {
      AsyncStorage.setItem(`@shilpi_clients_${activeShopId}`, JSON.stringify(updatedClients)).catch(() => {});
    }

    // Keep client names consistent across local bookings
    setBookings((prev) =>
      prev.map((b) =>
        b.clientId && String(b.clientId) === String(clientId) ? { ...b, client: nextName } : b
      )
    );
    return true;
  };

  const handleToggleClientActive = async (clientId: number | string, nextActive: boolean) => {
    const activeShopId = beauticianId || (await AsyncStorage.getItem('@shilpi_beautician_id'));
    const updated = clients.map((c) =>
      String(c.id) === String(clientId) ? { ...c, isActive: nextActive } : c
    );
    setClients(updated);
    if (activeShopId) {
      AsyncStorage.setItem(`@shilpi_clients_${activeShopId}`, JSON.stringify(updated)).catch(() => {});
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(clientId))) {
      try {
        await apiClient.patch(`/clients/${clientId}/status`, { isActive: nextActive });
      } catch (err) {
        console.warn('Client active toggle sync warning:', err);
      }
    }
  };

  const handleUpdateClientPhoto = async (clientId: number | string, photoUri: string) => {
    const activeShopId = beauticianId || (await AsyncStorage.getItem('@shilpi_beautician_id'));
    const updated = clients.map((c) =>
      String(c.id) === String(clientId) ? { ...c, photoUri } : c
    );
    setClients(updated);
    if (activeShopId) {
      AsyncStorage.setItem(`@shilpi_clients_${activeShopId}`, JSON.stringify(updated)).catch(() => {});
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(clientId))) {
      try {
        await apiClient.patch(`/clients/${clientId}`, { profilePhotoUrl: photoUri });
      } catch (err) {
        console.warn('Client photo sync warning:', err);
      }
    }
  };

  // Studio Expenses CRUD backed by PostgreSQL + real-time Home/Reports sync
  const recalcMonthExpenses = (list: ExpenseRecord[]) => {
    const t = new Date();
    const curPrefix = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
    const total = list
      .filter((e) => String(e.expenseDate || '').startsWith(curPrefix))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    setMonthExpenses(total);
  };

  const handleAddExpense = async (payload: {
    title: string;
    category: string;
    amount: number;
    expenseDate: string;
    notes?: string;
  }) => {
    const res = await apiClient.post('/expenses', {
      title: payload.title,
      category: payload.category,
      amountPaise: Math.max(100, Math.round(payload.amount * 100)),
      expenseDate: payload.expenseDate,
      notes: payload.notes || undefined,
    });

    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.error?.message || 'Failed to save expense');
    }

    const e = res.data.data;
    const shortM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dtStr = String(e.expenseDate || payload.expenseDate).slice(0, 10);
    const dtObj = new Date(`${dtStr}T00:00:00Z`);
    const dNum = isNaN(dtObj.getUTCDate()) ? '' : String(dtObj.getUTCDate()).padStart(2, '0');
    const mStr = isNaN(dtObj.getUTCMonth()) ? '' : shortM[dtObj.getUTCMonth()] || '';

    const createdRecord: ExpenseRecord = {
      id: e.id,
      title: e.title,
      category: e.category,
      categoryLabel: e.categoryLabel || e.category,
      amount: Math.round(Number(e.amountPaise || 0) / 100),
      expenseDate: dtStr,
      dateLabel: dNum && mStr ? `${dNum} ${mStr}` : dtStr,
      notes: e.notes || '',
    };

    const next = [createdRecord, ...expenses];
    setExpenses(next);
    recalcMonthExpenses(next);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_expenses_${beauticianId}`, JSON.stringify(next)).catch(() => {});
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const next = expenses.filter((e) => e.id !== expenseId);
    setExpenses(next);
    recalcMonthExpenses(next);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_expenses_${beauticianId}`, JSON.stringify(next)).catch(() => {});
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(expenseId)) {
      await apiClient.delete(`/expenses/${expenseId}`).catch(() => {});
    }
  };

  const handleUpdateExpense = async (
    expenseId: string,
    payload: {
      title: string;
      category: string;
      amount: number;
      expenseDate: string;
      notes?: string;
    }
  ) => {
    const res = await apiClient.patch(`/expenses/${expenseId}`, {
      title: payload.title,
      category: payload.category,
      amountPaise: Math.max(100, Math.round(payload.amount * 100)),
      expenseDate: payload.expenseDate,
      notes: payload.notes || undefined,
    });

    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.error?.message || 'Failed to update expense');
    }

    const e = res.data.data;
    const shortM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dtStr = String(e.expenseDate || payload.expenseDate).slice(0, 10);
    const dtObj = new Date(`${dtStr}T00:00:00Z`);
    const dNum = isNaN(dtObj.getUTCDate()) ? '' : String(dtObj.getUTCDate()).padStart(2, '0');
    const mStr = isNaN(dtObj.getUTCMonth()) ? '' : shortM[dtObj.getUTCMonth()] || '';

    const updatedRecord: ExpenseRecord = {
      id: e.id,
      title: e.title,
      category: e.category,
      categoryLabel: e.categoryLabel || e.category,
      amount: Math.round(Number(e.amountPaise || 0) / 100),
      expenseDate: dtStr,
      dateLabel: dNum && mStr ? `${dNum} ${mStr}` : dtStr,
      notes: e.notes || '',
    };

    const next = expenses.map((item) => (item.id === expenseId ? updatedRecord : item));
    setExpenses(next);
    recalcMonthExpenses(next);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_expenses_${beauticianId}`, JSON.stringify(next)).catch(() => {});
    }
  };

  // Studio Reminders CRUD backed by PostgreSQL + local AsyncStorage cache
  const handleAddReminder = async (payload: {
    text: string;
    kind: string;
    remindAt: string;
    bookingId?: string | null;
  }) => {
    const res = await apiClient.post('/reminders', {
      text: payload.text,
      kind: payload.kind,
      remindAt: payload.remindAt,
      bookingId: payload.bookingId || null,
    });

    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.error?.message || 'Failed to save reminder');
    }

    const r = res.data.data;
    const created: ReminderRecord = {
      id: r.id,
      text: r.text,
      kind: r.kind || payload.kind,
      remindAt: r.remindAt || payload.remindAt,
      isCompleted: !!r.isCompleted,
      bookingId: r.bookingId || null,
    };

    const next = [...reminders, created].sort(
      (a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
    );
    setReminders(next);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_reminders_${beauticianId}`, JSON.stringify(next)).catch(() => {});
    }

    // Schedule system notification outside of the app
    scheduleReminderNotification({
      id: created.id,
      text: created.text,
      kind: created.kind,
      remindAt: created.remindAt,
    }).then((notifId) => {
      if (notifId) {
        AsyncStorage.setItem(`@shilpi_notif_${created.id}`, notifId).catch(() => {});
      }
    });
  };

  const handleToggleReminder = async (reminderId: string) => {
    const target = reminders.find((r) => r.id === reminderId);
    if (!target) return;
    const nextCompleted = !target.isCompleted;
    const next = reminders.map((r) =>
      r.id === reminderId ? { ...r, isCompleted: nextCompleted } : r
    );
    setReminders(next);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_reminders_${beauticianId}`, JSON.stringify(next)).catch(() => {});
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(reminderId)) {
      await apiClient.patch(`/reminders/${reminderId}`, { isCompleted: nextCompleted }).catch(() => {});
    }

    // Sync device notification state
    if (nextCompleted) {
      AsyncStorage.getItem(`@shilpi_notif_${reminderId}`).then((notifId) => {
        if (notifId) {
          cancelReminderNotification(notifId);
          AsyncStorage.removeItem(`@shilpi_notif_${reminderId}`).catch(() => {});
        }
      });
    } else {
      scheduleReminderNotification({
        id: target.id,
        text: target.text,
        kind: target.kind,
        remindAt: target.remindAt,
      }).then((notifId) => {
        if (notifId) {
          AsyncStorage.setItem(`@shilpi_notif_${target.id}`, notifId).catch(() => {});
        }
      });
    }
  };

  const handleUpdateReminder = async (
    reminderId: string,
    payload: {
      text: string;
      kind: string;
      remindAt: string;
      bookingId?: string | null;
    }
  ) => {
    const res = await apiClient.patch(`/reminders/${reminderId}`, {
      text: payload.text,
      kind: payload.kind,
      remindAt: payload.remindAt,
      bookingId: payload.bookingId || null,
    });

    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.error?.message || 'Failed to update reminder');
    }

    const r = res.data.data;
    const updated: ReminderRecord = {
      id: r.id,
      text: r.text,
      kind: r.kind || payload.kind,
      remindAt: r.remindAt || payload.remindAt,
      isCompleted: !!r.isCompleted,
      bookingId: r.bookingId || null,
    };

    const next = reminders
      .map((item) => (item.id === reminderId ? updated : item))
      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
    setReminders(next);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_reminders_${beauticianId}`, JSON.stringify(next)).catch(() => {});
    }

    // Refresh scheduled notification
    AsyncStorage.getItem(`@shilpi_notif_${reminderId}`).then((notifId) => {
      if (notifId) {
        cancelReminderNotification(notifId);
      }
      scheduleReminderNotification({
        id: updated.id,
        text: updated.text,
        kind: updated.kind,
        remindAt: updated.remindAt,
      }).then((newNotifId) => {
        if (newNotifId) {
          AsyncStorage.setItem(`@shilpi_notif_${updated.id}`, newNotifId).catch(() => {});
        }
      });
    });
  };

  const handleDeleteReminder = async (reminderId: string) => {
    // Cancel scheduled notification
    AsyncStorage.getItem(`@shilpi_notif_${reminderId}`).then((notifId) => {
      if (notifId) {
        cancelReminderNotification(notifId);
        AsyncStorage.removeItem(`@shilpi_notif_${reminderId}`).catch(() => {});
      }
    });
    const next = reminders.filter((r) => r.id !== reminderId);
    setReminders(next);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_reminders_${beauticianId}`, JSON.stringify(next)).catch(() => {});
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(reminderId)) {
      await apiClient.delete(`/reminders/${reminderId}`).catch(() => {});
    }
  };

  // Payments Reminder (Direct to WhatsApp chat with template)
  const handleOpenRemindSheet = (pendingList?: Booking[]) => {
    const unpaid = (pendingList && pendingList.length > 0 ? pendingList : bookings).filter((b) => {
      const total = b.items.reduce((s, i) => s + (i.price || 0), 0) + (b.travel || 0);
      return total - (b.advance || 0) > 0;
    });

    if (unpaid.length === 0) {
      Alert.alert('All Settled', 'All client balances are settled right now.');
      return;
    }

    const firstTarget = unpaid[0];
    const firstTotal =
      firstTarget.items.reduce((s, i) => s + (i.price || 0), 0) + (firstTarget.travel || 0);
    const firstDue = Math.max(0, firstTotal - (firstTarget.advance || 0));
    const firstPhone = getClientPhoneForBooking(firstTarget);
    const serviceNames = firstTarget.items.map((i) => i.name).join(' + ') || 'Styling Session';

    const reminderMsg = getPaymentReminderMessage({
      clientName: firstTarget.client,
      dateLong: firstTarget.dateLong,
      serviceNames,
      dueAmount: firstDue,
      artistName,
      studioName,
    });

    // Directly open client's WhatsApp chat with prefilled payment reminder template
    openWhatsAppDirect(firstPhone, reminderMsg);
  };

  // Subscription UPI Sheet
  const handlePayByUpi = (planMonths: number, total: number) => {
    setActiveSheet({
      kicker: 'SHILPI PREMIUM · PAYMENT',
      title: `Pay ${fmt(total)} for ${planMonths} months?`,
      message: `Shilpi Premium · ${planMonths} months\n${fmt(total / planMonths)} / month (incl. GST)\n\nPlan total ${fmt(total)}\nGST (18%) included ${fmt(Math.round(total - total / 1.18))}\n\nA GST invoice is emailed immediately after UPI payment.`,
      cta: 'Pay by UPI',
      onConfirm: () => {
        navigateTo('settings');
      },
    });
  };

  // Center FAB (+) Action -> Opens New Booking directly as requested
  const handleNewBooking = () => {
    setBookingClientName(undefined);
    setBookingInitialDate(undefined);
    setBookingInitialMonth(undefined);
    setBookingInitialYear(undefined);
    navigateTo('newbooking');
  };

  // Real sidebar metrics synced with active studio bookings & month
  const nowDate = new Date();
  const shortMonthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const curMonthShortStr = shortMonthsList[nowDate.getMonth()];
  const curYearNum = nowDate.getFullYear();
  const curDayNum = nowDate.getDate();

  const sidebarMonthBookingsCount = bookings.filter((b) => {
    if (b.bookingDate) {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.bookingDate));
      if (m) {
        return Number(m[1]) === curYearNum && Number(m[2]) - 1 === nowDate.getMonth();
      }
    }
    return b.month === curMonthShortStr && (!b.year || b.year === curYearNum);
  }).length;

  const sidebarToCollectAmount = bookings.reduce((sum, b) => {
    const bTotal = b.items.reduce((s, item) => s + item.price, 0) + (b.travel || 0);
    return sum + Math.max(0, bTotal - (b.advance || 0));
  }, 0);

  const sidebarTodayBookingsCount = bookings.filter((b) => {
    if (b.status !== 'Upcoming') return false;
    if (b.bookingDate) {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.bookingDate));
      if (m) {
        return (
          Number(m[1]) === curYearNum &&
          Number(m[2]) - 1 === nowDate.getMonth() &&
          Number(m[3]) === curDayNum
        );
      }
    }
    return b.day === curDayNum && b.month === curMonthShortStr && (!b.year || b.year === curYearNum);
  }).length;

  const showTabs =
    currentScreen !== 'newbooking' &&
    currentScreen !== 'newclient' &&
    currentScreen !== 'qr_scanner';

  return (
    <View style={styles.container}>
      {/* 1. Curved Black Top Header */}
      <TopHeader
        screen={currentScreen}
        title={TITLES[currentScreen] || 'SHILPI'}
        hasUnread={notifications.length > 0}
        onOpenMenu={() => setIsDrawerOpen(true)}
        onGoBack={handleGoBack}
        onOpenNotifications={() => navigateTo('notifications')}
      />

      {/* 2. Active Screen Content */}
      <View style={styles.content}>
        {currentScreen === 'home' && (
          <HomeScreen
            bookings={bookings}
            monthExpenses={monthExpenses}
            artistName={artistName}
            onOpenBooking={handleOpenBooking}
            onOpenOrders={() => handleTabChange('orders')}
            onSendBookingReminder={handleSendBookingReminder}
            onCloseBooking={handleCloseBooking}
            onMarkFullyPaid={handleMarkFullyPaid}
            onStartNewBooking={(day, month, year) => {
              setBookingInitialDate(day);
              setBookingInitialMonth(month);
              setBookingInitialYear(year);
              setBookingClientName(undefined);
              navigateTo('newbooking');
            }}
          />
        )}

        {currentScreen === 'clients' && (
          <ClientsScreen
            clients={enrichedClients}
            onOpenClient={handleOpenClient}
            onToggleVip={handleToggleClientVip}
            onStartNewClient={() => navigateTo('newclient')}
          />
        )}

        {currentScreen === 'client' && (
          <ClientDetailScreen
            client={selectedClient}
            allClients={enrichedClients}
            bookings={bookings}
            onGoBack={handleGoBack}
            onOpenWhatsAppSheet={handleOpenWhatsAppSheet}
            onToggleVip={handleToggleClientVip}
            onUpdateClient={handleUpdateClient}
            onToggleActive={handleToggleClientActive}
            onUpdatePhoto={handleUpdateClientPhoto}
            onRecordPayment={handleRecordPayment}
            onNewBookingForClient={(clientName) => {
              setBookingClientName(clientName);
              setBookingInitialDate(undefined);
              setBookingInitialMonth(undefined);
              setBookingInitialYear(undefined);
              navigateTo('newbooking');
            }}
          />
        )}

        {currentScreen === 'orders' && (
          <OrdersScreen
            bookings={bookings}
            onOpenBooking={handleOpenBooking}
            onStartNewBooking={() => {
              setBookingClientName(undefined);
              setBookingInitialDate(undefined);
              setBookingInitialMonth(undefined);
              setBookingInitialYear(undefined);
              navigateTo('newbooking');
            }}
          />
        )}

        {currentScreen === 'order' && (
          <OrderDetailScreen
            order={selectedBooking}
            onGoBack={handleGoBack}
            onUpdateStatus={handleUpdateBookingStatus}
            onOpenConfirmSheet={handleOpenConfirmSheet}
            onCloseBooking={handleCloseBooking}
            onMarkFullyPaid={handleMarkFullyPaid}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {currentScreen === 'newbooking' && (
          <NewBookingScreen
            clients={enrichedClients.filter((c) => c.isActive !== false)}
            packageGroups={packageGroups}
            bookings={bookings}
            initialDay={bookingInitialDate}
            initialMonth={bookingInitialMonth}
            initialYear={bookingInitialYear}
            initialClientName={bookingClientName}
            onSaveBooking={handleSaveBooking}
            onGoBack={handleGoBack}
            onStartNewClient={() => navigateTo('newclient')}
          />
        )}

        {currentScreen === 'newclient' && (
          <NewClientScreen
            existingClients={enrichedClients}
            onSaveClient={handleSaveClient}
            onImportContacts={handleImportContacts}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'payments' && (
          <PaymentsScreen
            bookings={bookings}
            registeredAt={registeredAt}
            onOpenBooking={(booking) => handleOpenBooking(booking.id)}
            onOpenRemindSheet={handleOpenRemindSheet}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'packages' && (
          <PackagesScreen
            packageGroups={packageGroups}
            onAddPackage={handleAddPackage}
            onUpdatePackage={handleUpdatePackage}
            onDeletePackage={handleDeletePackage}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'gallery' && (
          <GalleryScreen
            beauticianId={beauticianId || undefined}
            studioName={studioName}
            artistName={artistName}
            studioLogo={studioLogo}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'notifications' && (
          <NotificationsScreen
            notifications={notifications}
            onNavigate={(screen) => navigateTo(screen)}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'reminders' && (
          <RemindersScreen
            reminders={reminders}
            bookings={bookings}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onUpdateReminder={handleUpdateReminder}
            onDeleteReminder={handleDeleteReminder}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'expenses' && (
          <ExpensesScreen
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'reports' && (
          <ReportsScreen
            bookings={bookings}
            expenses={expenses}
            monthExpenses={monthExpenses}
            registeredAt={registeredAt}
            studioName={studioName}
            artistName={artistName}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'subscription' && (
          <SubscriptionScreen onPayByUpi={handlePayByUpi} onGoBack={handleGoBack} />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            artistName={artistName}
            studioName={studioName}
            studioLogo={studioLogo}
            studioPhone={studioPhone}
            studioCity={studioCity}
            studioRole={studioRole}
            isPremium={isPremium}
            usage={{
              orders: bookings.length,
              clients: enrichedClients.length,
              packages: packageGroups.reduce((s, g) => s + g.items.length, 0),
              reminders: reminders.length,
              closes: bookings.filter((b) => b.status === 'Closed').length,
            }}
            onGoToSubscription={() => navigateTo('subscription')}
            onLogout={onLogout}
            onGoBack={handleGoBack}
            onUpdateProfile={(updated) => {
              if (updated.artistName !== undefined) setArtistName(updated.artistName);
              if (updated.studioName !== undefined) setStudioName(updated.studioName);
              if (updated.studioLogo !== undefined) setStudioLogo(updated.studioLogo);
              if (updated.studioPhone !== undefined) setStudioPhone(updated.studioPhone);
              if (updated.studioCity !== undefined) setStudioCity(updated.studioCity);
              if (updated.studioRole !== undefined) setStudioRole(updated.studioRole);
            }}
          />
        )}
      </View>

      {/* 3. Bottom Navigation Bar with Center FAB */}
      {showTabs && (
        <BottomTabBar
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          onPressNewBooking={handleNewBooking}
        />
      )}

      {/* 4. Slide-in Drawer Menu */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(screen) => {
          setIsDrawerOpen(false);
          if (screen === 'qr_scanner') {
            onOpenQrScanner();
          } else if (screen === 'payments' || screen === 'earnings') {
            setActiveTab('earnings');
            navigateTo('payments');
          } else if (screen === 'home' || screen === 'clients' || screen === 'orders') {
            setActiveTab(screen);
            navigateTo(screen);
          } else {
            navigateTo(screen);
          }
        }}
        onLogout={onLogout}
        ownerName={artistName}
        logoUri={studioLogo}
        monthBookingsCount={sidebarMonthBookingsCount}
        toCollectAmount={sidebarToCollectAmount}
        unreadNotificationsCount={notifications.length}
        todayBookingsCount={sidebarTodayBookingsCount}
        isPremium={isPremium}
      />

      {/* 5. Custom Themed Exit Confirmation Modal */}
      <ExitConfirmModal
        visible={isExitModalVisible}
        onCancel={() => setIsExitModalVisible(false)}
        onConfirmExit={() => {
          setIsExitModalVisible(false);
          BackHandler.exitApp();
        }}
      />

      {/* 6. Action Bottom Sheet */}
      <ActionBottomSheet
        sheet={activeSheet}
        onClose={() => setActiveSheet(null)}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    backgroundColor: '#121212',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: Platform.OS === 'ios' ? 94 : 84,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  fabPlus: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
  },
});
