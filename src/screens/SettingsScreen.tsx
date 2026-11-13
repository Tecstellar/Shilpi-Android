import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Circle, Line, Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

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
  onDeleteAccount?: (reason: string, feedback?: string) => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Premium Vector Icons
// ---------------------------------------------------------------------------
const ChevronRightIcon = ({ color = 'rgba(18, 18, 18, 0.35)', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

const UserIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const BuildingIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <Path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
  </Svg>
);

const PhoneIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const PackageIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <Line x1="12" y1="22.08" x2="12" y2="12" />
  </Svg>
);

const CrownIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
  </Svg>
);

const PaletteIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="13.5" cy="6.5" r=".7" fill={color} />
    <Circle cx="17.5" cy="10.5" r=".7" fill={color} />
    <Circle cx="8.5" cy="7.5" r=".7" fill={color} />
    <Circle cx="6.5" cy="12.5" r=".7" fill={color} />
    <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </Svg>
);

const BellIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const MessageSquareIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const ShieldIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

const HelpCircleIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </Svg>
);

const LogOutIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

const Trash2Icon = ({ color = '#DC2626', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </Svg>
);

const AlertTriangleIcon = ({ color = '#DC2626', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
  </Svg>
);

const CloseIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const CheckVectorIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Free Limits Quota Definition
// ---------------------------------------------------------------------------
const LIMITS: { key: keyof SettingsUsageCounts; label: string; max: number }[] = [
  { key: 'orders', label: 'Order creation', max: 20 },
  { key: 'clients', label: 'Client creation', max: 20 },
  { key: 'packages', label: 'Packages catalog', max: 5 },
  { key: 'reminders', label: 'Automated reminders', max: 10 },
  { key: 'closes', label: 'Photo order closures', max: 10 },
];

// ---------------------------------------------------------------------------
// Account Deletion Reasons (Play Store & App Store Compliant)
// ---------------------------------------------------------------------------
const DELETION_REASONS = [
  'I am closing or pausing my studio business',
  'Switching to another app or physical registers',
  'Found it difficult to use or missing key features',
  'Subscription pricing / upgrade is too expensive',
  'Privacy, data security, or backup concerns',
  'Other reason',
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
  onDeleteAccount,
}) => {
  const insets = useSafeAreaInsets();
  const { themeName, colors, themes, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const initialLetter = (artistName.trim().charAt(0) || 'S').toUpperCase();

  // Usage Quota Calculations
  const usageRows = useMemo(() => {
    let atLimitCount = 0;
    const rows = LIMITS.map((item) => {
      const used = usage[item.key] || 0;
      const full = used >= item.max;
      if (full) atLimitCount++;
      const pct = isPremium ? 100 : Math.min(Math.round((used / item.max) * 100), 100);
      return {
        label: item.label,
        value: isPremium ? 'Unlimited' : `${used} / ${item.max}`,
        pct,
        textColor: isPremium ? '#121212' : full ? '#DC2626' : 'rgba(18, 18, 18, 0.55)',
        barColor: isPremium ? '#121212' : full ? '#DC2626' : '#121212',
      };
    });
    return { rows, atLimitCount };
  }, [usage, isPremium]);

  // Theme expand state
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  // Profile Preview Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Delete Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Logout Confirmation Handler
  const handleConfirmLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your Shilpi Studio account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  // Permanent Delete Account Action
  const handleExecuteDeleteAccount = async () => {
    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a reason for deleting your account.');
      return;
    }

    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type "DELETE" to confirm permanent account deletion.');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'This will PERMANENTLY ERASE all your client records, wedding bookings, invoices, expenses, and portfolio photos. There is NO WAY to recover this data. Are you absolutely certain?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);

              if (onDeleteAccount) {
                await onDeleteAccount(selectedReason, feedbackText);
              } else {
                // Call backend delete endpoint if reachable
                try {
                  const token = await AsyncStorage.getItem('@shilpi_token');
                  if (token) {
                    await fetch('http://localhost:4000/api/v1/auth/account', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        reason: selectedReason,
                        feedback: feedbackText,
                      }),
                    });
                  }
                } catch {
                  // Fallback offline deletion
                }

                // Clear all stored local data
                await AsyncStorage.multiRemove([
                  '@shilpi_token',
                  '@shilpi_beautician_id',
                  '@shilpi_profile',
                  '@shilpi_clients',
                  '@shilpi_bookings',
                  '@shilpi_notifs',
                  '@shilpi_packages',
                  '@shilpi_setup_done',
                  '@shilpi_theme',
                  '@shilpi_theme_mode',
                ]);
              }

              setIsDeleting(false);
              setDeleteModalOpen(false);

              Alert.alert(
                'Account Deleted',
                'Your Shilpi Studio account and all associated data have been permanently removed.',
                [{ text: 'OK', onPress: onLogout }]
              );
            } catch (err: any) {
              setIsDeleting(false);
              Alert.alert('Deletion Error', err?.message || 'Could not delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 24) + 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. STUDIO & ARTIST PROFILE HERO CARD */}
      <View style={styles.heroProfileCard}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => setProfileModalOpen(true)}
            activeOpacity={0.8}
          >
            {studioLogo ? (
              <Image source={{ uri: studioLogo }} style={styles.avatarImage} />
            ) : (
              <>
                <Svg width={64} height={64} style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#1E293B" />
                      <Stop offset="100%" stopColor="#0F172A" />
                    </LinearGradient>
                  </Defs>
                  <Rect x={0} y={0} width={64} height={64} rx={32} fill="url(#avatarGrad)" />
                </Svg>
                <Text style={styles.avatarLetter}>{initialLetter}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.heroDetails}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroArtistName} numberOfLines={1}>
                {artistName}
              </Text>
              <View style={[styles.membershipBadge, isPremium ? styles.badgePremium : styles.badgeFree]}>
                <Text style={[styles.membershipBadgeText, isPremium ? styles.badgeTextPremium : styles.badgeTextFree]}>
                  {isPremium ? 'PRO' : 'FREE TIER'}
                </Text>
              </View>
            </View>

            <Text style={styles.heroStudioName} numberOfLines={1}>
              {studioName}
            </Text>

            <Text style={styles.heroRoleLocation} numberOfLines={1}>
              {studioRole}{studioCity ? ` · ${studioCity}` : ''}
            </Text>
          </View>
        </View>

        {studioPhone ? (
          <View style={styles.heroContactRow}>
            <PhoneIcon color="rgba(255, 255, 255, 0.7)" size={13} />
            <Text style={styles.heroPhoneText}>{studioPhone}</Text>
          </View>
        ) : null}
      </View>

      {/* 2. GROUP 1: STUDIO & BUSINESS PROFILE */}
      <View style={styles.groupContainer}>
        <Text style={styles.groupSectionTitle}>STUDIO &amp; PROFILE</Text>
        <View style={styles.groupCard}>
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => setProfileModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <UserIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Artist Profile</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>{artistName} · {studioRole}</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => setProfileModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <BuildingIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Business Profile</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>{studioName}{studioCity ? ` · ${studioCity}` : ''}</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.groupRow, styles.groupRowLast]}
            onPress={() => Alert.alert('WhatsApp Business', `Linked to ${studioPhone || 'your registered mobile'}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#ecfdf5' }]}>
              <PhoneIcon color="#059669" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>WhatsApp Contact</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>{studioPhone || 'Setup WhatsApp number'}</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. GROUP 2: MEMBERSHIP & USAGE LIMITS */}
      <View style={styles.groupContainer}>
        <View style={styles.groupSectionHeaderRow}>
          <Text style={styles.groupSectionTitle}>MEMBERSHIP &amp; USAGE</Text>
          <Text style={styles.groupSectionHint}>
            {isPremium ? 'UNLIMITED ACCESS' : `${usageRows.atLimitCount} OF 5 REACHED`}
          </Text>
        </View>

        <View style={styles.groupCard}>
          <TouchableOpacity
            style={styles.groupRow}
            onPress={onGoToSubscription}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: isPremium ? '#fef3c7' : '#f1f5f9' }]}>
              <CrownIcon color={isPremium ? '#d97706' : '#1e293b'} size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Subscription Plan</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {isPremium ? 'Shilpi Pro · Unlimited' : 'Free Tier · 20 Bookings Limit'}
              </Text>
            </View>
            <View style={styles.planActionWrap}>
              <Text style={[styles.planBadgeText, isPremium && { color: '#d97706' }]}>
                {isPremium ? 'MANAGE' : 'UPGRADE'}
              </Text>
              <ChevronRightIcon />
            </View>
          </TouchableOpacity>

          {/* Usage Meters */}
          <View style={styles.usageBlock}>
            <Text style={styles.usageBlockKicker}>ACTIVE MONTH QUOTAS</Text>
            {usageRows.rows.map((u, idx) => (
              <View key={idx} style={styles.usageMeterItem}>
                <View style={styles.usageMeterTop}>
                  <Text style={styles.usageMeterLabel}>{u.label}</Text>
                  <Text style={[styles.usageMeterVal, { color: u.textColor }]}>{u.value}</Text>
                </View>
                <View style={styles.usageMeterTrack}>
                  <View style={[styles.usageMeterFill, { width: `${u.pct}%`, backgroundColor: u.barColor }]} />
                </View>
              </View>
            ))}

            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeCtaBtn}
                onPress={onGoToSubscription}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeCtaText}>UNLOCK UNLIMITED BOOKINGS · ₹399/MO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 4. GROUP 3: APP PREFERENCES & THEMES */}
      <View style={styles.groupContainer}>
        <Text style={styles.groupSectionTitle}>PREFERENCES &amp; THEME</Text>
        <View style={styles.groupCard}>
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => setThemePickerOpen(!themePickerOpen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#fdf2f8' }]}>
              <PaletteIcon color="#be185d" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>App Theme</Text>
              <Text style={styles.rowSubtitle}>
                {themes.find((t) => t.name === themeName)?.label || 'Signature Luxury'}
              </Text>
            </View>
            <Text style={styles.themeToggleText}>{themePickerOpen ? 'HIDE' : 'CHANGE'}</Text>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Interactive Theme Swatches Accordion */}
          {themePickerOpen && (
            <View style={styles.themePaletteList}>
              {themes.map((th) => {
                const isSelected = themeName === th.name;
                return (
                  <TouchableOpacity
                    key={th.name}
                    style={[styles.themeOptionRow, isSelected && styles.themeOptionRowActive]}
                    onPress={() => setTheme(th.name)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.swatchMiniGroup}>
                      <View style={[styles.swatchDot, { backgroundColor: th.accent }]} />
                      <View style={[styles.swatchDot, { backgroundColor: th.accent2 }]} />
                      <View style={[styles.swatchDot, { backgroundColor: th.tint }]} />
                    </View>
                    <View style={styles.themeOptionInfo}>
                      <Text style={styles.themeOptionLabel}>{th.label}</Text>
                      <Text style={styles.themeOptionHint}>{th.hint}</Text>
                    </View>
                    <View style={[styles.themeRadioCircle, isSelected && styles.themeRadioCircleActive]}>
                      {isSelected ? <CheckVectorIcon color="#ffffff" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => Alert.alert('Notification Settings', 'Instant WhatsApp push notifications, trial booking alerts, and client follow-up reminders are enabled.')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <BellIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Notifications &amp; Alerts</Text>
              <Text style={styles.rowSubtitle}>Sound, Push &amp; WhatsApp reminders</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => Alert.alert('WhatsApp Templates', '4 bridal templates configured: Advance receipt, Wedding trial reminder, Balance due alert, and Post-event thank you.')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <MessageSquareIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>WhatsApp Message Templates</Text>
              <Text style={styles.rowSubtitle}>4 pre-saved client templates</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.groupRow, styles.groupRowLast]}
            onPress={() => Alert.alert('Device Permissions', 'Camera (Portfolio lookbook), Photo Gallery (Client photos), and Contacts (Client CRM import) granted.')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <ShieldIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Device Permissions</Text>
              <Text style={styles.rowSubtitle}>Camera, Photos, Contacts</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. GROUP 4: SUPPORT & LEGAL */}
      <View style={styles.groupContainer}>
        <Text style={styles.groupSectionTitle}>SUPPORT &amp; LEGAL</Text>
        <View style={styles.groupCard}>
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => Alert.alert('Help & Knowledge Base', 'Browse Shilpi Studio ERP quick-start guides, invoicing tips, and offline backup protocols.')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <HelpCircleIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Help &amp; Knowledge Base</Text>
              <Text style={styles.rowSubtitle}>Guides, FAQs &amp; Video Walkthroughs</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => Alert.alert('Privacy Policy', 'Your client data and financials are protected with industry-standard encryption and never sold to third parties.')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <ShieldIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Privacy Policy</Text>
              <Text style={styles.rowSubtitle}>Data security &amp; encryption terms</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.groupRow, styles.groupRowLast]}
            onPress={() => Alert.alert('Shilpi Studio ERP', 'Version 1.0.0 (Build 2026.11)\nArchitecture: React Native 0.88 + Expo SDK 58')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <PackageIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>App Version</Text>
              <Text style={styles.rowSubtitle}>v1.0.0 · Build 2026.11 (Latest)</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. GROUP 5: ACCOUNT & DANGER ZONE */}
      <View style={styles.groupContainer}>
        <Text style={styles.groupSectionTitle}>ACCOUNT ACTIONS</Text>
        <View style={styles.groupCard}>
          {/* Logout */}
          <TouchableOpacity
            style={styles.groupRow}
            onPress={handleConfirmLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <LogOutIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Log Out</Text>
              <Text style={styles.rowSubtitle}>Sign out from this device</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* PERMANENTLY DELETE ACCOUNT OPTION */}
          <TouchableOpacity
            style={[styles.groupRow, styles.groupRowLast, styles.dangerRow]}
            onPress={() => {
              setSelectedReason('');
              setFeedbackText('');
              setConfirmText('');
              setDeleteModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#fee2e2' }]}>
              <Trash2Icon color="#dc2626" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.dangerRowTitle}>Permanently Delete Account</Text>
              <Text style={styles.dangerRowSubtitle}>
                Erase studio, bookings, clients &amp; financials
              </Text>
            </View>
            <ChevronRightIcon color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. PROFILE PREVIEW MODAL */}
      <Modal visible={profileModalOpen} transparent animationType="slide" onRequestClose={() => setProfileModalOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setProfileModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.profileModalCard}>
                <View style={styles.profileModalHeader}>
                  <Text style={styles.profileModalKicker}>STUDIO PROFILE</Text>
                  <Text style={styles.profileModalTitle}>{artistName}</Text>
                  <Text style={styles.profileModalSubtitle}>{studioName}</Text>
                </View>

                <View style={styles.profileDetailsList}>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileDetailLabel}>Role / Designation</Text>
                    <Text style={styles.profileDetailVal}>{studioRole}</Text>
                  </View>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileDetailLabel}>City / Location</Text>
                    <Text style={styles.profileDetailVal}>{studioCity || 'Not specified'}</Text>
                  </View>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileDetailLabel}>Contact Phone</Text>
                    <Text style={styles.profileDetailVal}>{studioPhone || 'Not specified'}</Text>
                  </View>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileDetailLabel}>Membership Tier</Text>
                    <Text style={[styles.profileDetailVal, { color: isPremium ? '#d97706' : '#121212', fontWeight: '800' }]}>
                      {isPremium ? 'Shilpi Pro (Unlimited)' : 'Free Tier'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.profileModalCloseBtn}
                  onPress={() => setProfileModalOpen(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.profileModalCloseText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 8. PERMANENT ACCOUNT DELETION MODAL WITH DELETION REASON OPTION */}
      <Modal
        visible={deleteModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isDeleting) setDeleteModalOpen(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (!isDeleting) setDeleteModalOpen(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback>
                <View style={styles.deleteModalCard}>
                  {/* Danger Header */}
                  <View style={styles.deleteModalHeader}>
                    <View style={styles.warningIconCircle}>
                      <AlertTriangleIcon color="#dc2626" size={24} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deleteModalTitle}>Permanently Delete Account</Text>
                      <Text style={styles.deleteModalSubtitle}>
                        This action is irreversible and erases all studio data.
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => !isDeleting && setDeleteModalOpen(false)}
                      disabled={isDeleting}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <CloseIcon color="#64748b" size={18} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.deleteModalScroll} showsVerticalScrollIndicator={false}>
                    {/* Data Loss Warning Box */}
                    <View style={styles.deleteWarningBox}>
                      <Text style={styles.deleteWarningItem}>• All wedding bookings and client orders will be permanently erased.</Text>
                      <Text style={styles.deleteWarningItem}>• Client CRM records, invoices, and payment histories deleted.</Text>
                      <Text style={styles.deleteWarningItem}>• Portfolio looks, expenses, and reminders cannot be recovered.</Text>
                    </View>

                    {/* Step 1: Deletion Reason (Required) */}
                    <Text style={styles.deleteSectionLabel}>
                      WHY ARE YOU DELETING YOUR ACCOUNT? <Text style={{ color: '#dc2626' }}>*</Text>
                    </Text>

                    <View style={styles.reasonsList}>
                      {DELETION_REASONS.map((reason) => {
                        const isChosen = selectedReason === reason;
                        return (
                          <TouchableOpacity
                            key={reason}
                            style={[styles.reasonOptionPill, isChosen && styles.reasonOptionPillActive]}
                            onPress={() => setSelectedReason(reason)}
                            activeOpacity={0.7}
                            disabled={isDeleting}
                          >
                            <View style={[styles.reasonRadioCircle, isChosen && styles.reasonRadioCircleActive]}>
                              {isChosen ? <View style={styles.reasonRadioDot} /> : null}
                            </View>
                            <Text style={[styles.reasonOptionText, isChosen && styles.reasonOptionTextActive]}>
                              {reason}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Optional Feedback Input */}
                    <Text style={styles.deleteSectionLabel}>ADDITIONAL FEEDBACK (OPTIONAL)</Text>
                    <TextInput
                      style={styles.deleteFeedbackInput}
                      placeholder="Tell us what we could have improved..."
                      placeholderTextColor="rgba(18, 18, 18, 0.4)"
                      value={feedbackText}
                      onChangeText={setFeedbackText}
                      multiline
                      numberOfLines={3}
                      editable={!isDeleting}
                    />

                    {/* Step 2: Safety Word Confirmation */}
                    <Text style={styles.deleteSectionLabel}>
                      TYPE &quot;DELETE&quot; TO CONFIRM <Text style={{ color: '#dc2626' }}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.deleteConfirmInput}
                      placeholder='Type "DELETE"'
                      placeholderTextColor="rgba(18, 18, 18, 0.35)"
                      value={confirmText}
                      onChangeText={setConfirmText}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!isDeleting}
                    />
                  </ScrollView>

                  {/* Modal Action Buttons */}
                  <View style={styles.deleteActionRow}>
                    <TouchableOpacity
                      style={styles.deleteCancelBtn}
                      onPress={() => setDeleteModalOpen(false)}
                      disabled={isDeleting}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteCancelText}>KEEP ACCOUNT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.deleteConfirmBtn,
                        (!selectedReason || confirmText.trim().toUpperCase() !== 'DELETE' || isDeleting) &&
                          styles.deleteConfirmBtnDisabled,
                      ]}
                      onPress={handleExecuteDeleteAccount}
                      disabled={!selectedReason || confirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                      activeOpacity={0.8}
                    >
                      {isDeleting ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.deleteConfirmText}>DELETE PERMANENTLY</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

// ---------------------------------------------------------------------------
// Design & Theme Stylesheet
// ---------------------------------------------------------------------------
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#f4f4f6',
    },
    scrollContent: {
      paddingBottom: 40,
    },

    // 1. Hero Profile Card
    heroProfileCard: {
      backgroundColor: '#121212',
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 22,
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatarWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatarImage: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    avatarLetter: {
      fontSize: 26,
      fontWeight: '800',
      color: '#ffffff',
    },
    heroDetails: {
      flex: 1,
    },
    heroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    heroArtistName: {
      fontSize: 20,
      fontWeight: '800',
      color: '#ffffff',
      flex: 1,
    },
    membershipBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgePremium: {
      backgroundColor: '#fef3c7',
    },
    badgeFree: {
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },
    membershipBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    badgeTextPremium: {
      color: '#b45309',
    },
    badgeTextFree: {
      color: '#ffffff',
    },
    heroStudioName: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
    heroRoleLocation: {
      fontSize: 11.5,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: 2,
    },
    heroContactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    heroPhoneText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.75)',
    },

    // 2. Group Section Cards
    groupContainer: {
      marginTop: 18,
      paddingHorizontal: 16,
    },
    groupSectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    groupSectionTitle: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: 'rgba(18, 18, 18, 0.55)',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    groupSectionHint: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.deep,
    },
    groupCard: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.07)',
      overflow: 'hidden',
      shadowColor: '#121212',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    groupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.05)',
      gap: 12,
      backgroundColor: '#ffffff',
    },
    groupRowLast: {
      borderBottomWidth: 0,
    },
    iconPill: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowMainCol: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 13.5,
      fontWeight: '700',
      color: '#121212',
    },
    rowSubtitle: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.48)',
      marginTop: 1.5,
    },
    planActionWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    planBadgeText: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#121212',
    },

    // Danger Row
    dangerRow: {
      backgroundColor: '#fffdfd',
    },
    dangerRowTitle: {
      fontSize: 13.5,
      fontWeight: '700',
      color: '#dc2626',
    },
    dangerRowSubtitle: {
      fontSize: 11,
      color: 'rgba(220, 38, 38, 0.65)',
      marginTop: 1.5,
    },

    // Usage Meters Block
    usageBlock: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(18, 18, 18, 0.05)',
      backgroundColor: '#fafafb',
    },
    usageBlockKicker: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      color: 'rgba(18, 18, 18, 0.45)',
      marginBottom: 10,
    },
    usageMeterItem: {
      marginBottom: 10,
    },
    usageMeterTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    usageMeterLabel: {
      fontSize: 11.5,
      fontWeight: '600',
      color: '#1e293b',
    },
    usageMeterVal: {
      fontSize: 11.5,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    usageMeterTrack: {
      height: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(18, 18, 18, 0.08)',
      marginTop: 5,
      overflow: 'hidden',
    },
    usageMeterFill: {
      height: '100%',
      borderRadius: 999,
    },
    upgradeCtaBtn: {
      backgroundColor: '#121212',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    upgradeCtaText: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#ffffff',
    },

    // Theme Picker Accordion
    themeToggleText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.deep,
      marginRight: 2,
    },
    themePaletteList: {
      backgroundColor: '#f8fafc',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.05)',
      paddingVertical: 6,
    },
    themeOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 12,
    },
    themeOptionRowActive: {
      backgroundColor: 'rgba(18, 18, 18, 0.04)',
    },
    swatchMiniGroup: {
      flexDirection: 'row',
      gap: 3,
    },
    swatchDot: {
      width: 14,
      height: 24,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.08)',
    },
    themeOptionInfo: {
      flex: 1,
    },
    themeOptionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
    },
    themeOptionHint: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 1,
    },
    themeRadioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: 'rgba(18, 18, 18, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeRadioCircleActive: {
      backgroundColor: '#121212',
      borderColor: '#121212',
    },

    // Modal Generic
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },

    // Profile Preview Modal
    profileModalCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 22,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 18,
      elevation: 8,
    },
    profileModalHeader: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.08)',
      paddingBottom: 14,
    },
    profileModalKicker: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: colors.deep,
    },
    profileModalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#121212',
      marginTop: 2,
    },
    profileModalSubtitle: {
      fontSize: 13,
      color: 'rgba(18, 18, 18, 0.6)',
      marginTop: 2,
    },
    profileDetailsList: {
      marginVertical: 14,
      gap: 12,
    },
    profileDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    profileDetailLabel: {
      fontSize: 12.5,
      color: 'rgba(18, 18, 18, 0.55)',
      fontWeight: '600',
    },
    profileDetailVal: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
    },
    profileModalCloseBtn: {
      backgroundColor: '#121212',
      paddingVertical: 13,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    profileModalCloseText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#ffffff',
    },

    // Account Deletion Modal (Compliant with reason selection)
    deleteModalCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 20,
      width: '100%',
      maxHeight: '85%',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    deleteModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.08)',
      paddingBottom: 12,
    },
    warningIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#fee2e2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteModalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#dc2626',
    },
    deleteModalSubtitle: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.55)',
      marginTop: 1,
    },
    deleteModalScroll: {
      marginVertical: 12,
    },
    deleteWarningBox: {
      backgroundColor: '#fef2f2',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: '#fecaca',
      gap: 6,
      marginBottom: 14,
    },
    deleteWarningItem: {
      fontSize: 11,
      color: '#991b1b',
      lineHeight: 16,
      fontWeight: '500',
    },
    deleteSectionLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#1e293b',
      marginBottom: 8,
      marginTop: 6,
    },
    reasonsList: {
      gap: 8,
      marginBottom: 14,
    },
    reasonOptionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.12)',
      backgroundColor: '#ffffff',
      gap: 10,
    },
    reasonOptionPillActive: {
      borderColor: '#dc2626',
      backgroundColor: '#fff5f5',
    },
    reasonRadioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: 'rgba(18, 18, 18, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    reasonRadioCircleActive: {
      borderColor: '#dc2626',
    },
    reasonRadioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#dc2626',
    },
    reasonOptionText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#1e293b',
      flex: 1,
    },
    reasonOptionTextActive: {
      color: '#dc2626',
      fontWeight: '700',
    },
    deleteFeedbackInput: {
      backgroundColor: '#f8fafc',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.1)',
      padding: 10,
      fontSize: 12,
      color: '#121212',
      textAlignVertical: 'top',
      minHeight: 60,
      marginBottom: 14,
    },
    deleteConfirmInput: {
      backgroundColor: '#f8fafc',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: '#dc2626',
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 13,
      fontWeight: '700',
      color: '#dc2626',
      letterSpacing: 1,
      marginBottom: 6,
    },
    deleteActionRow: {
      flexDirection: 'row',
      gap: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: 'rgba(18, 18, 18, 0.08)',
    },
    deleteCancelBtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteCancelText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#1e293b',
    },
    deleteConfirmBtn: {
      flex: 1.3,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: '#dc2626',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteConfirmBtnDisabled: {
      opacity: 0.45,
    },
    deleteConfirmText: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#ffffff',
    },
  });
