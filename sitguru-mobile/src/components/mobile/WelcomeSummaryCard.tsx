import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import SitGuruButton from '@/components/SitGuruButton';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType } from '@/constants/mobile-layout';

type WelcomeSummaryCardProps = {
  petName: string;
  petType?: string | null;
  breed?: string | null;
  size?: string | null;
  onOpenDashboard: () => void;
  onStayHere: () => void;
};

/**
 * Post-onboarding welcome card — expands into the PriorityCarousel stream next.
 */
export default function WelcomeSummaryCard({
  petName,
  petType,
  breed,
  size,
  onOpenDashboard,
  onStayHere,
}: WelcomeSummaryCardProps) {
  const expand = useSharedValue(0);

  useEffect(() => {
    expand.value = withDelay(
      40,
      withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [expand]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: expand.value,
    transform: [
      { scale: 0.94 + expand.value * 0.06 },
      { translateY: (1 - expand.value) * 18 },
    ],
  }));

  const meta = [petType, breed, size].filter(Boolean).join(' · ');

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <Text style={styles.eyebrow}>Welcome to the pack</Text>
      <Text style={styles.title}>{petName} is ready</Text>
      <Text style={styles.helper}>
        Passport saved. This profile card drops into your Priority carousel so
        Find Care and handoffs stay one thumb away.
      </Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}

      <View style={styles.actions}>
        <SitGuruButton
          label="See on dashboard"
          onPress={onOpenDashboard}
          accessibilityLabel="Open pet parent dashboard with welcome card"
        />
        <SitGuruButton
          label="Stay in passports"
          onPress={onStayHere}
          variant="ghost"
          accessibilityLabel="Return to pet passport hub"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 24,
    gap: MobileSpace.sm,
    padding: MobileSpace.lg,
    width: '100%',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.title,
    letterSpacing: -0.4,
  },
  helper: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
  },
  meta: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.caption,
    marginTop: MobileSpace.xs,
  },
  actions: {
    gap: MobileSpace.sm,
    marginTop: MobileSpace.md,
    width: '100%',
  },
});
