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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Client } from '../data/prototypeData';

interface NewClientScreenProps {
  onSaveClient: (client: Partial<Client>, thenCreateBooking?: boolean) => void;
  onGoBack: () => void;
}

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
  onSaveClient,
  onGoBack,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [validationError, setValidationError] = useState(false);

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

  const handleSave = (thenCreateBooking: boolean = false) => {
    if (!name.trim()) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    onSaveClient(
      {
        name: name.trim(),
        phone: phone.trim() || '+91 98000 00000',
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
            <Text style={styles.sectionKicker}>CLIENT DETAILS</Text>
            {validationError && (
              <Text style={styles.errorText}>* Name is required</Text>
            )}
          </View>

          {/* Name Field */}
          <View style={[styles.fieldRow, validationError && styles.fieldRowError]}>
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
                  if (t.trim()) setValidationError(false);
                }}
              />
            </View>
          </View>

          <View style={styles.fieldDivider} />

          {/* Phone Field */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <PhoneIcon />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
              <TextInput
                style={styles.compactInput}
                keyboardType="phone-pad"
                placeholder="+91 98765 43210"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                value={phone}
                onChangeText={setPhone}
              />
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
});
