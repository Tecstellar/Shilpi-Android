import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

interface PhotoPickerModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  hasExistingPhoto?: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onRemovePhoto?: () => void;
}

// Premium Camera Icon
const CameraVectorIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={2} />
  </Svg>
);

// Premium Gallery / Image Icon
const GalleryVectorIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Path
      d="M21 15l-5-5L5 21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Trash / Delete Icon
const TrashVectorIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Close (X) Icon
const CloseIcon = ({ color = '#64748b', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
  visible,
  title = 'Add Photo',
  subtitle = 'Choose a photo source',
  hasExistingPhoto = false,
  onClose,
  onSelectCamera,
  onSelectGallery,
  onRemovePhoto,
}) => {
  const { colors } = useTheme();

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onClose();
  };

  const handleCamera = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectCamera();
  };

  const handleGallery = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectGallery();
  };

  const handleRemove = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (onRemovePhoto) onRemovePhoto();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { borderColor: colors.borderLight }]}>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.kicker, { color: colors.accent }]}>CHOOSE MEDIA</Text>
                  <Text style={styles.title}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close photo picker"
                >
                  <CloseIcon color="#64748b" size={16} />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.optionsWrap}>
                {/* 1. Camera Option */}
                <TouchableOpacity
                  style={[styles.optionRow, { borderColor: colors.borderLight }]}
                  onPress={handleCamera}
                  activeOpacity={0.7}
                  accessibilityLabel="Take Photo with Camera"
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.tint2 }]}>
                    <CameraVectorIcon color={colors.accent} size={20} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Take Photo</Text>
                    <Text style={styles.optionSubtitle}>Capture look with your camera</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Gallery Option */}
                <TouchableOpacity
                  style={[styles.optionRow, { borderColor: colors.borderLight }]}
                  onPress={handleGallery}
                  activeOpacity={0.7}
                  accessibilityLabel="Choose from Device Gallery"
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#f0f9ff' }]}>
                    <GalleryVectorIcon color="#0284c7" size={20} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Choose from Gallery</Text>
                    <Text style={styles.optionSubtitle}>Select saved photos or albums</Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Remove Option (If photo exists) */}
                {hasExistingPhoto && onRemovePhoto && (
                  <TouchableOpacity
                    style={[styles.optionRow, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}
                    onPress={handleRemove}
                    activeOpacity={0.7}
                    accessibilityLabel="Remove Current Photo"
                  >
                    <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
                      <TrashVectorIcon color="#ef4444" size={20} />
                    </View>
                    <View style={styles.optionTextCol}>
                      <Text style={[styles.optionTitle, { color: '#dc2626' }]}>Remove Photo</Text>
                      <Text style={styles.optionSubtitle}>Clear current profile picture</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={handleClose}
                activeOpacity={0.75}
                accessibilityLabel="Cancel photo selection"
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsWrap: {
    gap: 10,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  cancelBtn: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.5,
  },
});
