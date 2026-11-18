import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { Client, Booking, fmt, first, normalizePhoneKey } from '../data/prototypeData';
import { ClearDueModal } from '../components/ClearDueModal';
import { PhotoPickerModal } from '../components/PhotoPickerModal';
import {
  openWhatsAppDirect,
  getPaymentReminderMessage,
} from '../utils/whatsappHelper';

const PhoneVectorIcon = ({ color = '#121212' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChatVectorIcon = ({ color, size = 14 }: { color?: string; size?: number }) => {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.accent;
  return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={resolvedColor} strokeWidth={2}>
    <Path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
  );
};

const HeartVectorIcon = ({ filled }: { filled: boolean }) => {
  const { colors } = useTheme();
  return (
  <Svg
    width={19}
    height={19}
    viewBox="0 0 24 24"
    fill={filled ? colors.accent : 'none'}
    stroke={filled ? colors.accent : 'rgba(255, 255, 255, 0.6)'}
    strokeWidth={2}
  >
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
  );
};

const MoreDotsVerticalIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="#ffffff">
    <Circle cx="12" cy="5" r="2" />
    <Circle cx="12" cy="12" r="2" />
    <Circle cx="12" cy="19" r="2" />
  </Svg>
);

const PremiumSparkleIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#121212" />
    <Path d="M19 2L19.7 4.3L22 5L19.7 5.7L19 8L18.3 5.7L16 5L18.3 4.3L19 2Z" fill="#121212" opacity={0.85} />
  </Svg>
);

const StatusToggleIcon = ({ makeActive }: { makeActive: boolean }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={makeActive ? '#186d3b' : '#b91c1c'} strokeWidth={2}>
    <Circle cx="12" cy="12" r="9" />
    {makeActive ? (
      <Path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <Path d="M8.5 8.5l7 7" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </Svg>
);

const CameraBadgeIcon = ({ size = 12, color = '#ffffff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

interface ClientDetailScreenProps {
  client: Client | null;
  allClients?: Client[];
  bookings?: Booking[];
  onGoBack: () => void;
  onOpenWhatsAppSheet: (clientName: string, phone: string) => void;
  onNewBookingForClient?: (clientName: string) => void;
  onToggleVip?: (clientId: number | string) => void;
  onUpdateClient?: (
    clientId: number | string,
    payload: { name: string; phone: string; notes: string }
  ) => Promise<boolean> | boolean;
  onToggleActive?: (clientId: number | string, nextActive: boolean) => void;
  onUpdatePhoto?: (clientId: number | string, photoUri: string) => Promise<void> | void;
  onRecordPayment?: (
    orderId: string,
    amount: number,
    paymentMode?: string,
    notes?: string
  ) => Promise<boolean | void> | boolean | void;
}

export const ClientDetailScreen: React.FC<ClientDetailScreenProps> = ({
  client,
  allClients = [],
  bookings = [],
  onGoBack,
  onOpenWhatsAppSheet,
  onNewBookingForClient,
  onToggleVip,
  onUpdateClient,
  onToggleActive,
  onUpdatePhoto,
  onRecordPayment,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [curPhotoUri, setCurPhotoUri] = useState<string | undefined>(client?.photoUri);
  const [targetPaymentBooking, setTargetPaymentBooking] = useState<Booking | null>(null);
  const [clearDueModalOpen, setClearDueModalOpen] = useState<boolean>(false);
  const [isPhotoPickerVisible, setIsPhotoPickerVisible] = useState<boolean>(false);

  const clientBookings = useMemo(() => {
    if (!client) return [];
    return (bookings || []).filter(
      (b) => (b.clientId && String(b.clientId) === String(client.id)) || b.client === client.name
    );
  }, [bookings, client]);

  const { totalDue, pendingBookings } = useMemo(() => {
    let sum = 0;
    const list: Array<{ booking: Booking; total: number; advance: number; due: number }> = [];
    clientBookings.forEach((b) => {
      const bTotal = b.items.reduce((s, it) => s + it.price, 0) + (b.travel || 0);
      const bDue = Math.max(0, bTotal - (b.advance || 0));
      if (bDue > 0) {
        sum += bDue;
        list.push({ booking: b, total: bTotal, advance: b.advance || 0, due: bDue });
      }
    });
    return { totalDue: sum, pendingBookings: list };
  }, [clientBookings]);

  useEffect(() => {
    setCurPhotoUri(client?.photoUri);
  }, [client?.photoUri]);

  const handlePickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera Permission Needed', 'Please allow camera access to take a photo of your client.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        const picked = res.assets[0].uri;
        setCurPhotoUri(picked);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        if (onUpdatePhoto && client) {
          onUpdatePhoto(client.id, picked);
        }
      }
    } catch {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow gallery access to pick a photo for your client.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        const picked = res.assets[0].uri;
        setCurPhotoUri(picked);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        if (onUpdatePhoto && client) {
          onUpdatePhoto(client.id, picked);
        }
      }
    } catch {
      Alert.alert('Gallery Error', 'Could not open photo gallery.');
    }
  };

  const handleOpenPhotoOptions = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setIsPhotoPickerVisible(true);
  };

  useEffect(() => {
    if (client) {
      setEditName(client.name || '');
      const key = normalizePhoneKey(client.phone || '');
      setEditPhone(key.length === 10 ? key : client.phone || '');
      setEditNotes(client.notes || '');
    }
  }, [client?.id, client?.name, client?.phone, client?.notes]);

  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f4f6', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#121212', marginBottom: 12 }}>Client not found</Text>
        <TouchableOpacity
          onPress={onGoBack}
          style={{ backgroundColor: colors.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700' }}>Back to Clients</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initial = client.name.charAt(0);
  const isClientActive = client.isActive !== false;

  const handleCall = () => {
    const rawPhone = client.phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${rawPhone}`);
  };

  const openEditSheet = () => {
    setMenuOpen(false);
    setEditName(client.name || '');
    const key = normalizePhoneKey(client.phone || '');
    setEditPhone(key.length === 10 ? key : client.phone || '');
    setEditNotes(client.notes || '');
    setEditModalOpen(true);
  };

  const handleToggleActivePress = () => {
    setMenuOpen(false);
    const nextActive = !isClientActive;
    Alert.alert(
      nextActive ? 'Make Client Active' : 'Make Client Inactive',
      nextActive
        ? `Reactivate ${client.name} in your active client list?`
        : `Mark ${client.name} as inactive? You can reactivate them anytime from the Inactive tab.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Make Active' : 'Make Inactive',
          style: nextActive ? 'default' : 'destructive',
          onPress: () => onToggleActive?.(client.id, nextActive),
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    const cleanName = editName.trim();
    if (!cleanName) {
      Alert.alert('Name Required', 'Please enter the client name.');
      return;
    }
    const phoneKey = normalizePhoneKey(editPhone);
    if (!phoneKey || phoneKey.length < 10) {
      Alert.alert(
        'Mobile Number Required',
        'A valid 10-digit mobile number is required for every client.'
      );
      return;
    }
    const duplicate = allClients.find(
      (c) => String(c.id) !== String(client.id) && normalizePhoneKey(c.phone) === phoneKey
    );
    if (duplicate) {
      Alert.alert(
        'Duplicate Mobile Number',
        `This client was already registered in the name of "${duplicate.name}".`
      );
      return;
    }

    const formattedPhone =
      phoneKey.length === 10
        ? `+91 ${phoneKey.slice(0, 5)} ${phoneKey.slice(5)}`
        : editPhone.trim();

    if (!onUpdateClient) {
      setEditModalOpen(false);
      return;
    }
    setSavingEdit(true);
    try {
      const ok = await onUpdateClient(client.id, {
        name: cleanName,
        phone: formattedPhone,
        notes: editNotes.trim(),
      });
      if (ok) {
        setEditModalOpen(false);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Ink Profile Card */}
      <View style={styles.inkProfileCard}>
        {(client.isVip || !isClientActive) && (
          <View style={styles.cornerBadgeWrap} pointerEvents="none">
            {client.isVip ? (
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>VIP</Text>
              </View>
            ) : null}
            {!isClientActive ? (
              <View style={styles.inactiveHeaderBadge}>
                <Text style={styles.inactiveHeaderBadgeText}>INACTIVE</Text>
              </View>
            ) : null}
          </View>
        )}

        <TouchableOpacity
          style={styles.avatarTouchWrap}
          onPress={handleOpenPhotoOptions}
          activeOpacity={0.85}
          accessibilityLabel="Add or update client photo"
        >
          <View style={styles.avatarGradient}>
            {curPhotoUri ? (
              <Image source={{ uri: curPhotoUri }} style={styles.avatarPhoto} />
            ) : (
              <Text style={styles.avatarLetter}>{initial}</Text>
            )}
          </View>
          <View style={styles.cameraBadge}>
            <CameraBadgeIcon size={12} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <View style={styles.nameContainer}>
          <Text
            style={[
              styles.clientName,
              client.name.length > 26
                ? { fontSize: 16 }
                : client.name.length > 18
                  ? { fontSize: 19 }
                  : client.name.length > 12
                    ? { fontSize: 21 }
                    : null,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {client.name}
          </Text>
          <Text style={styles.clientPhone} numberOfLines={1}>
            {client.phone}
          </Text>
        </View>

        <View style={styles.headerActionsCol}>
          {onToggleVip && (
            <TouchableOpacity
              style={[styles.vipHeartBtn, client.isVip && styles.vipHeartBtnActive]}
              onPress={() => onToggleVip(client.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.8}
            >
              <HeartVectorIcon filled={!!client.isVip} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.moreDotsBtn}
            onPress={() => setMenuOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.8}
            accessibilityLabel="Client options"
          >
            <MoreDotsVerticalIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Action Buttons (Call & WhatsApp) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtnWhite}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconWrap}>
            <PhoneVectorIcon color="#121212" />
          </View>
          <Text style={styles.actionBtnText}>CALL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnPink}
          onPress={() => onOpenWhatsAppSheet(client.name, client.phone)}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconWrap}>
            <ChatVectorIcon color={colors.accent} />
          </View>
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

      {/* 3c. Compact Due Banner (Only shown if customer has an outstanding due) */}
      {totalDue > 0 ? (
        <View style={styles.compactDueCard}>
          <View style={styles.compactDueLeft}>
            <View style={styles.compactDueDot} />
            <View style={styles.compactDueInfo}>
              <Text style={styles.compactDueLabel}>PENDING DUE</Text>
              <Text style={styles.compactDueAmount}>{fmt(totalDue)}</Text>
            </View>
          </View>

          <View style={styles.compactDueActionsRow}>
            <TouchableOpacity
              style={styles.compactRemindDueBtn}
              onPress={() => {
                const dueMsg = getPaymentReminderMessage({
                  clientName: client.name,
                  dueAmount: totalDue,
                  artistName: 'Artist',
                  studioName: 'Shilpi Studio',
                });
                openWhatsAppDirect(client.phone, dueMsg);
              }}
              activeOpacity={0.8}
              accessibilityLabel={`Send due reminder to ${client.name} on WhatsApp`}
            >
              <ChatVectorIcon color="#ffffff" size={13} />
              <Text style={styles.compactRemindDueBtnText}>Remind</Text>
            </TouchableOpacity>

            {onRecordPayment && (
              <TouchableOpacity
                style={styles.compactClearDueBtn}
                onPress={() => {
                  if (pendingBookings[0]) {
                    setTargetPaymentBooking(pendingBookings[0].booking);
                    setClearDueModalOpen(true);
                  }
                }}
                activeOpacity={0.85}
                accessibilityLabel={`Clear due amount ${fmt(totalDue)}`}
              >
                <Text style={styles.compactClearDueBtnText}>Clear Due</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : null}

      {/* 3b. Client Notes */}
      {client.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>CLIENT NOTES</Text>
          <Text style={styles.notesText}>{client.notes}</Text>
        </View>
      ) : null}

      {/* 4. Booking History List */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>
          BOOKING HISTORY ({clientBookings.length > 0 ? clientBookings.length : client.history.length})
        </Text>
      </View>

      <View style={styles.historyList}>
        {clientBookings.length > 0 ? (
          clientBookings.map((b, i) => {
            const bTotal = b.items.reduce((s, it) => s + it.price, 0) + (b.travel || 0);
            const bDue = Math.max(0, bTotal - (b.advance || 0));
            return (
              <View key={b.id || i} style={styles.historyItem}>
                <View style={styles.historyDateBox}>
                  <Text style={styles.historyDateText}>
                    {b.day && b.month ? `${b.day} ${b.month}` : String(b.bookingDate || '').split('T')[0]}
                  </Text>
                </View>

                <View style={styles.historyPkgInfo}>
                  <Text style={styles.historyPkgName}>{b.items[0]?.name || 'Booking'}</Text>
                  <Text style={[styles.historyStatus, { color: bDue > 0 ? '#ef4444' : '#16a34a' }]}>
                    {bDue > 0 ? `Due: ${fmt(bDue)}` : 'Fully Paid ✓'}
                  </Text>
                </View>

                <View style={styles.historyAmountBox}>
                  <Text style={styles.historyAmountText}>{fmt(bTotal)}</Text>
                  {bDue > 0 && onRecordPayment ? (
                    <TouchableOpacity
                      style={[styles.historyPayBtn, { borderColor: colors.accent }]}
                      onPress={() => {
                        setTargetPaymentBooking(b);
                        setClearDueModalOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.historyPayBtnText, { color: colors.accent }]}>Clear Due</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.historyPaidLabel}>BOOKED</Text>
                  )}
                </View>
              </View>
            );
          })
        ) : client.history.length > 0 ? (
          client.history.map((h, i) => (
            <View key={i} style={styles.historyItem}>
              <View style={styles.historyDateBox}>
                <Text style={styles.historyDateText}>{h.date}</Text>
              </View>

              <View style={styles.historyPkgInfo}>
                <Text style={styles.historyPkgName}>{h.pkg}</Text>
                <Text style={styles.historyStatus}>Saved Booking</Text>
              </View>

              <View style={styles.historyAmountBox}>
                <Text style={styles.historyAmountText}>{fmt(h.amount)}</Text>
                <Text style={styles.historyPaidLabel}>BOOKED</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.historyEmptyRow}>
            <Text style={styles.historyEmptyText}>No bookings yet for {first(client.name)}.</Text>
          </View>
        )}
      </View>

      {/* 5. New Booking CTA for this Client */}
      {onNewBookingForClient && (
        <View style={styles.newBookingCtaWrap}>
          <TouchableOpacity
            style={styles.newBookingCtaBtn}
            onPress={() => onNewBookingForClient(client.name)}
            activeOpacity={0.85}
          >
            <Text style={styles.newBookingCtaText}>
              ＋ New Booking for {first(client.name)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 100 }} />

      {/* Three-dot Profile Options Modal (Edit & Make Inactive / Active) */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuHeading}>CLIENT OPTIONS</Text>

            <TouchableOpacity style={styles.menuOption} onPress={openEditSheet} activeOpacity={0.8}>
              <View style={styles.menuIconWrap}>
                <PremiumSparkleIcon />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuOptionTitle}>Edit Client Details</Text>
                <Text style={styles.menuOptionSub}>Update name, mobile number, or notes</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleToggleActivePress}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  { backgroundColor: isClientActive ? 'rgba(185, 28, 28, 0.1)' : '#eaf8ef' },
                ]}
              >
                <StatusToggleIcon makeActive={!isClientActive} />
              </View>
              <View style={styles.menuTextCol}>
                <Text
                  style={[
                    styles.menuOptionTitle,
                    { color: isClientActive ? '#b91c1c' : '#186d3b' },
                  ]}
                >
                  {isClientActive ? 'Make Inactive' : 'Make Active'}
                </Text>
                <Text style={styles.menuOptionSub}>
                  {isClientActive
                    ? 'Move client out of your active booking directory'
                    : 'Restore client back to active directory'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        visible={editModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.editBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editCard}>
            <Text style={styles.editEyebrow}>EDIT CLIENT</Text>
            <Text style={styles.editTitle}>Update profile</Text>

            <Text style={styles.editLabel}>FULL NAME *</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Client name"
              placeholderTextColor="rgba(18, 18, 18, 0.38)"
            />

            <Text style={styles.editLabel}>MOBILE NUMBER *</Text>
            <TextInput
              style={styles.editInput}
              value={editPhone}
              onChangeText={(t) => setEditPhone(t.replace(/\D/g, '').slice(0, 12))}
              keyboardType="phone-pad"
              placeholder="10-digit mobile number"
              placeholderTextColor="rgba(18, 18, 18, 0.38)"
            />

            <Text style={styles.editLabel}>NOTES</Text>
            <TextInput
              style={[styles.editInput, styles.editNotesInput]}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              placeholder="Skin type, preferences, remarks..."
              placeholderTextColor="rgba(18, 18, 18, 0.38)"
            />

            <View style={styles.editFooterRow}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.editCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, savingEdit && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
                activeOpacity={0.85}
              >
                <Text style={styles.editSaveText}>
                  {savingEdit ? 'SAVING...' : 'SAVE CHANGES'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PhotoPickerModal
        visible={isPhotoPickerVisible}
        title="Client Photo"
        subtitle="Add or update client profile picture"
        hasExistingPhoto={!!curPhotoUri}
        onClose={() => setIsPhotoPickerVisible(false)}
        onSelectCamera={() => {
          setIsPhotoPickerVisible(false);
          handlePickFromCamera();
        }}
        onSelectGallery={() => {
          setIsPhotoPickerVisible(false);
          handlePickFromGallery();
        }}
        onRemovePhoto={() => {
          setIsPhotoPickerVisible(false);
          setCurPhotoUri(undefined);
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
          if (onUpdatePhoto && client) {
            onUpdatePhoto(client.id, '');
          }
        }}
      />

      <ClearDueModal
        visible={clearDueModalOpen}
        booking={targetPaymentBooking}
        clientName={client?.name}
        onClose={() => {
          setClearDueModalOpen(false);
          setTargetPaymentBooking(null);
        }}
        onConfirmPayment={async (bId, amount, mode, notes) => {
          if (onRecordPayment) {
            await onRecordPayment(bId, amount, mode, notes);
          }
        }}
      />
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
    position: 'relative',
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cornerBadgeWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    overflow: 'hidden',
  },
  avatarTouchWrap: {
    position: 'relative',
    marginRight: 0,
    flexShrink: 0,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  clientName: {
    fontSize: 23,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  vipBadge: {
    backgroundColor: colors.palePinkBorder,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  vipBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: '#ff6ca0',
  },
  inactiveHeaderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  inactiveHeaderBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  headerActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipHeartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipHeartBtnActive: {
    backgroundColor: colors.palePinkBorder,
    borderWidth: 1,
    borderColor: colors.palePinkBorder,
  },
  moreDotsBtn: {
    width: 36,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionIconWrap: {
    marginRight: 6,
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
    color: colors.deep,
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
  notesCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.06)',
  },
  compactDueCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff1f2',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  compactDueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  compactDueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  compactDueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactDueLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.8,
  },
  compactDueAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#b91c1c',
    letterSpacing: 0.2,
  },
  compactDueActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactRemindDueBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  compactRemindDueBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  compactClearDueBtn: {
    backgroundColor: '#121212',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  compactClearDueBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  historyPayBtn: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    marginTop: 3,
  },
  historyPayBtnText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  notesLabel: {
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13.5,
    color: '#121212',
    lineHeight: 19,
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
    color: colors.accent,
    marginTop: 2,
  },
  historyEmptyRow: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  historyEmptyText: {
    fontSize: 13,
    color: 'rgba(18, 18, 18, 0.45)',
    fontWeight: '500',
  },
  newBookingCtaWrap: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  newBookingCtaBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  newBookingCtaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  menuHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(18, 18, 18, 0.45)',
    marginBottom: 10,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f4f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  menuOptionSub: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.06)',
    marginVertical: 4,
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  editCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
  },
  editEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.accent,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121212',
    marginTop: 2,
    marginBottom: 14,
  },
  editLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: 'rgba(18, 18, 18, 0.55)',
    marginBottom: 5,
    marginTop: 10,
  },
  editInput: {
    backgroundColor: colors.tint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  editNotesInput: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  editFooterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#f4f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#121212',
  },
  editSaveBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#ffffff',
  },
});
