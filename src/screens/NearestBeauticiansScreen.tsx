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
  Line,
} from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { apiClient } from '../services/apiClient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 36;
const CARD_INTERVAL = CARD_WIDTH + 12;

// -------------------------------------------------------------
// 1. BESPOKE PREMIUM VECTOR ICONS (Zero Emojis, Zero Lollipops)
// -------------------------------------------------------------

const BackArrowVector: React.FC<{ color?: string; size?: number }> = ({ color = '#0f172a', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Modern Precision Target Locator (Replaces the cartoon lollipop pin)
const PrecisionTargetVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ff2d75', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} />
    <Circle cx={12} cy={12} r={3} fill={color} />
    <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Diamond Vector Icon for Pro Beauticians
const DiamondVector: React.FC<{ color?: string; size?: number }> = ({ color = '#f59e0b', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L2 9l10 13 10-13-10-13z" fill={color} />
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
      fill={color}
      fillOpacity={0.12}
    />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FilterSlidersVector: React.FC<{ color?: string; size?: number }> = ({ color = '#0f172a', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ChevronDownVector: React.FC<{ color?: string; size?: number }> = ({ color = '#0f172a', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StarFilledVector: React.FC<{ color?: string; size?: number }> = ({ color = '#fbbf24', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const NavigationArrowVector: React.FC<{ color?: string; size?: number }> = ({ color = '#ffffff', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L19 21L12 17L5 21L12 2Z" fill={color} />
  </Svg>
);

// -------------------------------------------------------------
// 2. REAL REGISTERED STUDIOS ROSTER (TAMIL NADU DIRECTORY)
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
  createdAt?: string;
}

const REGISTERED_STUDIOS_CATALOG: RegisteredMakeover[] = [
  {
    id: 'add09d3c-707a-4a01-9787-0932a837b0e2',
    businessName: 'Jo Makeovers',
    ownerName: 'Sankarajothi K',
    phone: '+919360396190',
    city: 'Kalugumalai',
    address: 'Main Bazaar Road, Near Murugan Temple, Kalugumalai - 628552',
    pincode: '628552',
    profilePhotoUrl: null,
    businessTypes: ['Bridal Artists', 'Makeup Artists'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 8,
    distanceKm: 0.6,
    isExactPincode: true,
    startingPrice: 4500,
    services: ['South Indian Bridal', 'Mehendi Design', 'Reception Look', 'Muhurtham Look'],
    latitude: 9.1447,
    longitude: 77.7081,
    mapX: 0.52,
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
    businessTypes: ['Beauticians', 'Hair Stylists'],
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
    mapX: 0.68,
    mapY: 0.48,
  },
  {
    id: 'kovilpatti-royal-628501',
    businessName: 'Kovilpatti Royal Bridal Studio',
    ownerName: 'Revathi Muthu',
    phone: '+919488334455',
    city: 'Kovilpatti',
    address: 'Main Road, Near Old Bus Stand, Kovilpatti - 628501',
    pincode: '628501',
    profilePhotoUrl: null,
    businessTypes: ['Bridal Artists', 'Mehndi Artists'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 6,
    distanceKm: 18.2,
    isExactPincode: false,
    startingPrice: 4000,
    services: ['Bridal Glow Package', 'Facials', 'Traditional Hair Do', 'Bridal Mehndi'],
    latitude: 9.1724,
    longitude: 77.8687,
    mapX: 0.82,
    mapY: 0.35,
  },
  {
    id: 'sankarankovil-glam-627756',
    businessName: 'Sankarankovil Bridal Glamour',
    ownerName: 'Gomathi R.',
    phone: '+919443889900',
    city: 'Sankarankovil',
    address: 'Rathna Theatre Road, Sankarankovil - 627756',
    pincode: '627756',
    profilePhotoUrl: null,
    businessTypes: ['Bridal Artists', 'Skin Care Specialists'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 5,
    distanceKm: 21.4,
    isExactPincode: false,
    startingPrice: 3800,
    services: ['Temple Bridal Saree Pleating', 'HD Airbrush Makeup', 'Skin Polishing'],
    latitude: 9.1711,
    longitude: 77.5342,
    mapX: 0.35,
    mapY: 0.42,
  },
  {
    id: 'tirunelveli-grace-627001',
    businessName: 'Tirunelveli Grace Makeovers',
    ownerName: 'Subhashini V.',
    phone: '+919788112233',
    city: 'Tirunelveli',
    address: 'Trivandrum High Road, Junction, Tirunelveli - 627001',
    pincode: '627001',
    profilePhotoUrl: null,
    businessTypes: ['Bridal Artists', 'Hair Stylists'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 7,
    distanceKm: 48.6,
    isExactPincode: false,
    startingPrice: 4200,
    services: ['Braided Flower Hairstyle', 'HD Makeup', 'Saree Pre-pleating'],
    latitude: 8.7139,
    longitude: 77.7567,
    mapX: 0.56,
    mapY: 0.72,
  },
  {
    id: 'divya-crown-chennai-600017',
    businessName: 'Divya Crown Makeovers',
    ownerName: 'Divya Krishnan',
    phone: '+919840123456',
    city: 'Chennai',
    address: 'Usman Road, T. Nagar, Chennai - 600017',
    pincode: '600017',
    profilePhotoUrl: null,
    businessTypes: ['Bridal Artists', 'Makeup Artists'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 16,
    distanceKm: 95.0,
    isExactPincode: false,
    startingPrice: 8500,
    services: ['Airbrush HD Bridal', 'Engagement Styling', 'Reception Glow'],
    latitude: 13.0418,
    longitude: 80.2341,
    mapX: 0.76,
    mapY: 0.28,
  },
  {
    id: '2c704aa6-5642-4b9e-8b8a-3be33a4e53f2',
    businessName: 'Shilpi Makeovers',
    ownerName: 'Shilpa R.',
    phone: '+919876543210',
    city: 'Coimbatore',
    address: 'Cross Cut Road, Gandhipuram, Coimbatore - 641002',
    pincode: '641002',
    profilePhotoUrl: null,
    businessTypes: ['Bridal Artists', 'Grooming Specialists'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 14,
    distanceKm: 120.0,
    isExactPincode: false,
    startingPrice: 6500,
    services: ['HD Bridal Makeup', 'Muhurtham Saree Draping', 'Airbrush Makeup'],
    latitude: 11.0168,
    longitude: 76.9558,
    mapX: 0.44,
    mapY: 0.30,
  },
  {
    id: 'ananya-bridal-madurai-625001',
    businessName: 'Ananya Bridal Artistry',
    ownerName: 'Ananya Meenakshi',
    phone: '+919443211223',
    city: 'Madurai',
    address: 'West Masi Street, Near Meenakshi Temple, Madurai - 625001',
    pincode: '625001',
    profilePhotoUrl: null,
    businessTypes: ['Bridal Artists', 'Mehndi Artists'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 11,
    distanceKm: 85.0,
    isExactPincode: false,
    startingPrice: 7000,
    services: ['Traditional Muhurtham Look', 'Jasmine Flower Styling', 'Kanjeevaram Draping'],
    latitude: 9.9252,
    longitude: 78.1198,
    mapX: 0.62,
    mapY: 0.32,
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
    businessTypes: ['Makeup Artists', 'Hair Stylists'],
    isPro: true,
    subscriptionTier: 'pro_monthly',
    verified: true,
    completedBookingsCount: 9,
    distanceKm: 122.0,
    isExactPincode: false,
    startingPrice: 5500,
    services: ['Bridal Makeover', 'Flower Hairstyling', 'Saree Pleating'],
    latitude: 11.0016,
    longitude: 76.9620,
    mapX: 0.78,
    mapY: 0.45,
  },
  {
    id: 'kavya-glamour-cbe-641004',
    businessName: 'Kavya Glamour Studio',
    ownerName: 'Kavya N.',
    phone: '+919629123456',
    city: 'Coimbatore',
    address: 'Avinashi Road, Peelamedu, Coimbatore - 641004',
    pincode: '641004',
    profilePhotoUrl: null,
    businessTypes: ['Beauticians', 'Skin Care Specialists'],
    isPro: false,
    subscriptionTier: 'free',
    verified: true,
    completedBookingsCount: 5,
    distanceKm: 124.0,
    isExactPincode: false,
    startingPrice: 3800,
    services: ['Party Makeup', 'Hair Spa', 'Draping'],
    latitude: 11.0260,
    longitude: 77.0010,
    mapX: 0.38,
    mapY: 0.55,
  },
  {
    id: 'meera-traditional-madurai-625002',
    businessName: 'Meera Traditional Bridal Art',
    ownerName: 'Meera Sundar',
    phone: '+919790445566',
    city: 'Madurai',
    address: 'South Veli Street, Madurai - 625002',
    pincode: '625002',
    profilePhotoUrl: null,
    businessTypes: ['Mehndi Artists', 'Bridal Artists'],
    isPro: false,
    subscriptionTier: 'free',
    verified: true,
    completedBookingsCount: 4,
    distanceKm: 87.0,
    isExactPincode: false,
    startingPrice: 4000,
    services: ['Bridal Mehendi', 'Muhurtham Saree Draping'],
    latitude: 9.9180,
    longitude: 78.1120,
    mapX: 0.65,
    mapY: 0.40,
  },
  {
    id: 'salem-pearl-636004',
    businessName: 'Salem Pearl Makeovers',
    ownerName: 'Lakshmi Priya',
    phone: '+919566778899',
    city: 'Salem',
    address: 'Brindavan Road, Fairlands, Salem - 636004',
    pincode: '636004',
    profilePhotoUrl: null,
    businessTypes: ['Beauticians', 'Bridal Artists'],
    isPro: false,
    subscriptionTier: 'free',
    verified: true,
    completedBookingsCount: 3,
    distanceKm: 175.0,
    isExactPincode: false,
    startingPrice: 3200,
    services: ['Bridal Glow', 'Saree Draping', 'Hair Styling'],
    latitude: 11.6643,
    longitude: 78.1460,
    mapX: 0.58,
    mapY: 0.22,
  },
];

const DEFAULT_PROFESSIONS = [
  'All Beauticians',
  'Bridal Artists',
  'Makeup Artists',
  'Hair Stylists',
  'Mehndi Artists',
  'Skin Care Specialists',
  'Beauticians',
  'Grooming Specialists',
];

const RANKING_LIMIT_OPTIONS = [
  { id: 'top_5', label: 'Top 5', limit: 5 },
  { id: 'top_10', label: 'Top 10', limit: 10 },
  { id: 'top_20', label: 'Top 20', limit: 20 },
  { id: 'top_50', label: 'Top 50', limit: 50 },
  { id: 'top_100', label: 'Top 100', limit: 100 },
  { id: 'all', label: 'All', limit: 9999 },
];

const POPULAR_LOCATIONS = [
  { pin: '628552', city: 'Kalugumalai', area: 'Main Bazaar, Kalugumalai' },
  { pin: '628501', city: 'Kovilpatti', area: 'New Road, Kovilpatti' },
  { pin: '627001', city: 'Tirunelveli', area: 'Junction, Tirunelveli' },
  { pin: '641002', city: 'Coimbatore', area: 'Gandhipuram, Coimbatore' },
  { pin: '641018', city: 'Coimbatore', area: 'Avinashi Road, Coimbatore' },
  { pin: '625001', city: 'Madurai', area: 'Town Center, Madurai' },
  { pin: '600017', city: 'Chennai', area: 'T. Nagar, Chennai' },
];

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
}

export const NearestBeauticiansScreen: React.FC<NearestBeauticiansScreenProps> = ({ onGoBack }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  // Section Selector: 'nearby' (50 KM) | 'all' (Directory + Pagination) | 'top' (Dynamic Ranking)
  const [activeSection, setActiveSection] = useState<'nearby' | 'all' | 'top'>('nearby');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Animation State (1:1 Video Match)
  const [isAnimationRunning, setIsAnimationRunning] = useState(true);
  const [animationStepText, setAnimationStepText] = useState('Finding your location');

  // Location & Search State
  const [userPincode, setUserPincode] = useState<string>('628552');
  const [userCity, setUserCity] = useState<string>('Kalugumalai');
  const [userAddress, setUserAddress] = useState<string>('Main Bazaar, Kalugumalai');
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number }>({ lat: 9.1447, lng: 77.7081 });

  // Data State
  const [studios, setStudios] = useState<RegisteredMakeover[]>(REGISTERED_STUDIOS_CATALOG);
  const [selectedStudio, setSelectedStudio] = useState<RegisteredMakeover>(REGISTERED_STUDIOS_CATALOG[0]);
  const [availableProfessions, setAvailableProfessions] = useState<string[]>(DEFAULT_PROFESSIONS);
  const [activeProfession, setActiveProfession] = useState<string>('All Beauticians');

  // Dynamic Top Ranking State
  const [rankingCriteria, setRankingCriteria] = useState<'combined' | 'bookings' | 'subscription'>('combined');
  const [rankingLimit, setRankingLimit] = useState<string>('top_10');
  const [rankingDropdownOpen, setRankingDropdownOpen] = useState(false);

  // Pagination for Section 2 (All Beauticians)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Advanced Filters State
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterRadius, setFilterRadius] = useState<number | null>(50); // 50 KM default
  const [filterSubscription, setFilterSubscription] = useState<'all' | 'pro' | 'free'>('all');
  const [filterBookingSort, setFilterBookingSort] = useState<'none' | 'most_bookings' | 'least_bookings'>('none');
  const [filterAdditional, setFilterAdditional] = useState<'none' | 'highest_rated' | 'most_experienced' | 'recent'>('none');
  const [searchNameQuery, setSearchNameQuery] = useState('');

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Animation values (Matching User Video Reference 1:1)
  const scanFadeAnim = useRef(new Animated.Value(1)).current;
  const pinDropAnim = useRef(new Animated.Value(-120)).current;
  const pinScaleAnim = useRef(new Animated.Value(0.4)).current;
  const shadowPulseAnim = useRef(new Animated.Value(0.4)).current;
  const radarSweepRotate = useRef(new Animated.Value(0)).current;
  const avatarPop1 = useRef(new Animated.Value(0)).current;
  const avatarPop2 = useRef(new Animated.Value(0)).current;
  const avatarPop3 = useRef(new Animated.Value(0)).current;
  const avatarPop4 = useRef(new Animated.Value(0)).current;
  const avatarPop5 = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;

  const cardListRef = useRef<FlatList>(null);

  // -------------------------------------------------------------
  // 3. ANIMATION LIFECYCLE (1:1 Match with User Video Reference)
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // 1. Center Target Jewel drops down from title
    Animated.parallel([
      Animated.timing(pinDropAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(pinScaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(shadowPulseAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Rotating radar sweep sector
    Animated.loop(
      Animated.timing(radarSweepRotate, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 3. Progress bar from 0% to 100%
    Animated.timing(progressBarAnim, {
      toValue: 1,
      duration: 3400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();

    // 4. Subtitle step transitions
    const step2Timer = setTimeout(() => {
      if (isMounted) {
        setAnimationStepText('Reading your PIN code');
        Animated.spring(avatarPop1, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }).start();
        Animated.spring(avatarPop2, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }).start();
      }
    }, 1300);

    const step3Timer = setTimeout(() => {
      if (isMounted) {
        setAnimationStepText('Beauticians found near you');
        Animated.spring(avatarPop3, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }).start();
        Animated.spring(avatarPop4, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }).start();
        Animated.spring(avatarPop5, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }).start();
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    }, 2400);

    // 5. Conclude animation
    const finishTimer = setTimeout(() => {
      if (isMounted) {
        Animated.timing(scanFadeAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          if (isMounted) {
            setIsAnimationRunning(false);
          }
        });
      }
    }, 3600);

    // Detect GPS Position & reverseGeocode
    async function initLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;
          setCustomerCoords({ lat, lng });

          const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (isMounted && geocode && geocode[0]) {
            const g = geocode[0];
            const detectedPin = g.postalCode || '628552';
            const detectedCity = g.city || g.subregion || g.district || 'Kalugumalai';
            const streetOrArea = g.street || g.name || g.district || '';
            const displayAddress = streetOrArea && streetOrArea !== detectedCity
              ? `${streetOrArea}, ${detectedCity}`
              : detectedCity;

            setUserPincode(detectedPin);
            setUserCity(detectedCity);
            setUserAddress(displayAddress);
          }
        }
      } catch (e) {
        console.warn('GPS initial detection notice:', e);
      }
    }

    initLocation();

    return () => {
      isMounted = false;
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(finishTimer);
    };
  }, []);

  // -------------------------------------------------------------
  // 4. ROBUST FILTERING ENGINE (CLIENT & BACKEND DUAL ENGINE)
  // -------------------------------------------------------------
  const computeAndFilterStudios = useCallback(() => {
    // Start with complete verified catalogue
    let pool = REGISTERED_STUDIOS_CATALOG.map((s) => {
      // Recompute real distance from customer coords
      const dist = haversineDistance(customerCoords.lat, customerCoords.lng, s.latitude, s.longitude);
      return {
        ...s,
        distanceKm: dist,
        isExactPincode: s.pincode === userPincode,
      };
    });

    // 1. Section 1: Nearby Beauticians (50 KM radius)
    if (activeSection === 'nearby') {
      const radius = filterRadius !== null ? filterRadius : 50;
      pool = pool.filter((s) => s.distanceKm <= radius);
      pool.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    // 2. Section 2: All Beauticians
    else if (activeSection === 'all') {
      if (searchNameQuery.trim()) {
        const q = searchNameQuery.toLowerCase().trim();
        pool = pool.filter(
          (s) =>
            s.businessName.toLowerCase().includes(q) ||
            s.ownerName.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.address.toLowerCase().includes(q) ||
            s.pincode.includes(q)
        );
      }
      pool.sort((a, b) => {
        if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
        return b.completedBookingsCount - a.completedBookingsCount;
      });
    }

    // 3. Section 3: Top Beauticians (Dynamic Ranking)
    else if (activeSection === 'top') {
      if (rankingCriteria === 'bookings') {
        pool.sort((a, b) => b.completedBookingsCount - a.completedBookingsCount || a.distanceKm - b.distanceKm);
      } else if (rankingCriteria === 'subscription') {
        pool.sort((a, b) => {
          if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
          return b.completedBookingsCount - a.completedBookingsCount;
        });
      } else {
        // Combined: Pro priority, then bookings, then distance
        pool.sort((a, b) => {
          if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
          if (b.completedBookingsCount !== a.completedBookingsCount) {
            return b.completedBookingsCount - a.completedBookingsCount;
          }
          return a.distanceKm - b.distanceKm;
        });
      }

      // Dynamic Limit (Top 5, Top 10, Top 20, Top 50, Top 100, All)
      const opt = RANKING_LIMIT_OPTIONS.find((r) => r.id === rankingLimit);
      if (opt && opt.limit < 9999) {
        pool = pool.slice(0, opt.limit);
      }
    }

    // 4. Profession-based Filtering (Section 4)
    if (activeProfession && activeProfession !== 'All Beauticians') {
      const pLower = activeProfession.toLowerCase();
      pool = pool.filter(
        (s) =>
          s.businessTypes.some((t) => t.toLowerCase().includes(pLower)) ||
          s.services.some((srv) => srv.toLowerCase().includes(pLower))
      );
    }

    // 5. Advanced Filter Overrides (Section 5)
    if (filterSubscription === 'pro') {
      pool = pool.filter((s) => s.isPro);
    } else if (filterSubscription === 'free') {
      pool = pool.filter((s) => !s.isPro);
    }

    if (filterBookingSort === 'most_bookings') {
      pool.sort((a, b) => b.completedBookingsCount - a.completedBookingsCount);
    } else if (filterBookingSort === 'least_bookings') {
      pool.sort((a, b) => a.completedBookingsCount - b.completedBookingsCount);
    }

    setStudios(pool);
    if (pool.length > 0) {
      setSelectedStudio(pool[0]);
    }
  }, [
    activeSection,
    customerCoords,
    userPincode,
    filterRadius,
    searchNameQuery,
    rankingCriteria,
    rankingLimit,
    activeProfession,
    filterSubscription,
    filterBookingSort,
  ]);

  // Sync data on any parameter change
  useEffect(() => {
    computeAndFilterStudios();
  }, [computeAndFilterStudios]);

  // Handle location selection from change modal
  const handleSelectLocation = (areaName: string, pin: string, city: string) => {
    setUserAddress(areaName);
    setUserPincode(pin);
    setUserCity(city);

    // Resolve base coordinate
    if (pin === '628552') setCustomerCoords({ lat: 9.1447, lng: 77.7081 });
    else if (pin.startsWith('641')) setCustomerCoords({ lat: 11.0168, lng: 76.9558 });
    else if (pin.startsWith('600')) setCustomerCoords({ lat: 13.0418, lng: 80.2341 });
    else if (pin.startsWith('625')) setCustomerCoords({ lat: 9.9252, lng: 78.1198 });
    else if (pin.startsWith('627')) setCustomerCoords({ lat: 8.7139, lng: 77.7567 });
    else if (pin === '628501') setCustomerCoords({ lat: 9.1724, lng: 77.8687 });

    setSearchModalOpen(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterRadius !== 50 && filterRadius !== null) count++;
    if (filterSubscription !== 'all') count++;
    if (filterBookingSort !== 'none') count++;
    if (filterAdditional !== 'none') count++;
    if (activeProfession !== 'All Beauticians') count++;
    return count;
  }, [filterRadius, filterSubscription, filterBookingSort, filterAdditional, activeProfession]);

  const handleClearFilters = () => {
    setFilterRadius(50);
    setFilterSubscription('all');
    setFilterBookingSort('none');
    setFilterAdditional('none');
    setActiveProfession('All Beauticians');
    setSearchNameQuery('');
    setFilterModalOpen(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const spinInterpolation = radarSweepRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.screen}>
      {/* -------------------------------------------------------------
          A. REPLACEMENT ANIMATION: 1:1 MATCH WITH VIDEO REFERENCE
         ------------------------------------------------------------- */}
      {isAnimationRunning && (
        <Animated.View style={[styles.animationOverlay, { opacity: scanFadeAnim }]}>
          {/* Top Shilpi Brand Title */}
          <View style={[styles.animTopHeader, { top: insets.top + 28 }]}>
            <Text style={styles.animBrandTitle}>Shilpi</Text>
          </View>

          {/* Center Stage: Grid, Concentric Rings & Rotating Sweep */}
          <View style={styles.animCenterStage}>
            {/* Street Grid Lines (Delicate Rose `#fbcfe8`) */}
            <Svg width={300} height={300} style={StyleSheet.absoluteFill}>
              <Line x1="15" y1="90" x2="285" y2="80" stroke="#fbcfe8" strokeWidth={1.5} />
              <Line x1="0" y1="130" x2="300" y2="125" stroke="#fbcfe8" strokeWidth={1.5} />
              <Line x1="10" y1="210" x2="290" y2="215" stroke="#fbcfe8" strokeWidth={1.5} />
              <Line x1="85" y1="10" x2="105" y2="290" stroke="#fbcfe8" strokeWidth={1.5} />
              <Line x1="210" y1="10" x2="195" y2="290" stroke="#fbcfe8" strokeWidth={1.5} />
            </Svg>

            {/* Outer Dotted Circle */}
            <View style={styles.animCircleOuter} />

            {/* Middle Dashed Circle */}
            <View style={styles.animCircleMiddle} />

            {/* Inner Solid Pink Ring */}
            <View style={styles.animCircleInner} />

            {/* Radial Connector Dashed Guides */}
            <Svg width={300} height={300} style={StyleSheet.absoluteFill}>
              <Line x1="150" y1="150" x2="80" y2="70" stroke="#f472b6" strokeWidth={1} strokeDasharray="3,3" />
              <Line x1="150" y1="150" x2="225" y2="65" stroke="#f472b6" strokeWidth={1} strokeDasharray="3,3" />
              <Line x1="150" y1="150" x2="230" y2="175" stroke="#f472b6" strokeWidth={1} strokeDasharray="3,3" />
              <Line x1="150" y1="150" x2="170" y2="235" stroke="#f472b6" strokeWidth={1} strokeDasharray="3,3" />
              <Line x1="150" y1="150" x2="70" y2="185" stroke="#f472b6" strokeWidth={1} strokeDasharray="3,3" />
            </Svg>

            {/* Rotating Translucent Pink Radar Sweep Beam */}
            <Animated.View style={[styles.radarSweepSectorWrap, { transform: [{ rotate: spinInterpolation }] }]}>
              <Svg width={140} height={140} viewBox="0 0 100 100">
                <Defs>
                  <LinearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#f472b6" stopOpacity={0.85} />
                    <Stop offset="100%" stopColor="#ff2d75" stopOpacity={0.15} />
                  </LinearGradient>
                </Defs>
                <Path d="M0 100 L100 0 A100 100 0 0 1 100 100 Z" fill="url(#sweepGrad)" />
              </Svg>
            </Animated.View>

            {/* Center Ground Anchor Glow */}
            <Animated.View style={[styles.animPinShadow, { transform: [{ scale: shadowPulseAnim }] }]} />

            {/* Central Precision Target Locator (Zero Lollipop) */}
            <Animated.View
              style={[
                styles.animCenterPinWrap,
                {
                  transform: [{ translateY: pinDropAnim }, { scale: pinScaleAnim }],
                },
              ]}
            >
              <View style={styles.centerPrecisionBeacon}>
                <View style={styles.centerBeaconCore}>
                  <NavigationArrowVector color="#ffffff" size={16} />
                </View>
              </View>
            </Animated.View>

            {/* Orbiting Beautician Avatar 1 (Top Left) */}
            <Animated.View style={[styles.avatarBubbleAnchor, { top: 38, left: 45, transform: [{ scale: avatarPop1 }] }]}>
              <View style={[styles.avatarBubbleCircle, { borderColor: '#e11d48' }]}>
                <Text style={styles.avatarBubbleChar}>J</Text>
                <View style={styles.avatarStarBadge}>
                  <StarFilledVector color="#ffffff" size={8} />
                </View>
              </View>
            </Animated.View>

            {/* Orbiting Beautician Avatar 2 (Top Right) */}
            <Animated.View style={[styles.avatarBubbleAnchor, { top: 32, right: 40, transform: [{ scale: avatarPop2 }] }]}>
              <View style={[styles.avatarBubbleCircle, { borderColor: '#db2777' }]}>
                <Text style={styles.avatarBubbleChar}>N</Text>
                <View style={styles.avatarStarBadge}>
                  <StarFilledVector color="#ffffff" size={8} />
                </View>
              </View>
            </Animated.View>

            {/* Orbiting Beautician Avatar 3 (Mid Right) */}
            <Animated.View style={[styles.avatarBubbleAnchor, { top: 140, right: 35, transform: [{ scale: avatarPop3 }] }]}>
              <View style={[styles.avatarBubbleCircle, { borderColor: '#f43f5e' }]}>
                <Text style={styles.avatarBubbleChar}>R</Text>
                <View style={styles.avatarStarBadge}>
                  <StarFilledVector color="#ffffff" size={8} />
                </View>
              </View>
            </Animated.View>

            {/* Orbiting Beautician Avatar 4 (Bottom Center) */}
            <Animated.View style={[styles.avatarBubbleAnchor, { bottom: 28, right: 90, transform: [{ scale: avatarPop4 }] }]}>
              <View style={[styles.avatarBubbleCircle, { borderColor: '#e11d48' }]}>
                <Text style={styles.avatarBubbleChar}>G</Text>
                <View style={styles.avatarStarBadge}>
                  <StarFilledVector color="#ffffff" size={8} />
                </View>
              </View>
            </Animated.View>

            {/* Orbiting Beautician Avatar 5 (Mid Left) */}
            <Animated.View style={[styles.avatarBubbleAnchor, { top: 155, left: 35, transform: [{ scale: avatarPop5 }] }]}>
              <View style={[styles.avatarBubbleCircle, { borderColor: '#db2777' }]}>
                <Text style={styles.avatarBubbleChar}>S</Text>
                <View style={styles.avatarStarBadge}>
                  <StarFilledVector color="#ffffff" size={8} />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Subtitle Step Text in Luxury Serif Style */}
          <View style={[styles.animStepWrap, { bottom: insets.bottom + 110 }]}>
            <Text style={styles.animStepText}>{animationStepText}</Text>
          </View>

          {/* Slim Gradient Progress Bar at Bottom */}
          <View style={[styles.animProgressBarTrack, { bottom: insets.bottom + 45 }]}>
            <Animated.View
              style={[
                styles.animProgressBarFill,
                {
                  width: progressBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </Animated.View>
      )}

      {/* -------------------------------------------------------------
          B. DISCOVERY HEADER: SEARCH, LOCATION & VIEW TOGGLE
         ------------------------------------------------------------- */}
      <View style={[styles.topBarContainer, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarRow}>
          <TouchableOpacity style={styles.circleIconBtn} onPress={onGoBack} activeOpacity={0.8}>
            <BackArrowVector color="#0f172a" size={18} />
          </TouchableOpacity>

          {/* Location Capsule */}
          <TouchableOpacity
            style={styles.locationCapsule}
            onPress={() => setSearchModalOpen(true)}
            activeOpacity={0.85}
          >
            <PrecisionTargetVector color="#ff2d75" size={16} />
            <View style={styles.locationCapsuleTextWrap}>
              <Text style={styles.capsuleCityText} numberOfLines={1}>
                {userAddress || userCity}
              </Text>
              <View style={styles.capsuleDot} />
              <Text style={styles.capsulePinText}>{userPincode}</Text>
            </View>
            <View style={styles.capsuleArrowIcon}>
              <ChevronDownVector color="#64748b" size={13} />
            </View>
          </TouchableOpacity>

          {/* Advanced Filter Button with Count Badge */}
          <TouchableOpacity
            style={[styles.circleIconBtn, activeFiltersCount > 0 && styles.circleIconBtnActive]}
            onPress={() => setFilterModalOpen(true)}
            activeOpacity={0.8}
          >
            <FilterSlidersVector color={activeFiltersCount > 0 ? '#ffffff' : '#0f172a'} size={16} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* View Toggle (Map vs List) */}
          <TouchableOpacity
            style={[styles.circleIconBtn, viewMode === 'map' && { backgroundColor: '#ff2d75' }]}
            onPress={() => setViewMode((prev) => (prev === 'map' ? 'list' : 'map'))}
            activeOpacity={0.8}
          >
            {viewMode === 'map' ? (
              <ListVector color="#ffffff" size={16} />
            ) : (
              <CompassVector color="#0f172a" size={16} />
            )}
          </TouchableOpacity>
        </View>

        {/* -------------------------------------------------------------
            C. 3 CORE SECTIONS: NEARBY (50 KM) | ALL | TOP BEAUTICIANS
           ------------------------------------------------------------- */}
        <View style={styles.sectionTabsRow}>
          {/* Nearby Section (Strict 50 KM) */}
          <TouchableOpacity
            style={[styles.sectionTabPill, activeSection === 'nearby' && styles.sectionTabPillActive]}
            onPress={() => {
              setActiveSection('nearby');
              setFilterRadius(50);
            }}
            activeOpacity={0.8}
          >
            <PrecisionTargetVector color={activeSection === 'nearby' ? '#ffffff' : '#475569'} size={13} />
            <Text style={[styles.sectionTabText, activeSection === 'nearby' && styles.sectionTabTextActive, { marginLeft: 5 }]}>
              Nearby (50 KM)
            </Text>
          </TouchableOpacity>

          {/* All Beauticians Section */}
          <TouchableOpacity
            style={[styles.sectionTabPill, activeSection === 'all' && styles.sectionTabPillActive]}
            onPress={() => {
              setActiveSection('all');
              setFilterRadius(null);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.sectionTabText, activeSection === 'all' && styles.sectionTabTextActive]}>
              All Beauticians
            </Text>
          </TouchableOpacity>

          {/* Top Beauticians Section */}
          <TouchableOpacity
            style={[styles.sectionTabPill, activeSection === 'top' && styles.sectionTabPillActive]}
            onPress={() => {
              setActiveSection('top');
              setFilterRadius(null);
            }}
            activeOpacity={0.8}
          >
            <DiamondVector color={activeSection === 'top' ? '#ffffff' : '#f59e0b'} size={11} />
            <Text style={[styles.sectionTabText, activeSection === 'top' && styles.sectionTabTextActive, { marginLeft: 4 }]}>
              Top Beauticians
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 3 Dynamic Ranking Bar */}
        {activeSection === 'top' && (
          <View style={styles.topBeauticiansControlBar}>
            {/* Criteria: Combined | Most Bookings | Shilpi Pro */}
            <View style={styles.rankingCriteriaRow}>
              <TouchableOpacity
                style={[styles.criteriaChip, rankingCriteria === 'combined' && styles.criteriaChipActive]}
                onPress={() => setRankingCriteria('combined')}
              >
                <Text style={[styles.criteriaChipText, rankingCriteria === 'combined' && styles.criteriaChipTextActive]}>
                  Combined
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.criteriaChip, rankingCriteria === 'bookings' && styles.criteriaChipActive]}
                onPress={() => setRankingCriteria('bookings')}
              >
                <Text style={[styles.criteriaChipText, rankingCriteria === 'bookings' && styles.criteriaChipTextActive]}>
                  Most Bookings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.criteriaChip, rankingCriteria === 'subscription' && styles.criteriaChipActive]}
                onPress={() => setRankingCriteria('subscription')}
              >
                <Text style={[styles.criteriaChipText, rankingCriteria === 'subscription' && styles.criteriaChipTextActive]}>
                  Shilpi Pro
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dynamic Ranking Limit Dropdown (Top 5, Top 10, Top 20, Top 50, Top 100, All) */}
            <TouchableOpacity
              style={styles.rankingLimitDropdownBtn}
              onPress={() => setRankingDropdownOpen((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.rankingLimitDropdownText}>
                {RANKING_LIMIT_OPTIONS.find((r) => r.id === rankingLimit)?.label || 'Top 10'}
              </Text>
              <ChevronDownVector color="#0f172a" size={11} />
            </TouchableOpacity>
          </View>
        )}

        {/* Dynamic Limit Dropdown Menu */}
        {rankingDropdownOpen && activeSection === 'top' && (
          <View style={styles.rankingDropdownMenu}>
            {RANKING_LIMIT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.dropdownMenuItem, rankingLimit === opt.id && styles.dropdownMenuItemActive]}
                onPress={() => {
                  setRankingLimit(opt.id);
                  setRankingDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownMenuText, rankingLimit === opt.id && styles.dropdownMenuTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Section 2 Search by Name & Location */}
        {activeSection === 'all' && (
          <View style={styles.searchBarRow}>
            <SearchVector color="#64748b" size={15} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search by beautician name or location..."
              placeholderTextColor="#94a3b8"
              value={searchNameQuery}
              onChangeText={setSearchNameQuery}
            />
            {searchNameQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchNameQuery('')}>
                <CloseVector color="#94a3b8" size={14} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* -------------------------------------------------------------
            D. DYNAMIC PROFESSION CATEGORIES SCROLL
           ------------------------------------------------------------- */}
        <View style={styles.professionsScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.professionsScroll}>
            {availableProfessions.map((prof) => {
              const isSelected = activeProfession === prof;
              return (
                <TouchableOpacity
                  key={prof}
                  style={[styles.profPill, isSelected && styles.profPillActive]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setActiveProfession(prof);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.profPillText, isSelected && styles.profPillTextActive]}>
                    {prof}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* -------------------------------------------------------------
          E. MAIN CONTENT: MAP VIEW OR LIST VIEW
         ------------------------------------------------------------- */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {/* Authentic Google Maps Terrain */}
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Rect width="100%" height="100%" fill="#f4f3f0" />
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
              d={`M-10,${SCREEN_HEIGHT * 0.67} C${SCREEN_WIDTH * 0.30},${SCREEN_HEIGHT * 0.62} ${SCREEN_WIDTH * 0.62},${SCREEN_HEIGHT * 0.72} ${SCREEN_WIDTH + 10},${SCREEN_HEIGHT * 0.66} L${SCREEN_WIDTH + 10},${SCREEN_HEIGHT * 0.72} C${SCREEN_WIDTH * 0.62},${SCREEN_HEIGHT * 0.78} ${SCREEN_WIDTH * 0.30},${SCREEN_HEIGHT * 0.68} -10,${SCREEN_HEIGHT * 0.73} Z`}
              fill="#aadaff"
            />
            <Path d={`M-30,${SCREEN_HEIGHT * 0.36} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.36}`} stroke="#d5d3ce" strokeWidth={7} />
            <Path d={`M-30,${SCREEN_HEIGHT * 0.36} L${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.36}`} stroke="#ffffff" strokeWidth={5} />
            <Path
              d={`M-30,${SCREEN_HEIGHT * 0.44} Q${SCREEN_WIDTH * 0.45},${SCREEN_HEIGHT * 0.42} ${SCREEN_WIDTH + 30},${SCREEN_HEIGHT * 0.48}`}
              stroke="#fed7aa"
              strokeWidth={7}
            />
          </Svg>

          {/* User Location Radar Center Beacon */}
          <View style={[styles.userGpsPinWrap, { left: SCREEN_WIDTH * 0.50 - 20, top: SCREEN_HEIGHT * 0.46 - 20 }]}>
            <View style={styles.userGpsPulseRing} />
            <View style={styles.userGpsCenterDot} />
            <View style={styles.userGpsTag}>
              <Text style={styles.userGpsTagText}>YOU ({userPincode})</Text>
            </View>
          </View>

          {/* Modern Studio Vector Markers (Zero Lollipop Stalk) */}
          {studios.map((studio, idx) => {
            const isSelected = selectedStudio?.id === studio.id;
            const pinX = SCREEN_WIDTH * studio.mapX;
            const pinY = SCREEN_HEIGHT * studio.mapY;

            return (
              <TouchableOpacity
                key={studio.id}
                style={[
                  styles.modernMapMarkerWrap,
                  { left: pinX - 35, top: pinY - 45 },
                  isSelected && styles.modernMapMarkerWrapSelected,
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setSelectedStudio(studio);
                  if (cardListRef.current) {
                    cardListRef.current.scrollToIndex({ index: idx, animated: true });
                  }
                }}
                activeOpacity={0.88}
              >
                {/* Modern Studio Pill Badge */}
                <View style={[styles.modernStudioPill, isSelected && styles.modernStudioPillSelected]}>
                  {studio.isPro && (
                    <View style={{ marginRight: 3 }}>
                      <DiamondVector color="#f59e0b" size={10} />
                    </View>
                  )}
                  <Text style={[styles.modernStudioPillText, isSelected && styles.modernStudioPillTextSelected]} numberOfLines={1}>
                    {studio.businessName}
                  </Text>
                  <View style={styles.pinDistDot} />
                  <Text style={[styles.modernStudioDistText, isSelected && styles.modernStudioDistTextSelected]}>
                    {studio.distanceKm} km
                  </Text>
                </View>

                {/* Elevated Circular Beacon Jewel (No lollipop stalk!) */}
                <View
                  style={[
                    styles.beaconCircleJewel,
                    isSelected && styles.beaconCircleJewelSelected,
                    studio.isPro && styles.beaconCircleJewelPro,
                  ]}
                >
                  <Text
                    style={[
                      styles.beaconJewelText,
                      isSelected && styles.beaconJewelTextSelected,
                      studio.isPro && styles.beaconJewelTextPro,
                    ]}
                  >
                    {studio.businessName.charAt(0)}
                  </Text>
                </View>
                <View style={[styles.beaconGroundDot, isSelected && styles.beaconGroundDotSelected]} />
              </TouchableOpacity>
            );
          })}

          {/* Floating Re-center GPS Button */}
          <View style={[styles.floatingGpsBtn, { bottom: insets.bottom + 215 }]}>
            <TouchableOpacity
              style={styles.circleIconBtn}
              onPress={() => computeAndFilterStudios()}
              activeOpacity={0.85}
            >
              <CrosshairTargetVector color="#1a73e8" size={20} />
            </TouchableOpacity>
          </View>

          {/* Bottom Snapping Horizontal Card Carousel */}
          <View style={[styles.carouselContainer, { bottom: insets.bottom + 12 }]}>
            <FlatList
              ref={cardListRef}
              data={studios}
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
                if (studios[index] && studios[index].id !== selectedStudio.id) {
                  setSelectedStudio(studios[index]);
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
                      {/* Ranking Badge if Section is Top */}
                      {activeSection === 'top' && (
                        <View style={[styles.cardRankBadge, index < 3 && styles.cardRankBadgeTopThree]}>
                          <Text style={styles.cardRankBadgeText}>#{index + 1} Ranked</Text>
                        </View>
                      )}

                      <View style={styles.cardTopRow}>
                        <View style={[styles.cardAvatar, studio.isPro && styles.cardAvatarPro]}>
                          <Text style={[styles.cardAvatarChar, studio.isPro && styles.cardAvatarCharPro]}>
                            {studio.businessName.charAt(0)}
                          </Text>
                        </View>

                        <View style={styles.cardHeaderInfo}>
                          <View style={styles.cardTitleWrap}>
                            <Text style={styles.cardTitleText} numberOfLines={1}>
                              {studio.businessName}
                            </Text>
                            {studio.isPro ? (
                              <View style={styles.proGoldBadge}>
                                <DiamondVector color="#f59e0b" size={10} />
                                <Text style={styles.proGoldBadgeText}>PRO</Text>
                              </View>
                            ) : (
                              <VerifiedBadgeVector color="#ff2d75" size={13} />
                            )}
                          </View>

                          <Text style={styles.cardOwnerText} numberOfLines={1}>
                            By {studio.ownerName} · {studio.city}
                          </Text>

                          {/* Meta Row: Distance in KM, Completed Orders & Pin */}
                          <View style={styles.cardMetaRow}>
                            <View style={styles.distanceBadge}>
                              <PrecisionTargetVector color="#dc2626" size={11} />
                              <Text style={styles.distanceBadgeText}>{studio.distanceKm} km</Text>
                            </View>

                            <View style={styles.ordersBadge}>
                              <Text style={styles.ordersBadgeText}>{studio.completedBookingsCount} Orders</Text>
                            </View>

                            <View style={styles.pinBadge}>
                              <Text style={styles.pinBadgeText}>PIN {studio.pincode}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Services & Price */}
                      <View style={styles.cardServicesRow}>
                        <View style={styles.serviceChipsWrap}>
                          {studio.services.slice(0, 2).map((srv: string, sIdx: number) => (
                            <View key={`s-${sIdx}`} style={styles.serviceChip}>
                              <Text style={styles.serviceChipText} numberOfLines={1}>
                                {srv}
                              </Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.priceText}>From ₹{studio.startingPrice.toLocaleString('en-IN')}</Text>
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

                        <TouchableOpacity
                          style={styles.directionsActionBtn}
                          onPress={() => {
                            const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
                            const url = Platform.select({
                              ios: `${scheme}${studio.businessName}@${studio.latitude},${studio.longitude}`,
                              android: `${scheme}${studio.latitude},${studio.longitude}(${studio.businessName})`,
                            });
                            if (url) Linking.openURL(url);
                          }}
                        >
                          <MapNavigationVector color="#ea4335" size={12} />
                          <Text style={styles.directionsBtnText}>Directions</Text>
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
        // F. VERTICAL HIGH-CRAFT LIST VIEW
        // -------------------------------------------------------------
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {/* List Section Header */}
          <View style={styles.listHeaderRow}>
            <View>
              <Text style={styles.listHeaderTitle}>
                {studios.length} {activeSection === 'top' ? 'Top Ranked' : activeSection === 'nearby' ? 'Nearby (50 KM)' : 'All Registered'} Beauticians
              </Text>
              <Text style={styles.listHeaderSub}>
                {activeSection === 'nearby'
                  ? `Showing within 50 KM of ${userCity} · Sorted by distance`
                  : activeSection === 'top'
                  ? `Ranked by ${rankingCriteria} · Limited to ${rankingLimit.replace('top_', 'Top ')}`
                  : `All verified members across the platform`}
              </Text>
            </View>
          </View>

          {/* Studio List Cards */}
          {studios.map((studio, idx) => (
            <TouchableOpacity
              key={studio.id}
              style={styles.listCard}
              onPress={() => {
                setSelectedStudio(studio);
                setDetailModalOpen(true);
              }}
              activeOpacity={0.88}
            >
              {activeSection === 'top' && (
                <View style={[styles.cardRankBadge, idx < 3 && styles.cardRankBadgeTopThree]}>
                  <Text style={styles.cardRankBadgeText}>#{idx + 1} Ranked</Text>
                </View>
              )}

              <View style={styles.listCardTopRow}>
                <View style={[styles.cardAvatar, studio.isPro && styles.cardAvatarPro]}>
                  <Text style={[styles.cardAvatarChar, studio.isPro && styles.cardAvatarCharPro]}>
                    {studio.businessName.charAt(0)}
                  </Text>
                </View>

                <View style={styles.listCardInfo}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitleText} numberOfLines={1}>
                      {studio.businessName}
                    </Text>
                    {studio.isPro ? (
                      <View style={styles.proGoldBadge}>
                        <DiamondVector color="#f59e0b" size={9} />
                        <Text style={styles.proGoldBadgeText}>PRO</Text>
                      </View>
                    ) : (
                      <VerifiedBadgeVector color="#ff2d75" size={13} />
                    )}
                  </View>

                  <Text style={styles.cardOwnerText}>By {studio.ownerName} · {studio.city}</Text>
                  <Text style={styles.listAddressText} numberOfLines={1}>{studio.address}</Text>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.distanceBadge}>
                      <PrecisionTargetVector color="#dc2626" size={10} />
                      <Text style={styles.distanceBadgeText}>{studio.distanceKm} km</Text>
                    </View>
                    <View style={styles.ordersBadge}>
                      <Text style={styles.ordersBadgeText}>{studio.completedBookingsCount} Orders</Text>
                    </View>
                    <View style={styles.pinBadge}>
                      <Text style={styles.pinBadgeText}>PIN {studio.pincode}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.listDivider} />

              <View style={styles.listActionsRow}>
                <Text style={styles.priceText}>From ₹{studio.startingPrice.toLocaleString('en-IN')}</Text>

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
          ))}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* -------------------------------------------------------------
          G. ADVANCED FILTERS MODAL (SECTION 5)
         ------------------------------------------------------------- */}
      <Modal visible={filterModalOpen} transparent animationType="slide" onRequestClose={() => setFilterModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.filterSheetContainer}>
            <View style={styles.sheetHandle} />

            <View style={styles.filterSheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Advanced Filters</Text>
                <Text style={styles.sheetSubtitle}>Refine beauticians across Tamil Nadu</Text>
              </View>
              <TouchableOpacity onPress={() => setFilterModalOpen(false)} style={styles.sheetCloseBtn}>
                <CloseVector color="#0f172a" size={16} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_HEIGHT * 0.58 }}>
              {/* 1. Distance Radius */}
              <Text style={styles.filterGroupHeading}>LOCATION & RADIUS</Text>
              <View style={styles.filterPillsGrid}>
                {[
                  { label: 'Within 5 KM', val: 5 },
                  { label: 'Within 10 KM', val: 10 },
                  { label: 'Within 25 KM', val: 25 },
                  { label: 'Within 50 KM', val: 50 },
                  { label: 'Any Distance', val: null },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.filterChoicePill, filterRadius === item.val && styles.filterChoicePillActive]}
                    onPress={() => setFilterRadius(item.val)}
                  >
                    <Text style={[styles.filterChoiceText, filterRadius === item.val && styles.filterChoiceTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 2. Subscription Status */}
              <Text style={styles.filterGroupHeading}>SUBSCRIPTION TIER</Text>
              <View style={styles.filterPillsGrid}>
                {[
                  { label: 'All Members', val: 'all' },
                  { label: 'Shilpi Pro', val: 'pro', isPro: true },
                  { label: 'Free Members', val: 'free' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.filterChoicePill, filterSubscription === item.val && styles.filterChoicePillActive]}
                    onPress={() => setFilterSubscription(item.val as any)}
                  >
                    {item.isPro && (
                      <View style={{ marginRight: 4 }}>
                        <DiamondVector color={filterSubscription === 'pro' ? '#ffffff' : '#f59e0b'} size={11} />
                      </View>
                    )}
                    <Text style={[styles.filterChoiceText, filterSubscription === item.val && styles.filterChoiceTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. Booking Sorting */}
              <Text style={styles.filterGroupHeading}>BOOKING VOLUME</Text>
              <View style={styles.filterPillsGrid}>
                {[
                  { label: 'Standard Ranking', val: 'none' },
                  { label: 'Most Bookings', val: 'most_bookings' },
                  { label: 'Least Bookings', val: 'least_bookings' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.filterChoicePill, filterBookingSort === item.val && styles.filterChoicePillActive]}
                    onPress={() => setFilterBookingSort(item.val as any)}
                  >
                    <Text style={[styles.filterChoiceText, filterBookingSort === item.val && styles.filterChoiceTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 4. Additional Ranking Filters */}
              <Text style={styles.filterGroupHeading}>ADDITIONAL FILTERS</Text>
              <View style={styles.filterPillsGrid}>
                {[
                  { label: 'Highest Rated', val: 'highest_rated' },
                  { label: 'Most Experienced', val: 'most_experienced' },
                  { label: 'Recently Registered', val: 'recent' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.filterChoicePill, filterAdditional === item.val && styles.filterChoicePillActive]}
                    onPress={() => setFilterAdditional(item.val as any)}
                  >
                    <Text style={[styles.filterChoiceText, filterAdditional === item.val && styles.filterChoiceTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.filterSheetFooter}>
              <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleClearFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyFiltersBtn}
                onPress={() => {
                  setFilterModalOpen(false);
                  computeAndFilterStudios();
                }}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------------------
          H. LOCATION CHANGE MODAL
         ------------------------------------------------------------- */}
      <Modal visible={searchModalOpen} transparent animationType="fade" onRequestClose={() => setSearchModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.locationModalCard}>
            <View style={styles.filterSheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Change Preferred Location</Text>
                <Text style={styles.sheetSubtitle}>Find beauticians in any Tamil Nadu city or PIN</Text>
              </View>
              <TouchableOpacity onPress={() => setSearchModalOpen(false)} style={styles.sheetCloseBtn}>
                <CloseVector color="#0f172a" size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationInputWrap}>
              <SearchVector color="#64748b" size={16} />
              <TextInput
                style={styles.locationTextInput}
                placeholder="Enter city, area or 6-digit PIN code..."
                placeholderTextColor="#94a3b8"
                value={searchInput}
                onChangeText={setSearchInput}
                autoFocus
              />
            </View>

            <Text style={styles.filterGroupHeading}>FREQUENT CITIES</Text>
            <View style={styles.popularCitiesGrid}>
              {POPULAR_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={`${loc.city}-${loc.pin}`}
                  style={styles.popularCityPill}
                  onPress={() => handleSelectLocation(loc.area, loc.pin, loc.city)}
                >
                  <PrecisionTargetVector color="#ea4335" size={13} />
                  <Text style={styles.popularCityText} numberOfLines={1}>{loc.city}</Text>
                  <Text style={styles.popularCityPin}>{loc.pin}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------------------
          I. FULL STUDIO DETAILS MODAL
         ------------------------------------------------------------- */}
      <Modal visible={detailModalOpen} transparent animationType="slide" onRequestClose={() => setDetailModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.studioDetailSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.detailHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.detailStudioName} numberOfLines={1}>{selectedStudio?.businessName}</Text>
                  {selectedStudio?.isPro && (
                    <View style={styles.proGoldBadge}>
                      <DiamondVector color="#f59e0b" size={9} />
                      <Text style={styles.proGoldBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailOwnerName}>By {selectedStudio?.ownerName} · Verified Partner</Text>
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

              {/* Services & Packages */}
              <View style={styles.detailSectionBox}>
                <Text style={styles.detailSectionHeading}>SERVICES & PRICING</Text>
                {selectedStudio?.services.map((srv, idx) => (
                  <View key={`srv-${idx}`} style={styles.detailServiceRow}>
                    <Text style={styles.detailServiceName}>{srv}</Text>
                    <Text style={styles.detailServicePrice}>
                      ₹{(selectedStudio.startingPrice + idx * 1000).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Verified Shilpi Partner Guarantee */}
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

// -------------------------------------------------------------
// 6. PREMIUM MINIMALIST THEME STYLESHEET
// -------------------------------------------------------------

const createStyles = (colors: ThemeColors, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },

    // -------------------------------------------------------------
    // ANIMATION OVERLAY (1:1 Match with Video Reference)
    // -------------------------------------------------------------
    animationOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#fff0f3',
      zIndex: 9999,
      justifyContent: 'center',
      alignItems: 'center',
    },
    animTopHeader: {
      position: 'absolute',
      alignItems: 'center',
      zIndex: 10,
    },
    animBrandTitle: {
      fontSize: 24,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
      fontWeight: '600',
      color: '#db2777',
      letterSpacing: 0.5,
    },
    animCenterStage: {
      width: 300,
      height: 300,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    animCircleOuter: {
      position: 'absolute',
      width: 250,
      height: 250,
      borderRadius: 125,
      borderWidth: 1.2,
      borderColor: '#fbcfe8',
      borderStyle: 'dotted',
    },
    animCircleMiddle: {
      position: 'absolute',
      width: 195,
      height: 195,
      borderRadius: 97.5,
      borderWidth: 1.4,
      borderColor: '#f472b6',
      borderStyle: 'dashed',
    },
    animCircleInner: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 2,
      borderColor: '#e11d48',
      backgroundColor: 'rgba(255, 241, 242, 0.4)',
    },
    radarSweepSectorWrap: {
      position: 'absolute',
      width: 140,
      height: 140,
      justifyContent: 'center',
      alignItems: 'center',
    },
    animPinShadow: {
      position: 'absolute',
      width: 32,
      height: 12,
      borderRadius: 6,
      backgroundColor: 'rgba(225, 29, 72, 0.25)',
      bottom: 130,
    },
    animCenterPinWrap: {
      position: 'absolute',
      zIndex: 50,
      bottom: 132,
    },
    centerPrecisionBeacon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#e11d48',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2.5,
      borderColor: '#ffffff',
      shadowColor: '#e11d48',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 7,
    },
    centerBeaconCore: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarBubbleAnchor: {
      position: 'absolute',
      zIndex: 60,
    },
    avatarBubbleCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#ffffff',
      borderWidth: 2.2,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#e11d48',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 5,
    },
    avatarBubbleChar: {
      fontSize: 15,
      fontWeight: '800',
      color: '#0f172a',
    },
    avatarStarBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 15,
      height: 15,
      borderRadius: 7.5,
      backgroundColor: '#e11d48',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ffffff',
    },
    animStepWrap: {
      position: 'absolute',
      alignItems: 'center',
      width: '100%',
    },
    animStepText: {
      fontSize: 17,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
      fontWeight: '500',
      color: '#475569',
      letterSpacing: 0.3,
    },
    animProgressBarTrack: {
      position: 'absolute',
      width: SCREEN_WIDTH * 0.85,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'rgba(244, 114, 182, 0.22)',
      overflow: 'hidden',
    },
    animProgressBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: '#e11d48',
    },

    // -------------------------------------------------------------
    // TOP NAVIGATION & CAPSULE
    // -------------------------------------------------------------
    topBarContainer: {
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      zIndex: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 3,
    },
    topBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      gap: 8,
    },
    circleIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    circleIconBtnActive: {
      backgroundColor: '#ff2d75',
      borderColor: '#ff2d75',
    },
    filterBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 17,
      height: 17,
      borderRadius: 8.5,
      backgroundColor: '#0f172a',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#ffffff',
    },
    locationCapsule: {
      flex: 1,
      height: 40,
      backgroundColor: '#f8fafc',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    locationCapsuleTextWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 6,
      marginRight: 4,
    },
    capsuleCityText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#0f172a',
      maxWidth: '65%',
    },
    capsuleDot: {
      width: 3.5,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: '#94a3b8',
      marginHorizontal: 5,
    },
    capsulePinText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: '#64748b',
    },
    capsuleArrowIcon: {
      marginLeft: 2,
    },

    // -------------------------------------------------------------
    // SECTION TABS: NEARBY (50KM) | ALL | TOP BEAUTICIANS
    // -------------------------------------------------------------
    sectionTabsRow: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 6,
      gap: 6,
    },
    sectionTabPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: '#f1f5f9',
    },
    sectionTabPillActive: {
      backgroundColor: '#0f172a',
    },
    sectionTabText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#475569',
    },
    sectionTabTextActive: {
      color: '#ffffff',
    },

    // Top Beauticians Controls
    topBeauticiansControlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: '#fffbeb',
      borderTopWidth: 1,
      borderTopColor: '#fef3c7',
    },
    rankingCriteriaRow: {
      flexDirection: 'row',
      gap: 5,
    },
    criteriaChip: {
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 12,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#fde68a',
    },
    criteriaChipActive: {
      backgroundColor: '#f59e0b',
      borderColor: '#f59e0b',
    },
    criteriaChipText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#78350f',
    },
    criteriaChipTextActive: {
      color: '#ffffff',
    },
    rankingLimitDropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4.5,
      borderRadius: 12,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      gap: 4,
    },
    rankingLimitDropdownText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#0f172a',
    },
    rankingDropdownMenu: {
      position: 'absolute',
      right: 14,
      top: 135,
      backgroundColor: '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8,
      zIndex: 500,
      minWidth: 110,
      overflow: 'hidden',
    },
    dropdownMenuItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f8fafc',
    },
    dropdownMenuItemActive: {
      backgroundColor: '#fff1f2',
    },
    dropdownMenuText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#334155',
    },
    dropdownMenuTextActive: {
      color: '#e11d48',
      fontWeight: '800',
    },

    // Search Bar for Section 2
    searchBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 14,
      marginTop: 6,
      marginBottom: 2,
      paddingHorizontal: 10,
      height: 36,
      backgroundColor: '#f1f5f9',
      borderRadius: 10,
      gap: 6,
    },
    searchBarInput: {
      flex: 1,
      fontSize: 12,
      fontWeight: '500',
      color: '#0f172a',
      paddingVertical: 0,
    },

    // Dynamic Professions Scroll
    professionsScrollWrap: {
      paddingVertical: 6,
    },
    professionsScroll: {
      paddingHorizontal: 14,
      gap: 6,
    },
    profPill: {
      paddingHorizontal: 12,
      paddingVertical: 5.5,
      borderRadius: 14,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    profPillActive: {
      backgroundColor: '#ff2d75',
      borderColor: '#ff2d75',
    },
    profPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#475569',
    },
    profPillTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },

    // -------------------------------------------------------------
    // MODERN STUDIO BEACONS (ZERO LOLLIPOP STALK)
    // -------------------------------------------------------------
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    userGpsPinWrap: {
      position: 'absolute',
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 35,
    },
    userGpsPulseRing: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(26, 115, 232, 0.18)',
      borderWidth: 1.5,
      borderColor: '#1a73e8',
    },
    userGpsCenterDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#1a73e8',
      borderWidth: 2.5,
      borderColor: '#ffffff',
    },
    userGpsTag: {
      position: 'absolute',
      bottom: -18,
      backgroundColor: '#1a73e8',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    userGpsTagText: {
      fontSize: 8.5,
      fontWeight: '800',
      color: '#ffffff',
    },
    modernMapMarkerWrap: {
      position: 'absolute',
      width: 70,
      alignItems: 'center',
      zIndex: 40,
    },
    modernMapMarkerWrapSelected: {
      zIndex: 48,
    },
    modernStudioPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      paddingHorizontal: 7,
      paddingVertical: 3.5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      marginBottom: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
      maxWidth: 130,
    },
    modernStudioPillSelected: {
      backgroundColor: '#0f172a',
      borderColor: '#0f172a',
    },
    modernStudioPillText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#0f172a',
    },
    modernStudioPillTextSelected: {
      color: '#ffffff',
    },
    pinDistDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: '#94a3b8',
      marginHorizontal: 4,
    },
    modernStudioDistText: {
      fontSize: 8.5,
      fontWeight: '600',
      color: '#64748b',
    },
    modernStudioDistTextSelected: {
      color: '#cbd5e1',
    },
    beaconCircleJewel: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#ffffff',
      borderWidth: 2,
      borderColor: '#ff2d75',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    beaconCircleJewelSelected: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#0f172a',
      borderColor: '#ffffff',
      borderWidth: 2.5,
    },
    beaconCircleJewelPro: {
      borderColor: '#f59e0b',
      borderWidth: 2.5,
      backgroundColor: '#fffbeb',
    },
    beaconJewelText: {
      fontSize: 12,
      fontWeight: '900',
      color: '#ff2d75',
    },
    beaconJewelTextSelected: {
      color: '#ffffff',
      fontSize: 14,
    },
    beaconJewelTextPro: {
      color: '#b45309',
    },
    beaconGroundDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#ff2d75',
      marginTop: 2,
    },
    beaconGroundDotSelected: {
      backgroundColor: '#0f172a',
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    floatingGpsBtn: {
      position: 'absolute',
      right: 16,
      zIndex: 60,
    },

    // -------------------------------------------------------------
    // CAROUSEL STUDIO CARDS (MAP VIEW)
    // -------------------------------------------------------------
    carouselContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 70,
    },
    carouselPadding: {
      paddingHorizontal: 16,
      gap: 12,
    },
    carouselCard: {
      width: CARD_WIDTH,
      backgroundColor: '#ffffff',
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    carouselCardSelected: {
      borderColor: '#ff2d75',
      borderWidth: 1.8,
    },
    cardRankBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#f1f5f9',
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 6,
      marginBottom: 6,
    },
    cardRankBadgeTopThree: {
      backgroundColor: '#fef3c7',
    },
    cardRankBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#92400e',
    },
    cardTopRow: {
      flexDirection: 'row',
    },
    cardAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#f1f5f9',
      borderWidth: 1.5,
      borderColor: '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardAvatarPro: {
      borderColor: '#f59e0b',
      borderWidth: 2,
      backgroundColor: '#fffbeb',
    },
    cardAvatarChar: {
      fontSize: 16,
      fontWeight: '800',
      color: '#0f172a',
    },
    cardAvatarCharPro: {
      color: '#b45309',
    },
    cardHeaderInfo: {
      flex: 1,
    },
    cardTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardTitleText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#0f172a',
      flex: 1,
    },
    proGoldBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fffbeb',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#fde68a',
      gap: 3,
    },
    proGoldBadgeText: {
      fontSize: 8.5,
      fontWeight: '900',
      color: '#b45309',
    },
    cardOwnerText: {
      fontSize: 11,
      fontWeight: '500',
      color: '#64748b',
      marginTop: 1,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 5,
    },
    distanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fef2f2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 3,
    },
    distanceBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#dc2626',
    },
    ordersBadge: {
      backgroundColor: '#f0fdf4',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    ordersBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#16a34a',
    },
    pinBadge: {
      backgroundColor: '#f8fafc',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    pinBadgeText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: '#475569',
    },
    cardServicesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
    },
    serviceChipsWrap: {
      flexDirection: 'row',
      gap: 5,
      flex: 1,
    },
    serviceChip: {
      backgroundColor: '#f8fafc',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    serviceChipText: {
      fontSize: 10,
      fontWeight: '500',
      color: '#475569',
    },
    priceText: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#0f172a',
    },
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    callActionBtn: {
      flex: 1,
      height: 34,
      backgroundColor: '#0f172a',
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
    },
    waActionBtn: {
      flex: 1.2,
      height: 34,
      backgroundColor: '#16a34a',
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
    },
    directionsActionBtn: {
      flex: 1.1,
      height: 34,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
    },
    actionBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#ffffff',
    },
    directionsBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#0f172a',
    },

    // -------------------------------------------------------------
    // LIST VIEW STYLES
    // -------------------------------------------------------------
    listContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    listHeaderRow: {
      marginBottom: 12,
    },
    listHeaderTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#0f172a',
    },
    listHeaderSub: {
      fontSize: 11,
      fontWeight: '500',
      color: '#64748b',
      marginTop: 2,
    },
    listCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    listCardTopRow: {
      flexDirection: 'row',
    },
    listCardInfo: {
      flex: 1,
    },
    listAddressText: {
      fontSize: 10.5,
      color: '#64748b',
      marginTop: 2,
    },
    listDivider: {
      height: 1,
      backgroundColor: '#f1f5f9',
      marginVertical: 10,
    },
    listActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    btnSmallCall: {
      backgroundColor: '#0f172a',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    btnSmallWa: {
      backgroundColor: '#16a34a',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    // -------------------------------------------------------------
    // MODALS: FILTER, LOCATION & STUDIO DETAILS
    // -------------------------------------------------------------
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      justifyContent: 'flex-end',
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#cbd5e1',
      alignSelf: 'center',
      marginBottom: 14,
    },
    filterSheetContainer: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 18,
      paddingBottom: 28,
    },
    filterSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#0f172a',
    },
    sheetSubtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: '#64748b',
      marginTop: 2,
    },
    sheetCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterGroupHeading: {
      fontSize: 10.5,
      fontWeight: '800',
      color: '#94a3b8',
      letterSpacing: 0.8,
      marginTop: 14,
      marginBottom: 8,
    },
    filterPillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    filterChoicePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    filterChoicePillActive: {
      backgroundColor: '#0f172a',
      borderColor: '#0f172a',
    },
    filterChoiceText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: '#475569',
    },
    filterChoiceTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    filterSheetFooter: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 18,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
    },
    clearFiltersBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearFiltersText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#475569',
    },
    applyFiltersBtn: {
      flex: 1.6,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#ff2d75',
      justifyContent: 'center',
      alignItems: 'center',
    },
    applyFiltersText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },

    // Location Modal
    locationModalCard: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 18,
      paddingBottom: 32,
    },
    locationInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f1f5f9',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      gap: 8,
      marginBottom: 12,
    },
    locationTextInput: {
      flex: 1,
      fontSize: 13,
      color: '#0f172a',
    },
    popularCitiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    popularCityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      gap: 4,
    },
    popularCityText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#0f172a',
    },
    popularCityPin: {
      fontSize: 10,
      fontWeight: '500',
      color: '#64748b',
    },

    // Studio Detail Sheet
    studioDetailSheet: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 18,
      paddingBottom: 28,
    },
    detailHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    detailStudioName: {
      fontSize: 18,
      fontWeight: '800',
      color: '#0f172a',
    },
    detailOwnerName: {
      fontSize: 12,
      fontWeight: '500',
      color: '#64748b',
      marginTop: 2,
    },
    detailMetricsRow: {
      flexDirection: 'row',
      backgroundColor: '#f8fafc',
      borderRadius: 14,
      paddingVertical: 12,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    metricCol: {
      flex: 1,
      alignItems: 'center',
    },
    metricVal: {
      fontSize: 14,
      fontWeight: '800',
      color: '#0f172a',
    },
    metricLabel: {
      fontSize: 9.5,
      fontWeight: '500',
      color: '#64748b',
      marginTop: 2,
    },
    metricDivider: {
      width: 1,
      height: '60%',
      backgroundColor: '#cbd5e1',
      alignSelf: 'center',
    },
    detailSectionBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    detailSectionHeading: {
      fontSize: 10,
      fontWeight: '800',
      color: '#94a3b8',
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    detailAddressText: {
      fontSize: 12,
      color: '#334155',
      lineHeight: 18,
    },
    detailServiceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    detailServiceName: {
      fontSize: 12,
      fontWeight: '500',
      color: '#334155',
    },
    detailServicePrice: {
      fontSize: 12,
      fontWeight: '700',
      color: '#0f172a',
    },
    guaranteeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f0fdf4',
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#bbf7d0',
      marginTop: 12,
    },
    guaranteeTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: '#166534',
    },
    guaranteeSub: {
      fontSize: 10,
      color: '#15803d',
      marginTop: 1,
    },
    detailFooterRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    detailCallBtn: {
      flex: 1,
      height: 44,
      backgroundColor: '#0f172a',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    detailCallBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#ffffff',
    },
    detailWaBtn: {
      flex: 1.2,
      height: 44,
      backgroundColor: '#16a34a',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    detailWaBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
