import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import MobileScreen from '@/components/mobile/MobileScreen';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import TouchTarget from '@/components/mobile/TouchTarget';
import SitGuruButton from '@/components/SitGuruButton';
import { SitGuruColors } from '@/constants/colors';
import {
  getCompanion,
  getCompanionWebChatUrl,
} from '@/constants/companions';
import { AppFonts } from '@/constants/fonts';
import {
  MobileSpace,
  MobileType,
  StickyFooterClearance,
  TOUCH_MIN,
} from '@/constants/mobile-layout';

/**
 * Deep-dive for one AI companion (Rogue / Taco / Scout).
 * Live chat opens the matching sitguru.com companion surface.
 */
export default function AiCompanionScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const companion = getCompanion(
    Array.isArray(params.id) ? params.id[0] : params.id,
  );

  async function openLiveChat() {
    await openBrowserAsync(getCompanionWebChatUrl(companion.id), {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  }

  return (
    <MobileScreen
      scrollBottomInset={StickyFooterClearance.actionOnly}
      footer={
        <StickyActionBar embedded>
          <SitGuruButton label={companion.ctaLabel} onPress={openLiveChat} />
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
        <Text style={styles.cardEyebrow}>Live chat</Text>
        <Text style={styles.cardTitle}>{companion.ctaLabel}</Text>
        <Text style={styles.cardText}>
          Opens the SitGuru web companion so you get the same Rogue, Scout, or
          Taco chat experience as sitguru.com — FAQ chips, benefits, and live
          answers included.
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
    alignItems: 'center',
    height: TOUCH_MIN,
    justifyContent: 'center',
    width: TOUCH_MIN,
  },
  headerTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontFamily: AppFonts.black,
    fontSize: MobileType.title,
  },
  hero: {
    alignItems: 'center',
    marginBottom: MobileSpace.xl,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: MobileSpace.md,
    width: 80,
  },
  name: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.black,
    fontSize: 28,
    textAlign: 'center',
  },
  role: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.black,
    fontSize: 12,
    letterSpacing: 1.6,
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  audience: {
    color: SitGuruColors.muted,
    fontFamily: AppFonts.semibold,
    fontSize: MobileType.body,
    marginTop: MobileSpace.sm,
    textAlign: 'center',
  },
  helper: {
    color: SitGuruColors.muted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
    marginTop: MobileSpace.md,
    textAlign: 'center',
  },
  card: {
    backgroundColor: SitGuruColors.card,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: MobileSpace.lg,
  },
  cardEyebrow: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.black,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.black,
    fontSize: 20,
    marginTop: MobileSpace.sm,
  },
  cardText: {
    color: SitGuruColors.muted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
    marginTop: MobileSpace.sm,
  },
});
