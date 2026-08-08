import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import MobileScreen from '@/components/mobile/MobileScreen';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import TouchTarget from '@/components/mobile/TouchTarget';
import SitGuruButton from '@/components/SitGuruButton';
import { SitGuruColors } from '@/constants/colors';
import { getCompanion } from '@/constants/companions';
import { AppFonts } from '@/constants/fonts';
import {
  MobileSpace,
  MobileType,
  StickyFooterClearance,
  TOUCH_MIN,
} from '@/constants/mobile-layout';

/**
 * Deep-dive for one AI companion (Rogue / Taco / Scout).
 */
export default function AiCompanionScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const companion = getCompanion(
    Array.isArray(params.id) ? params.id[0] : params.id,
  );

  return (
    <MobileScreen
      scrollBottomInset={StickyFooterClearance.actionOnly}
      footer={
        <StickyActionBar embedded>
          <SitGuruButton
            label={companion.ctaLabel}
            onPress={() => router.push('/conversation')}
          />
          <SitGuruButton
            label={`Open ${companion.benefitsLabel}`}
            variant="secondary"
            onPress={() => router.push(companion.setupRoute)}
          />
        </StickyActionBar>
      }
    >
      <View style={styles.header}>
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <ChevronLeft color={SitGuruColors.text} size={22} strokeWidth={2.4} />
        </TouchTarget>
        <Text style={styles.headerTitle}>AI Companion</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Sparkles color="#FFFFFF" size={28} strokeWidth={2.4} />
        </View>
        <Text style={styles.name}>{companion.name}</Text>
        <Text style={styles.role}>{companion.title}</Text>
        <Text style={styles.audience}>For {companion.audience}</Text>
        <Text style={styles.helper}>{companion.helper}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Support layout</Text>
        <Text style={styles.cardTitle}>{companion.benefitsLabel}</Text>
        <Text style={styles.cardText}>
          Onboarding and support stay one companion at a time — tap Continue to
          chat, or open setup for the matching workspace path.
        </Text>
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
    marginBottom: MobileSpace.lg,
  },
  back: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 14,
    height: TOUCH_MIN,
    width: TOUCH_MIN,
  },
  headerTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.title,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 24,
    gap: MobileSpace.sm,
    marginBottom: MobileSpace.lg,
    padding: MobileSpace.xl,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    marginBottom: MobileSpace.sm,
    width: 64,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 28,
  },
  role: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: AppFonts.bold,
    fontSize: MobileType.body,
  },
  audience: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
  },
  helper: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
    marginTop: MobileSpace.sm,
    textAlign: 'center',
  },
  card: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: MobileSpace.sm,
    padding: MobileSpace.lg,
  },
  cardEyebrow: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.micro,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  cardText: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
  },
});
