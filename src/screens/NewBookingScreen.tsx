import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Colors } from '../theme/colors';
import {
  Client,
  PackageGroup,
  Booking,
  fmt,
  first,
} from '../data/prototypeData';

interface NewBookingScreenProps {
  clients: Client[];
  packageGroups: PackageGroup[];
  initialDay?: number;
  initialClientName?: string;
  onSaveBooking: (newBooking: Partial<Booking>) => void;
  onGoBack: () => void;
  onStartNewClient: () => void;
}

export const NewBookingScreen: React.FC<NewBookingScreenProps> = ({
  clients,
  packageGroups,
  initialDay,
  initialClientName,
  onSaveBooking,
  onGoBack,
  onStartNewClient,
}) => {
  const [selectedClient, setSelectedClient] = useState(
    initialClientName || clients[0]?.name || 'Priya Raghavan'
  );
  const [selectedDate, setSelectedDate] = useState(initialDay || 26);
  const [selectedPackages, setSelectedPackages] = useState<string[]>(['Bridal Makeup', 'Bridal Hair']);
  const [advanceText, setAdvanceText] = useState('8000');
  const [venue, setVenue] = useState('Sri Kamatchi Mahal, RS Puram');
  const [time, setTime] = useState('6:30 AM');

  // Flatten package items
  const allItems = packageGroups.reduce((acc, g) => acc.concat(g.items), [] as { name: string; price: number }[]);

  const togglePackage = (pkgName: string) => {
    setSelectedPackages((prev) =>
      prev.includes(pkgName) ? prev.filter((p) => p !== pkgName) : [...prev, pkgName]
    );
  };

  const travel = 1500;
  const packagesTotal = allItems
    .filter((item) => selectedPackages.includes(item.name))
    .reduce((sum, item) => sum + item.price, 0);

  const grandTotal = packagesTotal + travel;
  const advance = parseInt(advanceText.replace(/[^0-9]/g, '') || '0', 10);
  const balance = Math.max(grandTotal - advance, 0);

  const handleSave = () => {
    const selectedItems = allItems.filter((i) => selectedPackages.includes(i.name));
    onSaveBooking({
      ref: `Booking #${Math.floor(1000 + Math.random() * 9000)}`,
      client: selectedClient,
      day: selectedDate,
      month: 'Sep',
      dateLong: `Sat ${selectedDate} Sep 2026`,
      time: time.split(' ')[0] || '6:30',
      meridiem: time.includes('PM') ? 'PM' : 'AM',
      items: selectedItems.length > 0 ? selectedItems : [{ name: 'Custom Makeup Look', price: 10000 }],
      travel,
      advance,
      status: 'Upcoming',
      venue,
      address: 'Coimbatore',
      notes: 'New booking created from studio app.',
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Client Chip Selector */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>CLIENT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {clients.map((c) => {
            const isSel = selectedClient === c.name;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.clientChip, isSel && styles.clientChipActive]}
                onPress={() => setSelectedClient(c.name)}
                activeOpacity={0.8}
              >
                <Text style={[styles.clientChipText, isSel && styles.clientChipTextActive]}>
                  {first(c.name)}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.newClientChip}
            onPress={onStartNewClient}
            activeOpacity={0.8}
          >
            <Text style={styles.newClientText}>＋ New client</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 2. Date Selection Strip */}
      <View style={styles.sectionCard}>
        <View style={styles.dateHeaderRow}>
          <Text style={styles.sectionTitle}>PICK A DATE (SEPTEMBER 2026)</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          {[22, 23, 24, 25, 26, 27, 28, 29, 30].map((day) => {
            const isSel = selectedDate === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dateCell, isSel && styles.dateCellActive]}
                onPress={() => setSelectedDate(day)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateCellNum, isSel && styles.textWhite]}>{day}</Text>
                <Text style={[styles.dateCellMonth, isSel && styles.textWhite]}>SEP</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Package Selector */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>SELECT SERVICES & PACKAGES</Text>
        {packageGroups.map((group) => (
          <View key={group.name} style={styles.groupBlock}>
            <Text style={styles.groupHeader}>{group.name.toUpperCase()}</Text>
            {group.items.map((pkg) => {
              const isChecked = selectedPackages.includes(pkg.name);
              return (
                <TouchableOpacity
                  key={pkg.name}
                  style={[styles.pkgToggleRow, isChecked && styles.pkgToggleRowActive]}
                  onPress={() => togglePackage(pkg.name)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.pkgName, isChecked && styles.textWhite]}>
                    {pkg.name}
                  </Text>
                  <Text style={[styles.pkgPrice, isChecked && styles.textWhite]}>
                    {fmt(pkg.price)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* 4. Advance & Venue Inputs */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>ADVANCE & VENUE</Text>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>Advance Received (₹)</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            value={advanceText}
            onChangeText={setAdvanceText}
          />
        </View>

        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>Venue Address</Text>
          <TextInput
            style={styles.textInput}
            value={venue}
            onChangeText={setVenue}
          />
        </View>
      </View>

      {/* 5. Summary & Save Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryTextCol}>
          <Text style={styles.summaryLabel}>TOTAL: {fmt(grandTotal)}</Text>
          <Text style={styles.summaryBalance}>Balance due: {fmt(balance)}</Text>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>CONFIRM & SAVE</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f6',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#121212',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clientChip: {
    backgroundColor: '#f4f4f6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  clientChipActive: {
    backgroundColor: Colors.accent,
  },
  clientChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121212',
  },
  clientChipTextActive: {
    color: '#ffffff',
  },
  newClientChip: {
    backgroundColor: Colors.tint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  newClientText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deep,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
  },
  dateCell: {
    width: 48,
    height: 58,
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCellActive: {
    backgroundColor: Colors.accent,
  },
  dateCellNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
  },
  dateCellMonth: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  textWhite: {
    color: '#ffffff',
  },
  groupBlock: {
    marginTop: 8,
  },
  groupHeader: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.deep,
    marginBottom: 6,
  },
  pkgToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    marginBottom: 6,
  },
  pkgToggleRowActive: {
    backgroundColor: Colors.accent,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 18, 18, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
  },
  checkmark: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  pkgName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#121212',
  },
  pkgPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
  },
  inputField: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(18, 18, 18, 0.6)',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.tint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.07)',
  },
  summaryBar: {
    backgroundColor: '#121212',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
});
