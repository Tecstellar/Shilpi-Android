import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Client, normalizePhoneKey } from '../data/prototypeData';

interface NewClientScreenProps {
  existingClients?: Client[];
  onSaveClient: (client: Partial<Client>, thenCreateBooking?: boolean) => Promise<void> | void;
  onImportContacts?: (contacts: { name: string; phone: string }[]) => Promise<void>;
  onGoBack: () => void;
}

interface DeviceContactItem {
  id: string;
  name: string;
  rawPhone: string;
  phoneKey: string;
  missingPhone: boolean;
  duplicateName: string | null;
}

const ContactsBookIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={2}>
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={9} cy={7} r={4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ----------------- Bespoke Luxury SVG Icons ----------------- //

const UserIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={2}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={7} r={4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={2}>
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const NotesIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={2}>
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={16} y1={13} x2={8} y2={13} strokeLinecap="round" />
    <Line x1={16} y1={17} x2={8} y2={17} strokeLinecap="round" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={2}>
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={13} r={4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.4}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseSmallIcon = () => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="rgba(18, 18, 18, 0.6)" strokeWidth={2.4}>
    <Line x1={18} y1={6} x2={6} y2={18} strokeLinecap="round" />
    <Line x1={6} y1={6} x2={18} y2={18} strokeLinecap="round" />
  </Svg>
);

const CalendarPlusIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
    <Rect x={3} y={4} width={18} height={18} rx={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={16} y1={2} x2={16} y2={6} strokeLinecap="round" />
    <Line x1={8} y1={2} x2={8} y2={6} strokeLinecap="round" />
    <Line x1={3} y1={10} x2={21} y2={10} strokeLinecap="round" />
    <Line x1={12} y1={14} x2={12} y2={18} strokeLinecap="round" />
    <Line x1={10} y1={16} x2={14} y2={16} strokeLinecap="round" />
  </Svg>
);

// ----------------- Micro-Interactive Animated Touch Button ----------------- //

const AnimatedActionButton: React.FC<{
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
}> = ({ onPress, style, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 180,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 140,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ----------------- Main Screen Component ----------------- //

export const NewClientScreen: React.FC<NewClientScreenProps> = ({
  existingClients = [],
  onSaveClient,
  onImportContacts,
  onGoBack,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<'' | 'name' | 'phone' | 'duplicate'>('');
  const [duplicateOwnerName, setDuplicateOwnerName] = useState('');

  // Contacts Import Modal State
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [importingContacts, setImportingContacts] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContactItem[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Entrance spring animation
  const animMount = useRef(new Animated.Value(0)).current;
  const animPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(animMount, {
      toValue: 1,
      tension: 70,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Subtle gentle pulse for Save & Create Booking hero button
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animPulse, {
          toValue: 1.025,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animPulse, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  const handlePickPhoto = () => {
    Alert.alert(
      'Profile Photo',
      'Choose source for client profile picture:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera permission is required.');
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.2,
              base64: true,
            });
            if (!res.canceled && res.assets && res.assets[0]) {
              const asset = res.assets[0];
              setPhotoUri(
                asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
              );
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Gallery permission is required.');
              return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.2,
              base64: true,
            });
            if (!res.canceled && res.assets && res.assets[0]) {
              const asset = res.assets[0];
              setPhotoUri(
                asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
              );
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleOpenContactsPicker = async () => {
    try {
      setLoadingContacts(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setLoadingContacts(false);
        Alert.alert(
          'Contacts Permission Needed',
          'Please allow access to your phone contacts so you can import clients.'
        );
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });

      const existingMap = new Map<string, string>();
      for (const c of existingClients) {
        const key = normalizePhoneKey(c.phone);
        if (key) existingMap.set(key, c.name);
      }

      const mapped: DeviceContactItem[] = (data || []).map((c, idx) => {
        const displayName =
          c.name?.trim() ||
          [c.firstName, c.lastName].filter(Boolean).join(' ').trim() ||
          'Unnamed Contact';
        const rawNumber =
          c.phoneNumbers?.find((p) => p.number && p.number.trim())?.number?.trim() || '';
        const phoneKey = normalizePhoneKey(rawNumber);
        const missingPhone = !rawNumber || phoneKey.length < 10;
        const duplicateName = !missingPhone ? existingMap.get(phoneKey) || null : null;

        return {
          id: String(c.id || `contact_${idx}`),
          name: displayName,
          rawPhone: rawNumber,
          phoneKey,
          missingPhone,
          duplicateName,
        };
      });

      setDeviceContacts(mapped);
      setContactSearch('');
      setSelectedContactIds([]);
      setContactsModalOpen(true);
    } catch (err: any) {
      Alert.alert(
        'Could Not Read Contacts',
        err?.message || 'Unable to load contacts from your device.'
      );
    } finally {
      setLoadingContacts(false);
    }
  };

  const toggleSelectContact = (item: DeviceContactItem) => {
    if (item.missingPhone) {
      Alert.alert(
        'Mobile Number Required',
        `"${item.name}" has no valid mobile number. Contacts without a mobile number cannot be imported.`
      );
      return;
    }
    if (item.duplicateName) {
      Alert.alert(
        'Client Already Registered',
        `This client was already registered in the name of "${item.duplicateName}".`
      );
      return;
    }
    setSelectedContactIds((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
  };

  const handleConfirmImportContacts = async () => {
    const selectedItems = deviceContacts.filter((c) => selectedContactIds.includes(c.id));
    if (selectedItems.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select one or more contacts to import.');
      return;
    }

    // Filter out any in-batch duplicates on phoneKey before sending
    const seenKeys = new Set<string>();
    const payload: { name: string; phone: string }[] = [];
    const batchDuplicates: string[] = [];

    for (const item of selectedItems) {
      if (item.missingPhone) continue;
      if (seenKeys.has(item.phoneKey)) {
        batchDuplicates.push(item.name);
        continue;
      }
      seenKeys.add(item.phoneKey);
      const formattedPhone =
        item.phoneKey.length === 10
          ? `+91 ${item.phoneKey.slice(0, 5)} ${item.phoneKey.slice(5)}`
          : item.rawPhone;
      payload.push({ name: item.name, phone: formattedPhone });
    }

    if (batchDuplicates.length > 0) {
      Alert.alert(
        'Duplicate Mobile Number',
        `Skipped duplicate phone number for: ${batchDuplicates.join(', ')}.`
      );
    }

    if (payload.length === 0) return;

    setImportingContacts(true);
    try {
      if (onImportContacts) {
        await onImportContacts(payload);
      } else {
        for (const entry of payload) {
          await onSaveClient({ name: entry.name, phone: entry.phone }, false);
        }
      }
      setContactsModalOpen(false);
    } finally {
      setImportingContacts(false);
    }
  };

  const handleSave = (thenCreateBooking: boolean = false) => {
    if (!name.trim()) {
      setValidationError('name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setValidationError('phone');
      Alert.alert(
        'Mobile Number Required',
        'Please enter a valid 10-digit mobile number before saving.'
      );
      return;
    }
    const inputKey = normalizePhoneKey(cleanPhone);
    const existingDup = existingClients.find(
      (c) => normalizePhoneKey(c.phone) === inputKey
    );
    if (existingDup) {
      setValidationError('duplicate');
      setDuplicateOwnerName(existingDup.name);
      Alert.alert(
        'Client Already Registered',
        `This client was already registered in the name of "${existingDup.name}".`
      );
      return;
    }
    setValidationError('');
    setDuplicateOwnerName('');
    onSaveClient(
      {
        name: name.trim(),
        phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
        bookings: 0,
        sales: 0,
        profit: 0,
        history: [],
        notes: notes.trim(),
        photoUri: photoUri || undefined,
      },
      thenCreateBooking
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Card */}
        <View style={styles.inkHeaderCard}>
          <Text style={styles.kicker}>NEW CLIENT</Text>
          <Text style={styles.title}>Add to my client book</Text>
        </View>

        {/* 1b. Import from Phone Contacts Card (above manual form) */}
        <TouchableOpacity
          style={styles.importContactsCard}
          onPress={handleOpenContactsPicker}
          activeOpacity={0.85}
          disabled={loadingContacts}
        >
          <View style={styles.importIconBadge}>
            {loadingContacts ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <ContactsBookIcon />
            )}
          </View>
          <View style={styles.importTextCol}>
            <Text style={styles.importTitle}>Import from Contacts</Text>
            <Text style={styles.importSub}>
              Select one or multiple phone contacts to add
            </Text>
          </View>
          <View style={styles.importActionPill}>
            <Text style={styles.importActionText}>
              {loadingContacts ? 'LOADING' : 'IMPORT'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 2. Compact Unified Information Card (Name, Phone, Notes in a small space) */}
        <Animated.View
          style={[
            styles.compactFormCard,
            {
              opacity: animMount,
              transform: [
                {
                  translateY: animMount.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionKicker}>OR ADD MANUALLY</Text>
            {validationError === 'name' && (
              <Text style={styles.errorText}>* Name is required</Text>
            )}
            {validationError === 'phone' && (
              <Text style={styles.errorText}>* Enter 10-digit mobile number</Text>
            )}
            {validationError === 'duplicate' && (
              <Text style={styles.errorText}>
                * Registered as {duplicateOwnerName}
              </Text>
            )}
          </View>

          {/* Name Field */}
          <View style={[styles.fieldRow, validationError === 'name' && styles.fieldRowError]}>
            <View style={styles.fieldIconBox}>
              <UserIcon />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>FULL NAME *</Text>
              <TextInput
                style={styles.compactInput}
                placeholder="e.g. Priya Raghavan"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (t.trim() && validationError === 'name') setValidationError('');
                }}
              />
            </View>
          </View>

          <View style={styles.fieldDivider} />

          {/* Phone Field */}
          <View
            style={[
              styles.fieldRow,
              (validationError === 'phone' || validationError === 'duplicate') && styles.fieldRowError,
            ]}
          >
            <View style={styles.fieldIconBox}>
              <PhoneIcon />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
              <View style={styles.phonePrefixWrap}>
                <Text style={styles.phonePrefixCode}>+91</Text>
                <TextInput
                  style={[styles.compactInput, { flex: 1 }]}
                  keyboardType="number-pad"
                  placeholder="9876543210"
                  placeholderTextColor="rgba(18, 18, 18, 0.35)"
                  value={phone}
                  onChangeText={(t) => {
                    const digits = t.replace(/\D/g, '').slice(0, 10);
                    setPhone(digits);
                    if (validationError === 'duplicate') {
                      setValidationError('');
                      setDuplicateOwnerName('');
                    } else if (digits.length === 10 && validationError === 'phone') {
                      setValidationError('');
                    }
                  }}
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldDivider} />

          {/* Notes Field */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIconBox, { marginTop: 4 }]}>
              <NotesIcon />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>CLIENT NOTES</Text>
              <TextInput
                style={[styles.compactInput, styles.compactTextArea]}
                multiline
                numberOfLines={2}
                placeholder="Preferences, skin type, event date, remarks..."
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        </Animated.View>

        {/* 3. Profile Photo (Optional) - Positioned above Save Client */}
        <Animated.View
          style={[
            styles.photoCard,
            {
              opacity: animMount,
              transform: [
                {
                  translateY: animMount.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.photoTouchableRow}
            onPress={handlePickPhoto}
            activeOpacity={0.75}
          >
            {/* Avatar Preview or Placeholder Ring */}
            <View style={styles.avatarHolder}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarEmpty}>
                  <CameraIcon />
                </View>
              )}
            </View>

            {/* Photo Instruction Text */}
            <View style={styles.photoTextCol}>
              <View style={styles.photoHeadingRow}>
                <Text style={styles.photoTitle}>Profile Photo</Text>
                <View style={styles.optionalPill}>
                  <Text style={styles.optionalText}>OPTIONAL</Text>
                </View>
              </View>
              <Text style={styles.photoSub}>Tap to add from gallery or camera</Text>
            </View>

            {photoUri && (
              <TouchableOpacity
                onPress={() => setPhotoUri(null)}
                style={styles.removePhotoBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CloseSmallIcon />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* 4. Condensed Animated Dual Action Deck (Save Client + Save and Create Booking) */}
        <Animated.View
          style={[
            styles.actionDeckContainer,
            {
              opacity: animMount,
              transform: [
                {
                  translateY: animMount.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.dualActionRow}>
            {/* Action 1: Save Client (Compact dark obsidian button) */}
            <AnimatedActionButton
              style={styles.saveClientBtn}
              onPress={() => handleSave(false)}
            >
              <View style={styles.btnIconWrap}>
                <CheckIcon />
              </View>
              <Text style={styles.saveClientBtnText}>SAVE CLIENT</Text>
            </AnimatedActionButton>

            {/* Action 2: Save and Create Booking (Vivid Pink Animated Hero Capsule) */}
            <Animated.View style={{ flex: 1.35, transform: [{ scale: animPulse }] }}>
              <AnimatedActionButton
                style={styles.saveAndBookBtn}
                onPress={() => handleSave(true)}
              >
                <View style={styles.btnIconWrap}>
                  <CalendarPlusIcon />
                </View>
                <Text style={styles.saveAndBookBtnText} numberOfLines={1}>
                  SAVE & CREATE BOOKING
                </Text>
              </AnimatedActionButton>
            </Animated.View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Multi-Select Contacts Import Modal */}
      <Modal
        visible={contactsModalOpen}
        animationType="slide"
        onRequestClose={() => setContactsModalOpen(false)}
      >
        <View style={styles.contactsModalRoot}>
          <View style={styles.contactsModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactsModalEyebrow}>PHONE CONTACTS</Text>
              <Text style={styles.contactsModalTitle}>Select clients to import</Text>
            </View>
            <TouchableOpacity
              style={styles.contactsModalCloseBtn}
              onPress={() => setContactsModalOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.contactsModalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactsSearchWrap}>
            <TextInput
              style={styles.contactsSearchInput}
              placeholder="Search contacts by name or number..."
              placeholderTextColor="rgba(18, 18, 18, 0.4)"
              value={contactSearch}
              onChangeText={setContactSearch}
            />
          </View>

          <FlatList
            data={deviceContacts.filter(
              (c) =>
                c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                c.rawPhone.includes(contactSearch)
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contactsListContent}
            ListEmptyComponent={
              <View style={styles.contactsEmptyWrap}>
                <Text style={styles.contactsEmptyText}>No matching contacts found.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedContactIds.includes(item.id);
              const isDisabled = item.missingPhone || Boolean(item.duplicateName);
              return (
                <TouchableOpacity
                  style={[
                    styles.contactRow,
                    isSelected && styles.contactRowSelected,
                    isDisabled && styles.contactRowDisabled,
                  ]}
                  onPress={() => toggleSelectContact(item)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.contactCheckBox,
                      isSelected && styles.contactCheckBoxActive,
                      isDisabled && styles.contactCheckBoxDisabled,
                    ]}
                  >
                    {isSelected ? <CheckIcon /> : null}
                  </View>

                  <View style={styles.contactTextCol}>
                    <Text style={styles.contactRowName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.contactRowPhone} numberOfLines={1}>
                      {item.rawPhone ? item.rawPhone : 'No mobile number'}
                    </Text>
                  </View>

                  {item.missingPhone ? (
                    <View style={styles.contactWarnPill}>
                      <Text style={styles.contactWarnText}>NO NUMBER</Text>
                    </View>
                  ) : item.duplicateName ? (
                    <View style={styles.contactDupPill}>
                      <Text style={styles.contactDupText} numberOfLines={1}>
                        AS {item.duplicateName.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.contactsFooterBar}>
            <Text style={styles.contactsSelectedCount}>
              {selectedContactIds.length} selected
            </Text>
            <TouchableOpacity
              style={[
                styles.contactsImportConfirmBtn,
                (selectedContactIds.length === 0 || importingContacts) && { opacity: 0.45 },
              ]}
              onPress={handleConfirmImportContacts}
              disabled={selectedContactIds.length === 0 || importingContacts}
              activeOpacity={0.85}
            >
              <Text style={styles.contactsImportConfirmText}>
                {importingContacts
                  ? 'IMPORTING...'
                  : `IMPORT ${selectedContactIds.length || ''} CLIENT${selectedContactIds.length === 1 ? '' : 'S'}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f7',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  inkHeaderCard: {
    backgroundColor: '#121216',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#e8276b',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.4,
  },

  importContactsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.25)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  importIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importTextCol: {
    flex: 1,
  },
  importTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  importSub: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  importActionPill: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  importActionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#ffffff',
  },

  // 1. Compact Unified Form
  compactFormCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionKicker: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: 'rgba(18, 18, 18, 0.45)',
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#e8276b',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fieldRowError: {
    backgroundColor: 'rgba(232, 39, 107, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  fieldIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(232, 39, 107, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  compactInput: {
    fontSize: 14,
    color: '#121212',
    paddingVertical: 3,
    paddingHorizontal: 0,
    fontWeight: '500',
  },
  phonePrefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phonePrefixCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  compactTextArea: {
    minHeight: 46,
    textAlignVertical: 'top',
    paddingTop: 2,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.05)',
    marginVertical: 6,
  },

  // 2. Profile Photo Card
  photoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  photoTouchableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarHolder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarEmpty: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#e8276b',
    backgroundColor: 'rgba(232, 39, 107, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e8276b',
  },
  photoTextCol: {
    flex: 1,
  },
  photoHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.1,
  },
  optionalPill: {
    backgroundColor: 'rgba(18, 18, 18, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  optionalText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.55)',
    letterSpacing: 0.4,
  },
  photoSub: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.45)',
    marginTop: 2,
  },
  removePhotoBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(18, 18, 18, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.6)',
  },

  // 3. Condensed Animated Dual Action Deck
  actionDeckContainer: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  dualActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveClientBtn: {
    flex: 1,
    backgroundColor: '#16161b',
    borderRadius: 15,
    paddingVertical: 13,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#23232a',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  saveClientBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveAndBookBtn: {
    backgroundColor: '#e8276b',
    borderRadius: 15,
    paddingVertical: 13,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  saveAndBookBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  btnIconWrap: {
    marginRight: 6,
  },
  contactsModalRoot: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  contactsModalHeader: {
    backgroundColor: '#121216',
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactsModalEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#e8276b',
  },
  contactsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  contactsModalCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  contactsModalCloseText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#ffffff',
  },
  contactsSearchWrap: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
  },
  contactsSearchInput: {
    backgroundColor: Colors.tint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#121212',
  },
  contactsListContent: {
    paddingBottom: 24,
  },
  contactsEmptyWrap: {
    padding: 36,
    alignItems: 'center',
  },
  contactsEmptyText: {
    fontSize: 13.5,
    color: 'rgba(18, 18, 18, 0.5)',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
    gap: 12,
  },
  contactRowSelected: {
    backgroundColor: '#fff5f9',
  },
  contactRowDisabled: {
    opacity: 0.68,
  },
  contactCheckBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: 'rgba(18, 18, 18, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCheckBoxActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  contactCheckBoxDisabled: {
    borderColor: 'rgba(18, 18, 18, 0.14)',
    backgroundColor: 'rgba(18, 18, 18, 0.04)',
  },
  contactTextCol: {
    flex: 1,
  },
  contactRowName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  contactRowPhone: {
    fontSize: 12.5,
    color: 'rgba(18, 18, 18, 0.58)',
    marginTop: 2,
  },
  contactWarnPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contactWarnText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#92400e',
  },
  contactDupPill: {
    backgroundColor: '#ffeef4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 130,
  },
  contactDupText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.deep,
  },
  contactsFooterBar: {
    backgroundColor: '#121216',
    paddingHorizontal: 18,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactsSelectedCount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  contactsImportConfirmBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  contactsImportConfirmText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#ffffff',
  },
});
