import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { PLANS, fmt } from '../data/prototypeData';

const CheckVectorIcon: React.FC<{ color?: string }> = ({ color = '#ffffff' }) => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MONTH_SHORT_ARR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function computeRenewalDate(months: number): string {
  const dt = new Date();
  dt.setMonth(dt.getMonth() + months);
  const day = String(dt.getDate()).padStart(2, '0');
  const mon = MONTH_SHORT_ARR[dt.getMonth()];
  const year = dt.getFullYear();
  return `${day} ${mon} ${year}`;
}

interface SubscriptionScreenProps {
  onPayByUpi: (planMonths: number, total: number) => void;
  onGoBack: () => void;
}

const FEATURES = [
  { title: 'Unlimited bookings & clients', body: 'No caps on orders, clients or packages.' },
  { title: 'WhatsApp confirmations & reminders', body: 'Send order, closing and payment messages in one tap.' },
  { title: 'Payments & balance tracking', body: 'Know exactly who owes what, every month.' },
  { title: 'My Gallery with Instagram links', body: 'Build a portfolio from your finished looks.' },
  { title: 'Expenses & profit reports', body: 'Monthly and annual sales, expenses and real profit.' },
  { title: 'Priority support', body: 'Reach us on WhatsApp — replies within a day.' },
];

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  onPayByUpi,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedPlanMonths, setSelectedPlanMonths] = useState(12);

  const currentPlan = PLANS.find((p) => p.months === selectedPlanMonths) || PLANS[2];
  const planTotal = currentPlan.perMonth * currentPlan.months;
  const gst = Math.round(planTotal - planTotal / 1.18);
  const saveAmount = 499 * currentPlan.months - planTotal;
  const renewsOn = useMemo(() => computeRenewalDate(currentPlan.months), [currentPlan.months]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 24) + 96 },
      ]}
    >
      {/* 1. Hero Header Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.kicker}>SHILPI PREMIUM</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceBig}>{fmt(currentPlan.perMonth)}</Text>
          <Text style={styles.pricePerMonth}>/ month</Text>
        </View>
        <Text style={styles.headerSub}>
          All prices include GST. Pick a billing term — longer terms cost less per month.
        </Text>
      </View>

      {/* 2. Billing Term Radio Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>BILLING TERM</Text>
      </View>

      <View style={styles.plansContainer}>
        {PLANS.map((p) => {
          const isSelected = selectedPlanMonths === p.months;
          const total = p.perMonth * p.months;
          const note =
            p.months === 3
              ? 'billed quarterly'
              : p.months === 6
              ? 'billed half-yearly'
              : 'billed yearly';

          return (
            <TouchableOpacity
              key={p.months}
              style={[styles.planCard, isSelected && styles.planCardActive]}
              onPress={() => setSelectedPlanMonths(p.months)}
              activeOpacity={0.82}
            >
              {/* Radio Ring */}
              <View style={[styles.radioRing, isSelected && styles.radioRingActive]}>
                <View style={[styles.radioDot, isSelected && styles.radioDotActive]} />
              </View>

              {/* Middle Details */}
              <View style={styles.planMiddle}>
                <View style={styles.planTitleRow}>
                  <Text style={[styles.planTerm, isSelected && styles.textWhite]}>
                    {p.months} months
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      isSelected ? styles.badgeActive : styles.badgeDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isSelected ? styles.badgeTextActive : styles.badgeTextDefault,
                      ]}
                    >
                      {p.badge.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.planPerMonthSub, isSelected && styles.textWhiteMuted]}>
                  {fmt(p.perMonth)} / month · incl. GST
                </Text>
              </View>

              {/* Right Price & Note */}
              <View style={styles.planRight}>
                <Text style={[styles.planTotalBig, isSelected && styles.textWhite]}>
                  {fmt(total)}
                </Text>
                <Text style={[styles.planNote, isSelected && styles.textWhiteMuted]}>
                  {note}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. What You Get Checklist */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>WHAT YOU GET</Text>
      </View>

      <View style={styles.featuresList}>
        {FEATURES.map((feat, idx) => (
          <View key={idx} style={styles.featureCard}>
            <View style={styles.checkCircle}>
              <CheckVectorIcon color="#ffffff" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureBody}>{feat.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 4. Tinted Summary Card */}
      <View style={styles.summaryWrap}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan total</Text>
            <Text style={styles.summaryValueBold}>{fmt(planTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryMuted}>GST (18%) included</Text>
            <Text style={styles.summaryMuted}>{fmt(gst)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.saveLabel}>You save</Text>
            <Text style={styles.saveValue}>
              {saveAmount > 0 ? `${fmt(saveAmount)} vs monthly` : '—'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <Text style={styles.renewNote}>
            Renews on {renewsOn}. Cancel anytime — your data stays yours.
          </Text>
        </View>
      </View>

      {/* 5. Primary Pay CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => onPayByUpi(currentPlan.months, planTotal)}
          activeOpacity={0.85}
        >
          <Text style={styles.payBtnText}>
            PAY {fmt(planTotal)} · {currentPlan.months} MONTHS
          </Text>
        </TouchableOpacity>
        <Text style={styles.ctaFootnote}>
          UPI, card, net banking · GSTIN invoice emailed after payment
        </Text>
      </View>
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
      paddingBottom: 28,
    },
    inkHeaderCard: {
      backgroundColor: '#121212',
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 22,
    },
    kicker: {
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.accent2,
      fontWeight: '700',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      marginTop: 8,
    },
    priceBig: {
      fontSize: 42,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: -1,
    },
    pricePerMonth: {
      fontSize: 14,
      fontWeight: '700',
      color: '#ffffff',
    },
    headerSub: {
      fontSize: 12.5,
      color: 'rgba(255, 255, 255, 0.68)',
      lineHeight: 19,
      marginTop: 8,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 6,
    },
    sectionTitle: {
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontWeight: '700',
      color: '#121212',
    },
    plansContainer: {
      paddingHorizontal: 16,
      gap: 8,
    },
    planCard: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    planCardActive: {
      backgroundColor: '#121212',
    },
    radioRing: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#121212',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioRingActive: {
      borderColor: '#ffffff',
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: 'transparent',
    },
    radioDotActive: {
      backgroundColor: colors.accent,
    },
    planMiddle: {
      flex: 1,
      minWidth: 0,
    },
    planTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    planTerm: {
      fontSize: 16,
      fontWeight: '700',
      color: '#121212',
    },
    badge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 999,
    },
    badgeDefault: {
      backgroundColor: colors.tint,
    },
    badgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
    },
    badgeText: {
      fontSize: 9.5,
      fontWeight: '700',
      letterSpacing: 0.7,
    },
    badgeTextDefault: {
      color: colors.deep,
    },
    badgeTextActive: {
      color: '#ffffff',
    },
    planPerMonthSub: {
      fontSize: 12,
      color: 'rgba(18, 18, 18, 0.7)',
      marginTop: 4,
    },
    planRight: {
      alignItems: 'flex-end',
    },
    planTotalBig: {
      fontSize: 18,
      fontWeight: '700',
      color: '#121212',
    },
    planNote: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.65)',
      marginTop: 2,
    },
    textWhite: {
      color: '#ffffff',
    },
    textWhiteMuted: {
      color: 'rgba(255, 255, 255, 0.72)',
    },
    featuresList: {
      paddingHorizontal: 16,
      gap: 8,
    },
    featureCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      paddingVertical: 13,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    checkCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    featureTextCol: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#121212',
    },
    featureBody: {
      fontSize: 11.5,
      color: 'rgba(18, 18, 18, 0.6)',
      marginTop: 2,
      lineHeight: 16.5,
    },
    summaryWrap: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 8,
    },
    summaryCard: {
      backgroundColor: colors.tint,
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    summaryLabel: {
      fontSize: 13,
      color: '#121212',
    },
    summaryValueBold: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
    },
    summaryMuted: {
      fontSize: 12,
      color: 'rgba(18, 18, 18, 0.6)',
    },
    saveLabel: {
      fontSize: 12,
      color: colors.deep,
    },
    saveValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.deep,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: 'rgba(18, 18, 18, 0.1)',
      marginVertical: 12,
    },
    renewNote: {
      fontSize: 11.5,
      color: 'rgba(18, 18, 18, 0.6)',
      lineHeight: 17,
    },
    ctaContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 8,
    },
    payBtn: {
      backgroundColor: colors.accent,
      minHeight: 50,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    payBtnText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.1,
      color: '#ffffff',
    },
    ctaFootnote: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.5)',
      textAlign: 'center',
      lineHeight: 16,
    },
  });
