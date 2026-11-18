import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Alert,
  FlatList,
  Easing,
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
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { apiClient } from '../services/apiClient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 36;
const CARD_INTERVAL = CARD_WIDTH + 12;

// -------------------------------------------------------------
// 1. BESPOKE SVG VECTOR ICONS (Zero Emojis, Google Maps High Craft)
// -------------------------------------------------------------

const BackArrowVector: React.FC<{ color?: string; size?: number }> = ({ color = '#0f172a', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LocationPinVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ea4335', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={2} />
  </Svg>
);

// Diamond Vector Icon for Pro Beauticians (Replaces King / Crown Emoji)
const DiamondVector: React.FC<{ color?: string; size?: number }> = ({ color = '#f59e0b', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 9l10 13 10-13-10-13z"
      fill={color}
    />
    <Path
      d="M2 9h20M12 2l-4 7 4 13 4-13-4-7zM7 2l5 7M17 2l-5 7"
      stroke="#ffffff"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const VerifiedBadgeVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ff2d75', size = 14 }) => (
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
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WhatsAppVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ffffff', size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MapNavigationVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ea4335', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 11l19-9-9 19-2-8-8-2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CrosshairTargetVector: React.FC<{ color?: string; size?: number }> = ({ color = '#1a73e8', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} />
    <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx={12} cy={12} r={3} fill={color} />
  </Svg>
);

const CompassVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ea4335', size = 18 }) => (
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

const SearchVector: React.FC<{ color?: string; size?: number }> = ({ color = '#5f6368', size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
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
    />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// -------------------------------------------------------------
// 2. AUTHENTIC GOOGLE MAPS TEARDROP PIN COMPONENT
// -------------------------------------------------------------

const GoogleMapsPinIcon: React.FC<{
  color?: string;
  size?: number;
  isSelected?: boolean;
  isPro?: boolean;
  char?: string;
}> = ({ color = '#ff2d75', size = 36, isSelected = false, isPro = false, char = 'S' }) => {
  const pinFill = isPro ? '#f59e0b' : color;
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 36 45" fill="none">
      <Circle cx={18} cy={42} r={isSelected ? 5.5 : 4} fill="rgba(0, 0, 0, 0.25)" />
      <Path
        d="M18 2C9.716 2 3 8.716 3 17c0 11.25 15 25 15 25s15-13.75 15-25c0-8.284-6.716-15-15-15z"
        fill={pinFill}
        stroke="#ffffff"
        strokeWidth={isSelected ? 2.5 : 1.8}
      />
      <Circle cx={18} cy={17} r={8} fill="#ffffff" />
      {isPro ? (
        <Path
          d="M18 11.5l-4 3 4 5 4-5-4-3z"
          fill="#f59e0b"
        />
      ) : (
        <SvgText
          x={18}
          y={21}
          textAnchor="middle"
          fill={pinFill}
          fontSize={10.5}
          fontWeight="900"
        >
          {char}
        </SvgText>
      )}
    </Svg>
  );
};

// -------------------------------------------------------------
// 3. REAL REGISTERED BEAUTICIANS & LOCATION DIRECTORY
// -------------------------------------------------------------

export interface RegisteredMakeover {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  city: string;
  address: string;
  pincode: string;
  profilePhotoUrl: string | null;
  businessTypes: string[];
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
  mapX: number;
  mapY: number;
}

const REAL_REGISTERED_STUDIOS: RegisteredMakeover[] = [
  {
    id: '2c704aa6-5642-4b9e-8b8a-3be33a4e53f2',
    businessName: 'Shilpi Makeovers',
    ownerName: 'Shilpa R.',
    phone: '+919876543210',
    city: 'Coimbatore',
    address: 'Cross Cut Road, Gandhipuram, Coimbatore - 641002',
    pincode: '641002',
    profilePhotoUrl: null,
    businessTypes: ['Makeup Artist', 'Bridal Artist'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 14,
    distanceKm: 0.8,
    isExactPincode: true,
    startingPrice: 6500,
    services: ['HD Bridal Makeup', 'Muhurtham Saree Draping', 'Airbrush Makeup'],
    latitude: 11.0168,
    longitude: 76.9558,
    mapX: 0.64,
    mapY: 0.36,
  },
  {
    id: '2b919ddb-a83d-4cdd-b779-fb03b846b77c',
    businessName: 'Pooja Luxury Studio & Academy',
    ownerName: 'Pooja Sundaram MUA',
    phone: '+919999900011',
    city: 'Coimbatore',
    address: 'Opp. Lakshmi Mills, Avinashi Road, Coimbatore - 641018',
    pincode: '641018',
    profilePhotoUrl: null,
    businessTypes: ['Bridal Makeup', 'Hairstyling'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 9,
    distanceKm: 2.1,
    isExactPincode: false,
    startingPrice: 5500,
    services: ['Bridal Makeover', 'Flower Hairstyling', 'Saree Pleating'],
    latitude: 11.0016,
    longitude: 76.9620,
    mapX: 0.82,
    mapY: 0.46,
  },
  {
    id: 'add09d3c-707a-4a01-9787-0932a837b0e2',
    businessName: 'Jo Makeovers',
    ownerName: 'Sankarajothi K',
    phone: '+919360396190',
    city: 'Kalugumalai',
    address: 'Main Bazaar Road, Near Murugan Temple, Kalugumalai - 628552',
    pincode: '628552',
    profilePhotoUrl: null,
    businessTypes: ['Makeup Artist', 'Bridal Styling'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 8,
    distanceKm: 0.6,
    isExactPincode: true,
    startingPrice: 4500,
    services: ['South Indian Bridal', 'Mehendi Design', 'Reception Look'],
    latitude: 9.1447,
    longitude: 77.7081,
    mapX: 0.58,
    mapY: 0.38,
  },
  {
    id: '16b10f24-72c8-4331-88e8-97636b8f33a3',
    businessName: 'Nobita Makeovers',
    ownerName: 'Nobita',
    phone: '+918888888888',
    city: 'Kalugumalai',
    address: 'Sankarankovil Road, Kalugumalai - 628552',
    pincode: '628552',
    profilePhotoUrl: null,
    businessTypes: ['Beautician', 'Hairstylist'],
    isPro: false,
    subscriptionTier: 'free',
    verified: true,
    completedBookingsCount: 3,
    distanceKm: 1.4,
    isExactPincode: true,
    startingPrice: 3500,
    services: ['Party Makeover', 'Facials & Skincare', 'Hair Styling'],
    latitude: 9.1480,
    longitude: 77.7120,
    mapX: 0.72,
    mapY: 0.50,
  },
];

const FILTER_TABS = [
  { id: 'all', label: 'All Studios', isPro: false },
  { id: 'pro', label: 'Shilpi Pro', isPro: true },
  { id: 'bridal', label: 'Bridal Artists', isPro: false },
  { id: 'mehendi', label: 'Mehendi', isPro: false },
  { id: 'hair', label: 'Hairstyling', isPro: false },
];

const POPULAR_LOCATIONS = [
  { pin: '628552', city: 'Kalugumalai', area: 'Main Bazaar, Kalugumalai' },
  { pin: '641002', city: 'Coimbatore', area: 'Gandhipuram, Coimbatore' },
  { pin: '641018', city: 'Coimbatore', area: 'Avinashi Road, Coimbatore' },
  { pin: '600001', city: 'Chennai', area: 'George Town, Chennai' },
  { pin: '625001', city: 'Madurai', area: 'Town Center, Madurai' },
];

interface AreaMapProfile {
  cityName: string;
  primaryArea: string;
  secondaryArea1: string;
  secondaryArea2: string;
  highwayName: string;
  mainRoad1: string;
  mainRoad2: string;
  parkName: string;
  promenadeName: string;
  waterwayName: string;
}

const getAreaProfile = (city: string, pincode: string): AreaMapProfile => {
  const c = city.toLowerCase();
  if (c.includes('kalugumalai') || pincode === '628552') {
    return {
      cityName: 'KALUGUMALAI',
      primaryArea: 'MAIN BAZAAR',
      secondaryArea1: 'MURUGAN TEMPLE',
      secondaryArea2: 'KAZHUGUMALAI HILLS',
      highwayName: 'SH 76',
      mainRoad1: 'Sankarankovil Rd',
      mainRoad2: 'Main Bazaar St',
      parkName: 'Vettuvan Koil Heritage Park',
      promenadeName: 'Jain Monument Rock Reserve',
      waterwayName: 'Ayyanar Reservoir',
    };
  }
  if (c.includes('coimbatore') || pincode.startsWith('641')) {
    return {
      cityName: 'COIMBATORE',
      primaryArea: 'GANDHIPURAM',
      secondaryArea1: 'RS PURAM',
      secondaryArea2: 'PEELAMEDU',
      highwayName: 'NH 544',
      mainRoad1: 'Cross Cut Rd',
      mainRoad2: 'Avinashi Rd',
      parkName: 'VOC Park & Grounds',
      promenadeName: 'Race Course Promenade',
      waterwayName: 'Valankulam Lake',
    };
  }
  if (c.includes('chennai') || pincode.startsWith('600')) {
    return {
      cityName: 'CHENNAI',
      primaryArea: 'T. NAGAR',
      secondaryArea1: 'MYLAPORE',
      secondaryArea2: 'ANNA NAGAR',
      highwayName: 'NH 48',
      mainRoad1: 'Anna Salai',
      mainRoad2: 'Pondy Bazaar Rd',
      parkName: 'Semmozhi Poonga',
      promenadeName: 'Marina Promenade',
      waterwayName: 'Cooum Canal',
    };
  }
  if (c.includes('madurai') || pincode.startsWith('625')) {
    return {
      cityName: 'MADURAI',
      primaryArea: 'TOWN HALL',
      secondaryArea1: 'MEENAKSHI AMMAN',
      secondaryArea2: 'KK NAGAR',
      highwayName: 'NH 38',
      mainRoad1: 'West Masi St',
      mainRoad2: 'South Veli St',
      parkName: 'Gandhi Memorial Park',
      promenadeName: 'Teppakulam Grounds',
      waterwayName: 'Vaigai River',
    };
  }
  return {
    cityName: city.toUpperCase(),
    primaryArea: `${city.toUpperCase()} TOWN`,
    secondaryArea1: 'MARKET ROAD',
    secondaryArea2: 'CIVIC CENTER',
    highwayName: 'HIGHWAY',
    mainRoad1: 'Station Road',
    mainRoad2: 'Main Avenue',
    parkName: 'City Green Park',
    promenadeName: 'Central Grounds',
    waterwayName: 'Canal Line',
  };
};

interface NearestBeauticiansScreenProps {
  onGoBack: () => void;
}

export const NearestBeauticiansScreen: React.FC<NearestBeauticiansScreenProps> = ({ onGoBack }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  // 3-Second Loading Animation States
  const [isScanning, setIsScanning] = useState(true);
  const [scanStatusText, setScanStatusText] = useState('Requesting satellite GPS coordinates...');
  const [scanStepIndex, setScanStepIndex] = useState(1);

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(false);
  const [userPincode, setUserPincode] = useState<string>('641002');
  const [userCity, setUserCity] = useState<string>('Coimbatore');
  const [userAddress, setUserAddress] = useState<string>('Gandhipuram, Coimbatore');
  const [activeFilter, setActiveFilter] = useState('all');
  const [studios, setStudios] = useState<RegisteredMakeover[]>(REAL_REGISTERED_STUDIOS);
  const [selectedStudio, setSelectedStudio] = useState<RegisteredMakeover>(REAL_REGISTERED_STUDIOS[0]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Dynamic Google Maps Profile for the active geographic area
  const areaProfile = useMemo(() => getAreaProfile(userCity, userPincode), [userCity, userPincode]);

  // Animation values
  const radarScale = useRef(new Animated.Value(1)).current;
  const pinSpring = useRef(new Animated.Value(1)).current;
  const cardListRef = useRef<FlatList>(null);

  // Enterprise Loading Animation values
  const scanFadeAnim = useRef(new Animated.Value(1)).current;
  const radarSweepRotate = useRef(new Animated.Value(0)).current;
  const sonarWave1 = useRef(new Animated.Value(0.5)).current;
  const sonarWave2 = useRef(new Animated.Value(0.5)).current;
  const sonarWave3 = useRef(new Animated.Value(0.5)).current;
  const avatarPop1 = useRef(new Animated.Value(0)).current;
  const avatarPop2 = useRef(new Animated.Value(0)).current;
  const avatarPop3 = useRef(new Animated.Value(0)).current;
  const avatarPop4 = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;

  // Radar Pulse Animation for the Map Beacon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(radarScale, {
          toValue: 2.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(radarScale, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [radarScale]);

  // -------------------------------------------------------------
  // 4. HIGH-CRAFT 3-SECOND LOCATION SCANNING ANIMATION PIPELINE
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // Start 360-degree radar rotation
    Animated.loop(
      Animated.timing(radarSweepRotate, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Start multi-tier expanding sonar waves
    const createSonar = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(val, {
              toValue: 2.6,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(val, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createSonar(sonarWave1, 0).start();
    createSonar(sonarWave2, 600).start();
    createSonar(sonarWave3, 1200).start();

    // Progress bar from 0% to 100% over 3 seconds
    Animated.timing(progressBarAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Staggered pop-in for beautician avatars found in area
    setTimeout(() => {
      if (isMounted) {
        setScanStepIndex(2);
        setScanStatusText('Extracting postal PIN code & territory...');
        Animated.spring(avatarPop1, { toValue: 1, friction: 4.5, tension: 50, useNativeDriver: true }).start();
        Animated.spring(avatarPop2, { toValue: 1, friction: 4.5, tension: 50, useNativeDriver: true }).start();
      }
    }, 1100);

    setTimeout(() => {
      if (isMounted) {
        setScanStepIndex(3);
        setScanStatusText('Matching verified bridal studios...');
        Animated.spring(avatarPop3, { toValue: 1, friction: 4.5, tension: 50, useNativeDriver: true }).start();
        Animated.spring(avatarPop4, { toValue: 1, friction: 4.5, tension: 50, useNativeDriver: true }).start();
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    }, 2100);

    // Conclude 3-second scanning animation and reveal Google Map
    const timer = setTimeout(() => {
      if (isMounted) {
        Animated.timing(scanFadeAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          if (isMounted) {
            setIsScanning(false);
          }
        });
      }
    }, 3100);

    // Ask for location and reverse geocode
    async function locateCustomer() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const geocode = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          if (isMounted && geocode && geocode[0]) {
            const g = geocode[0];
            const detectedPin = g.postalCode || '641002';
            const detectedCity = g.city || g.subregion || g.district || 'Coimbatore';
            const streetOrArea = g.street || g.name || g.subregion || '';
            const displayAddress = streetOrArea && streetOrArea !== detectedCity
              ? `${streetOrArea}, ${detectedCity}`
              : detectedCity;

            setUserPincode(detectedPin);
            setUserCity(detectedCity);
            setUserAddress(displayAddress);
            filterByLocation(detectedPin, detectedCity);
            return;
          }
        }
      } catch (e) {
        console.warn('GPS detection notice:', e);
      }
      if (isMounted) {
        filterByLocation('641002', 'Coimbatore');
      }
    }

    locateCustomer();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Filter studios strictly according to the detected or searched area
  const filterByLocation = async (pincode: string, city: string) => {
    setLoading(true);
    try {
      const endpoint = `/discovery/beauticians?pincode=${encodeURIComponent(pincode)}&city=${encodeURIComponent(city)}`;
      const res = await apiClient.get(endpoint);

      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped = res.data.data.map((item: any, i: number) => {
          const isExact = item.pincode === pincode;
          return {
            ...item,
            isExactPincode: isExact,
            mapX: 0.55 + ((i * 18) % 30) / 100,
            mapY: 0.35 + ((i * 15) % 25) / 100,
          };
        });
        setStudios(mapped);
        setSelectedStudio(mapped[0]);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    // STRICT GEOGRAPHIC LOCALIZATION
    const cityClean = city.toLowerCase().trim();
    const isKalugumalai = cityClean.includes('kalugumalai') || pincode === '628552';
    const isCoimbatore = cityClean.includes('coimbatore') || pincode.startsWith('641');

    let pool = REAL_REGISTERED_STUDIOS.filter((s) => {
      if (isKalugumalai) return s.city.toLowerCase().includes('kalugumalai') || s.pincode === '628552';
      if (isCoimbatore) return s.city.toLowerCase().includes('coimbatore') || s.pincode.startsWith('641');
      return s.city.toLowerCase() === cityClean || s.pincode === pincode;
    });

    if (pool.length === 0) {
      pool = [...REAL_REGISTERED_STUDIOS];
    }

    // Sort order: Pro Subscribers first (Vector Diamond), Bookings, Exact PIN, Distance
    const matched = pool.sort((a, b) => {
      if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
      if (b.completedBookingsCount !== a.completedBookingsCount) {
        return b.completedBookingsCount - a.completedBookingsCount;
      }
      const aExact = a.pincode === pincode;
      const bExact = b.pincode === pincode;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });

    setStudios(matched);
    setSelectedStudio(matched[0]);
    setLoading(false);
  };

  // Filtered List based on Active Tab
  const filteredStudios = useMemo(() => {
    let list = [...studios];
    if (activeFilter === 'pro') {
      return list.filter((s) => s.isPro);
    }
    if (activeFilter === 'bridal') {
      return list.filter((s) =>
        s.businessTypes.some((t) => t.toLowerCase().includes('bridal')) ||
        s.services.some((sv) => sv.toLowerCase().includes('bridal'))
      );
    }
    if (activeFilter === 'mehendi') {
      return list.filter((s) =>
        s.businessTypes.some((t) => t.toLowerCase().includes('mehendi')) ||
        s.services.some((sv) => sv.toLowerCase().includes('mehendi'))
      );
    }
    if (activeFilter === 'hair') {
      return list.filter((s) =>
        s.businessTypes.some((t) => t.toLowerCase().includes('hair')) ||
        s.services.some((sv) => sv.toLowerCase().includes('hair'))
      );
    }
    return list;
  }, [studios, activeFilter]);

  // Handle marker selection with spring & carousel synchronization
  const handleSelectPin = (studio: RegisteredMakeover) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedStudio(studio);

    pinSpring.setValue(0.7);
    Animated.spring(pinSpring, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    const idx = filteredStudios.findIndex((s) => s.id === studio.id);
    if (idx !== -1 && cardListRef.current) {
      cardListRef.current.scrollToIndex({ index: idx, animated: true });
    }
  };

  // Handle address or PIN search from modal
  const handleSearchAddress = (query?: string) => {
    const text = (query || searchInput).trim();
    if (!text) return;

    let targetPin = userPincode;
    let targetCity = userCity;
    let targetArea = text;

    const cleanDigits = text.replace(/\D/g, '');
    if (cleanDigits.length === 6) {
      targetPin = cleanDigits;
      if (cleanDigits === '628552') targetCity = 'Kalugumalai';
      else if (cleanDigits.startsWith('641')) targetCity = 'Coimbatore';
      else if (cleanDigits.startsWith('600')) targetCity = 'Chennai';
      else if (cleanDigits.startsWith('625')) targetCity = 'Madurai';
      targetArea = `${targetCity} - ${targetPin}`;
    } else {
      const lower = text.toLowerCase();
      if (lower.includes('kalugu')) {
        targetCity = 'Kalugumalai';
        targetPin = '628552';
        targetArea = 'Main Bazaar, Kalugumalai';
      } else if (lower.includes('coimbatore') || lower.includes('gandhi') || lower.includes('avinashi') || lower.includes('puram')) {
        targetCity = 'Coimbatore';
        targetPin = '641002';
        targetArea = 'Gandhipuram, Coimbatore';
      } else if (lower.includes('chennai') || lower.includes('nagar') || lower.includes('george')) {
        targetCity = 'Chennai';
        targetPin = '600001';
        targetArea = 'T. Nagar, Chennai';
      } else if (lower.includes('madurai')) {
        targetCity = 'Madurai';
        targetPin = '625001';
        targetArea = 'Town Center, Madurai';
      } else {
        targetCity = text;
        targetArea = text;
      }
    }

    setUserCity(targetCity);
    setUserPincode(targetPin);
    setUserAddress(targetArea);
    setSearchModalOpen(false);
    filterByLocation(targetPin, targetCity);
  };

  // Actions
  const handleCall = (phone: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (studio: RegisteredMakeover) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const cleanDigits = studio.phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${studio.businessName}, I found your studio on Shilpi App. I would like to inquire about your bridal makeover packages!`
    );
    Linking.openURL(`https://wa.me/${cleanDigits}?text=${text}`);
  };

  const handleOpenMaps = (studio: RegisteredMakeover) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const query = encodeURIComponent(`${studio.businessName}, ${studio.address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url);
  };

  // User coordinate on map canvas
  const userMapX = SCREEN_WIDTH * 0.44;
  const userMapY = SCREEN_HEIGHT * 0.42;

  // Selected Studio coordinates
  const targetX = selectedStudio ? SCREEN_WIDTH * (selectedStudio.mapX || 0.60) : userMapX + 60;
  const targetY = selectedStudio ? SCREEN_HEIGHT * (selectedStudio.mapY || 0.38) : userMapY - 50;
  const midX = (userMapX + targetX) / 2;
  const midY = (userMapY + targetY) / 2 - 25;

  const spinInterpolation = radarSweepRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.screen}>
      {/* -------------------------------------------------------------
          5. ENTERPRISE 3-SECOND RADAR SCANNING & AVATAR FETCHING OVERLAY
         ------------------------------------------------------------- */}
      {isScanning && (
        <Animated.View style={[styles.scanOverlay, { opacity: scanFadeAnim }]}>
          {/* Top Bar on Scan Screen */}
          <View style={[styles.scanTopRow, { top: insets.top + 10 }]}>
            <TouchableOpacity style={styles.floatingCircleBtn} onPress={onGoBack} activeOpacity={0.82}>
              <BackArrowVector color="#0f172a" size={18} />
            </TouchableOpacity>
            <View style={styles.scanHeaderTitleWrap}>
              <Text style={styles.scanHeaderTitle}>LOCATING BEAUTICIANS</Text>
              <Text style={styles.scanHeaderSub}>High-Precision Territory Scan</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Central Radar Stage */}
          <View style={styles.radarCenterStage}>
            {/* Concentric Expanding Sonar Waves */}
            <Animated.View
              style={[
                styles.sonarRing,
                {
                  transform: [{ scale: sonarWave1 }],
                  opacity: sonarWave1.interpolate({ inputRange: [0.5, 2.6], outputRange: [0.45, 0] }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sonarRing,
                {
                  transform: [{ scale: sonarWave2 }],
                  opacity: sonarWave2.interpolate({ inputRange: [0.5, 2.6], outputRange: [0.35, 0] }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sonarRing,
                {
                  transform: [{ scale: sonarWave3 }],
                  opacity: sonarWave3.interpolate({ inputRange: [0.5, 2.6], outputRange: [0.25, 0] }),
                },
              ]}
            />

            {/* Rotating Radar Sweep Beam */}
            <Animated.View style={[styles.radarSweepBeam, { transform: [{ rotate: spinInterpolation }] }]}>
              <View style={styles.radarLaserLine} />
              <View style={styles.radarSweepSector} />
            </Animated.View>

            {/* Center User Beacon */}
            <View style={styles.scanUserCore}>
              <View style={styles.scanUserCoreInner} />
            </View>
            <View style={styles.scanUserTag}>
              <Text style={styles.scanUserTagText}>GPS FIXED</Text>
            </View>

            {/* Orbiting Beautician Avatar 1: Shilpi Makeovers (Top Right) */}
            <Animated.View
              style={[
                styles.orbitingAvatarNode,
                {
                  top: -65,
                  right: -55,
                  transform: [{ scale: avatarPop1 }],
                },
              ]}
            >
              <View style={[styles.avatarBubble, styles.avatarBubblePro]}>
                <Text style={styles.avatarBubbleText}>S</Text>
                <View style={styles.avatarDiamondBadge}>
                  <DiamondVector color="#ffffff" size={8} />
                </View>
              </View>
              <View style={styles.avatarCalloutTag}>
                <Text style={styles.avatarCalloutName}>Shilpi Makeovers</Text>
                <Text style={styles.avatarCalloutDist}>0.8 km</Text>
              </View>
            </Animated.View>

            {/* Orbiting Beautician Avatar 2: Pooja Luxury Studio (Bottom Right) */}
            <Animated.View
              style={[
                styles.orbitingAvatarNode,
                {
                  bottom: -60,
                  right: -45,
                  transform: [{ scale: avatarPop2 }],
                },
              ]}
            >
              <View style={[styles.avatarBubble, styles.avatarBubblePro]}>
                <Text style={styles.avatarBubbleText}>P</Text>
                <View style={styles.avatarDiamondBadge}>
                  <DiamondVector color="#ffffff" size={8} />
                </View>
              </View>
              <View style={styles.avatarCalloutTag}>
                <Text style={styles.avatarCalloutName}>Pooja Studio</Text>
                <Text style={styles.avatarCalloutDist}>2.1 km</Text>
              </View>
            </Animated.View>

            {/* Orbiting Beautician Avatar 3: Jo Makeovers (Top Left) */}
            <Animated.View
              style={[
                styles.orbitingAvatarNode,
                {
                  top: -55,
                  left: -60,
                  transform: [{ scale: avatarPop3 }],
                },
              ]}
            >
              <View style={[styles.avatarBubble, styles.avatarBubblePro]}>
                <Text style={styles.avatarBubbleText}>J</Text>
                <View style={styles.avatarDiamondBadge}>
                  <DiamondVector color="#ffffff" size={8} />
                </View>
              </View>
              <View style={styles.avatarCalloutTag}>
                <Text style={styles.avatarCalloutName}>Jo Makeovers</Text>
                <Text style={styles.avatarCalloutDist}>0.6 km</Text>
              </View>
            </Animated.View>

            {/* Orbiting Beautician Avatar 4: Nobita Makeovers (Bottom Left) */}
            <Animated.View
              style={[
                styles.orbitingAvatarNode,
                {
                  bottom: -50,
                  left: -50,
                  transform: [{ scale: avatarPop4 }],
                },
              ]}
            >
              <View style={styles.avatarBubble}>
                <Text style={[styles.avatarBubbleText, { color: '#0f172a' }]}>N</Text>
              </View>
              <View style={styles.avatarCalloutTag}>
                <Text style={styles.avatarCalloutName}>Nobita Studio</Text>
                <Text style={styles.avatarCalloutDist}>1.4 km</Text>
              </View>
            </Animated.View>
          </View>

          {/* Bottom Progress & Status Details */}
          <View style={[styles.scanBottomCard, { bottom: insets.bottom + 24 }]}>
            {/* Live Status Row */}
            <View style={styles.scanStatusRow}>
              <View style={styles.scanStatusIndicatorDot} />
              <Text style={styles.scanStatusHeadingText}>{scanStatusText}</Text>
            </View>

            {/* Target Area Capsule */}
            <View style={styles.scanTerritoryPill}>
              <LocationPinVector color="#ea4335" size={13} />
              <Text style={styles.scanTerritoryText} numberOfLines={1}>
                {userAddress || userCity} · PIN {userPincode}
              </Text>
            </View>

            {/* 3-Second Loading Progress Bar */}
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* Verified Guarantee Badge */}
            <View style={styles.scanVerifiedNotice}>
              <ShieldCheckVector color="#10b981" size={15} />
              <Text style={styles.scanVerifiedNoticeText}>
                Showing 100% Verified Shilpi Makeover Artists
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* -------------------------------------------------------------
          6. MAIN MAP OR LIST VIEW (APPEARS AFTER 3-SECOND SCAN)
         ------------------------------------------------------------- */}
      {viewMode === 'map' ? (
        <View style={styles.fullBleedMapContainer}>
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="routePinkGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#ff2d75" />
                <Stop offset="100%" stopColor="#e11d48" />
              </LinearGradient>
            </Defs>

            {/* 1. Google Maps Base Land Terrain (Signature #f4f3f0) */}
            <Rect width="100%" height="100%" fill="#f4f3f0" />

            {/* 2. Google Maps Parks & Green Spaces (#c8e8c8 with #a8d5a8 border) */}
            <Path
              d={`M${SCREEN_WIDTH * 0.04},${SCREEN_HEIGHT * 0.18} Q${SCREEN_WIDTH * 0.22},${SCREEN_HEIGHT * 0.16} ${SCREEN_WIDTH * 0.38},${SCREEN_HEIGHT * 0.20} Q${SCREEN_WIDTH * 0.40},${SCREEN_HEIGHT * 0.30} ${SCREEN_WIDTH * 0.25},${SCREEN_HEIGHT * 0.32} Q${SCREEN_WIDTH * 0.04},${SCREEN_HEIGHT * 0.31} ${SCREEN_WIDTH * 0.04},${SCREEN_HEIGHT * 0.18} Z`}
              fill="#c8e8c8"
              stroke="#a8d5a8"
              strokeWidth={1}
            />
            <Path
              d={`M${SCREEN_WIDTH * 0.58},${SCREEN_HEIGHT * 0.16} C${SCREEN_WIDTH * 0.72},${SCREEN_HEIGHT * 0.14} ${SCREEN_WIDTH * 0.94},${SCREEN_HEIGHT * 0.18} ${SCREEN_WIDTH * 0.92},${SCREEN_HEIGHT * 0.28} C${SCREEN_WIDTH * 0.90},${SCREEN_HEIGHT * 0.34} ${SCREEN_WIDTH * 0.65},${SCREEN_HEIGHT * 0.32} ${SCREEN_WIDTH * 0.58},${SCREEN_HEIGHT * 0.26} Z`}
              fill="#c8e8c8"
              stroke="#a8d5a8"
              strokeWidth={1}
            />
            <Path
              d={`M${SCREEN_WIDTH * 0.55},${SCREEN_HEIGHT * 0.60} Q${SCREEN_WIDTH * 0.75},${SCREEN_HEIGHT * 0.58} ${SCREEN_WIDTH * 0.94},${SCREEN_HEIGHT * 0.64} Q${SCREEN_WIDTH * 0.92},${SCREEN_HEIGHT * 0.76} ${SCREEN_WIDTH * 0.68},${SCREEN_HEIGHT * 0.75} Z`}
              fill="#d4edd2"
              stroke="#bbf2b6"
              strokeWidth={1}
            />

            {/* 3. Google Maps Waterway / Canal (#aadaff) */}
            <Path
              d={`M-10,${SCREEN_HEIGHT * 0.67} C${SCREEN_WIDTH * 0.30},${SCREEN_HEIGHT * 0.62} ${SCREEN_WIDTH * 0.62},${SCREEN_HEIGHT * 0.72} ${SCREEN_WIDTH + 10},${SCREEN_HEIGHT * 0.66} L${SCREEN_WIDTH + 10},${SCREEN_HEIGHT * 0.72} C${SCREEN_WIDTH * 0.62},${SCREEN_HEIGHT * 0.78} ${SCREEN_WIDTH * 0.30},${SCREEN_HEIGHT * 0.68} -10,${SCREEN_HEIGHT * 0.73} Z`}
              fill="#aadaff"
            />

            {/* 4. Google Maps Urban Neighborhood Blocks */}
            <Path
              d={`M${SCREEN_WIDTH * 0.05},${SCREEN_HEIGHT * 0.36} L${SCREEN_WIDTH * 0.40},${SCREEN_HEIGHT * 0.36} L${SCREEN_WIDTH * 0.40},${SCREEN_HEIGHT * 0.44} L${SCREEN_WIDTH * 0.05},${SCREEN_HEIGHT * 0.44} Z`}
              fill="#ebe7df"
            />
            <Path
              d={`M${SCREEN_WIDTH * 0.50},${SCREEN_HEIGHT * 0.36} L${SCREEN_WIDTH * 0.95},${SCREEN_HEIGHT * 0.36} L${SCREEN_WIDTH * 0.95},${SCREEN_HEIGHT * 0.46} L${SCREEN_WIDTH * 0.50},${SCREEN_HEIGHT * 0.46} Z`}
              fill="#ebe7df"
            />
            <Path
              d={`M${SCREEN_WIDTH * 0.05},${SCREEN_HEIGHT * 0.50} L${SCREEN_WIDTH * 0.42},${SCREEN_HEIGHT * 0.50} L${SCREEN_WIDTH * 0.42},${SCREEN_HEIGHT * 0.62} L${SCREEN_WIDTH * 0.05},${SCREEN_HEIGHT * 0.62} Z`}
              fill="#ebe7df"
            />

            {/* 5. Google Maps Organic Road Network */}
            <Path d={`M-30,${SCREEN_HEIGHT * 0.24} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.24}`} stroke="#e5e3de" strokeWidth={4} />
            <Path d={`M-30,${SCREEN_HEIGHT * 0.54} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.54}`} stroke="#e5e3de" strokeWidth={4} />
            <Path d={`M${SCREEN_WIDTH * 0.22},0 L${SCREEN_WIDTH * 0.22},${SCREEN_HEIGHT}`} stroke="#e5e3de" strokeWidth={4} />
            <Path d={`M${SCREEN_WIDTH * 0.74},0 L${SCREEN_WIDTH * 0.74},${SCREEN_HEIGHT}`} stroke="#e5e3de" strokeWidth={4} />

            <Path d={`M-30,${SCREEN_HEIGHT * 0.36} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.36}`} stroke="#d5d3ce" strokeWidth={7} />
            <Path d={`M-30,${SCREEN_HEIGHT * 0.48} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.48}`} stroke="#d5d3ce" strokeWidth={7} />
            <Path d={`M${SCREEN_WIDTH * 0.44},0 L${SCREEN_WIDTH * 0.44},${SCREEN_HEIGHT}`} stroke="#d5d3ce" strokeWidth={7} />
            <Path d={`M${SCREEN_WIDTH * 0.86},0 L${SCREEN_WIDTH * 0.86},${SCREEN_HEIGHT}`} stroke="#d5d3ce" strokeWidth={6} />

            <Path
              d={`M-30,${SCREEN_HEIGHT * 0.42} Q${SCREEN_WIDTH * 0.45},${SCREEN_HEIGHT * 0.40} ${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.48}`}
              stroke="#f59e0b"
              strokeWidth={9}
            />

            {/* Pure White Fills */}
            <Path d={`M-30,${SCREEN_HEIGHT * 0.24} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.24}`} stroke="#ffffff" strokeWidth={2.8} />
            <Path d={`M-30,${SCREEN_HEIGHT * 0.54} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.54}`} stroke="#ffffff" strokeWidth={2.8} />
            <Path d={`M${SCREEN_WIDTH * 0.22},0 L${SCREEN_WIDTH * 0.22},${SCREEN_HEIGHT}`} stroke="#ffffff" strokeWidth={2.8} />
            <Path d={`M${SCREEN_WIDTH * 0.74},0 L${SCREEN_WIDTH * 0.74},${SCREEN_HEIGHT}`} stroke="#ffffff" strokeWidth={2.8} />

            <Path d={`M-30,${SCREEN_HEIGHT * 0.36} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.36}`} stroke="#ffffff" strokeWidth={5} />
            <Path d={`M-30,${SCREEN_HEIGHT * 0.48} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.48}`} stroke="#ffffff" strokeWidth={5} />
            <Path d={`M${SCREEN_WIDTH * 0.44},0 L${SCREEN_WIDTH * 0.44},${SCREEN_HEIGHT}`} stroke="#ffffff" strokeWidth={5} />
            <Path d={`M${SCREEN_WIDTH * 0.86},0 L${SCREEN_WIDTH * 0.86},${SCREEN_HEIGHT}`} stroke="#ffffff" strokeWidth={4.5} />

            <Path
              d={`M-30,${SCREEN_HEIGHT * 0.42} Q${SCREEN_WIDTH * 0.45},${SCREEN_HEIGHT * 0.40} ${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.48}`}
              stroke="#fed7aa"
              strokeWidth={6.5}
            />

            {/* Bridge Deck over Canal */}
            <Rect x={SCREEN_WIDTH * 0.42} y={SCREEN_HEIGHT * 0.67} width={SCREEN_WIDTH * 0.05} height={SCREEN_HEIGHT * 0.045} fill="#ffffff" stroke="#d5d3ce" strokeWidth={1} rx={2} />

            {/* Dynamic Highway Shield Badge */}
            <Rect x={SCREEN_WIDTH * 0.08} y={SCREEN_HEIGHT * 0.40} width={44} height={16} rx={3} fill="#15803d" />
            <SvgText x={SCREEN_WIDTH * 0.08 + 22} y={SCREEN_HEIGHT * 0.40 + 11.5} fill="#ffffff" fontSize={8} fontWeight="800" textAnchor="middle">
              {areaProfile.highwayName}
            </SvgText>

            {/* DYNAMIC AREA TYPOGRAPHY & LABELS */}
            <SvgText x={SCREEN_WIDTH * 0.48} y={SCREEN_HEIGHT * 0.34} fill="#5f6368" fontSize={9.5} fontWeight="700" letterSpacing={1.2}>
              {areaProfile.primaryArea}
            </SvgText>
            <SvgText x={SCREEN_WIDTH * 0.06} y={SCREEN_HEIGHT * 0.52} fill="#5f6368" fontSize={9} fontWeight="700" letterSpacing={1.2}>
              {areaProfile.secondaryArea1}
            </SvgText>
            <SvgText x={SCREEN_WIDTH * 0.56} y={SCREEN_HEIGHT * 0.53} fill="#5f6368" fontSize={9} fontWeight="700" letterSpacing={1.2}>
              {areaProfile.secondaryArea2}
            </SvgText>

            <SvgText x={SCREEN_WIDTH * 0.52} y={SCREEN_HEIGHT * 0.47} fill="#80868b" fontSize={7.5} fontWeight="600">
              {areaProfile.mainRoad1}
            </SvgText>
            <SvgText x={SCREEN_WIDTH * 0.05} y={SCREEN_HEIGHT * 0.35} fill="#80868b" fontSize={7.5} fontWeight="600">
              {areaProfile.mainRoad2}
            </SvgText>

            <SvgText x={SCREEN_WIDTH * 0.12} y={SCREEN_HEIGHT * 0.25} fill="#188038" fontSize={8} fontWeight="700">
              {areaProfile.parkName}
            </SvgText>
            <SvgText x={SCREEN_WIDTH * 0.65} y={SCREEN_HEIGHT * 0.22} fill="#188038" fontSize={8} fontWeight="700">
              {areaProfile.promenadeName}
            </SvgText>

            {/* Google Maps POI Dots */}
            <Circle cx={SCREEN_WIDTH * 0.44} cy={SCREEN_HEIGHT * 0.36} r={7} fill="#1a73e8" />
            <Circle cx={SCREEN_WIDTH * 0.44} cy={SCREEN_HEIGHT * 0.36} r={3} fill="#ffffff" />
            <Circle cx={SCREEN_WIDTH * 0.74} cy={SCREEN_HEIGHT * 0.48} r={7} fill="#ea4335" />
            <Circle cx={SCREEN_WIDTH * 0.74} cy={SCREEN_HEIGHT * 0.48} r={2.5} fill="#ffffff" />

            {/* ACTIVE GOOGLE MAPS NAVIGATION ROUTE */}
            {selectedStudio && (
              <G>
                <Path
                  d={`M${userMapX},${userMapY} Q${midX},${midY} ${targetX},${targetY}`}
                  stroke="rgba(255, 45, 117, 0.22)"
                  strokeWidth={10}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={`M${userMapX},${userMapY} Q${midX},${midY} ${targetX},${targetY}`}
                  stroke="url(#routePinkGlow)"
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                />
              </G>
            )}
          </Svg>

          {/* ACTIVE ROUTE FLOATING ETA CAPSULE */}
          {selectedStudio && (
            <View style={[styles.routeEtaPill, { left: midX - 55, top: midY - 14 }]}>
              <View style={styles.etaDotPulse} />
              <Text style={styles.routeEtaPillText}>
                {Math.max(2, Math.round(selectedStudio.distanceKm * 2.5))} min ({selectedStudio.distanceKm} km)
              </Text>
            </View>
          )}

          {/* USER LIVE GPS BEACON */}
          <View style={[styles.userGpsBeacon, { left: userMapX - 22, top: userMapY - 22 }]}>
            <Animated.View
              style={[
                styles.userGpsSonarWave,
                {
                  transform: [{ scale: radarScale }],
                  opacity: radarScale.interpolate({
                    inputRange: [1, 2.2],
                    outputRange: [0.7, 0],
                  }),
                },
              ]}
            />
            <View style={styles.userGpsCorePoint}>
              <View style={styles.userGpsWhiteCenter} />
            </View>
            <View style={styles.userGpsTag}>
              <Text style={styles.userGpsTagText}>YOU ({userPincode})</Text>
            </View>
          </View>

          {/* AUTHENTIC GOOGLE MAPS TEARDROP LOCATION PINS */}
          {filteredStudios.map((studio) => {
            const pinX = SCREEN_WIDTH * studio.mapX;
            const pinY = SCREEN_HEIGHT * studio.mapY;
            const isSelected = selectedStudio?.id === studio.id;

            return (
              <TouchableOpacity
                key={studio.id}
                style={[
                  styles.googlePinAnchor,
                  { left: pinX - 30, top: pinY - 56 },
                  isSelected && styles.googlePinAnchorSelected,
                ]}
                onPress={() => handleSelectPin(studio)}
                activeOpacity={0.88}
              >
                <View style={[styles.googlePinCallout, isSelected && styles.googlePinCalloutSelected]}>
                  {studio.isPro && (
                    <View style={styles.proMiniBadge}>
                      <DiamondVector color="#f59e0b" size={10} />
                    </View>
                  )}
                  <Text style={[styles.googlePinCalloutText, isSelected && styles.googlePinCalloutTextSelected]} numberOfLines={1}>
                    {studio.businessName}
                  </Text>
                  <View style={styles.pinDistDot} />
                  <Text style={[styles.pinPriceText, isSelected && styles.pinPriceTextSelected]}>
                    ₹{(studio.startingPrice / 1000).toFixed(1)}k
                  </Text>
                </View>

                <Animated.View
                  style={isSelected ? { transform: [{ scale: pinSpring }] } : undefined}
                >
                  <GoogleMapsPinIcon
                    color="#ff2d75"
                    size={isSelected ? 40 : 34}
                    isSelected={isSelected}
                    isPro={studio.isPro}
                    char={studio.businessName.charAt(0)}
                  />
                </Animated.View>
              </TouchableOpacity>
            );
          })}

          {/* FULLY RESPONSIVE TOP BAR */}
          <View style={[styles.floatingTopBarWrap, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.floatingCircleBtn} onPress={onGoBack} activeOpacity={0.82}>
              <BackArrowVector color="#0f172a" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floatingLocationCapsule}
              onPress={() => {
                setSearchInput(userAddress || `${userCity} - ${userPincode}`);
                setSearchModalOpen(true);
              }}
              activeOpacity={0.85}
            >
              <LocationPinVector color="#ea4335" size={17} />
              <View style={styles.locationContentWrap}>
                <Text style={styles.capsuleCityText} numberOfLines={1} ellipsizeMode="tail">
                  {userAddress || userCity}
                </Text>
                <View style={styles.capsuleDot} />
                <Text style={styles.capsulePinText}>{userPincode}</Text>
              </View>
              <View style={styles.capsuleSearchCircle}>
                <SearchVector color="#5f6368" size={13} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floatingCircleBtn}
              onPress={() => setViewMode('list')}
              activeOpacity={0.82}
            >
              <ListVector color="#0f172a" size={16} />
            </TouchableOpacity>
          </View>

          {/* Floating Category Filter Chips */}
          <View style={[styles.floatingFilterChipsRow, { top: insets.top + 64 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
              {FILTER_TABS.map((tab) => {
                const isSelected = activeFilter === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.floatingFilterPill, isSelected && styles.floatingFilterPillActive]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setActiveFilter(tab.id);
                    }}
                    activeOpacity={0.8}
                  >
                    {tab.isPro && (
                      <View style={{ marginRight: 4 }}>
                        <DiamondVector color={isSelected ? '#ffffff' : '#f59e0b'} size={12} />
                      </View>
                    )}
                    <Text style={[styles.floatingFilterText, isSelected && styles.floatingFilterTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Floating Google Maps Target GPS Button */}
          <View style={[styles.floatingRightActions, { top: insets.top + 120 }]}>
            <TouchableOpacity
              style={styles.floatingActionIcon}
              onPress={() => filterByLocation(userPincode, userCity)}
              activeOpacity={0.8}
            >
              <CrosshairTargetVector color="#1a73e8" size={20} />
            </TouchableOpacity>
          </View>

          {/* HORIZONTAL SNAPPING STUDIO CARD DECK */}
          <View style={[styles.carouselContainer, { bottom: insets.bottom + 10 }]}>
            <FlatList
              ref={cardListRef}
              data={filteredStudios}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled={false}
              snapToInterval={CARD_INTERVAL}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScrollPadding}
              onMomentumScrollEnd={(e) => {
                const offset = e.nativeEvent.contentOffset.x;
                const index = Math.round(offset / CARD_INTERVAL);
                if (filteredStudios[index] && filteredStudios[index].id !== selectedStudio.id) {
                  setSelectedStudio(filteredStudios[index]);
                }
              }}
              renderItem={({ item: studio }) => {
                const isSelected = selectedStudio?.id === studio.id;
                return (
                  <View style={[styles.carouselCardItem, isSelected && styles.carouselCardItemSelected]}>
                    <TouchableOpacity
                      activeOpacity={0.94}
                      onPress={() => {
                        setSelectedStudio(studio);
                        setDetailModalOpen(true);
                      }}
                    >
                      <View style={styles.cardDragHandle} />

                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.cardAvatar, studio.isPro && styles.cardAvatarPro]}>
                          <Text style={[styles.cardAvatarText, studio.isPro && styles.cardAvatarTextPro]}>
                            {studio.businessName.charAt(0)}
                          </Text>
                        </View>

                        <View style={styles.cardInfoCol}>
                          <View style={styles.cardTitleWrap}>
                            <Text style={styles.cardTitleText} numberOfLines={1}>
                              {studio.businessName}
                            </Text>
                            {studio.isPro ? (
                              <View style={styles.proGoldBadge}>
                                <DiamondVector color="#fbbf24" size={9} />
                                <Text style={styles.proGoldText}>PRO</Text>
                              </View>
                            ) : (
                              <VerifiedBadgeVector color="#ff2d75" size={13} />
                            )}
                          </View>

                          <Text style={styles.cardOwnerSub} numberOfLines={1}>
                            By {studio.ownerName} · {studio.city}
                          </Text>

                          <View style={styles.cardMetaRow}>
                            <View style={styles.distanceBadgePill}>
                              <LocationPinVector color="#ea4335" size={10} />
                              <Text style={styles.distanceBadgeText}>{studio.distanceKm} km</Text>
                            </View>

                            <View style={styles.etaBadgePill}>
                              <Text style={styles.etaBadgeText}>~{Math.max(2, Math.round(studio.distanceKm * 2.5))} min</Text>
                            </View>

                            <View style={[styles.pinBadgePill, studio.isExactPincode && styles.pinExactBadgePill]}>
                              <Text style={[styles.pinBadgeText, studio.isExactPincode && styles.pinExactBadgeText]}>
                                {studio.isExactPincode ? `Exact PIN ${studio.pincode}` : `PIN ${studio.pincode}`}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardServicesRow}>
                        <View style={styles.chipsWrap}>
                          {studio.services.slice(0, 2).map((srv: string, idx: number) => (
                            <View key={`srv-${idx}`} style={styles.servicePill}>
                              <Text style={styles.servicePillText} numberOfLines={1}>
                                {srv}
                              </Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.priceHighlight}>
                          From ₹{studio.startingPrice.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.actionBtnCall}
                          onPress={() => handleCall(studio.phone)}
                          activeOpacity={0.82}
                        >
                          <PhoneCallVector color="#ffffff" size={13} />
                          <Text style={styles.actionBtnCallText}>Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtnWhatsApp}
                          onPress={() => handleWhatsApp(studio)}
                          activeOpacity={0.82}
                        >
                          <WhatsAppVector color="#ffffff" size={14} />
                          <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtnDirections}
                          onPress={() => handleOpenMaps(studio)}
                          activeOpacity={0.82}
                        >
                          <MapNavigationVector color="#ea4335" size={13} />
                          <Text style={styles.actionBtnDirectionsText}>Directions</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </View>
      ) : (
        // -------------------------------------------------------------
        // 7. HIGH-DENSITY LIST VIEW (MATCHING THEME)
        // -------------------------------------------------------------
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <View style={styles.listTopBar}>
            <TouchableOpacity style={styles.floatingCircleBtn} onPress={onGoBack} activeOpacity={0.8}>
              <BackArrowVector color="#0f172a" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floatingLocationCapsule}
              onPress={() => {
                setSearchInput(userAddress || `${userCity} - ${userPincode}`);
                setSearchModalOpen(true);
              }}
              activeOpacity={0.85}
            >
              <LocationPinVector color="#ea4335" size={15} />
              <View style={styles.locationContentWrap}>
                <Text style={styles.capsuleCityText} numberOfLines={1}>{userAddress || userCity}</Text>
                <View style={styles.capsuleDot} />
                <Text style={styles.capsulePinText}>{userPincode}</Text>
              </View>
              <View style={styles.capsuleSearchCircle}>
                <SearchVector color="#5f6368" size={13} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.floatingCircleBtn, { backgroundColor: '#ff2d75' }]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.8}
            >
              <CompassVector color="#ffffff" size={16} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.listHeaderBadgeRow}>
              <Text style={styles.listHeaderTitle}>
                {filteredStudios.length} Registered Beauticians Near {userCity}
              </Text>
              <Text style={styles.listHeaderSub}>Ranked by Shilpi Pro (Diamond) & verified bookings</Text>
            </View>

            {filteredStudios.map((studio) => (
              <TouchableOpacity
                key={studio.id}
                style={styles.listCard}
                onPress={() => {
                  setSelectedStudio(studio);
                  setDetailModalOpen(true);
                }}
                activeOpacity={0.88}
              >
                <View style={styles.listCardTop}>
                  <View style={[styles.listAvatar, studio.isPro && styles.listAvatarPro]}>
                    <Text style={[styles.listAvatarText, studio.isPro && styles.listAvatarTextPro]}>
                      {studio.businessName.charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.listInfoWrap}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.listStudioName} numberOfLines={1}>{studio.businessName}</Text>
                      {studio.isPro ? (
                        <View style={styles.proGoldBadge}>
                          <DiamondVector color="#fbbf24" size={8} />
                          <Text style={styles.proGoldText}>PRO</Text>
                        </View>
                      ) : (
                        <VerifiedBadgeVector color="#ff2d75" size={13} />
                      )}
                    </View>
                    <Text style={styles.listOwnerName}>By {studio.ownerName}</Text>
                    <Text style={styles.listAddress} numberOfLines={1}>{studio.address}</Text>

                    <View style={styles.listBadgesRow}>
                      <View style={styles.distanceBadgePill}>
                        <Text style={styles.distanceBadgeText}>{studio.distanceKm} km</Text>
                      </View>
                      <View style={[styles.pinBadgePill, studio.isExactPincode && styles.pinExactBadgePill]}>
                        <Text style={[styles.pinBadgeText, studio.isExactPincode && styles.pinExactBadgeText]}>
                          PIN {studio.pincode}
                        </Text>
                      </View>
                      {studio.completedBookingsCount > 0 && (
                        <View style={styles.ordersBadgePill}>
                          <Text style={styles.ordersBadgeText}>{studio.completedBookingsCount} Orders</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.listCardDivider} />

                <View style={styles.listActionsRow}>
                  <TouchableOpacity
                    style={styles.btnCallSmall}
                    onPress={() => handleCall(studio.phone)}
                    activeOpacity={0.8}
                  >
                    <PhoneCallVector color="#ffffff" size={13} />
                    <Text style={styles.btnCallSmallText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnWaSmall}
                    onPress={() => handleWhatsApp(studio)}
                    activeOpacity={0.8}
                  >
                    <WhatsAppVector color="#ffffff" size={14} />
                    <Text style={styles.btnWaSmallText}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnDirectionsSmall}
                    onPress={() => handleOpenMaps(studio)}
                    activeOpacity={0.8}
                  >
                    <MapNavigationVector color="#ea4335" size={12} />
                    <Text style={styles.btnDirectionsSmallText}>Directions</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      )}

      {/* -------------------------------------------------------------
          8. FULL STUDIO DETAILS MODAL (GOOGLE MAPS CARD)
         ------------------------------------------------------------- */}
      <Modal visible={detailModalOpen} transparent animationType="slide" onRequestClose={() => setDetailModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalStudioName} numberOfLines={1}>{selectedStudio?.businessName}</Text>
                  {selectedStudio?.isPro && (
                    <View style={styles.proGoldBadge}>
                      <DiamondVector color="#fbbf24" size={10} />
                      <Text style={styles.proGoldText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modalOwnerName}>By {selectedStudio?.ownerName} · Registered Beautician</Text>
              </View>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailModalOpen(false)}>
                <CloseVector color="#0f172a" size={16} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_HEIGHT * 0.52 }}>
              <View style={styles.modalStatsCard}>
                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatVal}>{selectedStudio?.distanceKm} km</Text>
                  <Text style={styles.modalStatLabel}>Distance</Text>
                </View>

                <View style={styles.modalStatDivider} />

                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatVal}>{selectedStudio?.pincode}</Text>
                  <Text style={styles.modalStatLabel}>{selectedStudio?.isExactPincode ? 'Same PIN Code' : 'PIN Code'}</Text>
                </View>

                <View style={styles.modalStatDivider} />

                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatVal}>
                    {selectedStudio?.completedBookingsCount > 0 ? selectedStudio.completedBookingsCount : 'Active'}
                  </Text>
                  <Text style={styles.modalStatLabel}>Orders Completed</Text>
                </View>
              </View>

              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionHeading}>STUDIO ADDRESS</Text>
                <Text style={styles.modalAddressText}>{selectedStudio?.address}</Text>
                <TouchableOpacity
                  style={styles.modalDirectionsBtn}
                  onPress={() => selectedStudio && handleOpenMaps(selectedStudio)}
                  activeOpacity={0.8}
                >
                  <MapNavigationVector color="#ea4335" size={14} />
                  <Text style={styles.modalDirectionsText}>Open in Google Maps</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionHeading}>SERVICES & PACKAGES</Text>
                {selectedStudio?.services.map((srv: string, idx: number) => (
                  <View key={`pkg-${idx}`} style={styles.modalServiceRow}>
                    <Text style={styles.modalServiceName} numberOfLines={1}>{srv}</Text>
                    <Text style={styles.modalServicePrice}>
                      ₹{(selectedStudio.startingPrice + idx * 1000).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.modalGuaranteeCard}>
                <ShieldCheckVector color="#10b981" size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalGuaranteeTitle}>Verified Shilpi Partner Studio</Text>
                  <Text style={styles.modalGuaranteeDesc}>
                    KYC verified, authenticated phone identity, and certified bridal makeover provider.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.modalCallBtn}
                onPress={() => selectedStudio && handleCall(selectedStudio.phone)}
                activeOpacity={0.82}
              >
                <PhoneCallVector color="#ffffff" size={15} />
                <Text style={styles.modalCallBtnText}>Call Studio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalWaBtn}
                onPress={() => selectedStudio && handleWhatsApp(selectedStudio)}
                activeOpacity={0.82}
              >
                <WhatsAppVector color="#ffffff" size={17} />
                <Text style={styles.modalWaBtnText}>WhatsApp Inquiry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------------------
          9. GOOGLE MAPS ADDRESS & PIN SEARCH DIALOG
         ------------------------------------------------------------- */}
      <Modal visible={searchModalOpen} transparent animationType="fade" onRequestClose={() => setSearchModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pincodeModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalStudioName}>Search Area or PIN Code</Text>
                <Text style={styles.modalOwnerName}>Find registered beauticians in any city or address</Text>
              </View>
              <TouchableOpacity onPress={() => setSearchModalOpen(false)} style={styles.modalCloseBtn}>
                <CloseVector color="#0f172a" size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputWrap}>
              <SearchVector color="#5f6368" size={16} />
              <TextInput
                style={styles.pincodeInput}
                placeholder="e.g. Kalugumalai, Gandhipuram, 641002..."
                placeholderTextColor="rgba(15, 23, 42, 0.4)"
                value={searchInput}
                onChangeText={setSearchInput}
                autoFocus={true}
              />
            </View>

            <TouchableOpacity
              style={styles.applyPinBtn}
              onPress={() => handleSearchAddress()}
              activeOpacity={0.85}
            >
              <Text style={styles.applyPinText}>SEARCH LOCATION</Text>
            </TouchableOpacity>

            <Text style={styles.suggestionsHeading}>FREQUENT LOCATIONS</Text>
            <View style={styles.suggestionsGrid}>
              {POPULAR_LOCATIONS.map((item) => (
                <TouchableOpacity
                  key={`${item.city}-${item.pin}`}
                  style={styles.suggestionPill}
                  onPress={() => handleSearchAddress(item.area)}
                  activeOpacity={0.8}
                >
                  <LocationPinVector color="#ea4335" size={14} />
                  <Text style={styles.suggestionArea} numberOfLines={1}>{item.area}</Text>
                  <Text style={styles.suggestionPin}>{item.pin}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// -------------------------------------------------------------
// 10. AUTHENTIC GOOGLE MAPS THEME STYLESHEET
// -------------------------------------------------------------

const createStyles = (colors: ThemeColors, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#f4f3f0',
    },
    // Enterprise Radar Scanning Screen Styles
    scanOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8fafc',
      zIndex: 999,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanTopRow: {
      position: 'absolute',
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    scanHeaderTitleWrap: {
      alignItems: 'center',
    },
    scanHeaderTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: '#0f172a',
      letterSpacing: 1,
    },
    scanHeaderSub: {
      fontSize: 11,
      fontWeight: '500',
      color: '#64748b',
      marginTop: 2,
    },
    radarCenterStage: {
      width: 220,
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    sonarRing: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 2,
      borderColor: '#ff2d75',
      backgroundColor: 'rgba(255, 45, 117, 0.08)',
    },
    radarSweepBeam: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radarLaserLine: {
      position: 'absolute',
      top: 0,
      width: 2.5,
      height: 110,
      backgroundColor: '#ff2d75',
      shadowColor: '#ff2d75',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 8,
      elevation: 6,
    },
    radarSweepSector: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 110,
      height: 110,
      borderTopRightRadius: 110,
      backgroundColor: 'rgba(255, 45, 117, 0.12)',
    },
    scanUserCore: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#ff2d75',
      borderWidth: 3.5,
      borderColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#ff2d75',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 6,
      zIndex: 20,
    },
    scanUserCoreInner: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#ffffff',
    },
    scanUserTag: {
      position: 'absolute',
      bottom: 60,
      backgroundColor: '#0f172a',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      zIndex: 21,
    },
    scanUserTagText: {
      fontSize: 8.5,
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: 0.6,
    },
    orbitingAvatarNode: {
      position: 'absolute',
      alignItems: 'center',
      zIndex: 30,
    },
    avatarBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#ffffff',
      borderWidth: 2,
      borderColor: '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    avatarBubblePro: {
      borderColor: '#f59e0b',
      backgroundColor: '#fef3c7',
    },
    avatarBubbleText: {
      fontSize: 16,
      fontWeight: '900',
      color: '#b45309',
    },
    avatarDiamondBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#f59e0b',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#ffffff',
    },
    avatarCalloutTag: {
      backgroundColor: '#ffffff',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
      marginTop: 4,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
      alignItems: 'center',
    },
    avatarCalloutName: {
      fontSize: 9,
      fontWeight: '700',
      color: '#0f172a',
    },
    avatarCalloutDist: {
      fontSize: 8,
      fontWeight: '800',
      color: '#ff2d75',
    },
    scanBottomCard: {
      position: 'absolute',
      left: 20,
      right: 20,
      backgroundColor: '#ffffff',
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
      elevation: 8,
      alignItems: 'center',
    },
    scanStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    scanStatusIndicatorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ff2d75',
    },
    scanStatusHeadingText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#0f172a',
    },
    scanTerritoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#f8fafc',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      marginBottom: 14,
    },
    scanTerritoryText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#475569',
    },
    progressBarBg: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: '#f1f5f9',
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#ff2d75',
      borderRadius: 3,
    },
    scanVerifiedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    scanVerifiedNoticeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#059669',
    },
    fullBleedMapContainer: {
      flex: 1,
      position: 'relative',
      backgroundColor: '#f4f3f0',
    },
    floatingTopBarWrap: {
      position: 'absolute',
      left: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      zIndex: 50,
    },
    floatingCircleBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      flexShrink: 0,
    },
    floatingLocationCapsule: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.10)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 5,
      minWidth: 0,
      gap: 8,
    },
    locationContentWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      gap: 5,
    },
    capsuleCityText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#202124',
      flexShrink: 1,
    },
    capsuleDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: '#70757a',
      flexShrink: 0,
    },
    capsulePinText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#ea4335',
      flexShrink: 0,
    },
    capsuleSearchCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#f1f3f4',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    floatingFilterChipsRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 49,
    },
    filterChipsScroll: {
      paddingHorizontal: 14,
      gap: 6,
    },
    floatingFilterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderRadius: 20,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#dadce0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 4,
      elevation: 3,
    },
    floatingFilterPillActive: {
      backgroundColor: '#202124',
      borderColor: '#202124',
    },
    floatingFilterText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#3c4043',
    },
    floatingFilterTextActive: {
      color: '#ffffff',
    },
    floatingRightActions: {
      position: 'absolute',
      right: 14,
      zIndex: 48,
    },
    floatingActionIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    routeEtaPill: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#202124',
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.30,
      shadowRadius: 5,
      elevation: 6,
      zIndex: 15,
    },
    etaDotPulse: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#ff2d75',
    },
    routeEtaPillText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.3,
    },
    userGpsBeacon: {
      position: 'absolute',
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    userGpsSonarWave: {
      position: 'absolute',
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(66, 133, 244, 0.25)',
    },
    userGpsCorePoint: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#1a73e8',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#ffffff',
      shadowColor: '#1a73e8',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.45,
      shadowRadius: 4,
      elevation: 4,
    },
    userGpsWhiteCenter: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#ffffff',
    },
    userGpsTag: {
      position: 'absolute',
      bottom: -18,
      backgroundColor: '#ffffff',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#1a73e8',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    userGpsTagText: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: '#1a73e8',
    },
    googlePinAnchor: {
      position: 'absolute',
      alignItems: 'center',
      zIndex: 20,
    },
    googlePinAnchorSelected: {
      zIndex: 99,
    },
    googlePinCallout: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#ffffff',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#dadce0',
      marginBottom: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 4,
      maxWidth: 130,
    },
    googlePinCalloutSelected: {
      borderColor: '#ff2d75',
      backgroundColor: '#fff1f6',
    },
    proMiniBadge: {
      flexShrink: 0,
    },
    googlePinCalloutText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: '#202124',
      flexShrink: 1,
    },
    googlePinCalloutTextSelected: {
      color: '#ff2d75',
    },
    pinDistDot: {
      width: 2.5,
      height: 2.5,
      borderRadius: 1.25,
      backgroundColor: '#70757a',
      flexShrink: 0,
    },
    pinPriceText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#188038',
      flexShrink: 0,
    },
    pinPriceTextSelected: {
      color: '#ff2d75',
    },
    carouselContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 60,
    },
    carouselScrollPadding: {
      paddingHorizontal: 18,
      gap: 12,
    },
    carouselCardItem: {
      width: CARD_WIDTH,
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: '#dadce0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 10,
    },
    carouselCardItemSelected: {
      borderColor: '#ff2d75',
    },
    cardDragHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#dadce0',
      alignSelf: 'center',
      marginBottom: 10,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    cardAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#f1f3f4',
      borderWidth: 1.5,
      borderColor: '#dadce0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardAvatarPro: {
      borderColor: '#f59e0b',
      backgroundColor: '#fef3c7',
    },
    cardAvatarText: {
      fontSize: 18,
      fontWeight: '900',
      color: '#202124',
    },
    cardAvatarTextPro: {
      color: '#b45309',
    },
    cardInfoCol: {
      flex: 1,
      minWidth: 0,
    },
    cardTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    cardTitleText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#202124',
      letterSpacing: -0.3,
      flexShrink: 1,
    },
    proGoldBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#202124',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#f59e0b',
    },
    proGoldText: {
      fontSize: 8.5,
      fontWeight: '900',
      color: '#fbbf24',
      letterSpacing: 0.5,
    },
    cardOwnerSub: {
      fontSize: 11.5,
      fontWeight: '500',
      color: '#5f6368',
      marginBottom: 6,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    distanceBadgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#fef2f2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#fecaca',
    },
    distanceBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#ea4335',
    },
    etaBadgePill: {
      backgroundColor: '#f1f3f4',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#dadce0',
    },
    etaBadgeText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: '#3c4043',
    },
    pinBadgePill: {
      backgroundColor: '#f8fafc',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#dadce0',
    },
    pinExactBadgePill: {
      backgroundColor: '#e6f4ea',
      borderColor: '#a8dab5',
    },
    pinBadgeText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: '#5f6368',
    },
    pinExactBadgeText: {
      color: '#137333',
      fontWeight: '800',
    },
    cardServicesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: '#f1f3f4',
      gap: 6,
    },
    chipsWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
      minWidth: 0,
    },
    servicePill: {
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#dadce0',
      maxWidth: 110,
    },
    servicePillText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: '#3c4043',
    },
    priceHighlight: {
      fontSize: 12,
      fontWeight: '800',
      color: '#188038',
      flexShrink: 0,
    },
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    actionBtnCall: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: '#202124',
      paddingVertical: 10,
      borderRadius: 12,
    },
    actionBtnCallText: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#ffffff',
    },
    actionBtnWhatsApp: {
      flex: 1.4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: '#ff2d75',
      paddingVertical: 10,
      borderRadius: 12,
      shadowColor: '#ff2d75',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 4,
    },
    actionBtnWhatsAppText: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#ffffff',
    },
    actionBtnDirections: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: '#ffffff',
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1.2,
      borderColor: '#dadce0',
    },
    actionBtnDirectionsText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ea4335',
    },
    listTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f3f4',
    },
    listScrollContent: {
      padding: 14,
      gap: 12,
    },
    listHeaderBadgeRow: {
      marginBottom: 4,
    },
    listHeaderTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#202124',
      letterSpacing: -0.3,
    },
    listHeaderSub: {
      fontSize: 11,
      fontWeight: '500',
      color: '#5f6368',
      marginTop: 2,
    },
    listCard: {
      backgroundColor: '#ffffff',
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: '#dadce0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    listCardTop: {
      flexDirection: 'row',
      gap: 12,
    },
    listAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#f1f3f4',
      borderWidth: 1.5,
      borderColor: '#dadce0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    listAvatarPro: {
      borderColor: '#f59e0b',
      backgroundColor: '#fef3c7',
    },
    listAvatarText: {
      fontSize: 16,
      fontWeight: '900',
      color: '#202124',
    },
    listAvatarTextPro: {
      color: '#b45309',
    },
    listInfoWrap: {
      flex: 1,
      minWidth: 0,
    },
    listStudioName: {
      fontSize: 14,
      fontWeight: '800',
      color: '#202124',
      flexShrink: 1,
    },
    listOwnerName: {
      fontSize: 11,
      fontWeight: '500',
      color: '#5f6368',
      marginTop: 1,
    },
    listAddress: {
      fontSize: 10.5,
      fontWeight: '400',
      color: '#70757a',
      marginTop: 2,
    },
    listBadgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    ordersBadgePill: {
      backgroundColor: '#f1f3f4',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    ordersBadgeText: {
      fontSize: 9.5,
      fontWeight: '700',
      color: '#3c4043',
    },
    listCardDivider: {
      height: 1,
      backgroundColor: '#f1f3f4',
      marginVertical: 10,
    },
    listActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    btnCallSmall: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: '#202124',
      paddingVertical: 7,
      borderRadius: 10,
    },
    btnCallSmallText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ffffff',
    },
    btnWaSmall: {
      flex: 1.3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: '#ff2d75',
      paddingVertical: 7,
      borderRadius: 10,
    },
    btnWaSmallText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ffffff',
    },
    btnDirectionsSmall: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: '#ffffff',
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#dadce0',
    },
    btnDirectionsSmallText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#ea4335',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(32, 33, 36, 0.65)',
      justifyContent: 'flex-end',
    },
    modalSheetContainer: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      paddingBottom: 28,
      maxHeight: SCREEN_HEIGHT * 0.82,
    },
    modalSheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#dadce0',
      alignSelf: 'center',
      marginBottom: 14,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    modalStudioName: {
      fontSize: 18,
      fontWeight: '800',
      color: '#202124',
      letterSpacing: -0.4,
    },
    modalOwnerName: {
      fontSize: 12,
      fontWeight: '500',
      color: '#5f6368',
      marginTop: 2,
    },
    modalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#f1f3f4',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalStatsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: '#dadce0',
      marginBottom: 14,
    },
    modalStatCol: {
      flex: 1,
      alignItems: 'center',
    },
    modalStatVal: {
      fontSize: 14,
      fontWeight: '900',
      color: '#202124',
    },
    modalStatLabel: {
      fontSize: 9.5,
      fontWeight: '600',
      color: '#5f6368',
      marginTop: 2,
    },
    modalStatDivider: {
      width: 1,
      height: 24,
      backgroundColor: '#dadce0',
    },
    modalSectionCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: '#f1f3f4',
      marginBottom: 12,
    },
    modalSectionHeading: {
      fontSize: 10,
      fontWeight: '800',
      color: '#70757a',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    modalAddressText: {
      fontSize: 12.5,
      fontWeight: '500',
      color: '#3c4043',
      lineHeight: 18,
      marginBottom: 10,
    },
    modalDirectionsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#fef2f2',
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#fecaca',
    },
    modalDirectionsText: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#ea4335',
    },
    modalServiceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#f8f9fa',
    },
    modalServiceName: {
      fontSize: 12,
      fontWeight: '600',
      color: '#202124',
      flex: 1,
      paddingRight: 8,
    },
    modalServicePrice: {
      fontSize: 12,
      fontWeight: '800',
      color: '#188038',
    },
    modalGuaranteeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#e6f4ea',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: '#a8dab5',
      marginBottom: 14,
    },
    modalGuaranteeTitle: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#137333',
    },
    modalGuaranteeDesc: {
      fontSize: 10,
      fontWeight: '500',
      color: '#137333',
      marginTop: 2,
    },
    modalFooterRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    modalCallBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#202124',
      paddingVertical: 13,
      borderRadius: 14,
    },
    modalCallBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    modalWaBtn: {
      flex: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#ff2d75',
      paddingVertical: 13,
      borderRadius: 14,
      shadowColor: '#ff2d75',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    modalWaBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },
    pincodeModalCard: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      paddingBottom: 32,
    },
    searchInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: '#dadce0',
      paddingHorizontal: 14,
      marginVertical: 14,
      gap: 8,
    },
    pincodeInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      fontWeight: '600',
      color: '#202124',
    },
    applyPinBtn: {
      backgroundColor: '#ea4335',
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      shadowColor: '#ea4335',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 16,
    },
    applyPinText: {
      fontSize: 12,
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: 0.8,
    },
    suggestionsHeading: {
      fontSize: 10,
      fontWeight: '800',
      color: '#70757a',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    suggestionsGrid: {
      gap: 6,
    },
    suggestionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#dadce0',
      gap: 8,
    },
    suggestionArea: {
      fontSize: 12,
      fontWeight: '600',
      color: '#3c4043',
      flex: 1,
    },
    suggestionPin: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#ea4335',
    },
  });
