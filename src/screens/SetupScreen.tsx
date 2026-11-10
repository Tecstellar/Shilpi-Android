import React, { useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';

interface SetupScreenProps {
  phone?: string;
  onCompleted: () => void;
}

type SetupStep = 'profile' | 'packages' | 'data' | 'tour';

interface PackageItem {
  id: string;
  name: string;
  price: number;
}

interface PackageGroup {
  name: string;
  items: PackageItem[];
}

const INITIAL_PKG_GROUPS: PackageGroup[] = [
  {
    name: 'Makeup',
    items: [
      { id: 'm1', name: 'Bridal Makeup', price: 15000 },
      { id: 'm2', name: 'Reception Makeup', price: 8000 },
      { id: 'm3', name: 'Party Makeup', price: 5000 },
    ],
  },
  {
    name: 'Hair Styling',
    items: [
      { id: 'h1', name: 'Bridal Hair', price: 3000 },
      { id: 'h2', name: 'Party Hair', price: 1500 },
    ],
  },
  {
    name: 'Saree Draping',
    items: [
      { id: 's1', name: 'Bridal Draping', price: 2000 },
      { id: 's2', name: 'Normal Draping', price: 1000 },
    ],
  },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  phone = '+919876543210',
  onCompleted,
}) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('profile');

  // Step 1: Profile State
  const [ownerName, setOwnerName] = useState('Shilpa R.');
  const [businessName, setBusinessName] = useState('Shilpi Makeovers');
  const [address, setAddress] = useState('12 Chinnaswamy Rd, Race Course');
  const [city, setCity] = useState('Coimbatore');
  const [pincode, setPincode] = useState('641002');

  // Step 2: Packages State
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>(INITIAL_PKG_GROUPS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceGroup, setNewServiceGroup] = useState('Makeup');

  // Step 3: Data Tasks State
  const [clientTaskDone, setClientTaskDone] = useState(false);
  const [bookingTaskDone, setBookingTaskDone] = useState(false);

  // Step 4: Tour Items State
  const [tourSeen, setTourSeen] = useState<{ [key: string]: boolean }>({
    home: true,
    expenses: false,
    reports: false,
  });

  // Step configuration matching prototype exactly
  const STEP_CONFIG = {
    profile: {
      kicker: 'STEP 1 OF 4 · YOUR BUSINESS',
      title: 'Tell us about your business',
      blurb: 'Name, business name and address — these appear on every client confirmation.',
      pct: '25%',
      cta: 'SAVE & CONTINUE',
      skippable: false,
    },
    packages: {
      kicker: 'STEP 2 OF 4 · PRICING',
      title: 'Set your pricing & services',
      blurb: 'Confirm what you offer and what you charge. You can edit any of it later.',
      pct: '50%',
      cta: 'SAVE PACKAGES',
      skippable: true,
    },
    data: {
      kicker: 'STEP 3 OF 4 · YOUR WORK',
      title: 'Add your prebooked orders',
      blurb: 'Bring in the clients and bookings you already have so nothing is missing.',
      pct: '75%',
      cta: 'DONE, CONTINUE',
      skippable: true,
    },
    tour: {
      kicker: 'STEP 4 OF 4 · TAKE A LOOK',
      title: 'Three places to know',
      blurb: 'Tap each one to see it, then finish — you are ready to run your business here.',
      pct: '100%',
      cta: 'FINISH SETUP',
      skippable: true,
    },
  };

  const currentConfig = STEP_CONFIG[currentStep];

  // Price update handler for packages
  const handleUpdatePrice = (groupName: string, itemId: string, newPriceStr: string) => {
    const num = parseInt(newPriceStr.replace(/[^0-9]/g, ''), 10) || 0;
    setPackageGroups((prev) =>
      prev.map((group) => {
        if (group.name !== groupName) return group;
        return {
          ...group,
          items: group.items.map((item) =>
            item.id === itemId ? { ...item, price: num } : item
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
    const priceNum = parseInt(newServicePrice.replace(/[^0-9]/g, ''), 10) || 3000;
    const newItem: PackageItem = {
      id: 'custom_' + Date.now(),
      name: newServiceName.trim(),
      price: priceNum,
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
    try {
      await AsyncStorage.setItem(
        '@shilpi_profile',
        JSON.stringify({ ownerName, businessName, address, city, pincode, phone })
      );
      await AsyncStorage.setItem('@shilpi_packages', JSON.stringify(packageGroups));
      await AsyncStorage.setItem('@shilpi_setup_done', 'true');

      // Attempt backend persistence
      try {
        await apiClient.post('/auth/register', {
          phone,
          ownerName,
          businessName,
          city,
          address,
        });
      } catch (err) {
        console.warn('Backend register sync skipped, using local persistence');
      }
    } catch (e) {
      console.warn('Setup persistence error', e);
    }
    onCompleted();
  };

  // Next step navigation handler
  const handleNext = () => {
    if (currentStep === 'profile') {
      if (!ownerName.trim() || !businessName.trim()) {
        Alert.alert('Required Fields', 'Please enter your name and business name.');
        return;
      }
      setCurrentStep('packages');
    } else if (currentStep === 'packages') {
      setCurrentStep('data');
    } else if (currentStep === 'data') {
      setCurrentStep('tour');
    } else if (currentStep === 'tour') {
      handleFinishSetup();
    }
  };

  // Skip handler
  const handleSkip = () => {
    if (currentStep === 'packages') {
      setCurrentStep('data');
    } else if (currentStep === 'data') {
      setCurrentStep('tour');
    } else if (currentStep === 'tour') {
      handleFinishSetup();
    }
  };

  // Back handler
  const handleBack = () => {
    if (currentStep === 'packages') setCurrentStep('profile');
    else if (currentStep === 'data') setCurrentStep('packages');
    else if (currentStep === 'tour') setCurrentStep('data');
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
        </View>

        {/* 3. STEP 1: Profile View */}
        {currentStep === 'profile' && (
          <View style={styles.stepContent}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Your name *</Text>
              <TextInput
                style={styles.inputField}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Shilpa R."
                placeholderTextColor="rgba(18,18,18,0.35)"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Business name *</Text>
              <TextInput
                style={styles.inputField}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Shilpi Makeovers"
                placeholderTextColor="rgba(18,18,18,0.35)"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Address *</Text>
              <TextInput
                style={[styles.inputField, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Street, area, city"
                placeholderTextColor="rgba(18,18,18,0.35)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>City *</Text>
                <TextInput
                  style={styles.inputField}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Coimbatore"
                  placeholderTextColor="rgba(18,18,18,0.35)"
                />
              </View>

              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>PIN code *</Text>
                <TextInput
                  style={styles.inputField}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="641002"
                  placeholderTextColor="rgba(18,18,18,0.35)"
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            <Text style={styles.helperNote}>
              All fields are required — they appear on every confirmation your clients receive.
            </Text>
          </View>
        )}

        {/* 4. STEP 2: Packages View */}
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
                        value={item.price ? item.price.toString() : ''}
                        onChangeText={(txt) => handleUpdatePrice(group.name, item.id, txt)}
                        keyboardType="numeric"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(group.name, item.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteIconText}>✕</Text>
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
                    placeholderTextColor="rgba(18,18,18,0.35)"
                    value={newServiceName}
                    onChangeText={setNewServiceName}
                  />
                </View>

                <View style={styles.twoColRow}>
                  <View style={[styles.fieldGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>Price (₹)</Text>
                    <TextInput
                      style={styles.addFormInput}
                      placeholder="6000"
                      placeholderTextColor="rgba(18,18,18,0.35)"
                      value={newServicePrice}
                      onChangeText={setNewServicePrice}
                      keyboardType="numeric"
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
                  onPress={() => setShowAddForm(true)}
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
                {clientTaskDone && <Text style={styles.checkMark}>✓</Text>}
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
                {bookingTaskDone && <Text style={styles.checkMark}>✓</Text>}
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
                {tourSeen.home && <Text style={styles.checkMark}>✓</Text>}
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
                {tourSeen.expenses && <Text style={styles.checkMark}>✓</Text>}
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
                {tourSeen.reports && <Text style={styles.checkMark}>✓</Text>}
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

        {/* 7. Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{currentConfig.cta}</Text>
          </TouchableOpacity>

          {currentConfig.skippable && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>SKIP FOR NOW</Text>
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
    paddingBottom: 40,
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
  inputField: {
    backgroundColor: '#fdf1e8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.1)',
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
    backgroundColor: '#fdf1e8',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  groupHeaderText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#121212',
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
    backgroundColor: '#fdf1e8',
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
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.15)',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addServiceBtnText: {
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '700',
    color: '#121212',
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
    borderColor: 'rgba(18, 18, 18, 0.07)',
    padding: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  addFormTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#121212',
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
    backgroundColor: '#fdf1e8',
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
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#e8276b',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#ffffff',
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
