import { useCallback, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type AvatarMenuVariant = 'full' | 'quick';

/**
 * Own-avatar menus:
 * - tap → full Profile & Account / workspace sheet
 * - long-press → roles-only quick switcher (mobile only)
 */
export function useOwnAvatarMenus() {
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<AvatarMenuVariant>('full');
  const suppressTapRef = useRef(false);

  const openFull = useCallback(() => {
    if (suppressTapRef.current) {
      suppressTapRef.current = false;
      return;
    }
    setVariant('full');
    setVisible(true);
  }, []);

  const openQuick = useCallback(() => {
    suppressTapRef.current = true;
    setVariant('quick');
    setVisible(true);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const avatarPressProps = {
    onPress: openFull,
    onLongPress: openQuick,
    delayLongPress: 380,
  } satisfies {
    onPress: (event?: GestureResponderEvent) => void;
    onLongPress: (event?: GestureResponderEvent) => void;
    delayLongPress: number;
  };

  return {
    visible,
    variant,
    openFull,
    openQuick,
    close,
    avatarPressProps,
  };
}
