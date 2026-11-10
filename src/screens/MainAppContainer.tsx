import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Drawer & Sheet States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActionSheetData | null>(null);

  // App Data State — Clean initial state (starts empty, persisted in AsyncStorage)
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>(INITIAL_PKG_GROUPS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [artistName, setArtistName] = useState('Artist');
  const [studioLogo, setStudioLogo] = useState<string | undefined>();

  // Load storage data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('@shilpi_profile');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (parsed.ownerName?.trim()) {
            setArtistName(parsed.ownerName.trim());
          } else if (parsed.businessName?.trim()) {
            setArtistName(parsed.businessName.trim());
          }
          if (parsed.logoUri) {
            setStudioLogo(parsed.logoUri);
          }
        }

        const storedClients = await AsyncStorage.getItem('@shilpi_clients');
        if (storedClients) {
          setClients(JSON.parse(storedClients));
        }

        const storedBookings = await AsyncStorage.getItem('@shilpi_bookings');
        if (storedBookings) {
          setBookings(JSON.parse(storedBookings));
        }

        const storedNotifs = await AsyncStorage.getItem('@shilpi_notifs');
        if (storedNotifs) {
          setNotifications(JSON.parse(storedNotifs));
        }

        const storedPackages = await AsyncStorage.getItem('@shilpi_packages');
        if (storedPackages) {
          setPackageGroups(JSON.parse(storedPackages));
        }
      } catch (e) {
        console.warn('Failed to load storage data:', e);
      }
    };
    loadData();
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || null;
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

  const handleOpenClient = (clientId: number) => {
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
    AsyncStorage.setItem('@shilpi_bookings', JSON.stringify(updated)).catch(() => {});
  };

  const handleSaveBooking = (newBookingData: Partial<Booking>) => {
    const newId = `b_${Date.now()}`;
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = months[now.getMonth()];

    const newBooking: Booking = {
      id: newId,
      ref: newBookingData.ref || `Booking #${Math.floor(1000 + Math.random() * 9000)}`,
      client: newBookingData.client || 'Client',
      day: newBookingData.day || now.getDate(),
      month: newBookingData.month || currentMonth,
      dateLong: newBookingData.dateLong || `${now.getDate()} ${currentMonth} ${now.getFullYear()}`,
      time: newBookingData.time || '10:00',
      meridiem: newBookingData.meridiem || 'AM',
      items: newBookingData.items || [{ name: 'Bridal Makeup', price: 15000 }],
      travel: newBookingData.travel || 0,
      advance: newBookingData.advance || 0,
      status: 'Upcoming',
      venue: newBookingData.venue || 'Residence',
      address: newBookingData.address || '',
      notes: newBookingData.notes || '',
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    AsyncStorage.setItem('@shilpi_bookings', JSON.stringify(updated)).catch(() => {});

    setCurrentScreen('orders');
    setActiveTab('orders');

    // Trigger WhatsApp confirmation sheet
    const total = newBooking.items.reduce((s, i) => s + i.price, 0) + newBooking.travel;
    const balance = total - newBooking.advance;
    setActiveSheet({
      kicker: 'BOOKING SAVED',
      title: `Send confirmation to ${first(newBooking.client)}?`,
      message: `Hi ${first(newBooking.client)}, your booking is confirmed.\n\n${newBooking.dateLong} · ${newBooking.time} ${newBooking.meridiem}\n${newBooking.items.map((i) => i.name).join(' + ')}\n${newBooking.venue}\n\nTotal ${fmt(total)} · Advance ${fmt(newBooking.advance)} · Balance ${fmt(balance)}\n\n— ${artistName}, Shilpi`,
      cta: 'Send on WhatsApp',
      logoUri: studioLogo,
    });
  };

  const handleSaveClient = (clientData: Partial<Client>) => {
    const newClient: Client = {
      id: Date.now(),
      name: clientData.name || 'New Client',
      phone: clientData.phone || '+91 ',
      bookings: 0,
      sales: 0,
      profit: 0,
      history: [],
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    AsyncStorage.setItem('@shilpi_clients', JSON.stringify(updated)).catch(() => {});

    setCurrentScreen('clients');
    setActiveTab('clients');
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
    setActiveSheet({
      kicker: 'WHATSAPP · ORDER CLOSED',
      title: `Thank ${order.client} and ask for review?`,
      message: `Thank you ${first(order.client)}! It was lovely working with you.\n\nIf you liked the look, a photo or a review would mean a lot — I would love to add it to my portfolio.\n\n— ${artistName}, Shilpi`,
      cta: 'Send Review Request',
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
            onOpenBooking={handleOpenBooking}
            onOpenOrders={() => handleTabChange('orders')}
          />
        )}

        {currentScreen === 'clients' && (
          <ClientsScreen
            clients={clients}
            onOpenClient={handleOpenClient}
            onStartNewClient={() => setCurrentScreen('newclient')}
          />
        )}

        {currentScreen === 'client' && (
          <ClientDetailScreen
            client={selectedClient}
            onGoBack={handleGoBack}
            onOpenWhatsAppSheet={handleOpenWhatsAppSheet}
          />
        )}

        {currentScreen === 'orders' && (
          <OrdersScreen
            bookings={bookings}
            onOpenBooking={handleOpenBooking}
            onStartNewBooking={() => setCurrentScreen('newbooking')}
          />
        )}

        {currentScreen === 'order' && (
          <OrderDetailScreen
            order={selectedBooking}
            onGoBack={handleGoBack}
            onUpdateStatus={handleUpdateBookingStatus}
            onOpenConfirmSheet={handleOpenConfirmSheet}
            onCloseBooking={handleCloseBooking}
          />
        )}

        {currentScreen === 'newbooking' && (
          <NewBookingScreen
            clients={clients}
            packageGroups={packageGroups}
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

        {currentScreen === 'gallery' && <GalleryScreen onGoBack={handleGoBack} />}

        {currentScreen === 'notifications' && (
          <NotificationsScreen
            notifications={notifications}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onGoBack={handleGoBack}
          />
        )}

        {currentScreen === 'reminders' && <RemindersScreen onGoBack={handleGoBack} />}

        {currentScreen === 'expenses' && <ExpensesScreen onGoBack={handleGoBack} />}

        {currentScreen === 'reports' && <ReportsScreen onGoBack={handleGoBack} />}

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
