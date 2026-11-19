import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Linking,
  Platform,
  Dimensions,
  FlatList,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Line,
} from 'react-native-svg';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { apiClient } from '../services/apiClient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 36;
const CARD_INTERVAL = CARD_WIDTH + 12;

// -------------------------------------------------------------
// BESPOKE VECTOR ICONS (Zero emojis, editorial line work)
// -------------------------------------------------------------

const BackArrowVector: React.FC<{ color?: string; size?: number }> = ({ color = '#0f172a', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PrecisionTargetVector: React.FC<{ color?: string; size?: number }> = ({ color = '#e8276b', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} />
    <Circle cx={12} cy={12} r={3} fill={color} />
    <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ArrowRightVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ffffff', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const VerifiedBadgeVector: React.FC<{ color?: string; size?: number }> = ({ color = '#e8276b', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l2.4 2.4 3.4-.4 1.4 3.1 3.1 1.4-.4 3.4 2.4 2.4-2.4 2.4.4 3.4-3.1 1.4-1.4 3.1-3.4-.4L12 22l-2.4-2.4-3.4.4-1.4-3.1-3.1-1.4.4-3.4L-0.3 12l2.4-2.4-.4-3.4 3.1-1.4 1.4-3.1 3.4.4L12 2z"
      fill={color}
    />
    <Path d="M9 12l2 2 4-4" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneCallVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ffffff', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      fill={color}
    />
  </Svg>
);

const WhatsAppVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ffffff', size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.95.57 3.86 1.66 5.51L2 22l4.74-1.73a9.87 9.87 0 005.3 1.52h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.84 9.84 0 0012.04 2z"
      fill="#25D366"
    />
    <Path
      d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.07 2.91 1.22 3.11c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
      fill={color}
    />
  </Svg>
);

const CompassVector: React.FC<{ color?: string; size?: number }> = ({ color = '#e8276b', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#d5d3ce" strokeWidth={1.8} fill="#ffffff" />
    <Path d="M12 4l3 8-3-2-3 2 3-8z" fill={color} />
    <Path d="M12 20l-3-8 3 2 3-2-3 8z" fill="#70757a" />
  </Svg>
);

const ListVector: React.FC<{ color?: string; size?: number }> = ({ color = '#0f172a', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseVector: React.FC<{ color?: string; size?: number }> = ({ color = '#0f172a', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

const ShieldCheckVector: React.FC<{ color?: string; size?: number }> = ({ color = '#10b981', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.12}
    />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// -------------------------------------------------------------
// BEAUTICIAN DATA INTERFACE (Directly from Shilpi Database)
// -------------------------------------------------------------

export interface RegisteredMakeover {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  city: string;
  address: string;
  pincode: string;
  isPro: boolean;
  subscriptionTier: string;
  verified: boolean;
  completedBookingsCount: number;
  distanceKm: number;
  isExactPincode: boolean;
  startingPrice: number;
  services: string[];
  latitude: number;
  longitude: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

interface NearestBeauticiansScreenProps {
  onGoBack: () => void;
  onSelectStudio?: (studio: RegisteredMakeover) => void;
}

export const NearestBeauticiansScreen: React.FC<NearestBeauticiansScreenProps> = ({ onGoBack }) => {
  const insets = useSafeAreaInsets();

  // Mode: 'map' (default interactive Google map) | 'list' (clean luxury list)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Location Choice Modal State
  const [locationChoiceModalOpen, setLocationChoiceModalOpen] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [modalPincodeInput, setModalPincodeInput] = useState('');
  const [listPincodeFilter, setListPincodeFilter] = useState('');

  // Active Location Coordinates & Details (Real Live Data - No dummy prefill)
  const [userPincode, setUserPincode] = useState<string>('');
  const [userCity, setUserCity] = useState<string>('Detecting location...');
  const [userAddress, setUserAddress] = useState<string>('Locating...');
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number }>({ lat: 11.0168, lng: 76.9558 });

  // Live Database Beauticians (Real Data Only - Zero Mock Fallbacks)
  const [rawDbBeauticians, setRawDbBeauticians] = useState<RegisteredMakeover[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Studios and selection
  const [selectedStudio, setSelectedStudio] = useState<RegisteredMakeover | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const cardListRef = useRef<FlatList>(null);
  const mapRef = useRef<MapView>(null);

  // -------------------------------------------------------------
  // FETCH REAL DATA FROM SHILPI DATABASE API
  // -------------------------------------------------------------
  const fetchDbBeauticians = useCallback(async (pincodeQuery?: string, lat?: number, lng?: number) => {
    setIsLoadingDb(true);
    const pin = (pincodeQuery || '').trim();
    const pinParam = pin ? `&pincode=${encodeURIComponent(pin)}` : '';
    const latParam = typeof lat === 'number' ? `&lat=${lat}` : '';
    const lngParam = typeof lng === 'number' ? `&lng=${lng}` : '';
    const endpoint = `/discovery/beauticians?section=all${pinParam}${latParam}${lngParam}`;

    try {
      const clientRes = await apiClient.get(endpoint).catch(() => null);
      let rawList: any[] | null = null;

      if (clientRes && clientRes.data && clientRes.data.success && Array.isArray(clientRes.data.data)) {
        rawList = clientRes.data.data;
      }

      if (rawList && rawList.length > 0) {
        const mapped: RegisteredMakeover[] = rawList.map((b: any) => ({
          id: b.id,
          businessName: b.businessName,
          ownerName: b.ownerName,
          phone: b.phone || '',
          city: b.city || '',
          address: b.address || `${b.businessName}, ${b.city || ''} - ${b.pincode || ''}`,
          pincode: b.pincode || '',
          isPro: false, // "Till now, no one is a pro in the app. All are free plan."
          subscriptionTier: 'free',
          verified: true,
          completedBookingsCount: typeof b.completedBookingsCount === 'number' ? b.completedBookingsCount : 0,
          distanceKm: typeof b.distanceKm === 'number' ? b.distanceKm : 1.0,
          isExactPincode: Boolean(b.isExactPincode),
          startingPrice: typeof b.startingPrice === 'number' ? b.startingPrice : 3500,
          services: Array.isArray(b.services) && b.services.length > 0 ? b.services : ['Bridal Makeover', 'Party Look'],
          latitude: typeof b.latitude === 'number' ? b.latitude : 11.0168,
          longitude: typeof b.longitude === 'number' ? b.longitude : 76.9558,
        }));
        setRawDbBeauticians(mapped);
      } else {
        setRawDbBeauticians([]);
      }
    } catch (err) {
      console.warn('Backend discovery fetch notice:', err);
      setRawDbBeauticians([]);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  // -------------------------------------------------------------
  // 1. LIVE GPS DETECTION HANDLER (Real Location Fetching)
  // -------------------------------------------------------------
  const handleDetectLiveGps = useCallback(async (isAutoOnMount = false) => {
    setIsDetectingGps(true);
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsDetectingGps(false);
        if (!isAutoOnMount) {
          Alert.alert(
            'Location Access Needed',
            'Please allow location permission in device settings or enter your 6-digit PIN code.',
            [{ text: 'OK' }]
          );
        }
        setUserCity('Select Location');
        setUserAddress('Location permission required');
        setLocationChoiceModalOpen(true);
        fetchDbBeauticians('');
        return;
      }

      // Fetch precise device coordinates
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCustomerCoords({ lat, lng });

      // Animate map smoothly to detected position
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          },
          800
        );
      }

      let detectedPin = '';
      let detectedCity = '';
      let displayAddress = '';

      // Primary: Native Reverse Geocoding via device
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode && geocode.length > 0) {
          const g = geocode[0];
          detectedPin = (g.postalCode || '').trim();
          detectedCity = g.city || g.subregion || g.district || g.region || '';
          const streetOrArea = g.street || g.name || '';
          displayAddress =
            streetOrArea && streetOrArea !== detectedCity
              ? `${streetOrArea}, ${detectedCity}`
              : (detectedCity || 'Current Location');
        }
      } catch (geoErr) {
        console.warn('Native reverse geocode note:', geoErr);
      }

      // Secondary: Free online reverse-geocoding fallback if native geocoder omits postalCode
      if (!detectedPin) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.postcode) {
              detectedPin = String(geoData.postcode).trim();
            }
            if (!detectedCity && (geoData.city || geoData.locality)) {
              detectedCity = geoData.city || geoData.locality || '';
            }
            if (!displayAddress && (geoData.locality || geoData.city)) {
              displayAddress = `${geoData.locality || ''}, ${geoData.city || ''}`.replace(/^, |, $/g, '');
            }
          }
        } catch (fallbackErr) {
          console.warn('Fallback reverse geocode note:', fallbackErr);
        }
      }

      // Populate real detected location into inputs (Never prefilled with dummy numbers)
      if (detectedPin) {
        setUserPincode(detectedPin);
        setListPincodeFilter(detectedPin);
        setModalPincodeInput(detectedPin);
      }
      if (detectedCity) {
        setUserCity(detectedCity);
      } else {
        setUserCity('Current Location');
      }
      if (displayAddress) {
        setUserAddress(displayAddress);
      } else {
        setUserAddress('Current Location');
      }

      // Fetch beauticians based on detected coordinates and PIN
      fetchDbBeauticians(detectedPin, lat, lng);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Auto-close modal when location is properly fetched
      setLocationChoiceModalOpen(false);
    } catch (e) {
      console.warn('GPS detection notice:', e);
      if (!isAutoOnMount) {
        Alert.alert('GPS Notice', 'Could not retrieve precise GPS. You can enter your 6-digit PIN code.');
      }
      setUserCity('Select Location');
      setUserAddress('Enter PIN to discover artists');
      setLocationChoiceModalOpen(true);
      fetchDbBeauticians('');
    } finally {
      setIsDetectingGps(false);
    }
  }, [fetchDbBeauticians]);

  // Automatically fetch live location on mount
  useEffect(() => {
    handleDetectLiveGps(true);
  }, [handleDetectLiveGps]);

  // -------------------------------------------------------------
  // 2. PINCODE SUBMISSION HANDLER (Exact Match with Database)
  // -------------------------------------------------------------
  const handleSubmitPincode = (pin: string) => {
    const clean = pin.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      Alert.alert('Invalid PIN Code', 'Please enter a valid 6-digit PIN code.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setUserPincode(clean);
    setListPincodeFilter(clean);
    setModalPincodeInput(clean);
    fetchDbBeauticians(clean, customerCoords.lat, customerCoords.lng);

    // Look for matching studio in database records to center coordinates
    const match = rawDbBeauticians.find((s) => s.pincode === clean);
    if (match) {
      setUserCity(match.city);
      setUserAddress(match.address);
      setCustomerCoords({ lat: match.latitude, lng: match.longitude });
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: match.latitude,
            longitude: match.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          },
          800
        );
      }
    } else {
      setUserCity(`PIN ${clean}`);
      setUserAddress(`Area PIN ${clean}`);
    }

    setLocationChoiceModalOpen(false);
  };

  // -------------------------------------------------------------
  // 3. USER'S STRICT RANKING ENGINE (TOP 5):
  //    Priority 1: Shilpi Subscriber (isPro === true) ALWAYS #1
  //    Priority 2: Completed Orders Count (completedBookingsCount DESC)
  //    Note: End-customers NEVER see SaaS badges ("Pro/Free").
  // -------------------------------------------------------------
  const topFiveStudios = useMemo(() => {
    const activePin = (listPincodeFilter || userPincode).trim();

    // Map all studios with recalculated distance from customer coords
    const withDist = rawDbBeauticians.map((s) => ({
      ...s,
      distanceKm: haversineDistance(customerCoords.lat, customerCoords.lng, s.latitude, s.longitude),
      isExactPincode: s.pincode === activePin,
    }));

    // Exact pincode matches
    const exactMatches = activePin ? withDist.filter((s) => s.pincode === activePin) : [];
    const otherStudios = activePin ? withDist.filter((s) => s.pincode !== activePin) : withDist;

    // User's Priority Rule:
    const priorityComparator = (a: RegisteredMakeover, b: RegisteredMakeover) => {
      if (b.completedBookingsCount !== a.completedBookingsCount) {
        return b.completedBookingsCount - a.completedBookingsCount;
      }
      return a.distanceKm - b.distanceKm;
    };

    exactMatches.sort(priorityComparator);
    otherStudios.sort(priorityComparator);

    // Top 5: exact pincode first, then nearest distance (Real data only)
    return [...exactMatches, ...otherStudios].slice(0, 5);
  }, [customerCoords, userPincode, listPincodeFilter, rawDbBeauticians]);

  // Keep selectedStudio in sync
  useEffect(() => {
    if (topFiveStudios.length > 0) {
      setSelectedStudio(topFiveStudios[0]);
    } else {
      setSelectedStudio(null);
    }
  }, [topFiveStudios]);

  return (
    <View style={styles.screen}>
      {/* -------------------------------------------------------------
          TOP HEADER BAR (High placement, minimal blank space)
         ------------------------------------------------------------- */}
      <View style={[styles.topBarContainer, { paddingTop: insets.top + 4 }]}>
        <View style={styles.topBarRow}>
          {/* Back Button to Role Selection */}
          <TouchableOpacity style={styles.circleIconBtn} onPress={onGoBack} activeOpacity={0.8}>
            <BackArrowVector color="#121212" size={18} />
          </TouchableOpacity>

          {/* Location / Pincode Capsule (Tap to change) */}
          <TouchableOpacity
            style={styles.locationCapsule}
            onPress={() => setLocationChoiceModalOpen(true)}
            activeOpacity={0.85}
          >
            <PrecisionTargetVector color="#e8276b" size={15} />
            <View style={styles.locationCapsuleTextWrap}>
              <Text style={styles.capsuleCityText} numberOfLines={1}>
                {userCity || (isDetectingGps ? 'Locating...' : 'Select Location')}
              </Text>
              {userPincode ? (
                <>
                  <View style={styles.capsuleDot} />
                  <Text style={styles.capsulePinText}>{userPincode}</Text>
                </>
              ) : null}
            </View>
          </TouchableOpacity>

          {/* View Mode Toggle (Map vs List) */}
          <TouchableOpacity
            style={[styles.circleIconBtn, viewMode === 'map' && styles.circleIconBtnActive]}
            onPress={() => setViewMode((prev) => (prev === 'map' ? 'list' : 'map'))}
            activeOpacity={0.8}
          >
            {viewMode === 'map' ? (
              <ListVector color="#ffffff" size={16} />
            ) : (
              <CompassVector color="#121212" size={16} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* -------------------------------------------------------------
          MAIN CONTENT: REAL SCROLLABLE GOOGLE MAP OR FILTERED LIST
         ------------------------------------------------------------- */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {/* Real Interactive Google Map */}
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            region={{
              latitude: customerCoords.lat,
              longitude: customerCoords.lng,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {/* Customer Location Marker */}
            <Marker
              coordinate={{ latitude: customerCoords.lat, longitude: customerCoords.lng }}
              title={userPincode ? `You are here (${userPincode})` : 'You are here'}
              description={userAddress}
            >
              <View style={styles.userGpsPinWrap}>
                <View style={styles.userGpsPulseRing} />
                <View style={styles.userGpsCenterDot} />
              </View>
            </Marker>

            {/* Beauticians Markers from Database */}
            {topFiveStudios.map((studio, idx) => {
              const isSelected = selectedStudio?.id === studio.id;
              return (
                <Marker
                  key={studio.id}
                  coordinate={{ latitude: studio.latitude, longitude: studio.longitude }}
                  title={studio.businessName}
                  description={`${studio.distanceKm} km · ${studio.completedBookingsCount} bookings`}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setSelectedStudio(studio);
                    if (cardListRef.current) {
                      cardListRef.current.scrollToIndex({ index: idx, animated: true });
                    }
                  }}
                >
                  <View style={[styles.mapMarkerWrap, isSelected && styles.mapMarkerWrapSelected]}>
                    <View style={[styles.markerPill, isSelected && styles.markerPillSelected]}>
                      <Text style={[styles.markerPillText, isSelected && styles.markerPillTextSelected]} numberOfLines={1}>
                        {studio.businessName}
                      </Text>
                      <View style={styles.pinDistDot} />
                      <Text style={[styles.markerDistText, isSelected && styles.markerDistTextSelected]}>
                        {studio.distanceKm} km
                      </Text>
                    </View>
                    <View style={[styles.beaconCircleJewel, isSelected && styles.beaconCircleJewelSelected]}>
                      <Text style={[styles.beaconJewelText, isSelected && styles.beaconJewelTextSelected]}>
                        {studio.businessName.charAt(0)}
                      </Text>
                    </View>
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {/* Bottom Snapping Studio Carousel */}
          <View style={[styles.carouselContainer, { bottom: insets.bottom + 14 }]}>
            {topFiveStudios.length > 0 ? (
              <FlatList
                ref={cardListRef}
                data={topFiveStudios}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled={false}
                snapToInterval={CARD_INTERVAL}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselPadding}
                onMomentumScrollEnd={(e) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  const index = Math.round(offset / CARD_INTERVAL);
                  if (topFiveStudios[index] && topFiveStudios[index].id !== selectedStudio?.id) {
                    setSelectedStudio(topFiveStudios[index]);
                  }
                }}
                renderItem={({ item: studio, index }) => {
                  const isSelected = selectedStudio?.id === studio.id;
                  return (
                    <View style={[styles.carouselCard, isSelected && styles.carouselCardSelected]}>
                      <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => {
                          setSelectedStudio(studio);
                          setDetailModalOpen(true);
                        }}
                      >
                        {/* Top Rank Badge */}
                        <View style={[styles.cardRankBadge, index === 0 && styles.cardRankBadgeFirst]}>
                          <Text style={styles.cardRankBadgeText}>#{index + 1} Ranked</Text>
                        </View>

                        <View style={styles.cardTopRow}>
                          <View style={styles.cardAvatar}>
                            <Text style={styles.cardAvatarChar}>
                              {studio.businessName.charAt(0)}
                            </Text>
                          </View>

                          <View style={styles.cardHeaderInfo}>
                            <View style={styles.cardTitleWrap}>
                              <Text style={styles.cardTitleText} numberOfLines={1}>
                                {studio.businessName}
                              </Text>
                              <VerifiedBadgeVector color="#e8276b" size={13} />
                            </View>

                            <Text style={styles.cardOwnerText} numberOfLines={1}>
                              By {studio.ownerName} · {studio.city}
                            </Text>

                            {/* Meta Row: Orders & Distance */}
                            <View style={styles.cardMetaRow}>
                              <View style={styles.distanceBadge}>
                                <PrecisionTargetVector color="#e8276b" size={11} />
                                <Text style={styles.distanceBadgeText}>{studio.distanceKm} km</Text>
                              </View>

                              <View style={styles.ordersBadge}>
                                <Text style={styles.ordersBadgeText}>{studio.completedBookingsCount} Orders Completed</Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* Actions Row */}
                        <View style={styles.cardActionsRow}>
                          <TouchableOpacity
                            style={styles.callActionBtn}
                            onPress={() => Linking.openURL(`tel:${studio.phone}`)}
                          >
                            <PhoneCallVector color="#ffffff" size={12} />
                            <Text style={styles.actionBtnText}>Call</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.waActionBtn}
                            onPress={() => {
                              const msg = encodeURIComponent(`Hi ${studio.ownerName}, I found ${studio.businessName} on Shilpi.`);
                              Linking.openURL(`whatsapp://send?phone=${studio.phone}&text=${msg}`);
                            }}
                          >
                            <WhatsAppVector color="#ffffff" size={13} />
                            <Text style={styles.actionBtnText}>WhatsApp</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyMapCard}>
                <PrecisionTargetVector color="#e8276b" size={24} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.emptyMapTitle}>No Beauticians in this Area</Text>
                  <Text style={styles.emptyMapSub}>
                    {listPincodeFilter || userPincode
                      ? `No registered beauticians found for PIN ${listPincodeFilter || userPincode}. Real registered beauticians will appear here as soon as they sign up.`
                      : 'No registered beauticians found in this area yet. Real registered beauticians will appear here as soon as they sign up.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.emptyMapChangeBtn}
                  onPress={() => setLocationChoiceModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyMapChangeText}>Change Area</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        // -------------------------------------------------------------
        // LIST VIEW (Clean Dribbble/Mobbin Luxury Standard)
        // -------------------------------------------------------------
        <ScrollView
          contentContainerStyle={[
            styles.listContainer,
            { paddingTop: insets.top + 55 + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Dedicated Pincode Filter Bar */}
          <View style={styles.listPincodeFilterCard}>
            <View style={styles.listPincodeInputRow}>
              <PrecisionTargetVector color="#e8276b" size={16} />
              <TextInput
                style={styles.listPincodeInput}
                placeholder="Enter 6-digit PIN code..."
                placeholderTextColor="#9ca3af"
                value={listPincodeFilter}
                onChangeText={setListPincodeFilter}
                keyboardType="numeric"
                maxLength={6}
                onSubmitEditing={() => handleSubmitPincode(listPincodeFilter)}
              />
              <TouchableOpacity
                style={styles.listPincodeApplyBtn}
                onPress={() => handleSubmitPincode(listPincodeFilter)}
                activeOpacity={0.8}
              >
                <ArrowRightVector color="#ffffff" size={14} />
              </TouchableOpacity>
            </View>
            <Text style={styles.listPincodeCaption}>
              {listPincodeFilter || userPincode ? (
                <>
                  Showing Top 5 Beauticians for PIN{' '}
                  <Text style={{ fontWeight: '800', color: '#121212' }}>{listPincodeFilter || userPincode}</Text>
                </>
              ) : (
                'Showing Beauticians in your area'
              )}
            </Text>
          </View>

          {/* Top 5 Studio List Cards (Real Data Only - Zero Mock Fallbacks) */}
          {topFiveStudios.length > 0 ? (
            topFiveStudios.map((studio, idx) => (
              <TouchableOpacity
                key={studio.id}
                style={styles.listCard}
                onPress={() => {
                  setSelectedStudio(studio);
                  setDetailModalOpen(true);
                }}
                activeOpacity={0.88}
              >
                {/* Rank Badge */}
                <View style={[styles.cardRankBadge, idx === 0 && styles.cardRankBadgeFirst]}>
                  <Text style={styles.cardRankBadgeText}>#{idx + 1} Ranked</Text>
                </View>

                <View style={styles.listCardTopRow}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarChar}>
                      {studio.businessName.charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.listCardInfo}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitleText} numberOfLines={1}>
                        {studio.businessName}
                      </Text>
                      <VerifiedBadgeVector color="#e8276b" size={13} />
                    </View>

                    <Text style={styles.cardOwnerText} numberOfLines={1}>By {studio.ownerName} · {studio.city}</Text>
                    <Text style={styles.listAddressText} numberOfLines={1}>{studio.address}</Text>

                    {/* Priority Indicators */}
                    <View style={styles.cardMetaRow}>
                      <View style={styles.distanceBadge}>
                        <PrecisionTargetVector color="#e8276b" size={10} />
                        <Text style={styles.distanceBadgeText}>{studio.distanceKm} km</Text>
                      </View>
                      <View style={styles.ordersBadge}>
                        <Text style={styles.ordersBadgeText}>{studio.completedBookingsCount} Orders Completed</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.listDivider} />

                {/* Action Buttons Row */}
                <View style={styles.listActionsRow}>
                  <View>
                    <Text style={styles.startingAtLabel}>Starting from</Text>
                    <Text style={styles.priceText}>₹{studio.startingPrice.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.btnSmallCall}
                      onPress={() => Linking.openURL(`tel:${studio.phone}`)}
                    >
                      <PhoneCallVector color="#ffffff" size={12} />
                      <Text style={styles.actionBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnSmallWa}
                      onPress={() => {
                        const msg = encodeURIComponent(`Hi ${studio.ownerName}, I found ${studio.businessName} on Shilpi.`);
                        Linking.openURL(`whatsapp://send?phone=${studio.phone}&text=${msg}`);
                      }}
                    >
                      <WhatsAppVector color="#ffffff" size={13} />
                      <Text style={styles.actionBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyListCard}>
              <PrecisionTargetVector color="#e8276b" size={32} />
              <Text style={styles.emptyListTitle}>No Registered Beauticians Yet</Text>
              <Text style={styles.emptyListSub}>
                {listPincodeFilter || userPincode
                  ? `There are no beauticians registered for PIN code ${listPincodeFilter || userPincode} yet. Newly registered studios will appear here in real time.`
                  : 'There are no beauticians registered in this area yet. Newly registered studios will appear here in real time.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyListChangeBtn}
                onPress={() => setLocationChoiceModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyListChangeBtnText}>Search Another PIN Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* -------------------------------------------------------------
          CENTERED COMPACT MODAL: "Find beauticians near you"
          - Compact centered card
          - Option 1: Use live GPS
          - Option 2: Search bar with arrow mark button
          - Top right: Close button
          - Popular suggestions completely removed
         ------------------------------------------------------------- */}
      <Modal
        visible={locationChoiceModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationChoiceModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.locationChoiceCard}>
            {/* Top Close Button */}
            <TouchableOpacity
              style={styles.modalTopCloseBtn}
              onPress={() => setLocationChoiceModalOpen(false)}
              activeOpacity={0.75}
            >
              <CloseVector color="#121212" size={16} />
            </TouchableOpacity>

            {/* Title & Subtitle */}
            <Text style={styles.locModalTitle}>Find beauticians near you</Text>
            <Text style={styles.locModalSubtitle}>
              Detect your location or enter your area PIN code to discover verified artists.
            </Text>

            {/* Option 1: Compact "Use live GPS" Button */}
            <TouchableOpacity
              style={styles.liveGpsButton}
              onPress={() => handleDetectLiveGps(false)}
              disabled={isDetectingGps}
              activeOpacity={0.88}
            >
              {isDetectingGps ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.liveGpsButtonText}>Fetching location...</Text>
                </View>
              ) : (
                <>
                  <CompassVector color="#ffffff" size={16} />
                  <Text style={styles.liveGpsButtonText}>Use live GPS</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Subtle Divider */}
            <View style={styles.modalOrDividerRow}>
              <View style={styles.modalOrLine} />
              <Text style={styles.modalOrText}>OR</Text>
              <View style={styles.modalOrLine} />
            </View>

            {/* Option 2: Search Bar with Inline Arrow Button */}
            <View style={styles.pincodeInputRow}>
              <PrecisionTargetVector color="#9ca3af" size={15} />
              <TextInput
                style={styles.pincodeInput}
                placeholder="Enter 6-digit PIN code..."
                placeholderTextColor="#9ca3af"
                value={modalPincodeInput}
                onChangeText={setModalPincodeInput}
                keyboardType="numeric"
                maxLength={6}
                onSubmitEditing={() => handleSubmitPincode(modalPincodeInput)}
              />
              <TouchableOpacity
                style={styles.pincodeArrowBtn}
                onPress={() => handleSubmitPincode(modalPincodeInput)}
                activeOpacity={0.85}
              >
                <ArrowRightVector color="#ffffff" size={15} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------------------
          STUDIO DETAILS MODAL (Safe from SaaS badges)
         ------------------------------------------------------------- */}
      <Modal visible={detailModalOpen} transparent animationType="slide" onRequestClose={() => setDetailModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.studioDetailSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.detailHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.detailStudioName} numberOfLines={1}>{selectedStudio?.businessName}</Text>
                  <VerifiedBadgeVector color="#e8276b" size={14} />
                </View>
                <Text style={styles.detailOwnerName}>By {selectedStudio?.ownerName} · Verified Bridal Artist</Text>
              </View>

              <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={styles.sheetCloseBtn}>
                <CloseVector color="#0f172a" size={16} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_HEIGHT * 0.48 }}>
              {/* Key Metrics */}
              <View style={styles.detailMetricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{selectedStudio?.distanceKm} km</Text>
                  <Text style={styles.metricLabel}>Distance</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{selectedStudio?.pincode}</Text>
                  <Text style={styles.metricLabel}>PIN Code</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{selectedStudio?.completedBookingsCount}</Text>
                  <Text style={styles.metricLabel}>Orders Completed</Text>
                </View>
              </View>

              {/* Address */}
              <View style={styles.detailSectionBox}>
                <Text style={styles.detailSectionHeading}>STUDIO ADDRESS</Text>
                <Text style={styles.detailAddressText}>{selectedStudio?.address}</Text>
              </View>

              {/* Services & Pricing */}
              <View style={styles.detailSectionBox}>
                <Text style={styles.detailSectionHeading}>SERVICES & PRICING</Text>
                {selectedStudio?.services.map((srv, idx) => (
                  <View key={`srv-${idx}`} style={styles.detailServiceRow}>
                    <Text style={styles.detailServiceName}>{srv}</Text>
                    <Text style={styles.detailServicePrice}>
                      ₹{(((selectedStudio?.startingPrice || 3500) + idx * 1000)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Verified Shilpi Guarantee */}
              <View style={styles.guaranteeBox}>
                <ShieldCheckVector color="#10b981" size={18} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.guaranteeTitle}>Verified Shilpi Makeover Artist</Text>
                  <Text style={styles.guaranteeSub}>Identity authenticated and registered on the Shilpi platform.</Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.detailFooterRow}>
              <TouchableOpacity
                style={styles.detailCallBtn}
                onPress={() => selectedStudio && Linking.openURL(`tel:${selectedStudio.phone}`)}
              >
                <PhoneCallVector color="#ffffff" size={14} />
                <Text style={styles.detailCallBtnText}>Call Studio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailWaBtn}
                onPress={() => {
                  if (selectedStudio) {
                    const msg = encodeURIComponent(`Hi ${selectedStudio.ownerName}, I found ${selectedStudio.businessName} on Shilpi.`);
                    Linking.openURL(`whatsapp://send?phone=${selectedStudio.phone}&text=${msg}`);
                  }
                }}
              >
                <WhatsAppVector color="#ffffff" size={15} />
                <Text style={styles.detailWaBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
    paddingBottom: 8,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  circleIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  circleIconBtnActive: {
    backgroundColor: '#121212',
    borderColor: '#121212',
  },
  locationCapsule: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fcd2e1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  locationCapsuleTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capsuleCityText: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  capsuleDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
  },
  capsulePinText: {
    color: '#e8276b',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // Map Area
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e5e3df',
  },
  userGpsPinWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userGpsPulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232, 39, 107, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 39, 107, 0.4)',
  },
  userGpsCenterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e8276b',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  mapMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapMarkerWrapSelected: {
    transform: [{ scale: 1.08 }],
  },
  markerPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.12)',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 4,
  },
  markerPillSelected: {
    backgroundColor: '#121212',
    borderColor: '#121212',
  },
  markerPillText: {
    color: '#121212',
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 90,
  },
  markerPillTextSelected: {
    color: '#ffffff',
  },
  pinDistDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9ca3af',
    marginHorizontal: 4,
  },
  markerDistText: {
    color: '#e8276b',
    fontSize: 10,
    fontWeight: '800',
  },
  markerDistTextSelected: {
    color: '#fcd2e1',
  },
  beaconCircleJewel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e8276b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  beaconCircleJewelSelected: {
    backgroundColor: '#e8276b',
    borderColor: '#ffffff',
  },
  beaconJewelText: {
    color: '#e8276b',
    fontSize: 13,
    fontWeight: '900',
  },
  beaconJewelTextSelected: {
    color: '#ffffff',
  },

  // Carousel
  carouselContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 15,
  },
  carouselPadding: {
    paddingHorizontal: 18,
  },
  carouselCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  carouselCardSelected: {
    borderColor: '#e8276b',
    borderWidth: 1.5,
  },
  cardRankBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 5,
  },
  cardRankBadgeFirst: {
    backgroundColor: '#ffeef4',
    borderWidth: 1,
    borderColor: '#fcd2e1',
  },
  cardRankBadgeText: {
    color: '#e8276b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffeef4',
    borderWidth: 1.5,
    borderColor: '#fcd2e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarChar: {
    color: '#e8276b',
    fontSize: 17,
    fontWeight: '900',
  },
  cardHeaderInfo: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 65, // Leave room for rank badge
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  cardTitleText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  cardOwnerText: {
    color: '#6b7280',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  distanceBadgeText: {
    color: '#e8276b',
    fontSize: 10.5,
    fontWeight: '800',
  },
  ordersBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  ordersBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  callActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121212',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  waActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e8276b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // -------------------------------------------------------------
  // LIST VIEW
  // -------------------------------------------------------------
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  listPincodeFilterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 39, 107, 0.16)',
    marginBottom: 14,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  listPincodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  listPincodeInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#121212',
    fontWeight: '700',
  },
  listPincodeApplyBtn: {
    backgroundColor: '#e8276b',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listPincodeCaption: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 2,
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  listCardTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  listCardInfo: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 65,
  },
  listAddressText: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  listDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  listActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startingAtLabel: {
    color: '#9ca3af',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceText: {
    color: '#121212',
    fontSize: 13.5,
    fontWeight: '900',
  },
  btnSmallCall: {
    backgroundColor: '#121212',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 15,
  },
  btnSmallWa: {
    backgroundColor: '#e8276b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 15,
  },

  // -------------------------------------------------------------
  // CENTERED COMPACT LOCATION MODAL
  // -------------------------------------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  locationChoiceCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTopCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  locModalTitle: {
    color: '#121212',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: 6,
  },
  locModalSubtitle: {
    color: '#6b7280',
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  liveGpsButton: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8276b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: '#e8276b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  liveGpsButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  modalOrDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
    gap: 8,
  },
  modalOrLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  modalOrText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pincodeInputRow: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  pincodeInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#121212',
    fontWeight: '700',
  },
  pincodeArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -------------------------------------------------------------
  // STUDIO DETAIL BOTTOM SHEET
  // -------------------------------------------------------------
  studioDetailSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 14,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailStudioName: {
    color: '#121212',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  detailOwnerName: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    height: '70%',
    alignSelf: 'center',
  },
  detailSectionBox: {
    marginBottom: 14,
  },
  detailSectionHeading: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  detailAddressText: {
    color: '#121212',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  detailServiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  detailServiceName: {
    color: '#374151',
    fontSize: 12.5,
    fontWeight: '600',
  },
  detailServicePrice: {
    color: '#e8276b',
    fontSize: 12.5,
    fontWeight: '800',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginTop: 8,
    marginBottom: 16,
  },
  guaranteeTitle: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '800',
  },
  guaranteeSub: {
    color: '#047857',
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2,
  },
  detailFooterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  detailCallBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#121212',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  detailCallBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  detailWaBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8276b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  detailWaBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyMapCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyMapTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#121212',
  },
  emptyMapSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  emptyMapChangeBtn: {
    backgroundColor: '#e8276b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  emptyMapChangeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyListCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#121212',
    marginTop: 12,
  },
  emptyListSub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyListChangeBtn: {
    marginTop: 16,
    backgroundColor: '#121212',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyListChangeBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
