import { Check, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { MobileSpace, TOUCH_MIN } from '@/constants/mobile-layout';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';

const ACTION_WIDTH = 88;
const THRESHOLD = 72;

type SwipeableListItemProps = {
  children: ReactNode;
  /** Swipe right → accept (green). */
  onSwipeRight?: () => void;
  /** Swipe left → decline (amber/red). */
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  enabled?: boolean;
  disabled?: boolean;
};

/**
 * Thumb-friendly list gestures:
 * swipe right to accept, swipe left to decline.
 */
export default function SwipeableListItem({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = 'Accept',
  leftLabel = 'Decline',
  enabled = true,
  disabled = false,
}: SwipeableListItemProps) {
  const translateX = useSharedValue(0);
  const flash = useSharedValue(0);
  const flashTone = useSharedValue(1); // 1 accept, 0 decline
  const canAccept = Boolean(onSwipeRight) && enabled && !disabled;
  const canDecline = Boolean(onSwipeLeft) && enabled && !disabled;

  const reset = useCallback(() => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
  }, [translateX]);

  const pulseSuccess = useCallback(
    (accepted: boolean) => {
      flashTone.value = accepted ? 1 : 0;
      flash.value = withSequence(
        withTiming(0.28, { duration: 90 }),
        withTiming(0, { duration: 260 }),
      );
    },
    [flash, flashTone],
  );

  const fireAccept = useCallback(() => {
    pulseSuccess(true);
    onSwipeRight?.();
    reset();
  }, [onSwipeRight, pulseSuccess, reset]);

  const fireDecline = useCallback(() => {
    pulseSuccess(false);
    onSwipeLeft?.();
    reset();
  }, [onSwipeLeft, pulseSuccess, reset]);

  const pan = Gesture.Pan()
    .enabled(canAccept || canDecline)
    .activeOffsetX([-18, 18])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      let next = event.translationX;
      if (!canAccept && next > 0) next = 0;
      if (!canDecline && next < 0) next = 0;
      const max = ACTION_WIDTH + 24;
      if (next > max) next = max;
      if (next < -max) next = -max;
      translateX.value = next;
    })
    .onEnd((event) => {
      if (event.translationX > THRESHOLD && canAccept) {
        translateX.value = withSpring(ACTION_WIDTH);
        runOnJS(fireAccept)();
        return;
      }
      if (event.translationX < -THRESHOLD && canDecline) {
        translateX.value = withSpring(-ACTION_WIDTH);
        runOnJS(fireDecline)();
        return;
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        scale: 1 - Math.min(Math.abs(translateX.value) / 900, 0.02),
      },
    ],
  }));

  const acceptStyle = useAnimatedStyle(() => ({
    opacity:
      translateX.value > 8 ? Math.min(translateX.value / THRESHOLD, 1) : 0,
  }));

  const declineStyle = useAnimatedStyle(() => ({
    opacity:
      translateX.value < -8 ? Math.min(-translateX.value / THRESHOLD, 1) : 0,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
    backgroundColor:
      flashTone.value > 0.5 ? SitGuruColors.primary : SitGuruColors.danger,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.actionAccept, acceptStyle]}>
        <Check color="#FFFFFF" size={22} strokeWidth={2.6} />
        <Text style={styles.actionText}>{rightLabel}</Text>
      </Animated.View>

      <Animated.View style={[styles.actionDecline, declineStyle]}>
        <X color="#FFFFFF" size={22} strokeWidth={2.6} />
        <Text style={styles.actionText}>{leftLabel}</Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          {children}
          <Animated.View
            pointerEvents="none"
            style={[styles.flashOverlay, flashStyle]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  card: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    width: '100%',
    zIndex: 2,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    zIndex: 3,
  },
  actionAccept: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    bottom: 0,
    gap: 4,
    justifyContent: 'center',
    left: 0,
    minWidth: ACTION_WIDTH,
    paddingHorizontal: MobileSpace.md,
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  actionDecline: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.danger,
    bottom: 0,
    gap: 4,
    justifyContent: 'center',
    minWidth: ACTION_WIDTH,
    paddingHorizontal: MobileSpace.md,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  actionText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 12,
  },
});

export const SWIPE_HINT =
  'Swipe right to accept · Swipe left to decline';
