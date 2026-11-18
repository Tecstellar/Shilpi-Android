import React, { useMemo, useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Circle, Line, Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { apiClient } from '../services/apiClient';
import { PhotoPickerModal } from '../components/PhotoPickerModal';

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
  onUpdateProfile?: (updated: {
    artistName?: string;
    studioName?: string;
    studioLogo?: string;
    studioPhone?: string;
    studioCity?: string;
    studioRole?: string;
    address?: string;
    pincode?: string;
  }) => void;
}

// ---------------------------------------------------------------------------
// Premium Vector Icons
// ---------------------------------------------------------------------------
const ChevronRightIcon = ({ color = 'rgba(18, 18, 18, 0.35)', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

const ChevronLeftIcon = ({ color = '#be185d', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 18l-6-6 6-6" />
  </Svg>
);

const UserIcon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const BuildingIcon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <Path d="M10 6h4" />
    <Path d="M10 10h4" />
    <Path d="M10 14h4" />
    <Path d="M10 18h4" />
  </Svg>
);

const WhatsAppIcon = ({ color = '#25D366', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </Svg>
);

const PhoneIcon = ({ color = '#121212', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const CrownIcon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <Circle cx="12" cy="4" r="1.3" fill={color} />
    <Circle cx="5" cy="4" r="1.3" fill={color} />
    <Circle cx="19" cy="4" r="1.3" fill={color} />
    <Path d="M5 20h14" />
  </Svg>
);

const BarChart2Icon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6" y1="20" x2="6" y2="14" />
  </Svg>
);

const PaletteIcon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="13.5" cy="6.5" r=".9" fill={color} />
    <Circle cx="17.5" cy="10.5" r=".9" fill={color} />
    <Circle cx="8.5" cy="7.5" r=".9" fill={color} />
    <Circle cx="6.5" cy="12.5" r=".9" fill={color} />
    <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </Svg>
);

const MessageSquareIcon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <Line x1="8" y1="9" x2="16" y2="9" />
    <Line x1="8" y1="13" x2="13" y2="13" />
  </Svg>
);

const FileTextIcon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
    <Line x1="10" y1="9" x2="8" y2="9" />
  </Svg>
);

const ShieldIcon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Polyline points="9 12 11 14 15 10" />
  </Svg>
);

const LogOutIcon = ({ color = '#121212', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

const Trash2Icon = ({ color = '#DC2626', size = 17 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
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

const CameraIcon = ({ color = '#ffffff', size = 11 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const CheckCircleVectorIcon = ({ color = '#D4AF37', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);

const CheckVectorIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Quotas & Default Templates
// ---------------------------------------------------------------------------
const LIMITS: { key: keyof SettingsUsageCounts; label: string; max: number }[] = [
  { key: 'orders', label: 'Order creation', max: 20 },
  { key: 'clients', label: 'Client creation', max: 20 },
  { key: 'packages', label: 'Packages catalog', max: 5 },
  { key: 'reminders', label: 'Automated reminders', max: 10 },
  { key: 'closes', label: 'Photo order closures', max: 10 },
];

const DELETION_REASONS = [
  'I am closing or pausing my studio business',
  'Switching to another app or physical registers',
  'Found it difficult to use or missing key features',
  'Subscription pricing / upgrade is too expensive',
  'Privacy, data security, or backup concerns',
  'Other reason',
];

const ROLE_SUGGESTIONS = [
  'Bridal Makeup Artist',
  'Celebrity Makeup & Hair Stylist',
  'Bridal Mehendi Artist',
  'Hairstylist & Saree Draper',
  'Nails & Lash Extension Specialist',
  'Beauty Studio & Academy Owner',
];

const CITY_SUGGESTIONS = [
  'Coimbatore',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Mumbai',
  'Delhi NCR',
  'Kochi',
  'Pune',
];

interface MessageTemplateItem {
  id: string;
  title: string;
  subtitle: string;
  body: string;
}

const DEFAULT_TEMPLATES: MessageTemplateItem[] = [
  {
    id: 'advance',
    title: 'Booking & Advance Receipt',
    subtitle: 'Sent when advance payment is received',
    body: 'Dear {client_name}, your bridal appointment for {event_date} is confirmed with advance payment. Total package: {package_name}. Thank you for choosing {studio_name}!',
  },
  {
    id: 'trial',
    title: 'Wedding Trial Reminder',
    subtitle: 'Sent 2-3 days before bridal trial look',
    body: 'Hi {client_name}, this is a gentle reminder for your bridal makeup trial session scheduled on {event_date} at {studio_name}. Please arrive with a clean face and your outfit reference.',
  },
  {
    id: 'balance',
    title: 'Pending Balance Due Alert',
    subtitle: 'Sent before the wedding day event',
    body: 'Dear {client_name}, the remaining balance of {balance_due} for your booking on {event_date} is due. You can pay via UPI or Cash. Looking forward to making you look stunning!',
  },
  {
    id: 'thanks',
    title: 'Post-Wedding Thank You Note',
    subtitle: 'Sent after wedding day completion',
    body: 'Thank you {client_name} for choosing {studio_name} on your most special day! We would love to see your professional photos and hear your feedback.',
  },
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
  onUpdateProfile,
  onDeleteAccount,
}) => {
  const insets = useSafeAreaInsets();
  const { themeName, colors, themes, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Editable Profile State
  const [curArtistName, setCurArtistName] = useState(artistName);
  const [curStudioName, setCurStudioName] = useState(studioName);
  const [curStudioLogo, setCurStudioLogo] = useState<string | undefined>(studioLogo);
  const [curStudioPhone, setCurStudioPhone] = useState(studioPhone);
  const [curStudioCity, setCurStudioCity] = useState(studioCity);
  const [curStudioRole, setCurStudioRole] = useState(studioRole);
  const [curAddress, setCurAddress] = useState('');
  const [curPincode, setCurPincode] = useState('');

  // WhatsApp auto-send toggles
  const [autoSendReceipt, setAutoSendReceipt] = useState(true);
  const [autoSendReminder, setAutoSendReminder] = useState(true);

  // Templates
  const [templates, setTemplates] = useState<MessageTemplateItem[]>(DEFAULT_TEMPLATES);
  const [activeEditingTemplate, setActiveEditingTemplate] = useState<MessageTemplateItem | null>(null);

  // Sync with incoming props
  useEffect(() => {
    setCurArtistName(artistName);
    setCurStudioName(studioName);
    setCurStudioLogo(studioLogo);
    setCurStudioPhone(studioPhone);
    setCurStudioCity(studioCity);
    setCurStudioRole(studioRole);
  }, [artistName, studioName, studioLogo, studioPhone, studioCity, studioRole]);

  // Load existing profile & templates from AsyncStorage
  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('@shilpi_profile');
        if (storedProfile) {
          const p = JSON.parse(storedProfile);
          if (p.address) setCurAddress(p.address);
          if (p.pincode) setCurPincode(p.pincode);
        }
        const storedTemplates = await AsyncStorage.getItem('@shilpi_templates');
        if (storedTemplates) {
          setTemplates(JSON.parse(storedTemplates));
        }
      } catch {}
    };
    hydrate();
  }, []);

  const initialLetter = (curArtistName.trim().charAt(0) || 'S').toUpperCase();

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

  // Interactive Theme State
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [quotasExpanded, setQuotasExpanded] = useState(false);
  const [isLogoPickerVisible, setIsLogoPickerVisible] = useState(false);

  // Edit Modals State
  const [editArtistModalOpen, setEditArtistModalOpen] = useState(false);
  const [editBusinessModalOpen, setEditBusinessModalOpen] = useState(false);
  const [editWhatsAppModalOpen, setEditWhatsAppModalOpen] = useState(false);
  const [editTemplatesModalOpen, setEditTemplatesModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Delete Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Helper: Persist updated profile to AsyncStorage, Parent State, and Backend
  const saveProfileData = async (updates: {
    artistName?: string;
    studioName?: string;
    studioLogo?: string;
    studioPhone?: string;
    studioCity?: string;
    studioRole?: string;
    address?: string;
    pincode?: string;
  }) => {
    try {
      setIsSavingProfile(true);

      const stored = await AsyncStorage.getItem('@shilpi_profile');
      const existing = stored ? JSON.parse(stored) : {};

      const nextProfile = {
        ...existing,
        ownerName: updates.artistName !== undefined ? updates.artistName : curArtistName,
        businessName: updates.studioName !== undefined ? updates.studioName : curStudioName,
        phone: updates.studioPhone !== undefined ? updates.studioPhone : curStudioPhone,
        city: updates.studioCity !== undefined ? updates.studioCity : curStudioCity,
        businessTypes: [updates.studioRole !== undefined ? updates.studioRole : curStudioRole],
        address: updates.address !== undefined ? updates.address : curAddress,
        pincode: updates.pincode !== undefined ? updates.pincode : curPincode,
        logoUri: updates.studioLogo !== undefined ? updates.studioLogo : curStudioLogo,
      };

      await AsyncStorage.setItem('@shilpi_profile', JSON.stringify(nextProfile));

      // Notify parent container
      if (onUpdateProfile) {
        onUpdateProfile({
          artistName: nextProfile.ownerName,
          studioName: nextProfile.businessName,
          studioLogo: nextProfile.logoUri,
          studioPhone: nextProfile.phone,
          studioCity: nextProfile.city,
          studioRole: nextProfile.businessTypes[0],
          address: nextProfile.address,
          pincode: nextProfile.pincode,
        });
      }

      // Sync with backend API
      try {
        await apiClient.patch('/auth/me', {
          ownerName: nextProfile.ownerName,
          businessName: nextProfile.businessName,
          businessTypes: nextProfile.businessTypes,
          city: nextProfile.city,
          address: nextProfile.address,
          pincode: nextProfile.pincode,
          phone: nextProfile.phone,
          logoUri: nextProfile.logoUri,
        });
      } catch (err) {
        console.warn('Backend sync profile failed:', err);
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      setIsSavingProfile(false);
      return true;
    } catch {
      setIsSavingProfile(false);
      Alert.alert('Save Error', 'Could not save profile changes.');
      return false;
    }
  };

  // Pick Logo / Photo with ImagePicker
  const handlePickLogo = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setIsLogoPickerVisible(true);
  };

  const handlePickLogoCamera = async () => {
    setIsLogoPickerVisible(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow camera access to take a photo.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        const pickedUri = res.assets[0].uri;
        setCurStudioLogo(pickedUri);
        await saveProfileData({ studioLogo: pickedUri });
      }
    } catch {
      Alert.alert('Camera Notice', 'Could not open camera.');
    }
  };

  const handlePickLogoGallery = async () => {
    setIsLogoPickerVisible(false);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow gallery access to pick a studio logo or artist photo.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        const pickedUri = res.assets[0].uri;
        setCurStudioLogo(pickedUri);
        await saveProfileData({ studioLogo: pickedUri });
      }
    } catch {
      Alert.alert('Picker Notice', 'Could not open photo gallery.');
    }
  };

  const handleRemoveLogo = async () => {
    setIsLogoPickerVisible(false);
    setCurStudioLogo(undefined);
    await saveProfileData({ studioLogo: '' });
  };

  // Logout Confirmation Handler
  const handleConfirmLogout = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your Shilpi Studio account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
            onLogout();
          },
        },
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

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

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

              // Call backend delete endpoint
              try {
                if (onDeleteAccount) {
                  await onDeleteAccount(selectedReason, feedbackText);
                } else {
                  await apiClient.delete('/auth/account', {
                    reason: selectedReason,
                    feedback: feedbackText,
                  });
                }
              } catch (delErr) {
                console.warn('Backend deleteAccount failed:', delErr);
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
                '@shilpi_templates',
              ]);

              setIsDeleting(false);
              setDeleteModalOpen(false);

              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}

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
      {/* 1. STUDIO & ARTIST PROFILE HERO CARD (Interactive with Edit Badge) */}
      <View style={styles.heroProfileCard}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={handlePickLogo}
            activeOpacity={0.8}
          >
            {curStudioLogo ? (
              <Image source={{ uri: curStudioLogo }} style={styles.avatarImage} />
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
            <View style={styles.avatarEditOverlay}>
              <CameraIcon color="#ffffff" size={10} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroDetails}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setEditArtistModalOpen(true);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroArtistName} numberOfLines={1}>
                {curArtistName}
              </Text>
              <TouchableOpacity
                style={[styles.membershipBadge, isPremium ? styles.badgePremium : styles.badgeFree]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  if (onGoToSubscription) onGoToSubscription();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.membershipBadgeText, isPremium ? styles.badgeTextPremium : styles.badgeTextFree]}>
                  {isPremium ? 'PRO' : 'FREE TIER'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.heroStudioName} numberOfLines={1}>
              {curStudioName}
            </Text>

            <Text style={styles.heroRoleLocation} numberOfLines={1}>
              {curStudioRole}{curStudioCity ? ` · ${curStudioCity}` : ''}
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.heroBottomBar}>
          <View style={styles.heroContactRow}>
            <PhoneIcon color="rgba(255, 255, 255, 0.7)" size={13} />
            <Text style={styles.heroPhoneText}>{curStudioPhone || 'No WhatsApp linked'}</Text>
          </View>

          <View style={styles.heroVerifiedRow}>
            <CheckCircleVectorIcon color="#D4AF37" size={13} />
            <Text style={styles.heroVerifiedText}>VERIFIED ARTIST</Text>
          </View>
        </View>
      </View>

      {/* 2. GROUP 1: PROFILE */}
      <View style={styles.groupContainer}>
        <View style={styles.groupSectionHeaderRow}>
          <Text style={styles.groupSectionTitle}>PROFILE</Text>
          <Text style={styles.groupSectionHint}>
            {isPremium ? 'PRO MEMBER' : 'FREE TRIAL'}
          </Text>
        </View>

        <View style={styles.groupCard}>
          {/* Edit Artist Profile Row */}
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setEditArtistModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <UserIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Artist Profile</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {curArtistName} · {curStudioRole}
              </Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Edit Business Profile Row */}
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setEditBusinessModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <BuildingIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Business Profile</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {curStudioName}{curStudioCity ? ` · ${curStudioCity}` : ''}
              </Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Edit WhatsApp Contact Row */}
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setEditWhatsAppModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#ecfdf5' }]}>
              <WhatsAppIcon color="#25D366" size={18} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>WhatsApp</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {curStudioPhone || 'Setup WhatsApp number'}
              </Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Subscription */}
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              if (onGoToSubscription) onGoToSubscription();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: isPremium ? '#fef3c7' : '#f5f3ff' }]}>
              <CrownIcon color={isPremium ? '#d97706' : '#be185d'} size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Subscription</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {isPremium ? 'Shilpi Pro · Unlimited' : 'Free Tier · 20 Bookings Limit'}
              </Text>
            </View>
            <View style={styles.planActionWrap}>
              <Text style={[styles.planBadgeText, isPremium ? { color: '#d97706' } : { color: '#be185d' }]}>
                {isPremium ? 'MANAGE' : 'UPGRADE'}
              </Text>
              <ChevronRightIcon />
            </View>
          </TouchableOpacity>

          {/* Active Month Quotas (Click-to-View Quotas) */}
          <TouchableOpacity
            style={[styles.groupRow, !quotasExpanded && styles.groupRowLast]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setQuotasExpanded(!quotasExpanded);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f8fafc' }]}>
              <BarChart2Icon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Active Month Quotas</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {isPremium
                  ? 'All 5 features unlimited · Tap to inspect'
                  : `${usageRows.atLimitCount} of 5 limits reached · Tap to inspect`}
              </Text>
            </View>
            <Text style={styles.themeToggleText}>{quotasExpanded ? 'HIDE' : 'VIEW'}</Text>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Quotas Visible ONLY If Clicked */}
          {quotasExpanded && (
            <View style={styles.usageBlock}>
              <Text style={styles.usageBlockKicker}>ACTIVE MONTH USAGE STATUS</Text>
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
                  <Text style={styles.upgradeCtaText}>UNLOCK UNLIMITED BOOKINGS · UPGRADE</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* 3. GROUP 2: SETTINGS & HELP */}
      <View style={styles.groupContainer}>
        <Text style={styles.groupSectionTitle}>SETTINGS &amp; HELP</Text>
        <View style={styles.groupCard}>
          {/* Live App Theme Switcher */}
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setThemePickerOpen(!themePickerOpen);
            }}
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
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setTheme(th.name);
                    }}
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

          {/* Edit WhatsApp Message Templates Row */}
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setEditTemplatesModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <MessageSquareIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>WhatsApp Message Templates</Text>
              <Text style={styles.rowSubtitle}>{templates.length} client message templates</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Terms of Conditions */}
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() =>
              Alert.alert(
                'Terms of Conditions',
                'By using Shilpi Studio ERP, you agree to our fair usage policies, data privacy protection, and software service agreement.'
              )
            }
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <FileTextIcon color="#1e293b" size={17} />
            </View>
            <View style={styles.rowMainCol}>
              <Text style={styles.rowTitle}>Terms of Conditions</Text>
              <Text style={styles.rowSubtitle}>Service agreement &amp; usage terms</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={[styles.groupRow, styles.groupRowLast]}
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'Your client data and financials are protected with industry-standard encryption and never sold or shared with third parties.'
              )
            }
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
        </View>
      </View>

      {/* 3. GROUP 3: ACCOUNT ACTIONS */}
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
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } catch {}
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

      {/* =========================================================================
          MODAL 1: EDIT ARTIST PROFILE
          ========================================================================= */}
      <Modal
        visible={editArtistModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditArtistModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEditArtistModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback>
                <View style={styles.editModalCard}>
                  <View style={styles.editModalHeader}>
                    <Text style={styles.editModalTitle}>Edit Artist Profile</Text>
                    <TouchableOpacity
                      onPress={() => setEditArtistModalOpen(false)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <CloseIcon color="#64748b" size={18} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
                    {/* Avatar Picker */}
                    <View style={styles.avatarEditRow}>
                      <TouchableOpacity style={styles.avatarPickerCircle} onPress={handlePickLogo}>
                        {curStudioLogo ? (
                          <Image source={{ uri: curStudioLogo }} style={styles.avatarPickerImage} />
                        ) : (
                          <Text style={styles.avatarPickerLetter}>{initialLetter}</Text>
                        )}
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.avatarPickerTitle}>Artist Photo / Logo</Text>
                        <TouchableOpacity style={styles.avatarPickerBtn} onPress={handlePickLogo}>
                          <Text style={styles.avatarPickerBtnText}>CHOOSE FROM GALLERY</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Artist Name Input */}
                    <Text style={styles.inputLabel}>ARTIST FULL NAME</Text>
                    <TextInput
                      style={styles.textInputBox}
                      value={curArtistName}
                      onChangeText={setCurArtistName}
                      placeholder="e.g. Pooja Sharma"
                      placeholderTextColor="rgba(18, 18, 18, 0.4)"
                    />

                    {/* Artist Role / Designation */}
                    <Text style={styles.inputLabel}>DESIGNATION / SPECIALTY</Text>
                    <TextInput
                      style={styles.textInputBox}
                      value={curStudioRole}
                      onChangeText={setCurStudioRole}
                      placeholder="e.g. Bridal Makeup Artist"
                      placeholderTextColor="rgba(18, 18, 18, 0.4)"
                    />

                    {/* Role Suggestion Chips */}
                    <View style={styles.suggestionChipsWrap}>
                      {ROLE_SUGGESTIONS.map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.suggestionChip, curStudioRole === r && styles.suggestionChipActive]}
                          onPress={() => {
                            try {
                              Haptics.selectionAsync();
                            } catch {}
                            setCurStudioRole(r);
                          }}
                        >
                          <Text style={[styles.suggestionChipText, curStudioRole === r && styles.suggestionChipTextActive]}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.editModalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setEditArtistModalOpen(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalCancelText}>CANCEL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={async () => {
                        const ok = await saveProfileData({
                          artistName: curArtistName,
                          studioRole: curStudioRole,
                        });
                        if (ok) setEditArtistModalOpen(false);
                      }}
                      disabled={isSavingProfile}
                      activeOpacity={0.8}
                    >
                      {isSavingProfile ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.modalSaveText}>SAVE CHANGES</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* =========================================================================
          MODAL 2: EDIT BUSINESS PROFILE
          ========================================================================= */}
      <Modal
        visible={editBusinessModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditBusinessModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEditBusinessModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback>
                <View style={styles.editModalCard}>
                  <View style={styles.editModalHeader}>
                    <Text style={styles.editModalTitle}>Edit Business Profile</Text>
                    <TouchableOpacity
                      onPress={() => setEditBusinessModalOpen(false)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <CloseIcon color="#64748b" size={18} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
                    {/* Studio Name Input */}
                    <Text style={styles.inputLabel}>STUDIO / SALON NAME</Text>
                    <TextInput
                      style={styles.textInputBox}
                      value={curStudioName}
                      onChangeText={setCurStudioName}
                      placeholder="e.g. Shilpi Bridal Studio"
                      placeholderTextColor="rgba(18, 18, 18, 0.4)"
                    />

                    {/* Studio City Input */}
                    <Text style={styles.inputLabel}>PRIMARY CITY</Text>
                    <TextInput
                      style={styles.textInputBox}
                      value={curStudioCity}
                      onChangeText={setCurStudioCity}
                      placeholder="e.g. Coimbatore"
                      placeholderTextColor="rgba(18, 18, 18, 0.4)"
                    />

                    {/* City Chips */}
                    <View style={styles.suggestionChipsWrap}>
                      {CITY_SUGGESTIONS.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.suggestionChip, curStudioCity === c && styles.suggestionChipActive]}
                          onPress={() => {
                            try {
                              Haptics.selectionAsync();
                            } catch {}
                            setCurStudioCity(c);
                          }}
                        >
                          <Text style={[styles.suggestionChipText, curStudioCity === c && styles.suggestionChipTextActive]}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Address Input */}
                    <Text style={styles.inputLabel}>STUDIO ADDRESS</Text>
                    <TextInput
                      style={[styles.textInputBox, { minHeight: 60, textAlignVertical: 'top' }]}
                      value={curAddress}
                      onChangeText={setCurAddress}
                      placeholder="Street, locality, area details..."
                      placeholderTextColor="rgba(18, 18, 18, 0.4)"
                      multiline
                    />

                    {/* Pincode Input */}
                    <Text style={styles.inputLabel}>PINCODE</Text>
                    <TextInput
                      style={styles.textInputBox}
                      value={curPincode}
                      onChangeText={setCurPincode}
                      placeholder="e.g. 641012"
                      placeholderTextColor="rgba(18, 18, 18, 0.4)"
                      keyboardType="number-pad"
                    />
                  </ScrollView>

                  <View style={styles.editModalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setEditBusinessModalOpen(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalCancelText}>CANCEL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={async () => {
                        const ok = await saveProfileData({
                          studioName: curStudioName,
                          studioCity: curStudioCity,
                          address: curAddress,
                          pincode: curPincode,
                        });
                        if (ok) setEditBusinessModalOpen(false);
                      }}
                      disabled={isSavingProfile}
                      activeOpacity={0.8}
                    >
                      {isSavingProfile ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.modalSaveText}>SAVE BUSINESS</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* =========================================================================
          MODAL 3: EDIT WHATSAPP SETTINGS
          ========================================================================= */}
      <Modal
        visible={editWhatsAppModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditWhatsAppModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEditWhatsAppModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback>
                <View style={styles.editModalCard}>
                  <View style={styles.editModalHeader}>
                    <Text style={styles.editModalTitle}>WhatsApp Settings</Text>
                    <TouchableOpacity
                      onPress={() => setEditWhatsAppModalOpen(false)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <CloseIcon color="#64748b" size={18} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.inputLabel}>WHATSAPP BUSINESS NUMBER</Text>
                    <TextInput
                      style={styles.textInputBox}
                      value={curStudioPhone}
                      onChangeText={setCurStudioPhone}
                      placeholder="+91 98765 43210"
                      placeholderTextColor="rgba(18, 18, 18, 0.4)"
                      keyboardType="phone-pad"
                    />
                    <Text style={styles.inputHint}>
                      Used for client invoices, booking advance confirmations, and reminders.
                    </Text>

                    <View style={styles.switchOptionRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.switchOptionTitle}>Auto-Send Advance Receipts</Text>
                        <Text style={styles.switchOptionSub}>Prompt to send WhatsApp receipt after booking</Text>
                      </View>
                      <Switch
                        value={autoSendReceipt}
                        onValueChange={setAutoSendReceipt}
                        trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                      />
                    </View>

                    <View style={styles.switchOptionRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.switchOptionTitle}>Auto-Send Balance Reminders</Text>
                        <Text style={styles.switchOptionSub}>Notify clients of upcoming payment dues</Text>
                      </View>
                      <Switch
                        value={autoSendReminder}
                        onValueChange={setAutoSendReminder}
                        trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                      />
                    </View>
                  </ScrollView>

                  <View style={styles.editModalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setEditWhatsAppModalOpen(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalCancelText}>CANCEL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={async () => {
                        const ok = await saveProfileData({ studioPhone: curStudioPhone });
                        if (ok) setEditWhatsAppModalOpen(false);
                      }}
                      disabled={isSavingProfile}
                      activeOpacity={0.8}
                    >
                      {isSavingProfile ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.modalSaveText}>SAVE WHATSAPP</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* =========================================================================
          MODAL 4: EDIT WHATSAPP MESSAGE TEMPLATES
          ========================================================================= */}
      <Modal
        visible={editTemplatesModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditTemplatesModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEditTemplatesModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback>
                <View style={styles.editModalCard}>
                  <View style={styles.editModalHeader}>
                    <Text style={styles.editModalTitle}>Message Templates</Text>
                    <TouchableOpacity
                      onPress={() => setEditTemplatesModalOpen(false)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <CloseIcon color="#64748b" size={18} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
                    {activeEditingTemplate ? (
                      <View>
                        <TouchableOpacity
                          style={styles.backToTemplatesBtn}
                          onPress={() => setActiveEditingTemplate(null)}
                        >
                          <ChevronLeftIcon color={colors.deep} size={14} />
                          <Text style={styles.backToTemplatesText}>Back to all templates</Text>
                        </TouchableOpacity>

                        <Text style={styles.templateEditTitle}>{activeEditingTemplate.title}</Text>
                        <Text style={styles.templateEditSub}>{activeEditingTemplate.subtitle}</Text>

                        <TextInput
                          style={styles.templateTextInput}
                          value={activeEditingTemplate.body}
                          onChangeText={(txt) =>
                            setActiveEditingTemplate({ ...activeEditingTemplate, body: txt })
                          }
                          multiline
                          numberOfLines={6}
                        />

                        <Text style={styles.templateTokensHint}>
                          Variables you can use: {'{client_name}'}, {'{event_date}'}, {'{package_name}'}, {'{balance_due}'}, {'{studio_name}'}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 10 }}>
                        {templates.map((tpl) => (
                          <TouchableOpacity
                            key={tpl.id}
                            style={styles.templateCardItem}
                            onPress={() => {
                              try {
                                Haptics.selectionAsync();
                              } catch {}
                              setActiveEditingTemplate(tpl);
                            }}
                            activeOpacity={0.75}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.templateCardTitle}>{tpl.title}</Text>
                              <Text style={styles.templateCardSub}>{tpl.subtitle}</Text>
                              <Text style={styles.templateCardPreview} numberOfLines={2}>
                                {tpl.body}
                              </Text>
                            </View>
                            <View style={styles.templateEditPill}>
                              <Text style={styles.templateEditText}>CUSTOMIZE</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </ScrollView>

                  <View style={styles.editModalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => {
                        setActiveEditingTemplate(null);
                        setEditTemplatesModalOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalCancelText}>CLOSE</Text>
                    </TouchableOpacity>

                    {activeEditingTemplate && (
                      <TouchableOpacity
                        style={styles.modalSaveBtn}
                        onPress={async () => {
                          const updated = templates.map((t) =>
                            t.id === activeEditingTemplate.id ? activeEditingTemplate : t
                          );
                          setTemplates(updated);
                          await AsyncStorage.setItem('@shilpi_templates', JSON.stringify(updated));
                          setActiveEditingTemplate(null);
                          try {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          } catch {}
                          Alert.alert('Template Saved', 'Your custom message template has been updated.');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.modalSaveText}>SAVE TEMPLATE</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* =========================================================================
          MODAL 5: PERMANENT ACCOUNT DELETION MODAL WITH DELETION REASON OPTION
          ========================================================================= */}
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
                            onPress={() => {
                              try {
                                Haptics.selectionAsync();
                              } catch {}
                              setSelectedReason(reason);
                            }}
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

      {/* Custom Themed Studio Logo / Photo Picker Modal */}
      <PhotoPickerModal
        visible={isLogoPickerVisible}
        title="Studio Logo / Photo"
        subtitle="Choose a source for your studio brand image"
        hasExistingPhoto={!!curStudioLogo}
        onClose={() => setIsLogoPickerVisible(false)}
        onSelectCamera={handlePickLogoCamera}
        onSelectGallery={handlePickLogoGallery}
        onRemovePhoto={handleRemoveLogo}
      />
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
      paddingBottom: 20,
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
      position: 'relative',
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
    avatarEditOverlay: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: '#be185d',
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#121212',
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
      fontSize: 19,
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
      color: 'rgba(255, 255, 255, 0.82)',
      marginTop: 2,
    },
    heroRoleLocation: {
      fontSize: 11.5,
      color: 'rgba(255, 255, 255, 0.55)',
      marginTop: 2,
    },
    heroBottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    heroContactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroPhoneText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.75)',
    },
    heroVerifiedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(212, 175, 55, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.25)',
    },
    heroVerifiedText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#F59E0B',
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
      minHeight: 52,
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
    editActionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    editActionText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: colors.deep,
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

    // Edit Modal Shared Styles
    editModalCard: {
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
    editModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.08)',
      paddingBottom: 12,
    },
    editModalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#121212',
    },
    editModalScroll: {
      marginVertical: 12,
    },
    inputLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#1e293b',
      marginBottom: 6,
      marginTop: 8,
    },
    textInputBox: {
      backgroundColor: '#f8fafc',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.12)',
      paddingVertical: 11,
      paddingHorizontal: 13,
      fontSize: 13,
      color: '#121212',
      fontWeight: '600',
    },
    inputHint: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 4,
      marginBottom: 8,
    },
    suggestionChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
      marginBottom: 10,
    },
    suggestionChip: {
      backgroundColor: 'rgba(18, 18, 18, 0.05)',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    suggestionChipActive: {
      backgroundColor: '#121212',
    },
    suggestionChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#1e293b',
    },
    suggestionChipTextActive: {
      color: '#ffffff',
    },
    avatarEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.06)',
    },
    avatarPickerCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#1e293b',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarPickerImage: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    avatarPickerLetter: {
      fontSize: 20,
      fontWeight: '800',
      color: '#ffffff',
    },
    avatarPickerTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#121212',
    },
    avatarPickerBtn: {
      backgroundColor: 'rgba(18, 18, 18, 0.06)',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    avatarPickerBtnText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#121212',
    },
    switchOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.05)',
    },
    switchOptionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
    },
    switchOptionSub: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 1,
    },
    editModalActions: {
      flexDirection: 'row',
      gap: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(18, 18, 18, 0.08)',
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#1e293b',
    },
    modalSaveBtn: {
      flex: 1.3,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#121212',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSaveText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#ffffff',
    },

    // Templates Modal
    templateCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.1)',
      backgroundColor: '#ffffff',
      gap: 10,
    },
    templateCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
    },
    templateCardSub: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 1,
    },
    templateCardPreview: {
      fontSize: 11,
      color: '#475569',
      marginTop: 4,
      fontStyle: 'italic',
    },
    templateEditPill: {
      backgroundColor: 'rgba(18, 18, 18, 0.06)',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    templateEditText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#121212',
    },
    backToTemplatesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    backToTemplatesText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.deep,
    },
    templateEditTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#121212',
    },
    templateEditSub: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 1,
      marginBottom: 10,
    },
    templateTextInput: {
      backgroundColor: '#f8fafc',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.12)',
      padding: 12,
      fontSize: 12.5,
      color: '#121212',
      textAlignVertical: 'top',
      minHeight: 120,
    },
    templateTokensHint: {
      fontSize: 10.5,
      color: 'rgba(18, 18, 18, 0.5)',
      marginTop: 8,
      lineHeight: 15,
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
