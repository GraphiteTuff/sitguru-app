import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
 * One job per step — replace multi-field forms with sequential steps.
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
        <View style={styles.header}>
          <Text style={styles.stepMeta}>
            Step {stepIndex + 1} of {steps.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          {step.helper ? (
            <Text style={styles.helper}>{step.helper}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.body}>{children}</View>

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
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel={nextLabel}
              disabled={nextDisabled}
              onPress={onNext}
              style={[
                styles.primary,
                nextDisabled ? styles.primaryDisabled : null,
                isFirst ? styles.primaryAlone : null,
              ]}
            >
              <Text style={styles.primaryText}>
                {isLast ? nextLabel : nextLabel}
              </Text>
            </TouchTarget>
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
  primary: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 16,
    flexGrow: 1,
    minHeight: TOUCH_MIN,
    minWidth: '40%',
    paddingHorizontal: MobileSpace.lg,
  },
  primaryAlone: {
    minWidth: '100%',
  },
  primaryDisabled: {
    opacity: 0.55,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
});
