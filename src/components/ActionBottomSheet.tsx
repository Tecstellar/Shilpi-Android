import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
} from 'react-native';
import { Colors } from '../theme/colors';

export interface ActionSheetData {
  kicker: string;
  title: string;
  message: string;
  cta: string;
  logoUri?: string;
  onConfirm?: () => void;
}

interface ActionBottomSheetProps {
  sheet: ActionSheetData | null;
  onClose: () => void;
}

export const ActionBottomSheet: React.FC<ActionBottomSheetProps> = ({ sheet, onClose }) => {
  if (!sheet) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheetContainer}>
        {/* Drag handle line */}
        <View style={styles.handleBar} />

        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.kicker}>{sheet.kicker}</Text>
            <Text style={styles.title}>{sheet.title}</Text>
          </View>
          {sheet.logoUri ? (
            <View style={styles.brandLogoBox}>
              <Image source={{ uri: sheet.logoUri }} style={styles.brandLogoImage} resizeMode="cover" />
            </View>
          ) : null}
        </View>

        <ScrollView style={styles.messageScroll} bounces={false}>
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{sheet.message}</Text>
          </View>
        </ScrollView>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>NOT NOW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              if (sheet.onConfirm) sheet.onConfirm();
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryText}>{sheet.cta.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.45)',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(18, 18, 18, 0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 39, 107, 0.35)',
    backgroundColor: '#ffeef4',
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.deep,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    color: '#121212',
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 14,
  },
  messageScroll: {
    maxHeight: 180,
    marginBottom: 16,
  },
  messageBox: {
    backgroundColor: Colors.tint,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.06)',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#121212',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f4f4f6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#121212',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ffffff',
  },
});
