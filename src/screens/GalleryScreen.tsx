import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { apiClient } from '../services/apiClient';

// ----------------- Bespoke SVG Icons ----------------- //

const CameraVectorIcon = ({ color = Colors.deep, size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9}>
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={13} r={4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusIcon = ({ color = '#ffffff', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <Line x1={12} y1={5} x2={12} y2={19} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} strokeLinecap="round" />
  </Svg>
);

const StreakFlameIcon = ({ color = '#e8276b', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1}>
    <Path
      d="M12 2c.5 3.5-2 5.5-2 8.5 0 1.4 1 2.5 2.5 2.5 1.8 0 2.5-1.5 2.5-3.2 2 1.5 3.5 4 3.5 6.7a6.5 6.5 0 1 1-13 0c0-3.8 2.8-7.4 6.5-14.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SharePostIcon = ({ color = '#ffffff', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
    <Circle cx={18} cy={5} r={3} />
    <Circle cx={6} cy={12} r={3} />
    <Circle cx={18} cy={19} r={3} />
    <Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} />
    <Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} />
  </Svg>
);

const InstagramGlyphIcon = ({ color = Colors.accent, size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1}>
    <Path
      d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={12} r={4} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={17.5} cy={6.5} r={1} fill={color} />
  </Svg>
);

const EditPencilIcon = ({ color = 'rgba(18,18,18,0.55)', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M12 20h9" strokeLinecap="round" />
    <Path
      d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({ color = '#d62828', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M3 6h18M8 6V4h8v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoreVerticalIcon = ({ color = '#121212', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx={12} cy={5} r={1.8} />
    <Circle cx={12} cy={12} r={1.8} />
    <Circle cx={12} cy={19} r={1.8} />
  </Svg>
);

const CheckCircleIcon = ({ color = '#121212', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4}>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ----------------- Types ----------------- //

export interface GalleryLook {
  id: string;
  title: string;
  place?: string | null;
  caption?: string | null;
  imageUrl: string;
  extraImages: string[];
  instagramHandle?: string | null;
  instagramUrl?: string | null;
  postedToInstagram?: boolean;
  createdAt?: string;
}

export interface StudioStreaks {
  completedOrders: number;
  galleryLooks: number;
  totalCards: number;
  postedLooks: number;
  weeklyStreak: number;
  tierName: string;
  nextTarget: number;
  progressPercent: number;
}

const DEFAULT_STREAKS: StudioStreaks = {
  completedOrders: 0,
  galleryLooks: 0,
  totalCards: 0,
  postedLooks: 0,
  weeklyStreak: 0,
  tierName: 'New Studio',
  nextTarget: 1,
  progressPercent: 0,
};

interface GalleryScreenProps {
  beauticianId?: string;
  studioName?: string;
  artistName?: string;
  studioLogo?: string;
  onGoBack: () => void;
}

function getAllLookPhotos(look: GalleryLook): string[] {
  const list: string[] = [];
  if (look.imageUrl?.trim()) list.push(look.imageUrl.trim());
  if (Array.isArray(look.extraImages)) {
    look.extraImages.forEach((uri) => {
      if (uri?.trim() && list.length < 5) list.push(uri.trim());
    });
  }
  return list;
}

function formatDateLabel(iso?: string): string {
  if (!iso) return 'Today';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Today';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({
  beauticianId,
  studioName = 'Shilpi Studio',
  artistName = 'Artist',
  studioLogo,
}) => {
  const [looks, setLooks] = useState<GalleryLook[]>([]);
  const [streaks, setStreaks] = useState<StudioStreaks>(DEFAULT_STREAKS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Add / Edit Look Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLookId, setEditingLookId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPlace, setFormPlace] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formInstaTag, setFormInstaTag] = useState('');

  // Share Poster Modal state
  const [shareModalLook, setShareModalLook] = useState<GalleryLook | null>(null);
  const [shareCaption, setShareCaption] = useState('');
  const [shareInstaTag, setShareInstaTag] = useState('');
  const [shareInstaUrl, setShareInstaUrl] = useState('');
  const [isSharingPoster, setIsSharingPoster] = useState(false);
  const [menuLook, setMenuLook] = useState<GalleryLook | null>(null);
  const posterShotRef = useRef<any>(null);

  const cacheKey = beauticianId ? `@shilpi_gallery_${beauticianId}` : null;

  const persistCache = async (nextLooks: GalleryLook[], nextStreaks: StudioStreaks) => {
    if (!cacheKey) return;
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ looks: nextLooks, streaks: nextStreaks })).catch(
      () => {}
    );
  };

  const fetchGallery = async () => {
    try {
      if (cacheKey) {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.looks)) setLooks(parsed.looks);
          if (parsed.streaks) setStreaks(parsed.streaks);
        }
      }

      const res = await apiClient.get('/gallery');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const serverLooks: GalleryLook[] = res.data.data.map((g: any) => ({
          id: g.id,
          title: g.title || 'Finished Look',
          place: g.place || '',
          caption: g.caption || '',
          imageUrl: g.imageUrl || '',
          extraImages: Array.isArray(g.extraImages) ? g.extraImages : [],
          instagramHandle: g.instagramHandle || '',
          instagramUrl: g.instagramUrl || '',
          postedToInstagram: Boolean(g.postedToInstagram),
          createdAt: g.createdAt,
        }));
        const serverStreaks: StudioStreaks = res.data.streaks || DEFAULT_STREAKS;
        setLooks(serverLooks);
        setStreaks(serverStreaks);
        await persistCache(serverLooks, serverStreaks);
      }
    } catch {
      // Offline cache already shown if present
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [beauticianId]);

  const openCreateLookModal = () => {
    setEditingLookId(null);
    setFormTitle('');
    setFormPlace('');
    setFormCaption(`Completed a client look with ${studioName} on Shilpi. Here is our finished look & details!`);
    setFormInstaTag('');
    setEditModalVisible(true);
  };

  const openEditLookModal = (look: GalleryLook) => {
    setEditingLookId(look.id);
    setFormTitle(look.title);
    setFormPlace(look.place || '');
    setFormCaption(look.caption || '');
    setFormInstaTag(look.instagramHandle || '');
    setEditModalVisible(true);
  };

  const handleSaveLookMetadata = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Look Title Required', 'Please enter a look or client name (e.g. Priya — Bridal Look).');
      return;
    }

    const cleanTag = formInstaTag.trim()
      ? formInstaTag.trim().startsWith('@')
        ? formInstaTag.trim()
        : `@${formInstaTag.trim()}`
      : '';

    setIsSaving(true);
    try {
      if (editingLookId) {
        const res = await apiClient.patch(`/gallery/${editingLookId}`, {
          title: formTitle.trim(),
          place: formPlace.trim() || null,
          caption: formCaption.trim() || null,
          instagramHandle: cleanTag || null,
        });
        if (res.data?.success && res.data.data) {
          const nextLooks = looks.map((l) => (l.id === editingLookId ? { ...l, ...res.data.data } : l));
          const nextStreaks = res.data.streaks || streaks;
          setLooks(nextLooks);
          setStreaks(nextStreaks);
          await persistCache(nextLooks, nextStreaks);
        }
      } else {
        const res = await apiClient.post('/gallery', {
          title: formTitle.trim(),
          place: formPlace.trim() || null,
          caption: formCaption.trim() || null,
          instagramHandle: cleanTag || null,
          imageUrl: '',
          extraImages: [],
        });
        if (res.data?.success && res.data.data) {
          const nextLooks = [res.data.data, ...looks];
          const nextStreaks = res.data.streaks || streaks;
          setLooks(nextLooks);
          setStreaks(nextStreaks);
          await persistCache(nextLooks, nextStreaks);
        }
      }
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert('Save Failed', e?.message || 'Could not save portfolio look.');
    } finally {
      setIsSaving(false);
    }
  };

  const savePhotosForLook = async (look: GalleryLook, nextImageUrl: string, nextExtras: string[]) => {
    const optimisticLooks = looks.map((l) =>
      l.id === look.id ? { ...l, imageUrl: nextImageUrl, extraImages: nextExtras } : l
    );
    setLooks(optimisticLooks);

    try {
      const res = await apiClient.patch(`/gallery/${look.id}`, {
        imageUrl: nextImageUrl,
        extraImages: nextExtras.slice(0, 4),
      });
      if (res.data?.success && res.data.data) {
        const syncedLooks = optimisticLooks.map((l) =>
          l.id === look.id ? { ...l, ...res.data.data } : l
        );
        const nextStreaks = res.data.streaks || streaks;
        setLooks(syncedLooks);
        setStreaks(nextStreaks);
        await persistCache(syncedLooks, nextStreaks);
      }
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.message || 'Could not save photo to server.');
    }
  };

  const pickImageFromSource = async (
    source: 'camera' | 'gallery',
    look: GalleryLook,
    slotIndex: number
  ) => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Camera Permission', 'Please allow camera access to capture your look.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.2,
          base64: true,
        });
        if (!res.canceled && res.assets?.[0]) {
          const asset = res.assets[0];
          const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          applySlotPhoto(look, slotIndex, uri);
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Gallery Permission', 'Please allow gallery access to select look photos.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.2,
          base64: true,
        });
        if (!res.canceled && res.assets?.[0]) {
          const asset = res.assets[0];
          const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          applySlotPhoto(look, slotIndex, uri);
        }
      }
    } catch (err: any) {
      Alert.alert('Photo Error', err?.message || 'Could not capture or pick image.');
    }
  };

  // slotIndex: 0 = Main Finished Look (imageUrl), 1..4 = extraImages[0..3]
  const applySlotPhoto = (look: GalleryLook, slotIndex: number, uri: string) => {
    if (slotIndex === 0) {
      void savePhotosForLook(look, uri, [...(look.extraImages || [])]);
      return;
    }
    const nextExtras = [...(look.extraImages || [])];
    const extraIdx = slotIndex - 1;
    while (nextExtras.length < extraIdx) {
      nextExtras.push('');
    }
    nextExtras[extraIdx] = uri;
    const cleanedExtras = nextExtras.filter((item, idx) => idx === extraIdx || Boolean(item));
    void savePhotosForLook(look, look.imageUrl || '', cleanedExtras.slice(0, 4));
  };

  const removeSlotPhoto = (look: GalleryLook, slotIndex: number) => {
    if (slotIndex === 0) {
      void savePhotosForLook(look, '', [...(look.extraImages || [])]);
      return;
    }
    const extraIdx = slotIndex - 1;
    const nextExtras = (look.extraImages || []).filter((_, idx) => idx !== extraIdx);
    void savePhotosForLook(look, look.imageUrl || '', nextExtras);
  };

  const handleTapSlot = (look: GalleryLook, slotIndex: number, label: string, hasExisting: boolean) => {
    const buttons: any[] = [
      { text: 'Take Photo (Camera)', onPress: () => pickImageFromSource('camera', look, slotIndex) },
      { text: 'Choose from Gallery', onPress: () => pickImageFromSource('gallery', look, slotIndex) },
    ];
    if (hasExisting) {
      buttons.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => removeSlotPhoto(look, slotIndex),
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(label, 'Add or update photo using Camera or Gallery:', buttons);
  };

  const handleOpenShareModal = (look: GalleryLook) => {
    const total = getAllLookPhotos(look).length;
    if (total < 3) {
      Alert.alert(
        'Minimum 3 Photos Needed',
        'Please drop the Finished Look plus Detail 1 and Detail 2 (3 to 5 photos total) before creating your combined Shilpi share post.'
      );
      return;
    }
    setShareModalLook(look);
    setShareCaption(
      look.caption?.trim() ||
        `Completed this client look for ${look.title} with ${studioName} on Shilpi!`
    );
    setShareInstaTag(look.instagramHandle || '');
    setShareInstaUrl(look.instagramUrl || '');
  };

  const handleShareCombinedPoster = async (markPostedOnly: boolean = false) => {
    if (!shareModalLook) return;
    const cleanTag = shareInstaTag.trim()
      ? shareInstaTag.trim().startsWith('@')
        ? shareInstaTag.trim()
        : `@${shareInstaTag.trim()}`
      : '';

    setIsSharingPoster(true);
    try {
      if (!markPostedOnly) {
        const uri = await posterShotRef.current?.capture?.();
        const captionText = `${shareCaption.trim()}${cleanTag ? `\n\nTag: ${cleanTag}` : ''}\n— Managed with Shilpi (${studioName})`;

        if (uri && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            UTI: 'public.png',
            dialogTitle: 'Post Shilpi Look to Instagram',
          });
        } else {
          await Share.share({ message: captionText });
        }
      }

      const res = await apiClient.patch(`/gallery/${shareModalLook.id}`, {
        caption: shareCaption.trim() || null,
        instagramHandle: cleanTag || null,
        instagramUrl: shareInstaUrl.trim() || null,
        postedToInstagram: true,
      });

      if (res.data?.success && res.data.data) {
        const nextLooks = looks.map((l) =>
          l.id === shareModalLook.id ? { ...l, ...res.data.data } : l
        );
        const nextStreaks = res.data.streaks || streaks;
        setLooks(nextLooks);
        setStreaks(nextStreaks);
        await persistCache(nextLooks, nextStreaks);
      }

      setShareModalLook(null);
    } catch (e: any) {
      Alert.alert('Share Error', e?.message || 'Could not generate or share combined poster.');
    } finally {
      setIsSharingPoster(false);
    }
  };

  const handleTogglePosted = async (look: GalleryLook) => {
    const nextPosted = !look.postedToInstagram;
    const optimisticLooks = looks.map((l) =>
      l.id === look.id ? { ...l, postedToInstagram: nextPosted } : l
    );
    setLooks(optimisticLooks);

    try {
      const res = await apiClient.patch(`/gallery/${look.id}`, {
        postedToInstagram: nextPosted,
      });
      if (res.data?.success && res.data.data) {
        const syncedLooks = optimisticLooks.map((l) =>
          l.id === look.id ? { ...l, ...res.data.data } : l
        );
        const nextStreaks = res.data.streaks || streaks;
        setLooks(syncedLooks);
        setStreaks(nextStreaks);
        await persistCache(syncedLooks, nextStreaks);
      }
    } catch (e: any) {
      setLooks(looks);
      Alert.alert('Update Failed', e?.message || 'Could not update posted status.');
    }
  };

  const handleDeleteLook = (look: GalleryLook) => {
    Alert.alert('Delete Look?', `Remove "${look.title}" from your portfolio gallery?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiClient.delete(`/gallery/${look.id}`);
            const nextLooks = looks.filter((l) => l.id !== look.id);
            const nextStreaks = res.data?.streaks || streaks;
            setLooks(nextLooks);
            setStreaks(nextStreaks);
            await persistCache(nextLooks, nextStreaks);
          } catch (e: any) {
            Alert.alert('Delete Failed', e?.message || 'Could not delete look.');
          }
        },
      },
    ]);
  };

  const studioInitials = studioName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || 'S';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Header Card */}
        <View style={styles.inkHeaderCard}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>MY PORTFOLIO</Text>
              <Text style={styles.title}>Client Looks & Reviews</Text>
            </View>
            <TouchableOpacity style={styles.newLookBtn} onPress={openCreateLookModal} activeOpacity={0.85}>
              <PlusIcon color="#ffffff" size={14} />
              <Text style={styles.newLookBtnText}>New Look</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Shilpi Streaks Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakTopRow}>
            <View style={styles.streakTierPill}>
              <StreakFlameIcon color="#e8276b" size={14} />
              <Text style={styles.streakTierText}>SHILPI STREAK · {streaks.tierName.toUpperCase()}</Text>
            </View>
            <Text style={styles.streakTargetText}>
              {streaks.completedOrders}/{streaks.nextTarget} Orders
            </Text>
          </View>

          <View style={styles.streakStatsRow}>
            <View style={styles.streakStatBox}>
              <Text style={styles.streakStatNum}>{streaks.completedOrders}</Text>
              <Text style={styles.streakStatLabel}>Completed Orders</Text>
            </View>
            <View style={styles.streakStatDivider} />
            <View style={styles.streakStatBox}>
              <Text style={styles.streakStatNum}>{streaks.galleryLooks}</Text>
              <Text style={styles.streakStatLabel}>Looks Saved</Text>
            </View>
            <View style={styles.streakStatDivider} />
            <View style={styles.streakStatBox}>
              <Text style={[styles.streakStatNum, { color: '#e8276b' }]}>{streaks.weeklyStreak} wk</Text>
              <Text style={styles.streakStatLabel}>Active Streak</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(6, streaks.progressPercent)}%` }]} />
          </View>
        </View>

        {/* 3. Loading or Empty State */}
        {isLoading && looks.length === 0 ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.emptySub}>Loading your studio portfolio...</Text>
          </View>
        ) : looks.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <CameraVectorIcon color={Colors.accent} size={28} />
            </View>
            <Text style={styles.emptyTitle}>No Portfolio Looks Yet</Text>
            <Text style={styles.emptySub}>
              Add 3 to 5 photos of any finished client look (Finished Look + Details) to combine them into a branded Shilpi post for Instagram.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openCreateLookModal} activeOpacity={0.85}>
              <PlusIcon color="#ffffff" size={15} />
              <Text style={styles.emptyAddBtnText}>ADD FIRST CLIENT LOOK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          looks.map((post) => {
            const detail1 = post.extraImages?.[0] || '';
            const detail2 = post.extraImages?.[1] || '';
            const detail3 = post.extraImages?.[2] || '';
            const detail4 = post.extraImages?.[3] || '';
            const photoCount = getAllLookPhotos(post).length;

            return (
              <View key={post.id} style={styles.postCard}>
                {/* Header */}
                <View style={styles.postHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postMeta}>
                      {formatDateLabel(post.createdAt)}
                      {post.place ? ` · ${post.place}` : ''}
                    </Text>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={[
                        styles.postedTogglePill,
                        post.postedToInstagram && styles.postedTogglePillActive,
                      ]}
                      onPress={() => handleTogglePosted(post)}
                      activeOpacity={0.8}
                    >
                      <CheckCircleIcon
                        color={post.postedToInstagram ? '#ffffff' : 'rgba(18,18,18,0.65)'}
                        size={12}
                      />
                      <Text
                        style={[
                          styles.postedToggleText,
                          post.postedToInstagram && styles.postedToggleTextActive,
                        ]}
                      >
                        Posted
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => setMenuLook(post)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MoreVerticalIcon color="#121212" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Primary 3-Slot Grid (Hero + Detail 1 + Detail 2) */}
                <View style={styles.photosGrid}>
                  <TouchableOpacity
                    style={styles.largeSlot}
                    activeOpacity={0.85}
                    onPress={() =>
                      handleTapSlot(post, 0, 'Finished Look Photo', Boolean(post.imageUrl))
                    }
                  >
                    {post.imageUrl ? (
                      <>
                        <Image source={{ uri: post.imageUrl }} style={styles.slotImageFill} resizeMode="cover" />
                        <View style={styles.slotCornerBadge}>
                          <Text style={styles.slotCornerBadgeText}>FINISHED LOOK</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={styles.slotPlaceholder}>Drop finished look</Text>
                        <Text style={styles.slotSubHint}>Camera or Gallery</Text>
                        <View style={styles.slotIconWrap}>
                          <CameraVectorIcon />
                        </View>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.rightThumbnails}>
                    <TouchableOpacity
                      style={styles.smallSlot}
                      activeOpacity={0.85}
                      onPress={() => handleTapSlot(post, 1, 'Detail 1 Photo', Boolean(detail1))}
                    >
                      {detail1 ? (
                        <>
                          <Image source={{ uri: detail1 }} style={styles.slotImageFill} resizeMode="cover" />
                          <View style={styles.smallSlotCorner}>
                            <Text style={styles.slotCornerBadgeText}>DETAIL 1</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={styles.smallSlotText}>Detail 1</Text>
                          <PlusIcon color={Colors.deep} size={13} />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.smallSlot}
                      activeOpacity={0.85}
                      onPress={() => handleTapSlot(post, 2, 'Detail 2 Photo', Boolean(detail2))}
                    >
                      {detail2 ? (
                        <>
                          <Image source={{ uri: detail2 }} style={styles.slotImageFill} resizeMode="cover" />
                          <View style={styles.smallSlotCorner}>
                            <Text style={styles.slotCornerBadgeText}>DETAIL 2</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={styles.smallSlotText}>Detail 2</Text>
                          <PlusIcon color={Colors.deep} size={13} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Optional Extra Photos (Detail 3 & Detail 4, up to 5 photos total) */}
                {(detail3 || detail4 || photoCount < 5) && (
                  <View style={styles.extraStripRow}>
                    {detail3 ? (
                      <TouchableOpacity
                        style={styles.extraThumbSlot}
                        activeOpacity={0.85}
                        onPress={() => handleTapSlot(post, 3, 'Detail 3 Photo', true)}
                      >
                        <Image source={{ uri: detail3 }} style={styles.slotImageFill} resizeMode="cover" />
                        <View style={styles.smallSlotCorner}>
                          <Text style={styles.slotCornerBadgeText}>DETAIL 3</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {detail4 ? (
                      <TouchableOpacity
                        style={styles.extraThumbSlot}
                        activeOpacity={0.85}
                        onPress={() => handleTapSlot(post, 4, 'Detail 4 Photo', true)}
                      >
                        <Image source={{ uri: detail4 }} style={styles.slotImageFill} resizeMode="cover" />
                        <View style={styles.smallSlotCorner}>
                          <Text style={styles.slotCornerBadgeText}>DETAIL 4</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {photoCount < 5 && (
                      <TouchableOpacity
                        style={styles.addExtraTile}
                        activeOpacity={0.8}
                        onPress={() => {
                          const nextIdx = !post.imageUrl
                            ? 0
                            : !detail1
                            ? 1
                            : !detail2
                            ? 2
                            : !detail3
                            ? 3
                            : 4;
                          handleTapSlot(
                            post,
                            nextIdx,
                            nextIdx === 0 ? 'Finished Look Photo' : `Detail ${nextIdx} Photo`,
                            false
                          );
                        }}
                      >
                        <PlusIcon color={Colors.accent} size={14} />
                        <Text style={styles.addExtraText}>Add Photo ({photoCount}/5)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Count + Readiness Bar */}
                <View style={styles.countStatusRow}>
                  <Text style={styles.countStatusText}>
                    {photoCount}/5 photos ·{' '}
                    {photoCount >= 3
                      ? 'Ready to combine & post'
                      : `Add ${3 - photoCount} more (min 3)`}
                  </Text>
                </View>

                {/* Caption */}
                {post.caption ? (
                  <Text style={styles.captionText}>{post.caption}</Text>
                ) : null}

                {/* Footer: Share Poster + Instagram Tag Status */}
                <View style={styles.postFooter}>
                  <TouchableOpacity
                    style={[
                      styles.sharePostBtn,
                      photoCount < 3 && styles.sharePostBtnMuted,
                    ]}
                    onPress={() => handleOpenShareModal(post)}
                    activeOpacity={0.85}
                  >
                    <SharePostIcon color="#ffffff" size={14} />
                    <Text style={styles.sharePostBtnText}>
                      {post.postedToInstagram ? 'SHARE AGAIN / EDIT POST' : 'CREATE & SHARE POST'}
                    </Text>
                  </TouchableOpacity>

                  {(post.postedToInstagram || post.instagramHandle) && (
                    <TouchableOpacity
                      style={styles.instaBadgePill}
                      onPress={() => handleOpenShareModal(post)}
                      activeOpacity={0.8}
                    >
                      <InstagramGlyphIcon color={Colors.accent} size={12} />
                      <Text style={styles.instaBadgeText} numberOfLines={1}>
                        {post.postedToInstagram ? 'POSTED TO INSTAGRAM' : 'TAG'}
                        {post.instagramHandle ? ` · ${post.instagramHandle}` : ''}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal 1: Add / Edit Look Metadata */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalKicker}>{editingLookId ? 'EDIT PORTFOLIO LOOK' : 'NEW PORTFOLIO LOOK'}</Text>
            <Text style={styles.modalTitle}>
              {editingLookId ? 'Update look details' : 'Create a look card'}
            </Text>

            <Text style={styles.inputLabel}>LOOK / CLIENT TITLE *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Priya Menon — Bridal Makeup"
              placeholderTextColor="rgba(18,18,18,0.35)"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <Text style={styles.inputLabel}>PLACE / VENUE</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Coimbatore"
              placeholderTextColor="rgba(18,18,18,0.35)"
              value={formPlace}
              onChangeText={setFormPlace}
            />

            <Text style={styles.inputLabel}>INSTAGRAM TAG (@HANDLE)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. @priya_weddings"
              placeholderTextColor="rgba(18,18,18,0.35)"
              autoCapitalize="none"
              value={formInstaTag}
              onChangeText={setFormInstaTag}
            />

            <Text style={styles.inputLabel}>STORY / CAPTION</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              multiline
              placeholder="Completed a look with Shilpi — client finished look & details..."
              placeholderTextColor="rgba(18,18,18,0.35)"
              value={formCaption}
              onChangeText={setFormCaption}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveLookMetadata}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {editingLookId ? 'SAVE CHANGES' : 'CREATE LOOK CARD'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 2: Combined Shilpi Branded Poster Preview & Instagram Share Sheet */}
      <Modal
        visible={Boolean(shareModalLook)}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalLook(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.shareModalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.shareHeaderRow}>
                <View>
                  <Text style={styles.modalKicker}>COMBINED SHILPI POST SHEET</Text>
                  <Text style={styles.modalTitle}>Preview & Share</Text>
                </View>
                <TouchableOpacity onPress={() => setShareModalLook(null)} style={styles.closePillBtn}>
                  <Text style={styles.closePillText}>Close</Text>
                </TouchableOpacity>
              </View>

              {shareModalLook && (
                <>
                  {/* Capturable Combined Shilpi Branded Poster */}
                  <ViewShot
                    ref={posterShotRef}
                    options={{ format: 'png', quality: 0.92 }}
                    style={styles.posterCanvas}
                  >
                    {/* Top Studio + Shilpi Brand Bar */}
                    <View style={styles.posterBrandBar}>
                      <View style={styles.posterStudioLeft}>
                        <View style={styles.posterLogoCircle}>
                          {studioLogo ? (
                            <Image source={{ uri: studioLogo }} style={styles.posterLogoImg} resizeMode="cover" />
                          ) : (
                            <Text style={styles.posterLogoInitials}>{studioInitials}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.posterStudioName} numberOfLines={1}>
                            {studioName}
                          </Text>
                          <Text style={styles.posterByShilpi} numberOfLines={1}>
                            Crafted by {artistName} · Shilpi
                          </Text>
                        </View>
                      </View>
                      <Image
                        source={require('../../assets/shilpi-logo-tight.png')}
                        style={styles.posterShilpiMark}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Collage of 3 to 5 Uploaded Photos */}
                    {(() => {
                      const photos = getAllLookPhotos(shareModalLook);
                      const hero = photos[0];
                      const rest = photos.slice(1);
                      return (
                        <View style={styles.posterCollageWrap}>
                          <View style={styles.posterHeroBox}>
                            {hero ? (
                              <Image source={{ uri: hero }} style={styles.slotImageFill} resizeMode="cover" />
                            ) : null}
                            <View style={styles.posterFinishedChip}>
                              <Text style={styles.posterFinishedChipText}>FINISHED LOOK</Text>
                            </View>
                          </View>

                          <View style={styles.posterDetailsCol}>
                            {rest.map((uri, idx) => (
                              <View key={idx} style={styles.posterDetailCell}>
                                <Image source={{ uri }} style={styles.slotImageFill} resizeMode="cover" />
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Story & Streak Stamp Footer */}
                    <View style={styles.posterFooter}>
                      <View style={styles.posterTitleRow}>
                        <Text style={styles.posterLookTitle} numberOfLines={1}>
                          {shareModalLook.title}
                        </Text>
                        {streaks.completedOrders > 0 && (
                          <View style={styles.posterStreakPill}>
                            <StreakFlameIcon color="#e8276b" size={10} />
                            <Text style={styles.posterStreakText}>
                              {streaks.completedOrders} Orders · {streaks.tierName}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.posterCaptionText}>{shareCaption}</Text>

                      <View style={styles.posterBottomMeta}>
                        <Text style={styles.posterPlaceDate}>
                          {formatDateLabel(shareModalLook.createdAt)}
                          {shareModalLook.place ? ` · ${shareModalLook.place}` : ''}
                        </Text>
                        {shareInstaTag.trim() ? (
                          <Text style={styles.posterTagText}>
                            {shareInstaTag.trim().startsWith('@')
                              ? shareInstaTag.trim()
                              : `@${shareInstaTag.trim()}`}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </ViewShot>

                  {/* Editable Share Caption & Instagram Tag */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>INSTAGRAM @TAG</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="@client_or_wedding_tag"
                    placeholderTextColor="rgba(18,18,18,0.35)"
                    autoCapitalize="none"
                    value={shareInstaTag}
                    onChangeText={setShareInstaTag}
                  />

                  <Text style={styles.inputLabel}>STORY MESSAGE ON POSTER</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextarea]}
                    multiline
                    placeholder="Completed this client look with Shilpi!"
                    placeholderTextColor="rgba(18,18,18,0.35)"
                    value={shareCaption}
                    onChangeText={setShareCaption}
                  />

                  <Text style={styles.inputLabel}>INSTAGRAM POST LINK (OPTIONAL)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="https://instagram.com/p/..."
                    placeholderTextColor="rgba(18,18,18,0.35)"
                    autoCapitalize="none"
                    value={shareInstaUrl}
                    onChangeText={setShareInstaUrl}
                  />

                  <TouchableOpacity
                    style={styles.shareActionBtn}
                    onPress={() => handleShareCombinedPoster(false)}
                    disabled={isSharingPoster}
                    activeOpacity={0.85}
                  >
                    {isSharingPoster ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <SharePostIcon color="#ffffff" size={16} />
                        <Text style={styles.shareActionBtnText}>SHARE TO INSTAGRAM / APPS</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveTagOnlyBtn}
                    onPress={() => handleShareCombinedPoster(true)}
                    disabled={isSharingPoster}
                  >
                    <Text style={styles.saveTagOnlyText}>Save Tag & Mark as Posted</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 3: Card Three-Dot Options Menu */}
      <Modal
        visible={Boolean(menuLook)}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuLook(null)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setMenuLook(null)}
        >
          <View style={styles.menuActionSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.menuSheetTitle} numberOfLines={1}>
              {menuLook?.title || 'Look Options'}
            </Text>

            <TouchableOpacity
              style={styles.menuSheetRow}
              onPress={() => {
                const target = menuLook;
                setMenuLook(null);
                if (target) openEditLookModal(target);
              }}
            >
              <EditPencilIcon color="#121212" size={16} />
              <Text style={styles.menuSheetRowText}>Edit Look Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuSheetRow}
              onPress={() => {
                const target = menuLook;
                setMenuLook(null);
                if (target) handleOpenShareModal(target);
              }}
            >
              <InstagramGlyphIcon color={Colors.accent} size={16} />
              <Text style={styles.menuSheetRowText}>Share / Edit Instagram Tag</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuSheetRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                const target = menuLook;
                setMenuLook(null);
                if (target) handleDeleteLook(target);
              }}
            >
              <TrashIcon color="#d62828" size={16} />
              <Text style={[styles.menuSheetRowText, { color: '#d62828' }]}>Delete Look</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuSheetCancelBtn}
              onPress={() => setMenuLook(null)}
            >
              <Text style={styles.menuSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.deep,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  newLookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 5,
  },
  newLookBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  streakCard: {
    backgroundColor: '#16161a',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#27272e',
  },
  streakTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakTierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 39, 107, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
  },
  streakTierText: {
    color: '#ff699e',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  streakTargetText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  streakStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  streakStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  streakStatNum: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  streakStatLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  streakStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#e8276b',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#121212',
  },
  emptySub: {
    fontSize: 12.5,
    color: 'rgba(18,18,18,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 7,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconActionBtn: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: '#f5f5f7',
  },
  postedTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: 'rgba(18,18,18,0.1)',
  },
  postedTogglePillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  postedToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(18,18,18,0.72)',
  },
  postedToggleTextActive: {
    color: '#ffffff',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  menuActionSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    paddingBottom: 14,
  },
  menuSheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(18,18,18,0.55)',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18,18,18,0.06)',
  },
  menuSheetRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#121212',
  },
  menuSheetCancelBtn: {
    marginTop: 10,
    backgroundColor: '#f3f3f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuSheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  photosGrid: {
    flexDirection: 'row',
    height: 190,
    gap: 6,
    paddingHorizontal: 16,
  },
  largeSlot: {
    flex: 2,
    backgroundColor: Colors.tint,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  slotImageFill: {
    width: '100%',
    height: '100%',
  },
  slotCornerBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(18,18,18,0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  smallSlotCorner: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(18,18,18,0.72)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  slotCornerBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  slotPlaceholder: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.deep,
  },
  slotSubHint: {
    fontSize: 10.5,
    color: 'rgba(18,18,18,0.45)',
    marginTop: 2,
  },
  slotIconWrap: {
    marginTop: 8,
  },
  rightThumbnails: {
    flex: 1,
    gap: 6,
  },
  smallSlot: {
    flex: 1,
    backgroundColor: Colors.tint,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    gap: 3,
  },
  smallSlotText: {
    fontSize: 10.5,
    color: Colors.deep,
    fontWeight: '700',
  },
  extraStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  extraThumbSlot: {
    width: 68,
    height: 68,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.tint,
  },
  addExtraTile: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.accent,
    backgroundColor: 'rgba(232, 39, 107, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addExtraText: {
    color: Colors.accent,
    fontSize: 11.5,
    fontWeight: '700',
  },
  countStatusRow: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  countStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(18,18,18,0.52)',
  },
  captionText: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(18, 18, 18, 0.8)',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  postFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sharePostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 7,
  },
  sharePostBtnMuted: {
    backgroundColor: '#2a2a30',
  },
  sharePostBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  instaBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tint2,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  instaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.accent,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 30,
  },
  shareModalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 18,
    maxHeight: '92%',
  },
  shareHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closePillBtn: {
    backgroundColor: '#f1f1f4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  closePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121212',
  },
  modalKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: Colors.accent,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121212',
    marginTop: 2,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(18,18,18,0.55)',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(18,18,18,0.08)',
  },
  modalTextarea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#f1f1f4',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#121212',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  posterCanvas: {
    backgroundColor: '#121216',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e8276b',
  },
  posterBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  posterStudioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  posterLogoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#e8276b',
    backgroundColor: '#1f161b',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  posterLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  posterLogoInitials: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  posterStudioName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  posterByShilpi: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10,
    fontWeight: '500',
  },
  posterShilpiMark: {
    width: 72,
    height: 18,
  },
  posterCollageWrap: {
    flexDirection: 'row',
    height: 210,
    gap: 5,
  },
  posterHeroBox: {
    flex: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e1e24',
    position: 'relative',
  },
  posterFinishedChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(232, 39, 107, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  posterFinishedChipText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  posterDetailsCol: {
    flex: 1,
    gap: 5,
  },
  posterDetailCell: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1e1e24',
  },
  posterFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  posterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  posterLookTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  posterStreakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 39, 107, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
  },
  posterStreakText: {
    color: '#ff7daa',
    fontSize: 9,
    fontWeight: '700',
  },
  posterCaptionText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 5,
  },
  posterBottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  posterPlaceDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
  posterTagText: {
    color: '#ff7daa',
    fontSize: 10.5,
    fontWeight: '700',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
  },
  shareActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  saveTagOnlyBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  saveTagOnlyText: {
    color: 'rgba(18,18,18,0.65)',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
