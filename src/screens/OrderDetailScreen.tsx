import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Booking, fmt } from '../data/prototypeData';

interface OrderDetailScreenProps {
  order: Booking | null;
  onGoBack: () => void;
  onUpdateStatus: (orderId: string, status: 'Upcoming' | 'Completed' | 'Closed') => void;
  onOpenConfirmSheet: (order: Booking) => void;
  onCloseBooking: (order: Booking) => void;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({
  order,
  onGoBack,
  onUpdateStatus,
  onOpenConfirmSheet,
  onCloseBooking,
}) => {
  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f4f6', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#121212', marginBottom: 12 }}>Booking not found</Text>
        <TouchableOpacity
          onPress={onGoBack}
          style={{ backgroundColor: Colors.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700' }}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = order.items.reduce((s, i) => s + i.price, 0) + order.travel;
  const balance = total - order.advance;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Black Ink Booking Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.refCode}>{order.ref}</Text>
        <Text style={styles.clientTitle}>{order.client}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaDate}>
            {order.dateLong} · {order.time} {order.meridiem}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{order.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* 2. Status Transition Buttons */}
      <View style={styles.statusButtonsRow}>
        {(['Upcoming', 'Completed', 'Closed'] as const).map((st) => {
          const isCurrent = order.status === st;
          return (
            <TouchableOpacity
              key={st}
              style={[styles.statusBtn, isCurrent && styles.statusBtnActive]}
              onPress={() => onUpdateStatus(order.id, st)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statusBtnText, isCurrent && styles.statusBtnTextActive]}>
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Packages Table */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>PACKAGES</Text>
      </View>

      <View style={styles.tableCard}>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{fmt(item.price)}</Text>
          </View>
        ))}

        {order.travel > 0 ? (
          <View style={styles.tableRow}>
            <Text style={styles.itemName}>Travel charges</Text>
            <Text style={styles.itemPrice}>{fmt(order.travel)}</Text>
          </View>
        ) : null}

        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmt(total)}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.itemName}>Advance paid</Text>
          <Text style={styles.itemPrice}>{fmt(order.advance)}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.balanceLabel}>Balance due</Text>
          <Text
            style={[
              styles.balanceValue,
              balance > 0 ? styles.balanceDue : styles.balancePaid,
            ]}
          >
            {balance > 0 ? fmt(balance) : 'Paid'}
          </Text>
        </View>
      </View>

      {/* 4. Venue & Address */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>VENUE & ADDRESS</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.venueHeading}>{order.venue}</Text>
        <Text style={styles.addressText}>{order.address}</Text>
      </View>

      {/* 5. Client Notes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CLIENT NOTES</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.notesText}>{order.notes}</Text>
      </View>

      {/* 6. Action Buttons */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={styles.whatsAppBtn}
          onPress={() => onOpenConfirmSheet(order)}
          activeOpacity={0.8}
        >
          <Text style={styles.whatsAppBtnText}>SEND WHATSAPP CONFIRMATION</Text>
        </TouchableOpacity>

        {order.status !== 'Closed' && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => onCloseBooking(order)}
            activeOpacity={0.8}
          >
            <Text style={styles.closeBtnText}>CLOSE BOOKING & SAVE TO GALLERY</Text>
          </TouchableOpacity>
        )}
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
    paddingBottom: 24,
  },
  inkHeaderCard: {
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  refCode: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.deep,
    fontWeight: '700',
  },
  clientTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaDate: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  statusBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnActive: {
    backgroundColor: Colors.accent,
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(18, 18, 18, 0.55)',
  },
  statusBtnTextActive: {
    color: '#ffffff',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
    paddingHorizontal: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.05)',
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(18, 18, 18, 0.12)',
  },
  itemName: {
    fontSize: 13.5,
    color: '#121212',
  },
  itemPrice: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  totalValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  balanceLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  balanceValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  balanceDue: {
    color: Colors.deep,
  },
  balancePaid: {
    color: 'rgba(18, 18, 18, 0.5)',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  venueHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  addressText: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 2,
    lineHeight: 18,
  },
  notesText: {
    fontSize: 12.5,
    color: 'rgba(18, 18, 18, 0.75)',
    lineHeight: 18,
  },
  ctaRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  whatsAppBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
  closeBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  closeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.deep,
  },
});
