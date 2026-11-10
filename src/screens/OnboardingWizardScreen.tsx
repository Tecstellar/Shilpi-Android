import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { apiClient } from '../services/apiClient';

const CheckVectorIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#e8276b" strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface OnboardingWizardScreenProps {
  phone: string;
  onCompleted: () => void;
}

interface ServiceItem {
  id: string;
  name: string;
  price: string;
}

const BUSINESS_TYPES = [
  'Bridal Makeup Artist',
  'Hair Stylist & Educator',
  'Nail & Lash Technician',
  'Mehendi & Henna Artist',
  'Saree Draper & Stylist',
  'Full Studio / Unisex Salon',
  'Freelance / Mobile Beautician',
];

const INITIAL_PACKAGES: ServiceItem[] = [
  { id: '1', name: 'Bridal Makeup & Hair', price: '15000' },
  { id: '2', name: 'Engagement Look', price: '8000' },
  { id: '3', name: 'Reception Styling', price: '10000' },
  { id: '4', name: 'Party Makeup', price: '4500' },
  { id: '5', name: 'Saree Draping & Hair', price: '3000' },
];

export const OnboardingWizardScreen: React.FC<OnboardingWizardScreenProps> = ({ phone, onCompleted }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Business Type
  const [selectedType, setSelectedType] = useState('Bridal Makeup Artist');

  // Step 2: Profile Fields
  const [ownerName, setOwnerName] = useState('Shilpa R.');
  const [businessName, setBusinessName] = useState('Shilpi Makeovers');
  const [address, setAddress] = useState('124 Cross Cut Road, Gandhipuram');
  const [city, setCity] = useState('Coimbatore');
  const [pincode, setPincode] = useState('641002');

  // Step 3: Packages
  const [packages, setPackages] = useState<ServiceItem[]>(INITIAL_PACKAGES);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);

  const handleUpdatePrice = (id: string, price: string) => {
    setPackages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price } : item))
    );
  };

  const handleAddCustomService = () => {
    if (!newServiceName.trim() || !newServicePrice.trim()) return;
    setPackages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newServiceName.trim(),
        price: newServicePrice.trim(),
      },
    ]);
    setNewServiceName('');
    setNewServicePrice('');
    setShowAddForm(false);
  };

  const handleFinishRegistration = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        phone,
        ownerName,
        businessName,
        activeTheme: 'signature',
        themeMode: 'dark',
        city,
      });

      if (response.data.success) {
        await AsyncStorage.setItem('@shilpi_token', response.data.token);
        onCompleted();
      } else {
        Alert.alert('Registration Error', response.data.error?.message || 'Failed to complete registration.');
      }
    } catch (e: any) {
      // In offline/mock mode, save local mock session
      await AsyncStorage.setItem('@shilpi_token', 'mock_offline_token');
      onCompleted();
    } finally {
      setLoading(false);
    }
  };

  // Progress percentage calculation
  const progressPercent = currentStep === 1 ? '25%' : currentStep === 2 ? '50%' : currentStep === 3 ? '75%' : '100%';

  return (
    <View style={styles.screen}>
      {/* Black Header with Progress Bar */}
      <View style={styles.headerBlack}>
        <View style={styles.kickerRow}>
          <Text style={styles.kickerText}>STEP {currentStep} OF 4</Text>
          <Text style={styles.percentText}>{progressPercent} COMPLETE</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: progressPercent }]} />
        </View>

        <Text style={styles.headerTitle}>
          {currentStep === 1 && 'What type of business do you run?'}
          {currentStep === 2 && 'Tell us about your studio'}
          {currentStep === 3 && 'Your services and rates'}
          {currentStep === 4 && 'All set! Welcome to Shilpi'}
        </Text>
        <Text style={styles.headerBlurb}>
          {currentStep === 1 && 'Your packages, reminders and reports will be personalized for your craft.'}
          {currentStep === 2 && 'All fields appear on every confirmation your clients receive.'}
          {currentStep === 3 && 'Suggested rates for bridal artists. You can edit any rate now or later.'}
          {currentStep === 4 && 'Your studio ledger is ready. Track bookings, payments, and client dues effortlessly.'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} bounces={false}>
        {/* STEP 1: BUSINESS TYPE */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            {BUSINESS_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeRow, isSelected && styles.typeRowSelected]}
                  onPress={() => setSelectedType(type)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* STEP 2: PROFILE DETAILS */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>YOUR NAME *</Text>
              <TextInput
                style={styles.fieldInput}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Shilpa R."
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>BUSINESS / STUDIO NAME *</Text>
              <TextInput
                style={styles.fieldInput}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Shilpi Makeovers"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>STUDIO ADDRESS *</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 70 }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Street, area, city"
                multiline
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>CITY *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Coimbatore"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>PIN CODE *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="641002"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: PACKAGES SETUP */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.subheading}>PACKAGES & SUGGESTED RATES</Text>
            {packages.map((pkg) => (
              <View key={pkg.id} style={styles.packageItemRow}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.rupeeSymbol}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="numeric"
                    value={pkg.price}
                    onChangeText={(val) => handleUpdatePrice(pkg.id, val)}
                  />
                </View>
              </View>
            ))}

            {showAddForm ? (
              <View style={styles.addServiceBox}>
                <Text style={styles.addServiceTitle}>NEW SERVICE</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="Service Name (e.g. Engagement Look)"
                  value={newServiceName}
                  onChangeText={setNewServiceName}
                />
                <TextInput
                  style={styles.addInput}
                  placeholder="Price (e.g. 5000)"
                  keyboardType="numeric"
                  value={newServicePrice}
                  onChangeText={setNewServicePrice}
                />
                <View style={styles.addBtnRow}>
                  <TouchableOpacity
                    style={styles.cancelSmallBtn}
                    onPress={() => setShowAddForm(false)}
                  >
                    <Text style={styles.cancelSmallText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveSmallBtn}
                    onPress={handleAddCustomService}
                  >
                    <Text style={styles.saveSmallText}>ADD SERVICE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addServiceTriggerBtn}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={styles.addServiceTriggerText}>＋ ADD CUSTOM SERVICE</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* STEP 4: SUMMARY & TOUR */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <View style={styles.checkIconWrap}>
                  <CheckVectorIcon />
                </View>
                <View style={styles.summaryTextGroup}>
                  <Text style={styles.summaryTitle}>Studio Profile</Text>
                  <Text style={styles.summaryDesc}>{businessName} · {city}</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <View style={styles.checkIconWrap}>
                  <CheckVectorIcon />
                </View>
                <View style={styles.summaryTextGroup}>
                  <Text style={styles.summaryTitle}>Service Catalog</Text>
                  <Text style={styles.summaryDesc}>{packages.length} active service packages configured</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <View style={styles.checkIconWrap}>
                  <CheckVectorIcon />
                </View>
                <View style={styles.summaryTextGroup}>
                  <Text style={styles.summaryTitle}>Client WhatsApp Dues</Text>
                  <Text style={styles.summaryDesc}>Instant booking confirmations & balance payment links enabled</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {currentStep < 4 ? (
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            onPress={() => setCurrentStep((prev) => (prev + 1) as any)}
          >
            <Text style={styles.primaryCtaText}>CONTINUE</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            onPress={handleFinishRegistration}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.primaryCtaText}>ENTER MY STUDIO</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  headerBlack: {
    backgroundColor: '#121212',
    paddingTop: 54,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  kickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kickerText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#c59b6d',
    fontWeight: '700',
  },
  percentText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#c59b6d',
  },
  headerTitle: {
    fontSize: 22,
    letterSpacing: -0.3,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 16,
  },
  headerBlurb: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 4,
    lineHeight: 18,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 100,
  },
  stepContainer: {
    gap: 12,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  typeRowSelected: {
    borderColor: '#121212',
    backgroundColor: '#ffffff',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(18, 18, 18, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioCircleActive: {
    borderColor: '#121212',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#121212',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#121212',
  },
  typeLabelSelected: {
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(18, 18, 18, 0.6)',
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#121212',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  subheading: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.6)',
    marginBottom: 4,
  },
  packageItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  packageName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#121212',
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  rupeeSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
    marginRight: 4,
  },
  priceInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
    minWidth: 60,
    textAlign: 'right',
    padding: 0,
  },
  addServiceTriggerBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.18)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  addServiceTriggerText: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#121212',
  },
  addServiceBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.15)',
    gap: 10,
  },
  addServiceTitle: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#8c6b3e',
  },
  addInput: {
    backgroundColor: '#f4f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelSmallBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.15)',
    borderRadius: 8,
  },
  cancelSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#121212',
  },
  saveSmallBtn: {
    flex: 2,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 8,
  },
  saveSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIconWrap: {
    marginRight: 10,
    marginTop: 2,
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
  },
  summaryDesc: {
    fontSize: 12,
    color: 'rgba(18, 18, 18, 0.6)',
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.07)',
    marginVertical: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(18, 18, 18, 0.08)',
  },
  primaryCtaBtn: {
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryCtaText: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
