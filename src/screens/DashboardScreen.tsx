import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { apiClient } from '../services/apiClient';

interface DashboardMetrics {
  totalClients: number;
  monthlyBookingsCount: number;
  totalSalesFormatted: string;
  totalExpensesFormatted: string;
  netProfitFormatted: string;
  profitMarginPercentage: number;
}

interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  bookingDate: string;
  eventLocation: string | null;
  balanceDueFormatted: string;
  status: string;
}

interface DashboardScreenProps {
  onOpenQrScanner: () => void;
  onNewBooking: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onOpenQrScanner, onNewBooking }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchDashboardData = async () => {
    try {
      const res = await apiClient.get('/dashboard/overview');
      if (res.data.success) {
        setMetrics(res.data.data.metrics);
        setAppointments(res.data.data.upcomingAppointments);
      }
    } catch (e) {
      console.error('Failed to load dashboard overview', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>SHILPI STUDIO</Text>
          <Text style={styles.headerSubtitle}>Studio Management & Dues Ledger</Text>
        </View>

        {/* Web Terminal Pairing Action */}
        <TouchableOpacity style={styles.linkTerminalBtn} onPress={onOpenQrScanner}>
          <Text style={styles.linkTerminalText}>Link Web</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Financial Ledger Hero (No purple gradients, clean elevated surface) */}
      <View style={styles.heroCard}>
        <Text style={styles.metricLabel}>Net Month Profit</Text>
        <Text style={styles.heroValue}>{metrics?.netProfitFormatted || '₹0'}</Text>

        <View style={styles.heroDivider} />

        <View style={styles.ledgerRow}>
          <View style={styles.ledgerCol}>
            <Text style={styles.subMetricLabel}>Total Collections</Text>
            <Text style={styles.subMetricValue}>{metrics?.totalSalesFormatted || '₹0'}</Text>
          </View>
          <View style={styles.ledgerCol}>
            <Text style={styles.subMetricLabel}>Expenses Recorded</Text>
            <Text style={styles.subMetricValue}>{metrics?.totalExpensesFormatted || '₹0'}</Text>
          </View>
          <View style={styles.ledgerCol}>
            <Text style={styles.subMetricLabel}>Margin</Text>
            <Text style={styles.subMetricValue}>{metrics?.profitMarginPercentage || 0}%</Text>
          </View>
        </View>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryActionBtn} onPress={onNewBooking}>
          <Text style={styles.primaryActionText}>+ New Booking</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Client Schedule */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <Text style={styles.sectionBadge}>{appointments.length} scheduled</Text>
      </View>

      {appointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No appointments scheduled</Text>
          <Text style={styles.emptySubtitle}>Tap New Booking to record an enquiry or bridal date.</Text>
        </View>
      ) : (
        appointments.map((item) => (
          <View key={item.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.clientName}>{item.clientName}</Text>
              <View style={[styles.statusTag, item.status === 'confirmed' ? styles.confirmedTag : styles.enquiryTag]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.appointmentDetails}>
              <Text style={styles.detailText}>Date: {new Date(item.bookingDate).toLocaleDateString('en-IN')}</Text>
              {item.eventLocation ? <Text style={styles.detailText}>Location: {item.eventLocation}</Text> : null}
              <Text style={styles.duesText}>Balance Due: {item.balanceDueFormatted}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  linkTerminalBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkTerminalText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  metricLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    fontWeight: '600',
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ledgerCol: {
    flex: 1,
  },
  subMetricLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  subMetricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
  },
  actionRow: {
    marginBottom: 24,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionBadge: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confirmedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  enquiryTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  appointmentDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  duesText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});
