import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ImageStyle,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruColors } from '@/constants/colors';
import { MobileSpace, TOUCH_MIN } from '@/constants/mobile-layout';
import { resolveSupabaseStorageUrl } from '@/lib/storage';

type CachedRemoteImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  /** Tap opens a lightweight full-screen preview (inside GestureHandlerRootView). */
  expandable?: boolean;
};

/**
 * High-performance remote image loader for live PawReport feeds.
 * Uses expo-image memory+disk cache so Guru photo uploads don't stutter the UI.
 */
export default function CachedRemoteImage({
  uri,
  style,
  accessibilityLabel = 'Care photo',
  expandable = true,
}: CachedRemoteImageProps) {
  const [open, setOpen] = useState(false);
  const resolved = resolveSupabaseStorageUrl(uri) || uri || '';

  if (!resolved) return null;

  return (
    <>
      <BubblePressable
        accessibilityRole="imagebutton"
        accessibilityLabel={accessibilityLabel}
        disabled={!expandable}
        onPress={() => {
          if (expandable) setOpen(true);
        }}
        scaleTo={0.88}
        style={styles.pressable}
      >
        <Image
          accessibilityLabel={accessibilityLabel}
          source={{ uri: resolved }}
          style={[styles.image, style]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={160}
          recyclingKey={resolved}
        />
      </BubblePressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          onPress={() => setOpen(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalFrame}>
            <Image
              source={{ uri: resolved }}
              style={styles.modalImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: TOUCH_MIN,
    minWidth: TOUCH_MIN,
  },
  image: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 14,
    height: 96,
    width: 96,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 36, 23, 0.92)',
    flex: 1,
    justifyContent: 'center',
    padding: MobileSpace.lg,
  },
  modalFrame: {
    height: '72%',
    width: '100%',
  },
  modalImage: {
    flex: 1,
    width: '100%',
  },
});
