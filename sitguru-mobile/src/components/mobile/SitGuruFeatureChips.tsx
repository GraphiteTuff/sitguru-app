import { router } from 'expo-router';
import {
  Gift,
  MapPin,
  PawPrint,
  Search,
  Sparkles,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace } from '@/constants/mobile-layout';
import {
  PET_PARENT_EXPERIENCES,
  VISITOR_EXPERIENCES,
  type ExperienceIconKey,
  type MobileExperience,
} from '@/constants/mobile-experiences';
import { useTheme } from '@/hooks/use-theme';

const ICONS: Record<ExperienceIconKey, LucideIcon> = {
  events: MapPin,
  rogue: Sparkles,
  delilah: Sparkles,
  passports: PawPrint,
  pawperks: Gift,
  explore: Search,
};

type SitGuruFeatureChipsProps = {
  chips?: MobileExperience[];
  /** Preset chip sets — never include primary book/join actions here. */
  preset?: 'visitor' | 'petParent';
  title?: string;
};

/**
 * Secondary SitGuru experiences — compact horizontal chips.
 * Always sits *below* scroll content; never replaces ConvertActionBar.
 */
export default function SitGuruFeatureChips({
  chips,
  preset = 'visitor',
  title = 'More from SitGuru',
}: SitGuruFeatureChipsProps) {
  const theme = useTheme();
  const resolved =
    chips ?? (preset === 'petParent' ? PET_PARENT_EXPERIENCES : VISITOR_EXPERIENCES);

  if (resolved.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.colors.textMuted }]}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {resolved.map((chip) => {
          const Icon = ICONS[chip.icon];
          return (
            <BubblePressable
              key={chip.id}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
              bubble
              bubbleColor={theme.colors.primarySoft}
              bubblePlacement="fill"
              haptic="light"
              onPress={() => {
                if (chip.params) {
                  router.push({
                    pathname: chip.href as never,
                    params: chip.params,
                  });
                  return;
                }
                router.push(chip.href as never);
              }}
              scaleTo={0.96}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.colors.backgroundElement,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon color={theme.colors.primary} size={16} strokeWidth={2.2} />
              <Text style={[styles.chipLabel, { color: theme.colors.text }]}>
                {chip.label}
              </Text>
            </BubblePressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.sm,
    marginTop: MobileSpace.md,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: MobileSpace.sm,
    paddingRight: MobileSpace.lg,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipLabel: {
    fontFamily: AppFonts.bold,
    fontSize: 13,
  },
});
