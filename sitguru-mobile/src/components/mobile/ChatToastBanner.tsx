import { MessageCircle, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BubblePressable from '@/components/BubblePressable';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, StickyFooterClearance } from '@/constants/mobile-layout';
import type { ChatToastPayload } from '@/hooks/data/useIncomingMessageToast';

type ChatToastBannerProps = {
  toast: ChatToastPayload | null;
  onDismiss: () => void;
  onPress?: (toast: ChatToastPayload) => void;
  isDark?: boolean;
};

/**
 * Top-anchored in-app toast for incoming chat/care snippets.
 * Stays clear of StickyActionBar + bottom tabs (top overlay, high zIndex).
 */
export default function ChatToastBanner({
  toast,
  onDismiss,
  onPress,
  isDark = false,
}: ChatToastBannerProps) {
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) {
      animation.setValue(0);
      return;
    }

    animation.setValue(0);
    Animated.timing(animation, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [animation, toast?.id]);

  if (!toast) return null;

  const palette = isDark
    ? {
        background: '#0D3222',
        border: '#2C7450',
        iconBg: '#154A31',
        title: '#F0FFF6',
        text: '#BFE2CC',
        icon: '#39D982',
      }
    : {
        background: '#ECF9F0',
        border: '#A9DEBA',
        iconBg: '#D6F2DF',
        title: '#075A39',
        text: '#3C6855',
        icon: '#0D5C3A',
      };

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          // Keep above sticky footers / nav; never compete with thumb-zone CTAs.
          paddingTop: Math.max(insets.top, MobileSpace.md),
          paddingBottom: StickyFooterClearance.navOnly,
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-18, 0],
              }),
            },
          ],
        },
      ]}
    >
      <BubblePressable
        accessibilityRole="button"
        onPress={() => {
          onPress?.(toast);
          onDismiss();
        }}
        scaleTo={0.97}
        style={[
          styles.banner,
          {
            backgroundColor: palette.background,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: palette.iconBg }]}>
          <MessageCircle color={palette.icon} size={18} strokeWidth={2.4} />
        </View>

        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.title }]}>
            {toast.title}
          </Text>
          <Text numberOfLines={2} style={[styles.snippet, { color: palette.text }]}>
            {toast.snippet}
          </Text>
        </View>

        <BubblePressable
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
          hitSlop={10}
          onPress={(event) => {
            event.stopPropagation?.();
            onDismiss();
          }}
          scaleTo={0.88}
          style={styles.dismiss}
        >
          <X color={palette.text} size={16} strokeWidth={2.4} />
        </BubblePressable>
      </BubblePressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 40,
  },
  banner: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: MobileSpace.lg,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    // Above StickyActionBar (zIndex 20) but below modal sheets.
    elevation: 8,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontFamily: AppFonts.extraBold,
    fontSize: 13,
  },
  snippet: {
    fontFamily: AppFonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  dismiss: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 28,
  },
});
