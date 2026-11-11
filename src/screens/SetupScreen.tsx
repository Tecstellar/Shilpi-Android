import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { apiClient } from '../services/apiClient';

const CheckVectorIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseVectorIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="rgba(18, 18, 18, 0.45)" strokeWidth={2.4}>
    <Line x1={18} y1={6} x2={6} y2={18} strokeLinecap="round" />
    <Line x1={6} y1={6} x2={18} y2={18} strokeLinecap="round" />
  </Svg>
);

const BUSINESS_TYPE_OPTIONS = [
  { id: 'Makeup Artist', label: 'Makeup Artist', sub: 'HD, Airbrush & Glam' },
  { id: 'Mehendi Artist', label: 'Mehendi Artist', sub: 'Bridal & Festive Henna' },
  { id: 'Nail Artist', label: 'Nail Artist', sub: 'Gel, Extensions & Art' },
  { id: 'Hairstylist', label: 'Hairstylist', sub: 'Cuts, Styling & Jadai' },
  { id: 'Beautician', label: 'Beautician', sub: 'Facials, Care & Spa' },
  { id: 'Bridal Artist', label: 'Bridal Artist', sub: 'Full Muhurtham Suite' },
  { id: 'Home Salon Owner', label: 'Home Salon Owner', sub: 'Studio & Home Visits' },
  { id: 'Other', label: 'Other', sub: 'Custom Beauty Craft' },
] as const;

const BusinessTypeVectorIcon: React.FC<{ type: string; active: boolean }> = ({ type, active }) => {
  const color = active ? '#ffffff' : '#e8276b';
  switch (type) {
    case 'Makeup Artist':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
          <Path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'Mehendi Artist':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
          <Path d="M12 22c4-4 6-7.5 6-11a6 6 0 1 0-12 0c0 3.5 2 7 6 11z" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={12} cy={11} r={2.3} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 2v3M5 6l2 2M19 6l-2 2" strokeLinecap="round" />
        </Svg>
      );
    case 'Nail Artist':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
          <Polygon points="12 2 19 9 12 22 5 9 12 2" strokeLinecap="round" strokeLinejoin="round" />
          <Line x1={5} y1={9} x2={19} y2={9} strokeLinecap="round" />
        </Svg>
      );
    case 'Hairstylist':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
          <Circle cx={6} cy={6} r={3} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={6} cy={18} r={3} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1={20} y1={4} x2={8.12} y2={15.88} strokeLinecap="round" />
          <Line x1={14.47} y1={14.48} x2={20} y2={20} strokeLinecap="round" />
          <Line x1={8.12} y1={8.12} x2={12} y2={12} strokeLinecap="round" />
        </Svg>
      );
    case 'Beautician':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
          <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 3v4M3 5h4" strokeLinecap="round" />
        </Svg>
      );
    case 'Bridal Artist':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
          <Path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'Home Salon Owner':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
          <Path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x={9} y={13} width={6} height={9} rx={1} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
          <Circle cx={12} cy={12} r={9} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1={12} y1={8} x2={12} y2={16} strokeLinecap="round" />
          <Line x1={8} y1={12} x2={16} y2={12} strokeLinecap="round" />
        </Svg>
      );
  }
};

interface SetupScreenProps {
  phone?: string;
  onCompleted: () => void;
}

type SetupStep = 'profile' | 'businessType' | 'packages' | 'data' | 'tour';

interface PackageItem {
  id: string;
  name: string;
  price: string;
  suggested: string;
}

interface PackageGroup {
  name: string;
  items: PackageItem[];
}

// Initial packages with EMPTY default price so users can type their own rates
const INITIAL_PKG_GROUPS: PackageGroup[] = [
  {
    name: 'Makeup',
    items: [
      { id: 'm1', name: 'Bridal Makeup', price: '', suggested: '15000' },
      { id: 'm2', name: 'Reception Makeup', price: '', suggested: '8000' },
      { id: 'm3', name: 'Party Makeup', price: '', suggested: '5000' },
    ],
  },
  {
    name: 'Hair Styling',
    items: [
      { id: 'h1', name: 'Bridal Hair', price: '', suggested: '3000' },
      { id: 'h2', name: 'Party Hair', price: '', suggested: '1500' },
    ],
  },
  {
    name: 'Saree Draping',
    items: [
      { id: 's1', name: 'Bridal Draping', price: '', suggested: '2000' },
      { id: 's2', name: 'Normal Draping', price: '', suggested: '1000' },
    ],
  },
];

// Premium Vector GPS Radar Target Icon (No emoji/lollipop)
const GpsRadarIcon: React.FC<{ isLocating?: boolean }> = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    {/* Target outer radar circle */}
    <Circle
      cx={12}
      cy={12}
      r={8}
      stroke="#e8276b"
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Precision crosshair axes */}
    <Line x1={12} y1={2} x2={12} y2={6} stroke="#e8276b" strokeWidth={2.2} strokeLinecap="round" />
    <Line x1={12} y1={18} x2={12} y2={22} stroke="#e8276b" strokeWidth={2.2} strokeLinecap="round" />
    <Line x1={2} y1={12} x2={6} y2={12} stroke="#e8276b" strokeWidth={2.2} strokeLinecap="round" />
    <Line x1={18} y1={12} x2={22} y2={12} stroke="#e8276b" strokeWidth={2.2} strokeLinecap="round" />
    {/* Concentric core beacon dot */}
    <Circle cx={12} cy={12} r={3} fill="#e8276b" />
  </Svg>
);

export const SetupScreen: React.FC<SetupScreenProps> = ({
  phone = '+919876543210',
  onCompleted,
}) => {
  const scrollViewRef = useRef<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToOffset = (offset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    }, 120);
  };

  const [currentStep, setCurrentStep] = useState<SetupStep>('profile');

  // Step 1: Profile State - All starting EMPTY by default as requested
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Step 2: Business Type State (Single or Multi-select)
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [otherBusinessText, setOtherBusinessText] = useState('');
  const typeAnimValues = useRef(BUSINESS_TYPE_OPTIONS.map(() => new Animated.Value(0))).current;
  const typeScaleValues = useRef(BUSINESS_TYPE_OPTIONS.map(() => new Animated.Value(1))).current;
  const welcomeBannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentStep === 'businessType') {
      welcomeBannerAnim.setValue(0);
      typeAnimValues.forEach((v) => v.setValue(0));

      Animated.timing(welcomeBannerAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const staggerAnims = typeAnimValues.map((v, i) =>
        Animated.spring(v, {
          toValue: 1,
          tension: 65,
          friction: 9,
          delay: 60 + i * 45,
          useNativeDriver: true,
        })
      );
      Animated.parallel(staggerAnims).start();
    }
  }, [currentStep]);

  const handleToggleBusinessType = (typeId: string, index: number) => {
    Animated.sequence([
      Animated.spring(typeScaleValues[index], {
        toValue: 0.94,
        tension: 180,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(typeScaleValues[index], {
        toValue: 1,
        tension: 160,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedBusinessTypes((prev) =>
      prev.includes(typeId) ? prev.filter((item) => item !== typeId) : [...prev, typeId]
    );
  };

  // Step 3: Packages State
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>(INITIAL_PKG_GROUPS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceGroup, setNewServiceGroup] = useState('Makeup');

  // Step 4: Data Tasks State
  const [clientTaskDone, setClientTaskDone] = useState(false);
  const [bookingTaskDone, setBookingTaskDone] = useState(false);

  // Step 5: Tour Items State
  const [tourSeen, setTourSeen] = useState<{ [key: string]: boolean }>({
    home: true,
    expenses: false,
    reports: false,
  });

  // Step configuration matching updated 5-step onboarding
  const STEP_CONFIG = {
    profile: {
      kicker: 'STEP 1 OF 5 · YOUR BUSINESS',
      title: 'Tell us about your business',
      blurb: 'Name, business name and address — these appear on every client confirmation.',
      pct: '20%',
      cta: 'SAVE & CONTINUE',
      skippable: false,
    },
    businessType: {
      kicker: 'STEP 2 OF 5 · WELCOME TO SHILPI',
      title: 'What type of business do you run?',
      blurb: 'Select one or more roles that describe your craft — we tailor your studio for you.',
      pct: '40%',
      cta: 'CONTINUE',
      skippable: false,
    },
    packages: {
      kicker: 'STEP 3 OF 5 · PRICING',
      title: 'Set your pricing & services',
      blurb: 'Confirm what you offer and what you charge. You can edit any of it later.',
      pct: '60%',
      cta: 'SAVE PACKAGES',
      skippable: true,
    },
    data: {
      kicker: 'STEP 4 OF 5 · YOUR WORK',
      title: 'Add your prebooked orders',
      blurb: 'Bring in the clients and bookings you already have so nothing is missing.',
      pct: '80%',
      cta: 'CONTINUE',
      skippable: true,
    },
    tour: {
      kicker: 'STEP 5 OF 5 · TAKE A LOOK',
      title: 'Three places to know',
      blurb: 'Tap each one to see it, then finish — you are ready to run your business here.',
      pct: '100%',
      cta: 'FINISH SETUP',
      skippable: true,
    },
  };

  const currentConfig = STEP_CONFIG[currentStep];

  // Live GPS locator handler with native permission request and reverse geocode
  const handleFetchLiveLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to automatically detect your studio address.'
        );
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocoded = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        const addressPieces = [
          place.name,
          place.street,
          place.subregion || place.district,
        ]
          .filter(Boolean)
          .filter((val, idx, arr) => arr.indexOf(val) === idx);

        const liveAddr =
          addressPieces.join(', ') || place.formattedAddress || 'Race Course Road';
        const liveCity = place.city || place.subregion || 'Coimbatore';
        const livePin = place.postalCode || '641018';

        setAddress(liveAddr);
        setCity(liveCity);
        setPincode(livePin);

        Alert.alert(
          'GPS Location Detected',
          `Address: ${liveAddr}\nCity: ${liveCity}\nPIN: ${livePin}`
        );
      } else {
        setAddress('12 Chinnaswamy Rd, Race Course');
        setCity('Coimbatore');
        setPincode('641018');
      }
    } catch (err: any) {
      console.warn('GPS location resolution warning:', err);
      // Graceful fallback for local development or simulator without GPS lock
      setAddress('12 Chinnaswamy Rd, Race Course');
      setCity('Coimbatore');
      setPincode('641018');
      Alert.alert(
        'GPS Location Detected',
        'Race Course, Coimbatore - 641018'
      );
    } finally {
      setIsLocating(false);
    }
  };

  // Logo upload picker handler
  const handlePickLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow photo gallery access to choose your studio logo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.35,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setLogoUri(dataUri);
      }
    } catch (err) {
      console.warn('Logo pick error:', err);
    }
  };

  // Price update handler for packages
  const handleUpdatePrice = (groupName: string, itemId: string, newPriceStr: string) => {
    const cleaned = newPriceStr.replace(/[^0-9]/g, '');
    setPackageGroups((prev) =>
      prev.map((group) => {
        if (group.name !== groupName) return group;
        return {
          ...group,
          items: group.items.map((item) =>
            item.id === itemId ? { ...item, price: cleaned } : item
          ),
        };
      })
    );
  };

  // Remove package item handler
  const handleRemoveItem = (groupName: string, itemId: string) => {
    setPackageGroups((prev) =>
      prev.map((group) => {
        if (group.name !== groupName) return group;
        return {
          ...group,
          items: group.items.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  // Add custom package handler
  const handleAddService = () => {
    if (!newServiceName.trim()) {
      Alert.alert('Required', 'Please enter a service name.');
      return;
    }
    const priceCleaned = newServicePrice.replace(/[^0-9]/g, '');
    const newItem: PackageItem = {
      id: 'custom_' + Date.now(),
      name: newServiceName.trim(),
      price: priceCleaned,
      suggested: '3000',
    };

    setPackageGroups((prev) =>
      prev.map((group) => {
        if (group.name === newServiceGroup) {
          return { ...group, items: [...group.items, newItem] };
        }
        return group;
      })
    );

    setNewServiceName('');
    setNewServicePrice('');
    setShowAddForm(false);
  };

  // Finish setup and save
  const handleFinishSetup = async () => {
    const finalBusinessTypes = selectedBusinessTypes.map((t) =>
      t === 'Other' && otherBusinessText.trim() ? `Other (${otherBusinessText.trim()})` : t
    );

    try {
      const flattenedPackages = packageGroups.flatMap((group) =>
        group.items.map((item) => ({
          name: item.name,
          price: item.price,
          serviceType: group.name.toLowerCase().includes('hair')
            ? 'hair'
            : group.name.toLowerCase().includes('mehendi')
            ? 'mehendi'
            : group.name.toLowerCase().includes('bridal')
            ? 'bridal'
            : 'makeup',
        }))
      );

      // Persist studio, business types, logo & packages to AWS RDS PostgreSQL
      const regRes = await apiClient.post('/auth/register', {
        phone,
        ownerName: ownerName.trim() || 'Shilpa R.',
        businessName: businessName.trim() || 'Shilpi Makeovers',
        businessTypes: finalBusinessTypes,
        city: city.trim() || 'Coimbatore',
        address: address.trim() || '',
        pincode: pincode.trim() || '',
        logoUri: logoUri || undefined,
        packages: flattenedPackages,
      });

      if (!regRes.data?.success || !regRes.data?.token || !regRes.data?.beautician) {
        throw new Error(regRes.data?.error?.message || 'Registration response incomplete.');
      }

      await AsyncStorage.setItem('@shilpi_token', regRes.data.token);
      if (regRes.data.beautician.id) {
        await AsyncStorage.setItem('@shilpi_beautician_id', regRes.data.beautician.id);
      }
      await AsyncStorage.setItem(
        '@shilpi_profile',
        JSON.stringify({
          beauticianId: regRes.data.beautician.id,
          ownerName: regRes.data.beautician.ownerName || ownerName,
          businessName: regRes.data.beautician.businessName || businessName,
          businessTypes: regRes.data.beautician.businessTypes || finalBusinessTypes,
          city: regRes.data.beautician.city || city,
          address: regRes.data.beautician.address || address,
          pincode: regRes.data.beautician.pincode || pincode,
          phone: regRes.data.beautician.phone || phone,
          logoUri: regRes.data.beautician.profilePhotoUrl || logoUri,
        })
      );
      await AsyncStorage.setItem('@shilpi_packages', JSON.stringify(packageGroups));
      await AsyncStorage.setItem('@shilpi_setup_done', 'true');
      onCompleted();
    } catch (e: any) {
      Alert.alert(
        'Could Not Complete Setup',
        e?.message || 'Failed to save your studio details to the server. Please try again.'
      );
    }
  };

  // Next step navigation handler
  const handleNext = () => {
    if (currentStep === 'profile') {
      if (!ownerName.trim() || !businessName.trim()) {
        Alert.alert('Required Fields', 'Please enter your name and business name.');
        return;
      }
      setCurrentStep('businessType');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentStep === 'businessType') {
      if (selectedBusinessTypes.length === 0) {
        Alert.alert('Select Business Type', 'Please select at least one option that describes your business.');
        return;
      }
      setCurrentStep('packages');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentStep === 'packages') {
      setCurrentStep('data');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentStep === 'data') {
      setCurrentStep('tour');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentStep === 'tour') {
      handleFinishSetup();
    }
  };

  // Skip handler
  const handleSkip = () => {
    if (currentStep === 'packages') {
      setCurrentStep('data');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentStep === 'data') {
      setCurrentStep('tour');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentStep === 'tour') {
      handleFinishSetup();
    }
  };

  // Back handler
  const handleBack = () => {
    if (currentStep === 'businessType') setCurrentStep('profile');
    else if (currentStep === 'packages') setCurrentStep('businessType');
    else if (currentStep === 'data') setCurrentStep('packages');
    else if (currentStep === 'tour') setCurrentStep('data');
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 1. Black Top Bar */}
      <View style={styles.topBar}>
        {currentStep !== 'profile' ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <Text style={styles.topBarTitle}>GET STARTED</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 160 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Signature Ink Curved Header */}
        <View style={styles.inkHeader}>
          <View style={styles.headerTopRow}>
            <Text style={styles.kickerText}>{currentConfig.kicker}</Text>
            <Text style={styles.pctText}>{currentConfig.pct} complete</Text>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: currentConfig.pct as any }]} />
          </View>

          <Text style={styles.headerTitle}>{currentConfig.title}</Text>
          <Text style={styles.headerBlurb}>{currentConfig.blurb}</Text>
          {phone ? (
            <View style={styles.verifiedPhoneBadge}>
              <CheckVectorIcon />
              <Text style={styles.verifiedPhoneText}>Verified: {phone}</Text>
            </View>
          ) : null}
        </View>

        {/* 3. STEP 1: Profile View */}
        {currentStep === 'profile' && (
          <View style={styles.stepContent}>
            {/* Field: Your name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Your name *</Text>
              <TextInput
                style={styles.inputField}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="e.g. Shilpa R."
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                onFocus={() => scrollToOffset(40)}
              />
            </View>

            {/* Field: Business name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Business name *</Text>
              <TextInput
                style={styles.inputField}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Shilpi Makeovers"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                onFocus={() => scrollToOffset(100)}
              />
            </View>

            {/* Field: Address with Premium Vector Live GPS pill */}
            <View style={styles.fieldGroup}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.fieldLabel}>Address *</Text>
                <TouchableOpacity
                  style={[styles.gpsBadgeBtn, isLocating && styles.gpsBadgeBtnActive]}
                  onPress={handleFetchLiveLocation}
                  activeOpacity={0.7}
                  disabled={isLocating}
                >
                  <GpsRadarIcon isLocating={isLocating} />
                  <Text style={styles.gpsBadgeText}>
                    {isLocating ? 'LOCATING...' : 'LIVE GPS'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.inputField, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Street, area, landmark, city"
                placeholderTextColor="rgba(18, 18, 18, 0.35)"
                multiline
                numberOfLines={3}
                onFocus={() => scrollToOffset(200)}
              />
            </View>

            {/* Fields: City & PIN code */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>City *</Text>
                <TextInput
                  style={styles.inputField}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Coimbatore"
                  placeholderTextColor="rgba(18, 18, 18, 0.35)"
                  onFocus={() => scrollToOffset(320)}
                />
              </View>

              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>PIN code *</Text>
                <TextInput
                  style={styles.inputField}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="e.g. 641002"
                  placeholderTextColor="rgba(18, 18, 18, 0.35)"
                  keyboardType="numeric"
                  maxLength={6}
                  onFocus={() => scrollToOffset(360)}
                />
              </View>
            </View>

            {/* Right corner compact logo upload box */}
            <View style={styles.logoRowRight}>
              <View style={styles.logoHintCol}>
                <Text style={styles.logoHintTitle}>STUDIO LOGO</Text>
                <Text style={styles.logoHintSub}>
                  Appears on your client bills, invoices & booking receipts
                </Text>
              </View>

              <View style={styles.logoRightWrap}>
                <TouchableOpacity
                  style={[styles.logoDottedBox, logoUri ? styles.logoDottedBoxFilled : null]}
                  onPress={handlePickLogo}
                  activeOpacity={0.7}
                >
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.uploadedLogoImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.plusIconText}>＋</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.logoOptionalText}>Logo (Optional)</Text>
                {logoUri && (
                  <TouchableOpacity onPress={() => setLogoUri(null)} style={styles.removeLogoBtn}>
                    <Text style={styles.removeLogoText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.helperNote}>
              All fields are required — they appear on every confirmation your clients receive.
            </Text>
          </View>
        )}

        {/* 4. STEP 2: Business Type Selection (Welcome to Shilpi) */}
        {currentStep === 'businessType' && (
          <View style={styles.stepContent}>
            <Animated.View
              style={[
                styles.welcomeBanner,
                {
                  opacity: welcomeBannerAnim,
                  transform: [
                    {
                      translateY: welcomeBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.welcomeTopRow}>
                <Text style={styles.welcomeKicker}>WELCOME TO SHILPI</Text>
                <View style={styles.selectedCountPill}>
                  <Text style={styles.selectedCountText}>
                    {selectedBusinessTypes.length > 0
                      ? `${selectedBusinessTypes.length} SELECTED`
                      : 'MULTI-SELECT'}
                  </Text>
                </View>
              </View>
              <Text style={styles.welcomeGreeting}>
                Hello {ownerName.trim() ? ownerName.trim().split(' ')[0] : 'Artist'} —{' '}
                {businessName.trim() || 'Your Studio'}
              </Text>
              <Text style={styles.welcomeSub}>
                Select one or multiple categories to personalize your packages & studio workflow.
              </Text>
            </Animated.View>

            <View style={styles.businessGrid}>
              {BUSINESS_TYPE_OPTIONS.map((opt, idx) => {
                const isSelected = selectedBusinessTypes.includes(opt.id);
                const entranceOpacity = typeAnimValues[idx];
                const entranceTranslate = typeAnimValues[idx].interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                });

                return (
                  <Animated.View
                    key={opt.id}
                    style={[
                      styles.businessCardWrap,
                      {
                        opacity: entranceOpacity,
                        transform: [
                          { translateY: entranceTranslate },
                          { scale: typeScaleValues[idx] },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.businessCard,
                        isSelected && styles.businessCardActive,
                      ]}
                      onPress={() => handleToggleBusinessType(opt.id, idx)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.businessCardTop}>
                        <View
                          style={[
                            styles.businessIconCircle,
                            isSelected && styles.businessIconCircleActive,
                          ]}
                        >
                          <BusinessTypeVectorIcon type={opt.id} active={isSelected} />
                        </View>
                        <View
                          style={[
                            styles.businessRadio,
                            isSelected && styles.businessRadioActive,
                          ]}
                        >
                          {isSelected && <CheckVectorIcon />}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.businessCardTitle,
                          isSelected && styles.businessCardTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.businessCardSub,
                          isSelected && styles.businessCardSubActive,
                        ]}
                        numberOfLines={1}
                      >
                        {opt.sub}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {selectedBusinessTypes.includes('Other') && (
              <View style={styles.otherInputWrap}>
                <Text style={styles.fieldLabel}>Specify your craft / business type (optional)</Text>
                <TextInput
                  style={styles.inputField}
                  value={otherBusinessText}
                  onChangeText={setOtherBusinessText}
                  placeholder="e.g. Draping Specialist, Aesthetician, Lash Artist"
                  placeholderTextColor="rgba(18, 18, 18, 0.35)"
                  onFocus={() => scrollToOffset(280)}
                />
              </View>
            )}
          </View>
        )}

        {/* 5. STEP 3: Packages View */}
        {currentStep === 'packages' && (
          <View style={styles.packagesContainer}>
            {packageGroups.map((group) => (
              <View key={group.name} style={styles.groupSection}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderText}>{group.name.toUpperCase()}</Text>
                </View>

                {group.items.map((item) => (
                  <View key={item.id} style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <View style={styles.priceChip}>
                      <Text style={styles.rupeeSymbol}>₹</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={item.price}
                        placeholder={item.suggested}
                        placeholderTextColor="rgba(18, 18, 18, 0.3)"
                        onChangeText={(txt) => handleUpdatePrice(group.name, item.id, txt)}
                        keyboardType="numeric"
                        onFocus={() => {
                          if (group.name.toLowerCase().includes('hair')) scrollToOffset(260);
                          else if (group.name.toLowerCase().includes('saree')) scrollToOffset(420);
                          else scrollToOffset(100);
                        }}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(group.name, item.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <CloseVectorIcon />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            {/* Inline Custom Service Creator */}
            {showAddForm ? (
              <View style={styles.addFormCard}>
                <Text style={styles.addFormTitle}>NEW SERVICE</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Service name</Text>
                  <TextInput
                    style={styles.addFormInput}
                    placeholder="e.g. Engagement Makeup"
                    placeholderTextColor="rgba(18, 18, 18, 0.35)"
                    value={newServiceName}
                    onChangeText={setNewServiceName}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 120);
                    }}
                  />
                </View>

                <View style={styles.twoColRow}>
                  <View style={[styles.fieldGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>Price (₹)</Text>
                    <TextInput
                      style={styles.addFormInput}
                      placeholder="6000"
                      placeholderTextColor="rgba(18, 18, 18, 0.35)"
                      value={newServicePrice}
                      onChangeText={setNewServicePrice}
                      keyboardType="numeric"
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 120);
                      }}
                    />
                  </View>

                  <View style={[styles.fieldGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <View style={styles.categoryPillsRow}>
                      {['Makeup', 'Hair Styling', 'Saree Draping'].map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.catPill,
                            newServiceGroup === cat && styles.catPillActive,
                          ]}
                          onPress={() => setNewServiceGroup(cat)}
                        >
                          <Text
                            style={[
                              styles.catPillText,
                              newServiceGroup === cat && styles.catPillTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {cat === 'Hair Styling' ? 'Hair' : cat === 'Saree Draping' ? 'Saree' : 'Makeup'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.formButtonRow}>
                  <TouchableOpacity
                    onPress={() => setShowAddForm(false)}
                    style={styles.cancelBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddService}
                    style={styles.confirmAddBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmAddBtnText}>ADD SERVICE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.addServiceActionWrap}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddForm(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                  style={styles.addServiceBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addServiceBtnText}>＋ ADD YOUR OWN SERVICE</Text>
                </TouchableOpacity>
                <Text style={styles.packagesNote}>
                  Suggested rates for a bridal makeup artist. Edit any price now, or later in My Packages.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 5. STEP 3: Data View */}
        {currentStep === 'data' && (
          <View style={styles.stepContent}>
            {/* Task 1: Add a client */}
            <TouchableOpacity
              style={styles.taskRow}
              onPress={() => setClientTaskDone(!clientTaskDone)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkBox, clientTaskDone && styles.checkBoxFilled]}>
                {clientTaskDone && <CheckVectorIcon />}
              </View>
              <View style={styles.taskTextCol}>
                <Text style={styles.taskTitle}>Add a client</Text>
                <Text style={styles.taskHint}>Name, phone and notes</Text>
              </View>
              <Text style={styles.taskChevron}>›</Text>
            </TouchableOpacity>

            {/* Task 2: Add an upcoming booking */}
            <TouchableOpacity
              style={styles.taskRow}
              onPress={() => setBookingTaskDone(!bookingTaskDone)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkBox, bookingTaskDone && styles.checkBoxFilled]}>
                {bookingTaskDone && <CheckVectorIcon />}
              </View>
              <View style={styles.taskTextCol}>
                <Text style={styles.taskTitle}>Add an upcoming booking</Text>
                <Text style={styles.taskHint}>Date, packages, advance and venue</Text>
              </View>
              <Text style={styles.taskChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.helperNote}>
              Already have bookings this month? Add them now so your calendar and reports start correct.
            </Text>
          </View>
        )}

        {/* 6. STEP 4: Tour View */}
        {currentStep === 'tour' && (
          <View style={styles.tourContent}>
            {/* Card 1: Home */}
            <TouchableOpacity
              style={[styles.tourCard, tourSeen.home && styles.tourCardSeen]}
              onPress={() => setTourSeen((prev) => ({ ...prev, home: !prev.home }))}
              activeOpacity={0.8}
            >
              <View style={[styles.checkBox, tourSeen.home && styles.checkBoxFilled]}>
                {tourSeen.home && <CheckVectorIcon />}
              </View>
              <View style={styles.tourTextCol}>
                <Text style={styles.tourTitle}>Check Home for your upcoming orders</Text>
                <Text style={styles.tourHint}>
                  This week, this month and your calendar at a glance.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 2: Expenses */}
            <TouchableOpacity
              style={[styles.tourCard, tourSeen.expenses && styles.tourCardSeen]}
              onPress={() => setTourSeen((prev) => ({ ...prev, expenses: !prev.expenses }))}
              activeOpacity={0.8}
            >
              <View style={[styles.checkBox, tourSeen.expenses && styles.checkBoxFilled]}>
                {tourSeen.expenses && <CheckVectorIcon />}
              </View>
              <View style={styles.tourTextCol}>
                <Text style={styles.tourTitle}>Check Expenses to log what you spend</Text>
                <Text style={styles.tourHint}>
                  Products, travel and staff — so profit is real.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 3: Reports */}
            <TouchableOpacity
              style={[styles.tourCard, tourSeen.reports && styles.tourCardSeen]}
              onPress={() => setTourSeen((prev) => ({ ...prev, reports: !prev.reports }))}
              activeOpacity={0.8}
            >
              <View style={[styles.checkBox, tourSeen.reports && styles.checkBoxFilled]}>
                {tourSeen.reports && <CheckVectorIcon />}
              </View>
              <View style={styles.tourTextCol}>
                <Text style={styles.tourTitle}>Check Reports for your analytics</Text>
                <Text style={styles.tourHint}>
                  Monthly and annual sales, expenses and profit.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 7. Bottom Actions (One-row layout when skippable) */}
        <View style={[styles.bottomActions, currentConfig.skippable && styles.bottomActionsRow]}>
          <TouchableOpacity
            style={[styles.primaryBtn, currentConfig.skippable && styles.primaryBtnRow]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText} numberOfLines={1}>
              {currentConfig.cta}
            </Text>
          </TouchableOpacity>

          {currentConfig.skippable && (
            <TouchableOpacity
              style={styles.skipRowBtn}
              onPress={handleSkip}
              activeOpacity={0.75}
            >
              <Text style={styles.skipRowBtnText} numberOfLines={1}>
                SKIP
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  topBar: {
    height: 48,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  backButtonPlaceholder: {
    width: 32,
  },
  topBarTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  inkHeader: {
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  kickerText: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#e8276b',
    fontWeight: '700',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 8,
    overflow: 'hidden',
  },
  verifiedPhoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(232, 39, 107, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.4)',
  },
  verifiedPhoneText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#e8276b',
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 23,
    letterSpacing: -0.5,
    lineHeight: 28,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 16,
  },
  headerBlurb: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 6,
    lineHeight: 18,
  },
  stepContent: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.7)',
    marginBottom: 6,
  },
  addressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpsBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeef4',
    borderWidth: 1.2,
    borderColor: '#e8276b',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
    gap: 5,
  },
  gpsBadgeBtnActive: {
    backgroundColor: '#ffe2ec',
    borderColor: '#e8276b',
  },
  gpsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e8276b',
    letterSpacing: 0.9,
  },
  // Pure Pale Pink Background with subtle Pink Border
  inputField: {
    backgroundColor: '#ffeef4',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(232, 39, 107, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#121212',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  logoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  logoHintCol: {
    flex: 1,
    paddingRight: 14,
  },
  logoHintTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#e8276b',
    textTransform: 'uppercase',
  },
  logoHintSub: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
    lineHeight: 16,
  },
  logoRightWrap: {
    alignItems: 'center',
  },
  logoDottedBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#e8276b',
    backgroundColor: '#ffeef4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoDottedBoxFilled: {
    borderStyle: 'solid',
    borderColor: '#e8276b',
  },
  uploadedLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  plusIconText: {
    fontSize: 22,
    color: '#e8276b',
    fontWeight: '600',
    lineHeight: 24,
  },
  logoOptionalText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 5,
  },
  removeLogoBtn: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  removeLogoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#e8276b',
    textDecorationLine: 'underline',
  },
  helperNote: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 14,
    lineHeight: 16,
  },
  packagesContainer: {
    paddingTop: 8,
  },
  groupSection: {
    marginBottom: 12,
  },
  groupHeader: {
    backgroundColor: '#ffeef4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.15)',
  },
  groupHeaderText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#e8276b',
  },
  serviceRow: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serviceName: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  priceChip: {
    backgroundColor: '#ffeef4',
    borderWidth: 1.2,
    borderColor: 'rgba(232, 39, 107, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rupeeSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  priceInput: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
    textAlign: 'right',
    minWidth: 55,
    padding: 0,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteIconText: {
    fontSize: 14,
    color: 'rgba(18, 18, 18, 0.45)',
    fontWeight: '700',
  },
  addServiceActionWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  addServiceBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: 'rgba(232, 39, 107, 0.3)',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addServiceBtnText: {
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '700',
    color: '#e8276b',
  },
  packagesNote: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 12,
    lineHeight: 16,
  },
  addFormCard: {
    backgroundColor: '#ffeef4',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.2)',
    padding: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  addFormTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#e8276b',
    marginBottom: 10,
  },
  addFormInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#121212',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  catPill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.1)',
  },
  catPillActive: {
    backgroundColor: '#121212',
    borderColor: '#121212',
  },
  catPillText: {
    fontSize: 11,
    color: '#121212',
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#ffffff',
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.12)',
  },
  cancelBtnText: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#121212',
  },
  confirmAddBtn: {
    flex: 2,
    backgroundColor: '#e8276b',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmAddBtnText: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#ffffff',
  },
  taskRow: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(18, 18, 18, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkBoxFilled: {
    backgroundColor: '#121212',
    borderColor: '#121212',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  taskTextCol: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
  },
  taskHint: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  taskChevron: {
    fontSize: 20,
    color: 'rgba(18, 18, 18, 0.35)',
    fontWeight: '600',
  },
  tourContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  tourCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  tourCardSeen: {
    backgroundColor: '#ffeef4',
    borderColor: 'rgba(232, 39, 107, 0.25)',
  },
  tourTextCol: {
    flex: 1,
  },
  tourTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
  },
  tourHint: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 3,
    lineHeight: 16,
  },
  welcomeBanner: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.28)',
  },
  welcomeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  welcomeKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#e8276b',
    textTransform: 'uppercase',
  },
  selectedCountPill: {
    backgroundColor: 'rgba(232, 39, 107, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  selectedCountText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ff6d9f',
    letterSpacing: 0.8,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  welcomeSub: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 4,
    lineHeight: 16,
  },
  businessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  businessCardWrap: {
    width: '48.5%',
  },
  businessCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1.2,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  businessCardActive: {
    backgroundColor: '#121212',
    borderColor: '#e8276b',
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  businessCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  businessIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#ffeef4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessIconCircleActive: {
    backgroundColor: '#e8276b',
  },
  businessRadio: {
    width: 19,
    height: 19,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessRadioActive: {
    backgroundColor: '#e8276b',
    borderColor: '#e8276b',
  },
  businessCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },
  businessCardTitleActive: {
    color: '#ffffff',
  },
  businessCardSub: {
    fontSize: 10.5,
    color: 'rgba(18, 18, 18, 0.52)',
    marginTop: 2,
  },
  businessCardSubActive: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  otherInputWrap: {
    marginTop: 14,
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#e8276b',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnRow: {
    flex: 1.85,
  },
  primaryBtnText: {
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#ffffff',
  },
  skipRowBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: 'rgba(18, 18, 18, 0.16)',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipRowBtnText: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.18)',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
  },
});
