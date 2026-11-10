import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Client, fmt, first } from '../data/prototypeData';

interface ClientDetailScreenProps {
  client: Client | null;
  onGoBack: () => void;
  onOpenWhatsAppSheet: (clientName: string, phone: string) => void;
}

export const ClientDetailScreen: React.FC<ClientDetailScreenProps> = ({
  client,
  onGoBack,
  onOpenWhatsAppSheet,
}) => {
  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f4f6', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#121212', marginBottom: 12 }}>Client not found</Text>
        <TouchableOpacity
          onPress={onGoBack}
          style={{ backgroundColor: Colors.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700' }}>Back to Clients</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initial = client.name.charAt(0);

  const handleCall = () => {
    const rawPhone = client.phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${rawPhone}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Ink Profile Card */}
      <View style={styles.inkProfileCard}>
        <View style={styles.avatarGradient}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>

        <View style={styles.nameContainer}>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
        </View>
      </View>

      {/* 2. Action Buttons (Call & WhatsApp) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtnWhite}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnIcon}>📞</Text>
          <Text style={styles.actionBtnText}>CALL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnPink}
          onPress={() => onOpenWhatsAppSheet(client.name, client.phone)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnIcon}>💬</Text>
          <Text style={styles.actionBtnTextPink}>WHATSAPP</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Metrics Summary Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>BOOKINGS</Text>
          <Text style={styles.metricValue}>{client.bookings}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>TOTAL SALES</Text>
          <Text style={styles.metricValue}>{fmt(client.sales)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>NET PROFIT</Text>
          <Text style={styles.metricValue}>{fmt(client.profit)}</Text>
        </View>
      </View>

      {/* 4. Booking History List */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>BOOKING HISTORY</Text>
      </View>

      <View style={styles.historyList}>
        {client.history.map((h, i) => (
          <View key={i} style={styles.historyItem}>
            <View style={styles.historyDateBox}>
              <Text style={styles.historyDateText}>{h.date}</Text>
            </View>

            <View style={styles.historyPkgInfo}>
              <Text style={styles.historyPkgName}>{h.pkg} Look</Text>
              <Text style={styles.historyStatus}>Delivered & Closed</Text>
            </View>

            <View style={styles.historyAmountBox}>
              <Text style={styles.historyAmountText}>{fmt(h.amount)}</Text>
              <Text style={styles.historyPaidLabel}>PAID</Text>
            </View>
          </View>
        ))}
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
  inkProfileCard: {
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  clientPhone: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  actionBtnWhite: {
    flex: 1,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnPink: {
    flex: 1,
    backgroundColor: Colors.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#121212',
  },
  actionBtnTextPink: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.deep,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-around',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(18, 18, 18, 0.5)',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121212',
    marginTop: 4,
  },
  historyHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  historyTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
  },
  historyList: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  historyDateBox: {
    width: 60,
  },
  historyDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
  },
  historyPkgInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  historyPkgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  historyStatus: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.5)',
    marginTop: 2,
  },
  historyAmountBox: {
    alignItems: 'flex-end',
  },
  historyAmountText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  historyPaidLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 2,
  },
});
