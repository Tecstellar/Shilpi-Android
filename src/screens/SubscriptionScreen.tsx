import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../theme/colors';
import { PLANS, fmt } from '../data/prototypeData';

interface SubscriptionScreenProps {
  onPayByUpi: (planMonths: number, total: number) => void;
  onGoBack: () => void;
}

const FEATURES = [
  { title: 'Unlimited bookings & clients', desc: 'No caps on orders, clients or packages.' },
  { title: 'WhatsApp confirmations & reminders', desc: 'Send order, closing and payment messages in one tap.' },
  { title: 'Payments & balance tracking', desc: 'Know exactly who owes what, every month.' },
  { title: 'My Gallery with Instagram links', desc: 'Build a portfolio from your finished looks.' },
  { title: 'Expenses & profit reports', desc: 'Monthly and annual sales, expenses and real profit.' },
  { title: 'Priority support', desc: 'Reach us on WhatsApp — replies within a day.' },
];

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  onPayByUpi,
  onGoBack,
}) => {
  const [selectedPlanMonths, setSelectedPlanMonths] = useState(12);

  const currentPlan = PLANS.find((p) => p.months === selectedPlanMonths) || PLANS[2];
  const planTotal = currentPlan.perMonth * currentPlan.months;
  const gst = Math.round(planTotal - planTotal / 1.18);
  const saveAmount = 499 * currentPlan.months - planTotal;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Header Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.kicker}>SHILPI PREMIUM</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceBig}>₹{currentPlan.perMonth}</Text>
          <Text style={styles.pricePerMonth}>/ month</Text>
        </View>
        <Text style={styles.headerSub}>
          All prices include GST. Pick a billing term — longer terms cost less per month.
        </Text>
      </View>

      {/* 2. Billing Term Options */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>BILLING TERM</Text>
      </View>

      <View style={styles.plansContainer}>
        {PLANS.map((p) => {
          const isSelected = selectedPlanMonths === p.months;
          const total = p.perMonth * p.months;

          return (
            <TouchableOpacity
              key={p.months}
              style={[styles.planCard, isSelected && styles.planCardActive]}
              onPress={() => setSelectedPlanMonths(p.months)}
              activeOpacity={0.8}
            >
              <View style={styles.planHeaderRow}>
                <Text style={[styles.planTerm, isSelected && styles.textWhite]}>
                  {p.months} MONTHS
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
                    {p.badge}
                  </Text>
                </View>
              </View>

              <View style={styles.planPricingRow}>
                <Text style={[styles.planPerMonth, isSelected && styles.textWhite]}>
                  {fmt(p.perMonth)} <Text style={styles.perMoSmall}>/ mo</Text>
                </Text>
                <Text style={[styles.planTotalText, isSelected && styles.textWhiteMuted]}>
                  Total {fmt(total)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Breakdown Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Billing term</Text>
          <Text style={styles.summaryValue}>{currentPlan.months} months</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Plan total</Text>
          <Text style={styles.summaryValue}>{fmt(planTotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST (18%) included</Text>
          <Text style={styles.summaryValue}>{fmt(gst)}</Text>
        </View>
        {saveAmount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={styles.saveLabel}>You save</Text>
            <Text style={styles.saveValue}>{fmt(saveAmount)}</Text>
          </View>
        ) : null}
      </View>

      {/* 4. Features Checklist */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>EVERYTHING INCLUDED</Text>
      </View>

      <View style={styles.featuresCard}>
        {FEATURES.map((feat, idx) => (
          <View key={idx} style={styles.featureRow}>
            <Text style={styles.checkIcon}>✓</Text>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 5. UPI Pay Button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => onPayByUpi(currentPlan.months, planTotal)}
          activeOpacity={0.8}
        >
          <Text style={styles.payBtnText}>PAY {fmt(planTotal)} BY UPI</Text>
        </TouchableOpacity>
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
    paddingBottom: 22,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.accent2,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  priceBig: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.accent,
  },
  pricePerMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
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
    gap: 10,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  planCardActive: {
    backgroundColor: '#121212',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTerm: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#121212',
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeDefault: {
    backgroundColor: Colors.tint,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#ffffff',
  },
  badgeTextDefault: {
    color: Colors.deep,
  },
  planPricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
  },
  planPerMonth: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121212',
  },
  perMoSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  planTotalText: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.55)',
  },
  textWhite: {
    color: '#ffffff',
  },
  textWhiteMuted: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(18, 18, 18, 0.65)',
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  saveLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.deep,
  },
  saveValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.deep,
  },
  featuresCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.05)',
  },
  checkIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 1,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  featureDesc: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 2,
    lineHeight: 16,
  },
  ctaContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  payBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#ffffff',
  },
});
