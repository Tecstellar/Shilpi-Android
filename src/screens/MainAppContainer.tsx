import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';
import { Colors } from '../theme/colors';
import {
  INITIAL_PKG_GROUPS,
  Client,
  Booking,
  PackageGroup,
  NotificationItem,
  fmt,
  first,
} from '../data/prototypeData';

import { TopHeader } from '../components/TopHeader';
import { BottomTabBar, TabType } from '../components/BottomTabBar';
import { DrawerMenu } from '../components/DrawerMenu';
import { ActionBottomSheet, ActionSheetData } from '../components/ActionBottomSheet';

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

  // App Data State — Strictly scoped to authenticated studio (beauticianId)
  const [beauticianId, setBeauticianId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<number>(0);
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>(INITIAL_PKG_GROUPS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [artistName, setArtistName] = useState('Artist');
  const [studioName, setStudioName] = useState('Shilpi Studio');
  const [studioLogo, setStudioLogo] = useState<string | undefined>();

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
        }

        const storedPackages = await AsyncStorage.getItem('@shilpi_packages');
        if (storedPackages) {
          setPackageGroups(JSON.parse(storedPackages));
        }

        // Hydrate live studio identity from backend (/auth/me)
        try {
          const meRes = await apiClient.get('/auth/me');
          if (meRes.data?.success && meRes.data?.beautician) {
            const b = meRes.data.beautician;
            resolvedShopId = b.id;
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

          const [storedClients, storedBookings, storedNotifs] = await Promise.all([
            AsyncStorage.getItem(`@shilpi_clients_${resolvedShopId}`),
            AsyncStorage.getItem(`@shilpi_bookings_${resolvedShopId}`),
            AsyncStorage.getItem(`@shilpi_notifs_${resolvedShopId}`),
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

        // Fetch shop-scoped clients, bookings & dashboard metrics directly from AWS RDS PostgreSQL
        try {
          const [clientsRes, bookingsRes, overviewRes] = await Promise.all([
            apiClient.get('/clients'),
            apiClient.get('/bookings').catch(() => null),
            apiClient.get('/dashboard/overview').catch(() => null),
          ]);

          if (overviewRes?.data?.success && overviewRes.data?.data?.metrics) {
            const rawExpPaise = Number(overviewRes.data.data.metrics.totalExpensesPaise || 0);
            setMonthExpenses(Math.round(rawExpPaise / 100));
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
                bookingDate: b.bookingDate,
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'earnings') {
      setCurrentScreen('payments');
    } else {
      setCurrentScreen(tab);
    }
  };

  const handleGoBack = () => {
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
    setCurrentScreen('client');
  };

  const handleOpenBooking = (bookingId: string) => {
    setSelectedOrderId(bookingId);
    setCurrentScreen('order');
  };

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

    setCurrentScreen('orders');
    setActiveTab('orders');

    // Trigger WhatsApp confirmation sheet with client's name immediately
    const total = newBooking.items.reduce((s, i) => s + i.price, 0) + newBooking.travel;
    const balance = Math.max(0, total - newBooking.advance);
    setActiveSheet({
      kicker: 'BOOKING SAVED',
      title: `Send confirmation to ${first(newBooking.client)}?`,
      message: `Hi ${first(newBooking.client)}, your booking is confirmed.\n\n${newBooking.dateLong} · ${newBooking.time} ${newBooking.meridiem}\n${newBooking.items.map((i) => i.name).join(' + ')}\n${newBooking.venue}\n\nTotal ${fmt(total)} · Advance ${fmt(newBooking.advance)} · Balance ${fmt(balance)}${newBooking.notes ? `\nNotes: ${newBooking.notes}` : ''}\n\n— ${artistName}, Shilpi`,
      cta: 'Send on WhatsApp',
      logoUri: studioLogo,
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
    let clientRecordId: string | number = Date.now();
    const newClient: Client = {
      id: clientRecordId,
      name: clientData.name?.trim() || 'New Client',
      phone: clientData.phone?.trim() || '+91 98000 00000',
      bookings: 0,
      sales: 0,
      profit: 0,
      history: [],
      notes: clientData.notes,
      photoUri: clientData.photoUri,
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
      newClient.notes = saved.notes || '';
      newClient.photoUri = saved.profilePhotoUrl || newClient.photoUri;
    } catch (err: any) {
      Alert.alert(
        'Could Not Save Client',
        err?.message || 'Unable to save client to database. Please try again.'
      );
      return;
    }

    // 2. Update shop-scoped local state and AsyncStorage
    const activeShopId = beauticianId || (await AsyncStorage.getItem('@shilpi_beautician_id'));
    setClients((prev) => {
      const filtered = prev.filter((c) => c.phone !== newClient.phone && c.id !== newClient.id);
      const updated = [newClient, ...filtered];
      if (activeShopId) {
        AsyncStorage.setItem(`@shilpi_clients_${activeShopId}`, JSON.stringify(updated)).catch(() => {});
      }
      return updated;
    });

    if (thenCreateBooking) {
      setBookingClientName(newClient.name);
      setCurrentScreen('newbooking');
    } else {
      setCurrentScreen('clients');
      setActiveTab('clients');
    }
  };

  const handleAddPackage = (groupName: string, name: string, price: number) => {
    const updated = packageGroups.map((g) =>
      g.name === groupName ? { ...g, items: [...g.items, { name, price }] } : g
    );
    setPackageGroups(updated);
    AsyncStorage.setItem('@shilpi_packages', JSON.stringify(updated)).catch(() => {});
  };

  // WhatsApp Confirm Sheet Trigger
  const handleOpenConfirmSheet = (order: Booking) => {
    const total = order.items.reduce((s, i) => s + i.price, 0) + order.travel;
    const balance = total - order.advance;
    setActiveSheet({
      kicker: 'WHATSAPP · ORDER CONFIRMATION',
      title: `Send to ${order.client}?`,
      message: `Hi ${first(order.client)}, your booking is confirmed.\n\n${order.dateLong} · ${order.time} ${order.meridiem}\n${order.items.map((i) => i.name).join(' + ')}\n${order.venue}\n\nTotal ${fmt(total)} · Advance ${fmt(order.advance)} · Balance ${fmt(balance)}\n\n— ${artistName}, Shilpi`,
      cta: 'Send Message',
      logoUri: studioLogo,
    });
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

    setActiveSheet({
      kicker: 'WHATSAPP · ORDER CLOSED',
      title: `Thank ${order.client} and ask for review?`,
      message: `Thank you ${first(order.client)}! It was lovely working with you.\n\nIf you liked the look, a photo or a review would mean a lot — I would love to add it to my portfolio.\n\n— ${artistName}, Shilpi`,
      cta: 'Open My Gallery & Drop Photos',
      logoUri: studioLogo,
      onConfirm: () => {
        setCurrentScreen('gallery');
      },
    });
  };

  // WhatsApp Direct Client Sheet
  const handleOpenWhatsAppSheet = (clientName: string, phone: string) => {
    setActiveSheet({
      kicker: 'WHATSAPP DIRECT',
      title: `Message ${clientName}?`,
      message: `Hi ${first(clientName)}, hope you are doing well! Let me know if you have any upcoming dates — happy to block them for you.\n\n— ${artistName}, Shilpi`,
      cta: 'Open WhatsApp',
    });
  };

  // Mark Booking Fully Paid (clears due in To Collect & records payment in PostgreSQL)
  const handleMarkFullyPaid = async (orderId: string) => {
    const target = bookings.find((b) => b.id === orderId);
    if (!target) return;

    const total = target.items.reduce((s, i) => s + i.price, 0) + (target.travel || 0);
    const paidDiff = Math.max(0, total - (target.advance || 0));

    const updated = bookings.map((b) =>
      b.id === orderId ? { ...b, advance: total } : b
    );
    setBookings(updated);
    if (beauticianId) {
      AsyncStorage.setItem(`@shilpi_bookings_${beauticianId}`, JSON.stringify(updated)).catch(() => {});
    }

    if (paidDiff > 0) {
      const payNotif: NotificationItem = {
        id: `pay-${orderId}-${Date.now()}`,
        glyph: '₹',
        title: `Payment received — ${fmt(paidDiff)}`,
        body: `${target.client} settled full balance for ${target.day} ${target.month}.`,
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
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(orderId)) {
      try {
        const res = await apiClient.post(`/bookings/${orderId}/pay`, {
          markFullyPaid: true,
          paymentMode: 'upi',
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
        console.warn('Mark fully paid sync warning:', err);
      }
    }

    Alert.alert('Fully Paid', `${target.client}'s balance is now marked as fully paid.`);
  };

  // Personalized Booking Reminder Sheet (from Home Calendar or Order)
  const handleSendBookingReminder = (order: Booking) => {
    const total = order.items.reduce((s, i) => s + i.price, 0) + (order.travel || 0);
    const balance = Math.max(0, total - (order.advance || 0));
    setActiveSheet({
      kicker: 'WHATSAPP · BOOKING REMINDER',
      title: `Send reminder to ${first(order.client)}?`,
      message: `Hi ${first(order.client)}, a gentle reminder for your appointment on ${order.dateLong} at ${order.time} ${order.meridiem}.\n\nService: ${order.items.map((i) => i.name).join(' + ')}\nVenue: ${order.venue}${balance > 0 ? `\nBalance due: ${fmt(balance)}` : '\nPayment status: Fully Paid'}\n\nLooking forward to styling you!\n— ${artistName}, ${studioName}`,
      cta: 'Send Reminder',
      logoUri: studioLogo,
    });
  };

  // Payments Reminder Sheet
  const handleOpenRemindSheet = () => {
    setActiveSheet({
      kicker: 'WHATSAPP · PAYMENT REMINDER',
      title: 'Send reminder for pending balance?',
      message: `Hi, a gentle reminder — your pending booking balance is due. You can pay by UPI.\n\nThank you!\n— ${artistName}, Shilpi`,
      cta: 'Send Reminder',
    });
  };

  // Subscription UPI Sheet
  const handlePayByUpi = (planMonths: number, total: number) => {
    setActiveSheet({
      kicker: 'SHILPI PREMIUM · PAYMENT',
      title: `Pay ${fmt(total)} for ${planMonths} months?`,
      message: `Shilpi Premium · ${planMonths} months\n${fmt(total / planMonths)} / month (incl. GST)\n\nPlan total ${fmt(total)}\nGST (18%) included ${fmt(Math.round(total - total / 1.18))}\n\nA GST invoice is emailed immediately after UPI payment.`,
      cta: 'Pay by UPI',
      onConfirm: () => {
        setCurrentScreen('settings');
      },
    });
  };

  // Center FAB (+) Action -> Opens New Booking directly as requested
  const handleNewBooking = () => {
    setBookingClientName(undefined);
    setBookingInitialDate(undefined);
    setBookingInitialMonth(undefined);
    setBookingInitialYear(undefined);
    setCurrentScreen('newbooking');
  };

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
        onOpenNotifications={() => setCurrentScreen('notifications')}
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
              setCurrentScreen('newbooking');
            }}
          />
        )}

        {currentScreen === 'clients' && (
          <ClientsScreen
            clients={enrichedClients}
            onOpenClient={handleOpenClient}
            onStartNewClient={() => setCurrentScreen('newclient')}
          />
        )}

        {currentScreen === 'client' && (
          <ClientDetailScreen
            client={selectedClient}
            onGoBack={handleGoBack}
            onOpenWhatsAppSheet={handleOpenWhatsAppSheet}
            onNewBookingForClient={(clientName) => {
              setBookingClientName(clientName);
              setBookingInitialDate(undefined);
              setBookingInitialMonth(undefined);
              setBookingInitialYear(undefined);
              setCurrentScreen('newbooking');
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
              setCurrentScreen('newbooking');
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
          />
        )}

        {currentScreen === 'newbooking' && (
          <NewBookingScreen
            clients={enrichedClients}
            packageGroups={packageGroups}
            bookings={bookings}
            initialDay={bookingInitialDate}
            initialMonth={bookingInitialMonth}
            initialYear={bookingInitialYear}
            initialClientName={bookingClientName}
            onSaveBooking={handleSaveBooking}
            onGoBack={handleGoBack}
            onStartNewClient={() => setCurrentScreen('newclient')}
          />
        )}

        {currentScreen === 'newclient' && (
          <NewClientScreen onSaveClient={handleSaveClient} onGoBack={handleGoBack} />
        )}

        {currentScreen === 'payments' && (
          <PaymentsScreen
            onOpenRemindSheet={handleOpenRemindSheet}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'packages' && (
          <PackagesScreen
            packageGroups={packageGroups}
            onAddPackage={handleAddPackage}
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
            onNavigate={(screen) => setCurrentScreen(screen)}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'reminders' && <RemindersScreen onGoBack={handleGoBack} />}

        {currentScreen === 'expenses' && <ExpensesScreen onGoBack={handleGoBack} />}

        {currentScreen === 'reports' && (
          <ReportsScreen
            bookings={bookings}
            monthExpenses={monthExpenses}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'subscription' && (
          <SubscriptionScreen onPayByUpi={handlePayByUpi} onGoBack={handleGoBack} />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            onGoToSubscription={() => setCurrentScreen('subscription')}
            onLogout={onLogout}
            onGoBack={handleGoBack}
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
          if (screen === 'qr_scanner') {
            onOpenQrScanner();
          } else if (screen === 'payments') {
            setActiveTab('earnings');
            setCurrentScreen('payments');
          } else if (screen === 'home' || screen === 'clients' || screen === 'orders') {
            setActiveTab(screen);
            setCurrentScreen(screen);
          } else {
            setCurrentScreen(screen);
          }
        }}
        onLogout={onLogout}
        ownerName={artistName}
        logoUri={studioLogo}
      />

      {/* 6. Action Bottom Sheet */}
      <ActionBottomSheet
        sheet={activeSheet}
        onClose={() => setActiveSheet(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    shadowColor: Colors.accent,
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
