import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Animated,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { apiClient } from '../services/apiClient';

// ----------------- Bespoke Luxury SVG Vector Icons ----------------- //

const BackArrowVectorIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LocationPinIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
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

const CrownProIcon = ({ color = '#f59e0b', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 4l3 12h14l3-12-5 6-5-6-5 6-5-6zM3 20h18v2H3v-2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
);

const StarIcon = ({ color = '#f59e0b', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const PhoneCallIcon = ({ color = '#ffffff', size = 15 }: { color?: string; size?: number }) => (
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

const WhatsAppIcon = ({ color = '#25D366', size = 16 }: { color?: string; size?: number }) => (
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

const MapNavigationIcon = ({ color = '#3b82f6', size = 15 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 11l19-9-9 19-2-8-8-2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseIcon = ({ color = '#64748b', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export interface NearbyBeautician {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  city: string | null;
  address: string | null;
  pincode: string | null;
  profilePhotoUrl: string | null;
  businessTypes: string[];
  isPremium: boolean;
  subscriptionTier: string;
  completedBookingsCount: number;
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  isExactPincode: boolean;
  startingPrice: number;
  services: string[];
}

interface NearestBeauticiansScreenProps {
  onGoBack: () => void;
}

const FILTER_TABS = [
  { id: 'all', label: 'All Artists' },
  { id: 'top5', label: '★ Top 5' },
  { id: 'premium', label: '👑 Shilpi Pro' },
  { id: 'bridal', label: 'Bridal Makeup' },
  { id: 'mehendi', label: 'Mehendi' },
  { id: 'hair', label: 'Hairstyling' },
];

export const NearestBeauticiansScreen: React.FC<NearestBeauticiansScreenProps> = ({ onGoBack }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [detectingGps, setDetectingGps] = useState(true);
  const [userPincode, setUserPincode] = useState<string>('641002');
  const [userCity, setUserCity] = useState<string>('Coimbatore');
  const [activeFilter, setActiveFilter] = useState('all');
  const [beauticians, setBeauticians] = useState<NearbyBeautician[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<NearbyBeautician | null>(null);
  const [manualLocationModalOpen, setManualLocationModalOpen] = useState(false);
  const [manualPincodeInput, setManualPincodeInput] = useState('');
  const [manualCityInput, setManualCityInput] = useState('');

  // Radar Pulse Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 2.2,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, pulseOpacity]);

  // Step 1: Detect GPS Location & Reverse-Geocode Pincode
  useEffect(() => {
    let isMounted = true;

    async function detectLocation() {
      setDetectingGps(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const geocode = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          if (isMounted && geocode && geocode[0]) {
            const first = geocode[0];
            const detectedPin = first.postalCode || '641002';
            const detectedCity = first.city || first.subregion || first.district || 'Coimbatore';
            setUserPincode(detectedPin);
            setUserCity(detectedCity);
            fetchBeauticians(detectedPin, detectedCity);
            return;
          }
        }
      } catch (err) {
        console.warn('GPS detection notice:', err);
      } finally {
        if (isMounted) {
          setDetectingGps(false);
        }
      }

      // Default fallback
      if (isMounted) {
        fetchBeauticians('641002', 'Coimbatore');
      }
    }

    detectLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  // Step 2: Fetch Beauticians from Live AWS Backend
  const fetchBeauticians = async (pincode: string, city: string) => {
    setLoading(true);
    try {
      const endpoint = `/discovery/beauticians?pincode=${encodeURIComponent(pincode)}&city=${encodeURIComponent(city)}`;
      const res = await apiClient.get(endpoint);

      if (res.data?.success && Array.isArray(res.data.data)) {
        setBeauticians(res.data.data);
      } else {
        // Fallback demo data if backend has zero records for that specific pincode
        setBeauticians(getFallbackBeauticians(pincode, city));
      }
    } catch {
      // Offline fallback for smooth demo experience
      setBeauticians(getFallbackBeauticians(pincode, city));
    } finally {
      setLoading(false);
    }
  };

  // Filter & Rank Data locally
  const filteredList = useMemo(() => {
    let list = [...beauticians];

    if (activeFilter === 'top5') {
      return list.slice(0, 5);
    }
    if (activeFilter === 'premium') {
      return list.filter((b) => b.isPremium);
    }
    if (activeFilter === 'bridal') {
      return list.filter((b) =>
        b.services.some((s) => s.toLowerCase().includes('bridal') || s.toLowerCase().includes('makeup'))
      );
    }
    if (activeFilter === 'mehendi') {
      return list.filter((b) =>
        b.services.some((s) => s.toLowerCase().includes('mehendi'))
      );
    }
    if (activeFilter === 'hair') {
      return list.filter((b) =>
        b.services.some((s) => s.toLowerCase().includes('hair'))
      );
    }

    return list;
  }, [beauticians, activeFilter]);

  // Actions
  const handleCall = (phone: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Calling unavailable', 'Could not open phone dialer.');
    });
  };

  const handleWhatsAppInquiry = (b: NearbyBeautician) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    const cleanPhone = b.phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${b.businessName}! ✨\n\nI found your studio profile on the Shilpi app. I would like to inquire about your availability and packages for a bridal / makeover booking.\n\nCould you please share your catalog and available dates?`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`).catch(() => {
      Alert.alert('WhatsApp not installed', 'Please install WhatsApp to chat with this beautician.');
    });
  };

  const handleOpenMaps = (b: NearbyBeautician) => {
    const query = encodeURIComponent(`${b.businessName}, ${b.address || ''}, ${b.city || ''} ${b.pincode || ''}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleApplyManualLocation = () => {
    const pin = manualPincodeInput.trim() || userPincode;
    const cty = manualCityInput.trim() || userCity;
    setUserPincode(pin);
    setUserCity(cty);
    setManualLocationModalOpen(false);
    fetchBeauticians(pin, cty);
  };

  return (
    <View style={styles.container}>
      {/* 1. Header with Back Button & Location Chip */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackArrowVectorIcon color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerKicker}>CUSTOMER DISCOVERY</Text>
            <Text style={styles.headerTitle}>Find Nearest Beautician</Text>
          </View>
        </View>

        {/* Location Chip with Radar Indicator */}
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => {
            setManualPincodeInput(userPincode);
            setManualCityInput(userCity);
            setManualLocationModalOpen(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.radarWrapper}>
            <Animated.View
              style={[
                styles.radarPulse,
                { transform: [{ scale: pulseAnim }], opacity: pulseOpacity, backgroundColor: colors.accent },
              ]}
            />
            <View style={[styles.radarCenterDot, { backgroundColor: colors.accent }]} />
          </View>

          <View style={{ flex: 1, paddingLeft: 6 }}>
            <Text style={styles.locationSubLabel}>CURRENT AREA / PINCODE</Text>
            <Text style={styles.locationMainText} numberOfLines={1}>
              {detectingGps ? 'Detecting GPS...' : `📍 ${userCity} · ${userPincode}`}
            </Text>
          </View>

          <View style={styles.locationChangeBtn}>
            <Text style={styles.locationChangeText}>CHANGE</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Filter Pills with Horizontal Scroll */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  setActiveFilter(tab.id);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Main Results Stream */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Locating verified beauticians in {userPincode}...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LocationPinIcon color="rgba(255,255,255,0.3)" size={48} />
          <Text style={styles.emptyTitle}>No Beauticians Found in {userPincode}</Text>
          <Text style={styles.emptySub}>
            Try changing your Pincode or searching for a nearby city area.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => setManualLocationModalOpen(true)}
          >
            <Text style={styles.emptyActionText}>ENTER ANOTHER PINCODE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredList.map((artist, idx) => (
            <TouchableOpacity
              key={artist.id}
              style={[
                styles.artistCard,
                artist.isPremium && styles.artistCardPremium,
              ]}
              onPress={() => setSelectedStudio(artist)}
              activeOpacity={0.92}
            >
              {/* Premium Gold Banner if Shilpi Pro */}
              {artist.isPremium && (
                <View style={styles.proBanner}>
                  <CrownProIcon color="#f59e0b" size={12} />
                  <Text style={styles.proBannerText}>SHILPI CERTIFIED PRO</Text>
                  <Text style={styles.proBannerSub}>TOP RATED</Text>
                </View>
              )}

              {/* Main Card Content */}
              <View style={styles.cardHeaderRow}>
                {/* Avatar / Logo */}
                <View style={styles.avatarWrap}>
                  {artist.profilePhotoUrl ? (
                    <Image source={{ uri: artist.profilePhotoUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: artist.isPremium ? '#fef3c7' : '#f1f5f9' }]}>
                      <Text style={[styles.avatarInitial, { color: artist.isPremium ? '#d97706' : '#0f172a' }]}>
                        {artist.businessName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Studio Info */}
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.studioName} numberOfLines={1}>
                      {artist.businessName}
                    </Text>
                  </View>
                  <Text style={styles.ownerName}>{artist.ownerName}</Text>

                  {/* Rating & Orders Metric */}
                  <View style={styles.statsRow}>
                    <View style={styles.ratingBadge}>
                      <StarIcon color="#f59e0b" size={11} />
                      <Text style={styles.ratingNumber}>{artist.rating}</Text>
                    </View>
                    <Text style={styles.ordersBadge}>
                      {artist.completedBookingsCount}+ Bookings Done
                    </Text>
                  </View>
                </View>
              </View>

              {/* Distance & Address row */}
              <View style={styles.addressRow}>
                <LocationPinIcon color="rgba(255,255,255,0.5)" size={13} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {artist.address || artist.city} · <Text style={{ color: colors.accent, fontWeight: '700' }}>{artist.distanceKm} km away</Text>
                </Text>
              </View>

              {/* Tags Row */}
              <View style={styles.tagsRow}>
                {artist.services.slice(0, 3).map((s, sIdx) => (
                  <View key={sIdx} style={styles.serviceTag}>
                    <Text style={styles.serviceTagText}>{s}</Text>
                  </View>
                ))}
                {artist.startingPrice ? (
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>From ₹{artist.startingPrice.toLocaleString()}</Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons Row */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(artist.phone)}
                  activeOpacity={0.8}
                >
                  <PhoneCallIcon color="#ffffff" size={14} />
                  <Text style={styles.callBtnText}>CALL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={() => handleWhatsAppInquiry(artist)}
                  activeOpacity={0.8}
                >
                  <WhatsAppIcon color="#25D366" size={16} />
                  <Text style={styles.whatsappBtnText}>INQUIRE ON WHATSAPP</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* 4. Studio Profile Detail Sheet Modal */}
      <Modal visible={Boolean(selectedStudio)} transparent animationType="slide" onRequestClose={() => setSelectedStudio(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedStudio(null)}>
          <View style={styles.detailSheetCard} onStartShouldSetResponder={() => true}>
            {/* Header with Close */}
            <View style={styles.detailSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailSheetKicker}>BEAUTICIAN PROFILE</Text>
                <Text style={styles.detailSheetTitle}>{selectedStudio?.businessName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStudio(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color="#64748b" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Pro Badge */}
              {selectedStudio?.isPremium && (
                <View style={styles.modalProCard}>
                  <CrownProIcon color="#f59e0b" size={16} />
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <Text style={styles.modalProTitle}>Verified Shilpi Pro Artist</Text>
                    <Text style={styles.modalProSub}>Top ranking bridal & makeover professional in {selectedStudio.city}</Text>
                  </View>
                </View>
              )}

              {/* Metrics Grid */}
              <View style={styles.detailMetricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>★ {selectedStudio?.rating}</Text>
                  <Text style={styles.metricLbl}>{selectedStudio?.reviewsCount} Client Reviews</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{selectedStudio?.completedBookingsCount}+</Text>
                  <Text style={styles.metricLbl}>Completed Weddings</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{selectedStudio?.distanceKm} km</Text>
                  <Text style={styles.metricLbl}>From Your Pincode</Text>
                </View>
              </View>

              {/* Location Details */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>STUDIO ADDRESS</Text>
                <Text style={styles.detailAddressText}>{selectedStudio?.address || 'RS Puram'}, {selectedStudio?.city} — {selectedStudio?.pincode}</Text>
                <TouchableOpacity style={styles.mapBtn} onPress={() => selectedStudio && handleOpenMaps(selectedStudio)}>
                  <MapNavigationIcon color="#3b82f6" size={14} />
                  <Text style={styles.mapBtnText}>Open in Google Maps for Directions</Text>
                </TouchableOpacity>
              </View>

              {/* Services Offered */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>SERVICES & SPECIALTIES</Text>
                <View style={styles.tagsRow}>
                  {selectedStudio?.services.map((s, idx) => (
                    <View key={idx} style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Direct Conversion Footer Buttons */}
            <View style={styles.detailFooterRow}>
              <TouchableOpacity
                style={styles.detailCallBtn}
                onPress={() => selectedStudio && handleCall(selectedStudio.phone)}
              >
                <PhoneCallIcon color="#ffffff" size={16} />
                <Text style={styles.detailCallText}>CALL ARTIST</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailWaBtn}
                onPress={() => selectedStudio && handleWhatsAppInquiry(selectedStudio)}
              >
                <WhatsAppIcon color="#ffffff" size={18} />
                <Text style={styles.detailWaText}>CHAT ON WHATSAPP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 5. Manual Pincode & City Search Modal */}
      <Modal visible={manualLocationModalOpen} transparent animationType="fade" onRequestClose={() => setManualLocationModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.manualModalCard}>
            <View style={styles.detailSheetHeader}>
              <View>
                <Text style={styles.detailSheetKicker}>LOCATION FILTER</Text>
                <Text style={styles.detailSheetTitle}>Change Search Pincode</Text>
              </View>
              <TouchableOpacity onPress={() => setManualLocationModalOpen(false)}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>ENTER 6-DIGIT PINCODE</Text>
            <TextInput
              style={styles.pincodeInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="e.g. 641002"
              placeholderTextColor="#64748b"
              value={manualPincodeInput}
              onChangeText={setManualPincodeInput}
            />

            <Text style={styles.inputLabel}>CITY (OPTIONAL)</Text>
            <TextInput
              style={styles.pincodeInput}
              placeholder="e.g. Coimbatore or Chennai"
              placeholderTextColor="#64748b"
              value={manualCityInput}
              onChangeText={setManualCityInput}
            />

            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyManualLocation}>
              <Text style={styles.applyBtnText}>SEARCH ARTISTS IN THIS PINCODE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Fallback demo data for immediate offline/Expo preview
function getFallbackBeauticians(pincode: string, city: string): NearbyBeautician[] {
  return [
    {
      id: 'demo-b1',
      businessName: 'Shilpi Makeovers & Bridal Studio',
      ownerName: 'Shilpa R.',
      phone: '+919876543210',
      city: city || 'Coimbatore',
      address: '14/2 RS Puram, West Club Road',
      pincode: pincode || '641002',
      profilePhotoUrl: null,
      businessTypes: ['Bridal Makeup', 'Airbrush HD', 'Hairstyling'],
      isPremium: true,
      subscriptionTier: 'premium',
      completedBookingsCount: 142,
      rating: 4.9,
      reviewsCount: 68,
      distanceKm: 0.8,
      isExactPincode: true,
      startingPrice: 8500,
      services: ['Bridal Makeover', 'HD Airbrush', 'Saree Draping', 'Mehendi'],
    },
    {
      id: 'demo-b2',
      businessName: 'Ananya Elegance Bridal Art',
      ownerName: 'Ananya S.',
      phone: '+919842100001',
      city: city || 'Coimbatore',
      address: 'Peelamedu, Near PSG Tech',
      pincode: '641004',
      profilePhotoUrl: null,
      businessTypes: ['Bridal Makeup', 'Hairstyling'],
      isPremium: true,
      subscriptionTier: 'premium',
      completedBookingsCount: 96,
      rating: 4.9,
      reviewsCount: 42,
      distanceKm: 2.1,
      isExactPincode: false,
      startingPrice: 6500,
      services: ['South Indian Bridal', 'Muhurtham Look', 'Reception Look'],
    },
    {
      id: 'demo-b3',
      businessName: 'Glamour Touch Studio',
      ownerName: 'Kavitha M.',
      phone: '+919842100002',
      city: city || 'Coimbatore',
      address: 'Saibaba Colony, NSR Road',
      pincode: '641011',
      profilePhotoUrl: null,
      businessTypes: ['Mehendi Artist', 'Bridal Makeup'],
      isPremium: false,
      subscriptionTier: 'standard',
      completedBookingsCount: 64,
      rating: 4.8,
      reviewsCount: 31,
      distanceKm: 3.4,
      isExactPincode: false,
      startingPrice: 4500,
      services: ['Bridal Mehendi', 'Party Makeup', 'Hairstyling'],
    },
    {
      id: 'demo-b4',
      businessName: 'Divya Hair & Makeover Lounge',
      ownerName: 'Divya P.',
      phone: '+919842100003',
      city: city || 'Coimbatore',
      address: 'Gandhipuram, Cross Cut Road',
      pincode: '641012',
      profilePhotoUrl: null,
      businessTypes: ['Hairstyling', 'Skin Care'],
      isPremium: false,
      subscriptionTier: 'standard',
      completedBookingsCount: 52,
      rating: 4.7,
      reviewsCount: 22,
      distanceKm: 4.1,
      isExactPincode: false,
      startingPrice: 4000,
      services: ['Advanced Hairstyling', 'Bridal Saree Pleating'],
    },
    {
      id: 'demo-b5',
      businessName: 'Mehendi Queen Studio',
      ownerName: 'Zainab F.',
      phone: '+919842100004',
      city: city || 'Coimbatore',
      address: 'Town Hall Main Road',
      pincode: '641001',
      profilePhotoUrl: null,
      businessTypes: ['Mehendi Artist'],
      isPremium: false,
      subscriptionTier: 'standard',
      completedBookingsCount: 48,
      rating: 4.8,
      reviewsCount: 19,
      distanceKm: 4.8,
      isExactPincode: false,
      startingPrice: 3500,
      services: ['Arabic Mehendi', 'Bridal Figures', 'Organic Henna'],
    },
  ];
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0f0f11',
    },
    header: {
      backgroundColor: '#000000',
      paddingTop: Platform.OS === 'ios' ? 54 : 38,
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      borderBottomWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#1c1c20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    headerTitleWrap: {
      flex: 1,
    },
    headerKicker: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: colors.accent,
      textTransform: 'uppercase',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.2,
      marginTop: 2,
    },
    locationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#18181c',
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    radarWrapper: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radarPulse: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    radarCenterDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    locationSubLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: 'rgba(255, 255, 255, 0.45)',
    },
    locationMainText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
      marginTop: 1,
    },
    locationChangeBtn: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    locationChangeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: colors.accent,
    },
    filterBar: {
      paddingVertical: 12,
      backgroundColor: '#0f0f11',
    },
    filterScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterPill: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: '#1c1c22',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    filterPillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    filterPillTextActive: {
      color: '#ffffff',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    artistCard: {
      backgroundColor: '#18181c',
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    artistCardPremium: {
      borderColor: 'rgba(245, 158, 11, 0.35)',
      backgroundColor: '#1a1916',
    },
    proBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      borderRadius: 8,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginBottom: 12,
      gap: 6,
      alignSelf: 'flex-start',
    },
    proBannerText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#f59e0b',
    },
    proBannerSub: {
      fontSize: 9,
      fontWeight: '700',
      color: 'rgba(245, 158, 11, 0.6)',
      marginLeft: 'auto',
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      overflow: 'hidden',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },
    avatarFallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontSize: 22,
      fontWeight: '800',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    studioName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.2,
    },
    ownerName: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.55)',
      marginTop: 1,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 3,
    },
    ratingNumber: {
      fontSize: 11,
      fontWeight: '700',
      color: '#f59e0b',
    },
    ordersBadge: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.6)',
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    addressText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
    },
    serviceTag: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    serviceTagText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.75)',
    },
    priceTag: {
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    priceTagText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#10b981',
    },
    cardActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    callBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#26262e',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 6,
    },
    callBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: '#ffffff',
    },
    whatsappBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(37, 211, 102, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(37, 211, 102, 0.3)',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      gap: 6,
    },
    whatsappBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: '#25D366',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    },
    loadingText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.6)',
      marginTop: 12,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#ffffff',
      marginTop: 14,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 18,
    },
    emptyActionBtn: {
      marginTop: 20,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
    },
    emptyActionText: {
      fontSize: 11.5,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: '#ffffff',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    detailSheetCard: {
      backgroundColor: '#18181c',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    detailSheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    detailSheetKicker: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.accent,
    },
    detailSheetTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#ffffff',
      marginTop: 2,
    },
    modalProCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      borderRadius: 12,
      padding: 10,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    modalProTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#f59e0b',
    },
    modalProSub: {
      fontSize: 10.5,
      color: 'rgba(255, 255, 255, 0.65)',
      marginTop: 1,
    },
    detailMetricsGrid: {
      flexDirection: 'row',
      backgroundColor: '#202026',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    metricItem: {
      flex: 1,
      alignItems: 'center',
    },
    metricVal: {
      fontSize: 16,
      fontWeight: '800',
      color: '#ffffff',
    },
    metricLbl: {
      fontSize: 9.5,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: 2,
    },
    metricDivider: {
      width: 1,
      height: '80%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignSelf: 'center',
    },
    detailSection: {
      marginBottom: 16,
    },
    detailSectionTitle: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: 'rgba(255, 255, 255, 0.45)',
      marginBottom: 6,
    },
    detailAddressText: {
      fontSize: 13,
      color: '#ffffff',
      lineHeight: 18,
    },
    mapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    mapBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#3b82f6',
    },
    detailFooterRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    detailCallBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#26262e',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      gap: 8,
    },
    detailCallText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: '#ffffff',
    },
    detailWaBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#25D366',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
      gap: 8,
    },
    detailWaText: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#ffffff',
    },
    manualModalCard: {
      backgroundColor: '#18181c',
      margin: 20,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: 'rgba(255, 255, 255, 0.55)',
      marginTop: 12,
      marginBottom: 6,
    },
    pincodeInput: {
      backgroundColor: '#202026',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    applyBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 18,
    },
    applyBtnText: {
      fontSize: 11.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#ffffff',
    },
  });
