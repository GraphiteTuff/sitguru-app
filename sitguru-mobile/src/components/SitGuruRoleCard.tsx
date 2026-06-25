import type { ComponentProps } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruIconBadge, { type SitGuruIconName } from '@/components/SitGuruIconBadge';
import { SitGuruColors } from '@/constants/colors';

type LinkHref = ComponentProps<typeof Link>['href'];
type SitGuruRoleTone = 'petParent' | 'guru' | 'ambassador';

type SitGuruRoleCardProps = {
  accessLabel?: string;
  actionLabel?: string;
  description: string;
  href: LinkHref;
  icon: SitGuruIconName;
  meta: string;
  title: string;
  tone: SitGuruRoleTone;
};

export default function SitGuruRoleCard({
  accessLabel = 'Registered role',
  actionLabel = 'Open',
  description,
  href,
  icon,
  meta,
  title,
  tone,
}: SitGuruRoleCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityLabel={`${title}. ${description}`}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          toneStyles[tone].card,
          pressed ? styles.pressed : null,
        ]}
      >
        <SitGuruIconBadge name={icon} size="large" tone={toneStyles[tone].badgeTone} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.badgeRow}>
              <Text style={[styles.meta, toneStyles[tone].meta]}>{meta}</Text>
              <Text style={[styles.access, toneStyles[tone].access]}>
                {accessLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.action}>
          <Text style={[styles.actionText, toneStyles[tone].meta]}>
            {actionLabel}
          </Text>
          <Text style={[styles.arrow, toneStyles[tone].meta]}>→</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SitGuruColors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: SitGuruColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 122,
    padding: 18,
    elevation: 4,
  },
  pressed: {
    opacity: 0.88,
    transform: [
      {
        translateY: 1,
      },
    ],
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    gap: 6,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  meta: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  access: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  description: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '900',
  },
  action: {
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    textTransform: 'uppercase',
  },
});

const toneStyles = {
  petParent: {
    card: {
      borderColor: SitGuruColors.primaryLight,
    },
    badgeTone: 'primary' as const,
    meta: {
      color: SitGuruColors.primary,
    },
    access: {
      backgroundColor: SitGuruColors.surfaceSoft,
      color: SitGuruColors.primary,
    },
  },
  guru: {
    card: {
      borderColor: 'rgba(181, 71, 8, 0.24)',
    },
    badgeTone: 'warning' as const,
    meta: {
      color: SitGuruColors.warning,
    },
    access: {
      backgroundColor: 'rgba(181, 71, 8, 0.1)',
      color: SitGuruColors.warning,
    },
  },
  ambassador: {
    card: {
      borderColor: 'rgba(180, 35, 24, 0.20)',
    },
    badgeTone: 'danger' as const,
    meta: {
      color: SitGuruColors.danger,
    },
    access: {
      backgroundColor: 'rgba(180, 35, 24, 0.08)',
      color: SitGuruColors.danger,
    },
  },
};
