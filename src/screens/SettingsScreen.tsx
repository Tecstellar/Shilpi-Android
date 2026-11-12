import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

const CheckVectorIcon: React.FC<{ color?: string }> = ({ color = '#ffffff' }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon: React.FC = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(18, 18, 18, 0.4)" strokeWidth={2}>
    <Path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export interface SettingsUsageCounts {
  orders: number;
  clients: number;
  packages: number;
  reminders: number;
  closes: number;
}

interface SettingsScreenProps {
  artistName?: string;
  studioName?: string;
  studioLogo?: string;
  studioPhone?: string;
  studioCity?: string;
  studioRole?: string;
  isPremium?: boolean;
  usage?: SettingsUsageCounts;
  onGoToSubscription: () => void;
  onLogout: () => void;
  onGoBack: () => void;
}

const LIMITS: { key: keyof SettingsUsageCounts; label: string; max: number }[] = [
  { key: 'orders', label: 'Order creation', max: 20 },
  { key: 'clients', label: 'Client creation', max: 20 },
  { key: 'packages', label: 'Packages', max: 5 },
  { key: 'reminders', label: 'Reminders', max: 10 },
  { key: 'closes', label: 'Closed orders with photos', max: 10 },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  artistName = 'Artist',
  studioName = 'Shilpi Studio',
  studioLogo,
  studioPhone = '',
  studioCity = '',
  studioRole = 'Bridal Makeup Artist',
  isPremium = false,
  usage = { orders: 0, clients: 0, packages: 0, reminders: 0, closes: 0 },
  onGoToSubscription,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const { themeName, colors, themes, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const initialLetter = (artistName.trim().charAt(0) || 'S').toUpperCase();
  const subtitleLine = studioCity.trim()
    ? `${studioRole} · ${studioCity.trim()}`
    : studioRole;

  const usageRows = useMemo(() => {
    let atLimitCount = 0;
    const rows = LIMITS.map((item) => {
      const used = usage[item.key] || 0;
      const full = used >= item.max;
      if (full) atLimitCount++;
      const pct = isPremium
        ? 100
        : Math.min(Math.round((used / item.max) * 100), 100);
      return {
        label: item.label,
        value: isPremium ? 'Unlimited' : `${used} / ${item.max}`,
        pct,
        textColor: isPremium
          ? '#121212'
          : full
          ? colors.accent
          : 'rgba(18, 18, 18, 0.55)',
        barColor: isPremium
          ? '#121212'
          : full
          ? colors.accent
          : 'rgba(18, 18, 18, 0.35)',
      };
    });
    return { rows, atLimitCount };
  }, [usage, isPremium, colors.accent]);

  const settingsRows = useMemo(
    () => [
      { label: 'My Profile', value: artistName, color: '#121212', action: 'info' },
      { label: 'Business Profile', value: studioName, color: '#121212', action: 'info' },
      {
        label: 'WhatsApp Settings',
        value: studioPhone || '+91 98765 43210',
        color: '#121212',
        action: 'info',
      },
      { label: 'Notification Settings', value: 'On', color: '#121212', action: 'info' },
      { label: 'WhatsApp Message Templates', value: '4 saved', color: '#121212', action: 'info' },
      { label: 'App Permissions', value: 'Photos, Contacts', color: '#121212', action: 'info' },
      {
        label: 'Subscription',
        value: isPremium ? 'Premium · ₹499 / month' : 'Free plan · Upgrade',
        color: '#121212',
        action: 'sub',
      },
      { label: 'Support', value: '', color: '#121212', action: 'info' },
      { label: 'Help', value: '', color: '#121212', action: 'info' },
      { label: 'Privacy', value: '', color: '#121212', action: 'info' },
      { label: 'Terms', value: '', color: '#121212', action: 'info' },
      { label: 'Logout', value: '', color: colors.deep, action: 'logout' },
    ],
    [artistName, studioName, studioPhone, isPremium, colors.deep]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 24) + 96 },
      ]}
    >
      {/* 1. Artist Profile Header */}
      <View style={styles.inkProfileCard}>
        <View style={styles.avatarWrap}>
          {studioLogo ? (
            <Image source={{ uri: studioLogo }} style={styles.avatarImage} />
          ) : (
            <>
              <Svg width={56} height={56} style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={colors.accent} />
                    <Stop offset="100%" stopColor={colors.deep} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={56} height={56} rx={28} fill="url(#avatarGrad)" />
              </Svg>
              <Text style={styles.avatarLetter}>{initialLetter}</Text>
            </>
          )}
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.artistName} numberOfLines={1}>
            {artistName}
          </Text>
          <Text style={styles.artistSub} numberOfLines={1}>
            {subtitleLine}
          </Text>
        </View>
      </View>

      {/* 2. Your Plan & Usage Limits Card */}
      <View style={styles.planHeaderRow}>
        <Text style={styles.planHeaderTitle}>
          YOUR PLAN · {isPremium ? 'PREMIUM' : 'FREE PLAN'}
        </Text>
        <Text style={styles.planHeaderHint}>
          {isPremium ? 'UNLIMITED' : `${usageRows.atLimitCount} OF 5 LIMITS REACHED`}
        </Text>
      </View>

      <View style={styles.usageCardWrap}>
        <View style={styles.usageCard}>
          {usageRows.rows.map((u, idx) => (
            <View key={idx}>
              <View style={styles.usageRowTop}>
                <Text style={styles.usageLabel}>{u.label}</Text>
                <Text style={[styles.usageValue, { color: u.textColor }]}>{u.value}</Text>
              </View>
              <View style={styles.usageTrack}>
                <View
                  style={[
                    styles.usageFill,
                    { width: `${u.pct}%`, backgroundColor: u.barColor },
                  ]}
                />
              </View>
            </View>
          ))}

          {!isPremium && (
            <TouchableOpacity
              style={styles.upgradeInlineBtn}
              onPress={onGoToSubscription}
              activeOpacity={0.85}
            >
              <Text style={styles.upgradeInlineBtnText}>UPGRADE FOR UNLIMITED</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. Prototype App Theme Selector */}
      <View style={styles.themeSectionHeader}>
        <Text style={styles.themeSectionTitle}>APP THEME</Text>
      </View>

      <View style={styles.themesList}>
        {themes.map((th) => {
          const isSelected = themeName === th.name;
          return (
            <TouchableOpacity
              key={th.name}
              style={[styles.themeRow, isSelected && styles.themeRowActive]}
              onPress={() => setTheme(th.name)}
              activeOpacity={0.78}
            >
              <View style={styles.swatchGroup}>
                <View style={[styles.swatchBar, { backgroundColor: th.accent }]} />
                <View style={[styles.swatchBar, { backgroundColor: th.accent2 }]} />
                <View style={[styles.swatchBar, { backgroundColor: th.tint }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeName}>{th.label}</Text>
                <Text style={styles.themeDesc}>{th.hint}</Text>
              </View>
              <View style={[styles.checkBox, isSelected && styles.checkBoxActive]}>
                {isSelected ? <CheckVectorIcon color="#ffffff" /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Prototype Settings List Rows */}
      <View style={styles.rowsSpacer} />
      <View style={styles.settingsList}>
        {settingsRows.map((row, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.settingRow}
            onPress={() => {
              if (row.action === 'sub') {
                onGoToSubscription();
              } else if (row.action === 'logout') {
                onLogout();
              } else {
                Alert.alert(row.label, row.value ? `${row.label}: ${row.value}` : `${row.label} settings`);
              }
            }}
            activeOpacity={0.75}
          >
            <Text style={[styles.rowLabel, { color: row.color }]}>{row.label}</Text>
            {row.value ? (
              <Text style={styles.rowValue} numberOfLines={1}>
                {row.value}
              </Text>
            ) : null}
            <ChevronRightIcon />
          </TouchableOpacity>
        ))}
      </View>

      {/* 5. Bottom Shilpi Premium Gradient Banner */}
      <View style={styles.promoBanner}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id="promoGrad" x1="0%" y1="0%" x2="100%" y2="80%">
              <Stop offset="0%" stopColor={colors.accent} />
              <Stop offset="100%" stopColor={colors.deep} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#promoGrad)" />
        </Svg>

        <Text style={styles.promoKicker}>SHILPI PREMIUM</Text>
        <Text style={styles.promoHeadline}>
          Unlimited bookings, gallery & reports from ₹399 / month
        </Text>
        <TouchableOpacity
          style={styles.promoBtn}
          onPress={onGoToSubscription}
          activeOpacity={0.85}
        >
          <Text style={styles.promoBtnText}>UPGRADE</Text>
        </TouchableOpacity>
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
      paddingBottom: 24,
    },
    inkProfileCard: {
      backgroundColor: '#121212',
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    avatarLetter: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
    },
    profileDetails: {
      flex: 1,
    },
    artistName: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
    },
    artistSub: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.65)',
      marginTop: 2,
    },
    planHeaderRow: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    planHeaderTitle: {
      flex: 1,
      fontSize: 10,
      letterSpacing: 1.2,
      fontWeight: '700',
      color: '#121212',
    },
    planHeaderHint: {
      fontSize: 10,
      letterSpacing: 1,
      fontWeight: '700',
      color: colors.deep,
    },
    usageCardWrap: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    usageCard: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    usageRowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    usageLabel: {
      fontSize: 12.5,
      color: '#121212',
      fontWeight: '500',
    },
    usageValue: {
      fontSize: 12.5,
      fontWeight: '700',
    },
    usageTrack: {
      height: 6,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: 'rgba(18, 18, 18, 0.1)',
      marginTop: 6,
    },
    usageFill: {
      height: 6,
      borderRadius: 999,
    },
    upgradeInlineBtn: {
      backgroundColor: colors.accent,
      minHeight: 46,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    upgradeInlineBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: '#ffffff',
    },
    themeSectionHeader: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      backgroundColor: colors.tint,
    },
    themeSectionTitle: {
      fontSize: 10,
      letterSpacing: 1.2,
      fontWeight: '700',
      color: '#121212',
    },
    themesList: {
      backgroundColor: '#ffffff',
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 58,
      paddingVertical: 13,
      paddingHorizontal: 16,
      gap: 12,
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.07)',
    },
    themeRowActive: {
      backgroundColor: colors.tint,
    },
    swatchGroup: {
      flexDirection: 'row',
      gap: 2,
    },
    swatchBar: {
      width: 18,
      height: 32,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.08)',
    },
    themeInfo: {
      flex: 1,
    },
    themeName: {
      fontSize: 14.5,
      fontWeight: '700',
      color: '#121212',
    },
    themeDesc: {
      fontSize: 11.5,
      color: 'rgba(18, 18, 18, 0.55)',
      marginTop: 2,
    },
    checkBox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: 'rgba(18, 18, 18, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    checkBoxActive: {
      backgroundColor: '#121212',
      borderColor: '#121212',
    },
    rowsSpacer: {
      height: 14,
    },
    settingsList: {
      backgroundColor: '#f4f4f6',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.07)',
    },
    rowLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
    },
    rowValue: {
      fontSize: 11.5,
      color: 'rgba(18, 18, 18, 0.5)',
      maxWidth: 150,
    },
    promoBanner: {
      marginTop: 16,
      paddingVertical: 18,
      paddingHorizontal: 16,
      backgroundColor: colors.accent,
      overflow: 'hidden',
      position: 'relative',
    },
    promoKicker: {
      fontSize: 10,
      letterSpacing: 1.2,
      fontWeight: '700',
      color: '#ffffff',
    },
    promoHeadline: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
      marginTop: 4,
      lineHeight: 28,
      letterSpacing: -0.4,
    },
    promoBtn: {
      backgroundColor: '#121212',
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
      marginTop: 14,
      minHeight: 48,
      paddingVertical: 13,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    promoBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      color: '#ffffff',
    },
  });
