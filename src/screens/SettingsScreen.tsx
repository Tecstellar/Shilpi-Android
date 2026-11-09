import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';

interface SettingsScreenProps {
  onGoToSubscription: () => void;
  onLogout: () => void;
  onGoBack: () => void;
}

const SETTINGS_ROWS = [
  { label: 'My Profile', value: 'Shilpa R.' },
  { label: 'Business Profile', value: 'Shilpi Makeovers' },
  { label: 'WhatsApp Settings', value: '+91 98765 43210' },
  { label: 'Notification Settings', value: 'On' },
  { label: 'WhatsApp Message Templates', value: '4 saved' },
  { label: 'App Permissions', value: 'Photos, Contacts' },
  { label: 'Subscription', value: 'Premium · ₹499 / mo', isSub: true },
  { label: 'Support & Help', value: 'WhatsApp Desk' },
  { label: 'Privacy & Terms', value: '' },
];

const THEMES = [
  { name: 'Signature', color: '#e8276b', desc: 'Brand pink & saffron' },
  { name: 'Mehendi', color: '#1f7a4d', desc: 'Deep henna green' },
  { name: 'Kumkum', color: '#d62828', desc: 'Vermilion red' },
  { name: 'Indigo', color: '#3b3fb6', desc: 'Cool indigo blush' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onGoToSubscription,
  onLogout,
  onGoBack,
}) => {
  const [selectedTheme, setSelectedTheme] = useState('Signature');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Artist Profile Header */}
      <View style={styles.inkProfileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>S</Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.artistName}>Shilpa R.</Text>
          <Text style={styles.artistSub}>Bridal Makeup Artist · Coimbatore</Text>
        </View>
      </View>

      {/* 2. Subscription Status Banner */}
      <TouchableOpacity
        style={styles.planBanner}
        onPress={onGoToSubscription}
        activeOpacity={0.8}
      >
        <View style={styles.planBannerLeft}>
          <Text style={styles.planBannerTitle}>SHILPI PREMIUM</Text>
          <Text style={styles.planBannerSub}>Unlimited Bookings, Clients & WhatsApp</Text>
        </View>
        <Text style={styles.planBadge}>ACTIVE</Text>
      </TouchableOpacity>

      {/* 3. Settings List Rows */}
      <View style={styles.settingsCard}>
        {SETTINGS_ROWS.map((row, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.settingRow}
            onPress={() => {
              if (row.isSub) onGoToSubscription();
              else Alert.alert(row.label, `Configuration for ${row.label}`);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>{row.label}</Text>
            <View style={styles.rowRight}>
              {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 4. Theme Selector */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>STUDIO THEME</Text>
      </View>

      <View style={styles.themesCard}>
        {THEMES.map((th) => {
          const isSelected = selectedTheme === th.name;
          return (
            <TouchableOpacity
              key={th.name}
              style={[styles.themeRow, isSelected && styles.themeRowActive]}
              onPress={() => setSelectedTheme(th.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.themeDot, { backgroundColor: th.color }]} />
              <View style={styles.themeInfo}>
                <Text style={styles.themeName}>{th.name}</Text>
                <Text style={styles.themeDesc}>{th.desc}</Text>
              </View>
              {isSelected && <Text style={styles.themeCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 5. Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>LOGOUT OF STUDIO ACCOUNT</Text>
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
  inkProfileCard: {
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
  planBanner: {
    backgroundColor: Colors.tint2,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.2)',
  },
  planBannerLeft: {
    flex: 1,
  },
  planBannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.deep,
  },
  planBannerSub: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.7)',
    marginTop: 2,
  },
  planBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    backgroundColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
  },
  rowLabel: {
    fontSize: 14,
    color: '#121212',
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontSize: 12.5,
    color: 'rgba(18, 18, 18, 0.55)',
  },
  chevron: {
    fontSize: 18,
    color: 'rgba(18, 18, 18, 0.35)',
    lineHeight: 18,
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
  themesCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
  },
  themeRowActive: {
    backgroundColor: Colors.tint,
  },
  themeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  themeDesc: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.5)',
    marginTop: 1,
  },
  themeCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  logoutBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: Colors.accent2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.accent2,
  },
});
