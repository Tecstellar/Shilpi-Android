import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { NotificationItem } from '../data/prototypeData';

const NotificationVectorIcon: React.FC<{ glyph: string; color?: string }> = ({ glyph, color = '#ffffff' }) => {
  if (glyph === 'star' || glyph === '★') {
    return (
      <Svg width={13} height={13} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1}>
        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </Svg>
    );
  }
  if (glyph === '↑') {
    return (
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4}>
        <Line x1={12} y1={19} x2={12} y2={5} strokeLinecap="round" />
        <Path d="M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (glyph === '!') {
    return (
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4}>
        <Line x1={12} y1={8} x2={12} y2={12} strokeLinecap="round" />
        <Circle cx={12} cy={16} r={1} fill={color} />
      </Svg>
    );
  }
  if (glyph === '＋' || glyph === '+') {
    return (
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4}>
        <Line x1={12} y1={5} x2={12} y2={19} strokeLinecap="round" />
        <Line x1={5} y1={12} x2={19} y2={12} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

interface NotificationsScreenProps {
  notifications: NotificationItem[];
  onNavigate: (screen: string) => void;
  onGoBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onNavigate,
  onGoBack,
}) => {
  const [readMap, setReadMap] = useState<Record<string, boolean>>({
    n4: true,
    n5: true,
    n6: true,
  });

  const unreadCount = notifications.filter((n) => !readMap[n.id]).length;

  const markAllRead = () => {
    const updated: Record<string, boolean> = {};
    notifications.forEach((n) => {
      updated[n.id] = true;
    });
    setReadMap(updated);
  };

  const handleOpen = (item: NotificationItem) => {
    setReadMap((prev) => ({ ...prev, [item.id]: true }));
    if (item.to) {
      onNavigate(item.to);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Unread count & Mark all read */}
      <View style={styles.topControlRow}>
        <Text style={styles.unreadCountText}>
          {unreadCount} UNREAD NOTIFICATION{unreadCount === 1 ? '' : 'S'}
        </Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markReadBtn}>MARK ALL READ</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Notifications List */}
      <View style={styles.notificationsList}>
        {notifications.map((n) => {
          const isRead = !!readMap[n.id];
          return (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, !isRead && styles.notifCardUnread]}
              onPress={() => handleOpen(n)}
              activeOpacity={0.7}
            >
              <View style={[styles.glyphChip, !isRead && styles.glyphChipUnread]}>
                <NotificationVectorIcon
                  glyph={n.glyph}
                  color={!isRead ? '#ffffff' : 'rgba(18, 18, 18, 0.6)'}
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.titleText}>{n.title}</Text>
                <Text style={styles.bodyText}>{n.body}</Text>
                <Text style={styles.timeText}>{n.time}</Text>
              </View>

              {!isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        })}
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
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  unreadCountText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#121212',
  },
  markReadBtn: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.deep,
  },
  notificationsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  notifCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: Colors.tint2,
  },
  glyphChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphChipUnread: {
    backgroundColor: Colors.accent,
  },
  glyphText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.deep,
  },
  glyphTextUnread: {
    color: '#ffffff',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(18, 18, 18, 0.7)',
    marginTop: 2,
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(18, 18, 18, 0.45)',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
});
