import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import {
  INITIAL_CLIENTS,
  INITIAL_BOOKINGS,
  INITIAL_PKG_GROUPS,
  INITIAL_NOTIFS,
  Client,
  Booking,
  PackageGroup,
  NotificationItem,
  fmt,
  first,
} from '../data/prototypeData';

import { TopHeader } from '../components/TopHeader';
import { BottomTabBar } from '../components/BottomTabBar';
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
  const [activeTab, setActiveTab] = useState<'clients' | 'home' | 'orders'>('home');
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [selectedClientId, setSelectedClientId] = useState<number>(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('b1');

  // Drawer & Sheet States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActionSheetData | null>(null);

  // App Data State
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>(INITIAL_PKG_GROUPS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFS);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const selectedBooking = bookings.find((b) => b.id === selectedOrderId) || bookings[0];

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

  const handleTabChange = (tab: 'clients' | 'home' | 'orders') => {
    setActiveTab(tab);
    setCurrentScreen(tab);
  };

  const handleGoBack = () => {
    // Return to the current active tab
    setCurrentScreen(activeTab);
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
    setBookings((prev) =>
      prev.map((b) => (b.id === orderId ? { ...b, status } : b))
    );
  };

  const handleSaveBooking = (newBookingData: Partial<Booking>) => {
    const newId = `b_${Date.now()}`;
    const newBooking: Booking = {
      id: newId,
      ref: newBookingData.ref || `Booking #${Math.floor(1000 + Math.random() * 9000)}`,
      client: newBookingData.client || 'Client',
      day: newBookingData.day || 26,
      month: newBookingData.month || 'Sep',
      dateLong: newBookingData.dateLong || 'Sat 26 Sep 2026',
      time: newBookingData.time || '6:30',
      meridiem: newBookingData.meridiem || 'AM',
      items: newBookingData.items || [{ name: 'Bridal Makeup', price: 15000 }],
      travel: newBookingData.travel || 0,
      advance: newBookingData.advance || 0,
      status: 'Upcoming',
      venue: newBookingData.venue || 'Residence',
      address: newBookingData.address || 'Coimbatore',
      notes: newBookingData.notes || '',
    };

    setBookings((prev) => [newBooking, ...prev]);
    setCurrentScreen('orders');
    setActiveTab('orders');

    // Trigger WhatsApp confirmation sheet
    setActiveSheet({
      kicker: 'BOOKING SAVED',
      title: `Send confirmation to ${first(newBooking.client)}?`,
      message: `Hi ${first(newBooking.client)}, your booking is confirmed.\n\n${newBooking.dateLong} · ${newBooking.time} ${newBooking.meridiem}\n${newBooking.items.map((i) => i.name).join(' + ')}\n${newBooking.venue}\n\nTotal ${fmt(newBooking.items.reduce((s, i) => s + i.price, 0) + newBooking.travel)} · Advance ${fmt(newBooking.advance)}\n\n— Shilpa R., Shilpi`,
      cta: 'Send on WhatsApp',
    });
  };

  const handleSaveClient = (clientData: Partial<Client>) => {
    const newClient: Client = {
      id: Date.now(),
      name: clientData.name || 'New Client',
      phone: clientData.phone || '+91 98000 00000',
      bookings: 1,
      sales: 0,
      profit: 0,
      history: [],
    };
    setClients((prev) => [newClient, ...prev]);
    setCurrentScreen('clients');
    setActiveTab('clients');
  };

  const handleAddPackage = (groupName: string, name: string, price: number) => {
    setPackageGroups((prev) =>
      prev.map((g) =>
        g.name === groupName
          ? { ...g, items: [...g.items, { name, price }] }
          : g
      )
    );
  };

  // WhatsApp Confirm Sheet Trigger
  const handleOpenConfirmSheet = (order: Booking) => {
    const total = order.items.reduce((s, i) => s + i.price, 0) + order.travel;
    const balance = total - order.advance;
    setActiveSheet({
      kicker: 'WHATSAPP · ORDER CONFIRMATION',
      title: `Send to ${order.client}?`,
      message: `Hi ${first(order.client)}, your booking is confirmed.\n\n${order.dateLong} · ${order.time} ${order.meridiem}\n${order.items.map((i) => i.name).join(' + ')}\n${order.venue}\n\nTotal ${fmt(total)} · Advance ${fmt(order.advance)} · Balance ${fmt(balance)}\n\n— Shilpa R., Shilpi`,
      cta: 'Send Message',
    });
  };

  // Close Booking Sheet Trigger
  const handleCloseBooking = (order: Booking) => {
    handleUpdateBookingStatus(order.id, 'Closed');
    setActiveSheet({
      kicker: 'WHATSAPP · ORDER CLOSED',
      title: `Thank ${order.client} and ask for review?`,
      message: `Thank you ${first(order.client)}! It was lovely working with you.\n\nIf you liked the look, a photo or a review would mean a lot — I would love to add it to my portfolio.\n\n— Shilpa R., Shilpi`,
      cta: 'Send Review Request',
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
      message: `Hi ${first(clientName)}, hope you are doing well! Let me know if you have any upcoming dates — happy to block them for you.\n\n— Shilpa R., Shilpi`,
      cta: 'Open WhatsApp',
    });
  };

  // Payments Reminder Sheet
  const handleOpenRemindSheet = () => {
    setActiveSheet({
      kicker: 'WHATSAPP · PAYMENT REMINDER',
      title: 'Remind 2 clients about pending balance?',
      message: `Hi Divya, a gentle reminder — a balance of ₹10,000 is pending for your reception booking on 14 Sep. You can pay by UPI to shilpa@upi.\n\nThank you!`,
      cta: 'Send 2 Reminders',
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

  // FAB Action
  const handleFabPress = () => {
    if (currentScreen === 'clients') {
      setCurrentScreen('newclient');
    } else {
      setCurrentScreen('newbooking');
    }
  };

  const showFab =
    currentScreen === 'home' ||
    currentScreen === 'clients' ||
    currentScreen === 'orders' ||
    currentScreen === 'client';

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
          <ClientsScreen clients={clients} onOpenClient={handleOpenClient} />
        )}

        {currentScreen === 'client' && (
          <ClientDetailScreen
            client={selectedClient}
            onGoBack={handleGoBack}
            onOpenWhatsAppSheet={handleOpenWhatsAppSheet}
          />
        )}

        {currentScreen === 'orders' && (
          <OrdersScreen bookings={bookings} onOpenBooking={handleOpenBooking} />
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

      {/* 3. Floating Action Button (FAB) */}
      {showFab && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
          activeOpacity={0.85}
        >
          <Text style={styles.fabPlus}>＋</Text>
        </TouchableOpacity>
      )}

      {/* 4. Bottom 3-Tab Bar */}
      {showTabs && (
        <BottomTabBar activeTab={activeTab} onSelectTab={handleTabChange} />
      )}

      {/* 5. Slide-in Drawer Menu */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(screen) => {
          if (screen === 'qr_scanner') {
            onOpenQrScanner();
          } else {
            setCurrentScreen(screen);
          }
        }}
        onLogout={onLogout}
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
    backgroundColor: '#f4f4f6',
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
