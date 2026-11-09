import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';

const GALLERY_POSTS = [
  {
    title: 'Anu Menon — Bridal Makeup',
    date: '30 Jun 2026',
    place: 'Coimbatore',
    caption: 'Traditional South Indian bridal — HD base, kohl-heavy eye, jasmine hair set.',
    instagramTag: '@anu_menon_weddings',
  },
  {
    title: 'Lakshmi Iyer — Bridal Makeup',
    date: '2 Aug 2026',
    place: 'Ganapathy',
    caption: 'Morning muhurtham look with Nivi drape. Posted to Instagram on 4 Aug.',
    instagramTag: '@lakshmi_iyer_mua',
  },
];

interface GalleryScreenProps {
  onGoBack: () => void;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({ onGoBack }) => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Header Card */}
      <View style={styles.inkHeaderCard}>
        <Text style={styles.kicker}>MY PORTFOLIO</Text>
        <Text style={styles.title}>Client Looks & Reviews</Text>
      </View>

      {/* 2. Portfolio Items */}
      {GALLERY_POSTS.map((post, idx) => (
        <View key={idx} style={styles.postCard}>
          <View style={styles.postHeader}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postMeta}>{post.date} · {post.place}</Text>
          </View>

          {/* 3-Slot Photo Grid matching Prototype */}
          <View style={styles.photosGrid}>
            <View style={styles.largeSlot}>
              <Text style={styles.slotPlaceholder}>Drop finished look</Text>
              <Text style={styles.slotIcon}>📸</Text>
            </View>

            <View style={styles.rightThumbnails}>
              <View style={styles.smallSlot}>
                <Text style={styles.smallSlotText}>Detail 1</Text>
              </View>
              <View style={styles.smallSlot}>
                <Text style={styles.smallSlotText}>Detail 2</Text>
              </View>
            </View>
          </View>

          {/* Caption */}
          <Text style={styles.captionText}>{post.caption}</Text>

          {/* Actions */}
          <View style={styles.postFooter}>
            <TouchableOpacity
              style={styles.instaBtn}
              onPress={() => Alert.alert('Instagram Link', `Link to ${post.instagramTag} copied.`)}
            >
              <Text style={styles.instaBtnText}>POSTED TO INSTAGRAM · {post.instagramTag}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

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
  inkHeaderCard: {
    backgroundColor: '#121212',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.deep,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  postCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  postHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121212',
  },
  postMeta: {
    fontSize: 11.5,
    color: 'rgba(18, 18, 18, 0.55)',
    marginTop: 2,
  },
  photosGrid: {
    flexDirection: 'row',
    height: 190,
    gap: 4,
    paddingHorizontal: 16,
  },
  largeSlot: {
    flex: 2,
    backgroundColor: Colors.tint,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPlaceholder: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.deep,
  },
  slotIcon: {
    fontSize: 20,
    marginTop: 6,
  },
  rightThumbnails: {
    flex: 1,
    gap: 4,
  },
  smallSlot: {
    flex: 1,
    backgroundColor: Colors.tint,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallSlotText: {
    fontSize: 10,
    color: 'rgba(18, 18, 18, 0.5)',
    fontWeight: '600',
  },
  captionText: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(18, 18, 18, 0.8)',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  postFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  instaBtn: {
    backgroundColor: Colors.tint2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  instaBtnText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.accent,
  },
});
