import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { PackageGroup, PackageItem, fmt } from '../data/prototypeData';

// 3-dot Vertical Menu Icon
const MoreVerticalVectorIcon = ({ color = 'rgba(18, 18, 18, 0.45)' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="5" r="1.2" fill={color} />
    <Circle cx="12" cy="12" r="1.2" fill={color} />
    <Circle cx="12" cy="19" r="1.2" fill={color} />
  </Svg>
);

// SquarePen Edit Icon (Premium Icon matching Web design)
const SquarePenVectorIcon = ({ color = '#121212' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
  </Svg>
);

// Trash Delete Icon
const TrashVectorIcon = ({ color = '#e8276b' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" />
    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <Path d="M10 11v6" />
    <Path d="M14 11v6" />
  </Svg>
);

interface PackagesScreenProps {
  packageGroups: PackageGroup[];
  onAddPackage: (groupName: string, name: string, price: number) => void;
  onUpdatePackage?: (
    groupName: string,
    oldName: string,
    newName: string,
    newPrice: number,
    newGroupName?: string
  ) => void;
  onDeletePackage?: (groupName: string, itemName: string) => void;
  onGoBack: () => void;
}

export const PackagesScreen: React.FC<PackagesScreenProps> = ({
  packageGroups,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  onGoBack,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('Makeup');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  // 3-Dot Actions Menu Modal State
  const [activeMenuTarget, setActiveMenuTarget] = useState<{
    groupName: string;
    item: PackageItem;
  } | null>(null);

  // Edit Modal State
  const [editTarget, setEditTarget] = useState<{
    groupName: string;
    item: PackageItem;
  } | null>(null);
  const [editCategory, setEditCategory] = useState('Makeup');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    groupName: string;
    item: PackageItem;
  } | null>(null);

  const handleSaveNew = () => {
    const priceNum = parseInt(servicePrice.replace(/[^0-9]/g, ''), 10);
    if (!serviceName.trim() || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid service name and price.');
      return;
    }
    onAddPackage(selectedGroup, serviceName.trim(), priceNum);
    setServiceName('');
    setServicePrice('');
    setShowAddForm(false);
  };

  const handleOpenEdit = (groupName: string, item: PackageItem) => {
    setActiveMenuTarget(null);
    setEditTarget({ groupName, item });
    setEditCategory(groupName);
    setEditName(item.name);
    setEditPrice(String(item.price));
  };

  const handleSaveEdit = () => {
    if (!editTarget) return;
    const priceNum = parseInt(editPrice.replace(/[^0-9]/g, ''), 10);
    if (!editName.trim() || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid package name and price.');
      return;
    }

    if (onUpdatePackage) {
      onUpdatePackage(
        editTarget.groupName,
        editTarget.item.name,
        editName.trim(),
        priceNum,
        editCategory
      );
    }
    setEditTarget(null);
  };

  const handleOpenDelete = (groupName: string, item: PackageItem) => {
    setActiveMenuTarget(null);
    setDeleteTarget({ groupName, item });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (onDeletePackage) {
      onDeletePackage(deleteTarget.groupName, deleteTarget.item.name);
    }
    setDeleteTarget(null);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {packageGroups.map((group) => (
        <View key={group.name} style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>{group.name.toUpperCase()}</Text>
            <Text style={styles.groupCount}>
              {group.items.length} {group.items.length === 1 ? 'SERVICE' : 'SERVICES'}
            </Text>
          </View>

          <View style={styles.groupCard}>
            {group.items.map((item, idx) => (
              <View
                key={`${group.name}-${item.name}-${idx}`}
                style={[
                  styles.itemRow,
                  idx === group.items.length - 1 && styles.itemRowLast,
                ]}
              >
                <View style={styles.itemInfoCol}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemCategorySub}>{group.name}</Text>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.itemPrice}>{fmt(item.price)}</Text>

                  {/* 3-Dot Vertical Menu Button */}
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => setActiveMenuTarget({ groupName: group.name, item })}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                    accessibilityLabel={`Options for ${item.name}`}
                  >
                    <MoreVerticalVectorIcon />
                  </TouchableOpacity>
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
            <TouchableOpacity style={styles.saveServiceBtn} onPress={handleSaveNew}>
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

      {/* 1. 3-Dot Options Action Sheet Modal */}
      <Modal
        visible={!!activeMenuTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMenuTarget(null)}
      >
        <TouchableWithoutFeedback onPress={() => setActiveMenuTarget(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.bottomSheetCard}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetKicker}>PACKAGE ACTIONS</Text>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {activeMenuTarget?.item.name}
                  </Text>
                  <Text style={styles.sheetPrice}>
                    {activeMenuTarget ? fmt(activeMenuTarget.item.price) : ''} ·{' '}
                    {activeMenuTarget?.groupName}
                  </Text>
                </View>

                <View style={styles.sheetActionsList}>
                  {/* Edit Option */}
                  <TouchableOpacity
                    style={styles.actionRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (activeMenuTarget) {
                        handleOpenEdit(activeMenuTarget.groupName, activeMenuTarget.item);
                      }
                    }}
                  >
                    <View style={styles.actionIconWrap}>
                      <SquarePenVectorIcon color="#121212" />
                    </View>
                    <View style={styles.actionTextCol}>
                      <Text style={styles.actionLabel}>Edit Package</Text>
                      <Text style={styles.actionSub}>Update title, price, or category</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Delete Option */}
                  <TouchableOpacity
                    style={[styles.actionRow, styles.actionRowDanger]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (activeMenuTarget) {
                        handleOpenDelete(activeMenuTarget.groupName, activeMenuTarget.item);
                      }
                    }}
                  >
                    <View style={[styles.actionIconWrap, styles.actionIconWrapDanger]}>
                      <TrashVectorIcon color="#e8276b" />
                    </View>
                    <View style={styles.actionTextCol}>
                      <Text style={[styles.actionLabel, styles.actionLabelDanger]}>
                        Delete Package
                      </Text>
                      <Text style={styles.actionSub}>Remove from your active service list</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => setActiveMenuTarget(null)}
                >
                  <Text style={styles.dismissBtnText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. Edit Package Dialog Modal */}
      <Modal
        visible={!!editTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTarget(null)}
      >
        <TouchableWithoutFeedback onPress={() => setEditTarget(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogCard}>
                <Text style={styles.dialogKicker}>EDIT PACKAGE</Text>
                <Text style={styles.dialogTitle}>Update Service Details</Text>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.groupSelectorRow}>
                    {packageGroups.map((g) => {
                      const isSel = editCategory === g.name;
                      return (
                        <TouchableOpacity
                          key={g.name}
                          style={[
                            styles.groupSelectorPill,
                            isSel && styles.groupSelectorPillActive,
                          ]}
                          onPress={() => setEditCategory(g.name)}
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
                  <Text style={styles.fieldLabel}>Package Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Package title"
                    placeholderTextColor="rgba(18, 18, 18, 0.4)"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                    placeholder="Price"
                    placeholderTextColor="rgba(18, 18, 18, 0.4)"
                  />
                </View>

                <View style={styles.formBtnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setEditTarget(null)}
                  >
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveServiceBtn} onPress={handleSaveEdit}>
                    <Text style={styles.saveServiceBtnText}>SAVE CHANGES</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 3. Delete Confirmation Dialog Modal */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <TouchableWithoutFeedback onPress={() => setDeleteTarget(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogCard}>
                <View style={styles.dangerBadgeWrap}>
                  <TrashVectorIcon color="#e8276b" />
                </View>
                <Text style={styles.dialogKickerDanger}>REMOVE PACKAGE</Text>
                <Text style={styles.dialogTitle}>
                  Delete &ldquo;{deleteTarget?.item.name}&rdquo;?
                </Text>
                <Text style={styles.dialogBody}>
                  This service ({deleteTarget ? fmt(deleteTarget.item.price) : ''}) will be removed from your {deleteTarget?.groupName} catalog. Existing bookings remain untouched.
                </Text>

                <View style={styles.formBtnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setDeleteTarget(null)}
                  >
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteConfirmBtn}
                    onPress={handleConfirmDelete}
                  >
                    <Text style={styles.deleteConfirmBtnText}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    groupTitle: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: '#ffffff',
    },
    groupCount: {
      fontSize: 9.5,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.accent2 || 'rgba(255, 255, 255, 0.65)',
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
      gap: 12,
    },
    itemRowLast: {
      borderBottomWidth: 0,
    },
    itemInfoCol: {
      flex: 1,
      minWidth: 0,
    },
    itemName: {
      fontSize: 14.5,
      fontWeight: '700',
      color: '#121212',
      lineHeight: 19,
    },
    itemCategorySub: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.45)',
      marginTop: 2,
      fontWeight: '500',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: '#121212',
      fontVariant: ['tabular-nums'],
    },
    moreBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: 'rgba(18, 18, 18, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2,
    },
    addBtnContainer: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    addPackageBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 2,
    },
    addPackageBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: '#ffffff',
    },
    addFormCard: {
      backgroundColor: colors.tint2,
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
      color: colors.deep,
      marginBottom: 10,
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
      flexWrap: 'wrap',
      gap: 6,
    },
    groupSelectorPill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.1)',
    },
    groupSelectorPillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    groupSelectorText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: '#121212',
    },
    groupSelectorTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    input: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13.5,
      color: '#121212',
    },
    formBtnRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: 'rgba(18, 18, 18, 0.15)',
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: '#121212',
    },
    saveServiceBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    saveServiceBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: '#ffffff',
    },
    deleteConfirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#e8276b',
      alignItems: 'center',
    },
    deleteConfirmBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: '#ffffff',
    },

    // Modal & Sheet Styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.52)',
      justifyContent: 'flex-end',
      paddingHorizontal: 12,
      paddingBottom: 20,
    },
    bottomSheetCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(18, 18, 18, 0.18)',
      alignSelf: 'center',
      marginBottom: 12,
    },
    sheetHeader: {
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.06)',
    },
    sheetKicker: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: 'rgba(18, 18, 18, 0.45)',
      textTransform: 'uppercase',
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#121212',
      marginTop: 2,
    },
    sheetPrice: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(18, 18, 18, 0.6)',
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    sheetActionsList: {
      paddingVertical: 6,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(18, 18, 18, 0.05)',
    },
    actionRowDanger: {
      borderBottomWidth: 0,
    },
    actionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(18, 18, 18, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionIconWrapDanger: {
      backgroundColor: '#ffeef4',
    },
    actionTextCol: {
      flex: 1,
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: '#121212',
    },
    actionLabelDanger: {
      color: '#e8276b',
    },
    actionSub: {
      fontSize: 11,
      color: 'rgba(18, 18, 18, 0.48)',
      marginTop: 1,
    },
    dismissBtn: {
      marginTop: 6,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: 'rgba(18, 18, 18, 0.04)',
      alignItems: 'center',
    },
    dismissBtnText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: '#121212',
    },

    // Dialog Card (Edit & Delete Confirm)
    dialogCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 20,
      marginHorizontal: 8,
      marginBottom: 'auto',
      marginTop: 'auto',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
    dialogKicker: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: 'rgba(18, 18, 18, 0.45)',
      textTransform: 'uppercase',
    },
    dialogKickerDanger: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: '#e8276b',
      textTransform: 'uppercase',
      marginTop: 8,
    },
    dialogTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#121212',
      marginTop: 2,
      marginBottom: 12,
    },
    dialogBody: {
      fontSize: 12.5,
      color: 'rgba(18, 18, 18, 0.65)',
      lineHeight: 18,
      marginBottom: 16,
    },
    dangerBadgeWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: '#ffeef4',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
