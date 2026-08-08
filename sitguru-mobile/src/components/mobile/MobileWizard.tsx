import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import TouchTarget from '@/components/mobile/TouchTarget';
import {
  MobileSpace,
  MobileType,
  TOUCH_MIN,
} from '@/constants/mobile-layout';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';

export type WizardStep = {
  id: string;
  title: string;
  helper?: string;
};

type MobileWizardProps = {
  steps: WizardStep[];
  stepIndex: number;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  /** Hide chrome when embedding a single step inside a larger screen. */
  compact?: boolean;
};

/**
 * One job per step — horizontal slide between steps (no abrupt jumps).
 */
export default function MobileWizard({
  steps,
  stepIndex,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  backLabel = 'Back',
  nextDisabled = false,
  compact = false,
}: MobileWizardProps) {
  const step = steps[stepIndex];
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= steps.length - 1;
  const prevIndexRef = useRef(stepIndex);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const nextGlow = useSharedValue(nextDisabled ? 0 : 1);

  useEffect(() => {
    const previous = prevIndexRef.current;
    const direction = stepIndex >= previous ? 1 : -1;
    prevIndexRef.current = stepIndex;

    translateX.value = direction * 56;
    opacity.value = 0.55;
    translateX.value = withTiming(0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity, stepIndex, translateX]);

  useEffect(() => {
    nextGlow.value = withTiming(nextDisabled ? 0 : 1, { duration: 220 });
  }, [nextDisabled, nextGlow]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const nextStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + nextGlow.value * 0.45,
    transform: [{ scale: 0.985 + nextGlow.value * 0.015 }],
  }));

  return (
    <View style={styles.wrap}>
      {!compact ? (
        <View style={styles.progressRow}>
          {steps.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.pip,
                index <= stepIndex ? styles.pipActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}

      {!compact && step ? (
        <Animated.View style={[styles.header, bodyStyle]}>
          <Text style={styles.stepMeta}>
            Step {stepIndex + 1} of {steps.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          {step.helper ? (
            <Text style={styles.helper}>{step.helper}</Text>
          ) : null}
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.body, bodyStyle]}>{children}</Animated.View>

      {(onBack || onNext) && !compact ? (
        <View style={styles.actions}>
          {!isFirst && onBack ? (
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              onPress={onBack}
              style={styles.secondary}
            >
              <Text style={styles.secondaryText}>{backLabel}</Text>
            </TouchTarget>
          ) : null}

          {onNext ? (
            <Animated.View
              style={[
                styles.primaryShell,
                isFirst ? styles.primaryAlone : null,
                nextStyle,
              ]}
            >
              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel={nextLabel}
                disabled={nextDisabled}
                onPress={onNext}
                style={[
                  styles.primary,
                  nextDisabled ? styles.primaryDisabled : null,
                ]}
              >
                <Text style={styles.primaryText}>
                  {isLast ? nextLabel : nextLabel}
                </Text>
              </TouchTarget>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.md,
    maxWidth: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MobileSpace.sm,
    width: '100%',
  },
  pip: {
    backgroundColor: SitGuruColors.border,
    borderRadius: 999,
    flexGrow: 1,
    height: 4,
    minWidth: 24,
  },
  pipActive: {
    backgroundColor: SitGuruColors.primary,
  },
  header: {
    gap: MobileSpace.xs,
    width: '100%',
  },
  stepMeta: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.title,
    letterSpacing: -0.4,
  },
  helper: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
  },
  body: {
    gap: MobileSpace.md,
    maxWidth: '100%',
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MobileSpace.sm,
    width: '100%',
  },
  secondary: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: TOUCH_MIN,
    minWidth: '40%',
    paddingHorizontal: MobileSpace.lg,
  },
  secondaryText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
  primaryShell: {
    flexGrow: 1,
    minWidth: '40%',
  },
  primary: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 16,
    minHeight: TOUCH_MIN,
    paddingHorizontal: MobileSpace.lg,
    width: '100%',
  },
  primaryAlone: {
    minWidth: '100%',
  },
  primaryDisabled: {
    opacity: 0.72,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
});
