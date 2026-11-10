import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../theme/colors';

const CheckVectorIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface ReminderItem {
  id: string;
  text: string;
  time: string;
  kind: string;
}

interface ReminderGroup {
  label: string;
  isToday?: boolean;
  items: ReminderItem[];
}

const REMINDER_GROUPS: ReminderGroup[] = [
  {
    label: 'Today · 14 Sep',
    isToday: true,
    items: [
      { id: 'r1', text: 'Collect ₹5,000 balance from Priya', time: '10:00 AM', kind: 'Payment' },
      { id: 'r2', text: 'Buy foundation shade 03 — Nykaa', time: '12:30 PM', kind: 'Product purchase' },
      { id: 'r3', text: 'Leave for Le Meridien', time: '4:45 PM', kind: 'Travel' },
    ],
  },
  {
    label: 'Tomorrow · 15 Sep',
    items: [
      { id: 'r4', text: 'Post Anu’s bridal reel', time: '11:00 AM', kind: 'Instagram' },
      { id: 'r5', text: 'Follow up with Keerthi on references', time: '6:00 PM', kind: 'Client follow-up' },
    ],
  },
  {
    label: 'This week',
    items: [
      { id: 'r6', text: 'Prep kit for Priya’s bridal — 18 Sep', time: '17 Sep · 8:00 PM', kind: 'Booking preparation' },
      { id: 'r7', text: 'Advance from Lakshmi for 29 Sep', time: '19 Sep · 11:00 AM', kind: 'Advance payment' },
    ],
  },
];

interface RemindersScreenProps {
  onGoBack: () => void;
}

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ onGoBack }) => {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({
    r2: true,
  });

  const toggleReminder = (id: string) => {
    setCompletedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {REMINDER_GROUPS.map((group, groupIdx) => (
        <View key={groupIdx} style={styles.groupSection}>
          <View
            style={[
              styles.groupHeader,
              group.isToday ? styles.groupHeaderToday : styles.groupHeaderDefault,
            ]}
          >
            <Text
              style={[
                styles.groupLabel,
                group.isToday ? styles.textWhite : styles.textInk,
              ]}
            >
              {group.label.toUpperCase()}
            </Text>
          </View>

          <View style={styles.groupCard}>
            {group.items.map((item) => {
              const isDone = !!completedMap[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.reminderRow}
                  onPress={() => toggleReminder(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkBox, isDone && styles.checkBoxDone]}>
                    {isDone && <CheckVectorIcon />}
                  </View>

                  <View style={styles.reminderDetails}>
                    <Text
                      style={[
                        styles.reminderText,
                        isDone && styles.reminderTextDone,
                      ]}
                    >
                      {item.text}
                    </Text>
                    <Text style={styles.reminderMeta}>
                      {item.time} · {item.kind}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.addBtnContainer}>
        <TouchableOpacity
          style={styles.addReminderBtn}
          onPress={() => Alert.alert('Add Reminder', 'Quick reminder saved for today.')}
          activeOpacity={0.8}
        >
          <Text style={styles.addReminderBtnText}>＋ ADD REMINDER</Text>
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
  groupSection: {
    marginTop: 14,
  },
  groupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  groupHeaderToday: {
    backgroundColor: Colors.accent,
  },
  groupHeaderDefault: {
    backgroundColor: Colors.tint,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  textWhite: {
    color: '#ffffff',
  },
  textInk: {
    color: '#121212',
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
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.06)',
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(18, 18, 18, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkBoxDone: {
    backgroundColor: '#121212',
    borderColor: '#121212',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  reminderDetails: {
    flex: 1,
  },
  reminderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
    lineHeight: 20,
  },
  reminderTextDone: {
    textDecorationLine: 'line-through',
    color: 'rgba(18, 18, 18, 0.4)',
  },
  reminderMeta: {
    fontSize: 11,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  addBtnContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  addReminderBtn: {
    backgroundColor: '#121212',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReminderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#ffffff',
  },
});
