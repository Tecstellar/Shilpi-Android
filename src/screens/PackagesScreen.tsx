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
import { PackageGroup, fmt } from '../data/prototypeData';

interface PackagesScreenProps {
  packageGroups: PackageGroup[];
  onAddPackage: (groupName: string, name: string, price: number) => void;
  onGoBack: () => void;
}

export const PackagesScreen: React.FC<PackagesScreenProps> = ({
  packageGroups,
  onAddPackage,
  onGoBack,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('Makeup');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const handleSave = () => {
    const priceNum = parseInt(servicePrice.replace(/[^0-9]/g, ''), 10);
    if (!serviceName.trim() || isNaN(priceNum)) return;
    onAddPackage(selectedGroup, serviceName.trim(), priceNum);
    setServiceName('');
    setServicePrice('');
    setShowAddForm(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {packageGroups.map((group) => (
        <View key={group.name} style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>{group.name.toUpperCase()}</Text>
          </View>

          <View style={styles.groupCard}>
            {group.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.itemPrice}>{fmt(item.price)}</Text>
                  <Text style={styles.editIcon}>✏️</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Inline Add Service Form */}
      {showAddForm ? (
        <View style={styles.addFormCard}>
          <Text style={styles.addFormTitle}>NEW SERVICE</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.groupSelectorRow}>
              {packageGroups.map((g) => {
                const isSel = selectedGroup === g.name;
                return (
                  <TouchableOpacity
                    key={g.name}
                    style={[styles.groupSelectorPill, isSel && styles.groupSelectorPillActive]}
                    onPress={() => setSelectedGroup(g.name)}
                  >
                    <Text
                      style={[
                        styles.groupSelectorText,
                        isSel && styles.groupSelectorTextActive,
                      ]}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Service Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. HD Airbrush Base"
              placeholderTextColor="rgba(18, 18, 18, 0.4)"
              value={serviceName}
              onChangeText={setServiceName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g. 5000"
              placeholderTextColor="rgba(18, 18, 18, 0.4)"
              value={servicePrice}
              onChangeText={setServicePrice}
            />
          </View>

          <View style={styles.formBtnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveServiceBtn} onPress={handleSave}>
              <Text style={styles.saveServiceBtnText}>ADD SERVICE</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.addBtnContainer}>
          <TouchableOpacity
            style={styles.addPackageBtn}
            onPress={() => setShowAddForm(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addPackageBtnText}>＋ ADD PACKAGE</Text>
          </TouchableOpacity>
        </View>
      )}

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
  groupSection: {
    marginTop: 14,
  },
  groupHeader: {
    backgroundColor: '#121212',
    marginHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#ffffff',
  },
  groupCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
  },
  itemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#121212',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  editIcon: {
    fontSize: 12,
    opacity: 0.6,
  },
  addBtnContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  addPackageBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPackageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#ffffff',
  },
  addFormCard: {
    backgroundColor: Colors.tint2,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  addFormTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: Colors.deep,
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(18, 18, 18, 0.7)',
    marginBottom: 6,
  },
  groupSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  groupSelectorPill: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  groupSelectorPillActive: {
    backgroundColor: Colors.accent,
  },
  groupSelectorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#121212',
  },
  groupSelectorTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.08)',
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#121212',
  },
  saveServiceBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveServiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});
