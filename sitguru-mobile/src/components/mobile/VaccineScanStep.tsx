import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle2, ImagePlus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import TouchTarget from '@/components/mobile/TouchTarget';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';

type VaccineScanStepProps = {
  uri: string | null;
  onCapture: (uri: string) => void;
};

/**
 * Camera-first vaccine paper capture for Pet Passport onboarding.
 */
export default function VaccineScanStep({
  uri,
  onCapture,
}: VaccineScanStepProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  async function snap() {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      if (photo?.uri) onCapture(photo.uri);
    } finally {
      setBusy(false);
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.72,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      onCapture(result.assets[0].uri);
    }
  }

  if (uri) {
    return (
      <View style={styles.wrap}>
        <Image source={{ uri }} style={styles.preview} />
        <View style={styles.successRow}>
          <CheckCircle2 color={SitGuruColors.primary} size={20} strokeWidth={2.4} />
          <Text style={styles.successText}>Vaccine papers captured</Text>
        </View>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Retake vaccine photo"
          onPress={() => onCapture('')}
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>Retake</Text>
        </TouchTarget>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.helper}>
          SitGuru uses the camera to scan vaccine papers so Gurus see verified
          care details without long forms.
        </Text>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Allow camera"
          onPress={() => void requestPermission()}
          style={styles.primary}
        >
          <Camera color="#FFFFFF" size={18} strokeWidth={2.4} />
          <Text style={styles.primaryText}>Allow camera</Text>
        </TouchTarget>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Upload from library"
          onPress={() => void pickFromLibrary()}
          style={styles.secondary}
        >
          <ImagePlus color={SitGuruColors.primary} size={18} strokeWidth={2.4} />
          <Text style={styles.secondaryText}>Upload instead</Text>
        </TouchTarget>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.helper}>
          Camera scanning runs on a device build. Upload vaccine papers for web
          preview.
        </Text>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Upload from library"
          onPress={() => void pickFromLibrary()}
          style={styles.primary}
        >
          <ImagePlus color="#FFFFFF" size={18} strokeWidth={2.4} />
          <Text style={styles.primaryText}>Upload papers</Text>
        </TouchTarget>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.cameraFrame}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.scanGuide} pointerEvents="none" />
      </View>
      <Text style={styles.helper}>
        Align the vaccine certificate inside the frame, then capture.
      </Text>
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Capture vaccine papers"
        disabled={busy}
        onPress={() => void snap()}
        style={[styles.primary, busy && styles.disabled]}
      >
        <Camera color="#FFFFFF" size={18} strokeWidth={2.4} />
        <Text style={styles.primaryText}>
          {busy ? 'Capturing…' : 'Scan papers'}
        </Text>
      </TouchTarget>
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Upload from library"
        onPress={() => void pickFromLibrary()}
        style={styles.secondary}
      >
        <ImagePlus color={SitGuruColors.primary} size={18} strokeWidth={2.4} />
        <Text style={styles.secondaryText}>Upload instead</Text>
      </TouchTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.md,
    width: '100%',
  },
  cameraFrame: {
    borderRadius: 20,
    height: 280,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  scanGuide: {
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 2,
    bottom: 24,
    left: 24,
    position: 'absolute',
    right: 24,
    top: 24,
  },
  preview: {
    borderRadius: 20,
    height: 280,
    width: '100%',
  },
  successRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
  },
  successText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.body,
  },
  helper: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
  },
  primary: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    gap: MobileSpace.sm,
    minHeight: TOUCH_MIN,
    paddingHorizontal: MobileSpace.lg,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
  secondary: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: MobileSpace.sm,
    minHeight: TOUCH_MIN,
    paddingHorizontal: MobileSpace.lg,
  },
  secondaryText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
  disabled: {
    opacity: 0.55,
  },
});
