import type { ComponentProps } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import SitGuruIconBadge, { type SitGuruIconName } from '@/components/SitGuruIconBadge';
import { SitGuruColors } from '@/constants/colors';

type LinkHref = ComponentProps<typeof Link>['href'];
type SitGuruActionTone = 'neutral' | 'primary' | 'warning' | 'danger' | 'dark';

type SitGuruActionCardProps = {
  ctaLabel?: string;
  description: string;
  href?: LinkHref;
  icon: SitGuruIconName;
  meta?: string;
  onPress?: () => void;
  title: string;
  tone?: SitGuruActionTone;
};

export default function SitGuruActionCard({
  ctaLabel,
  description,
  href,
  icon,
  meta,
  onPress,
  title,
  tone = 'neutral',
}: SitGuruActionCardProps) {
  const isActionable = Boolean(href || onPress);
  const card = (
    <BubblePressable
      accessibilityLabel={`${title}. ${description}`}
      accessibilityRole={isActionable ? 'button' : undefined}
      disabled={!isActionable}
      onPress={onPress}
      scaleTo={isActionable ? 0.965 : 1}
      style={[styles.card, toneStyles[tone].card]}
    >
      <View style={styles.topRow}>
        <SitGuruIconBadge
          name={icon}
          size="small"
          tone={tone === 'dark' ? 'dark' : tone}
        />
        {meta ? (
          <Text style={[styles.meta, toneStyles[tone].meta]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, toneStyles[tone].title]}>{title}</Text>
        <Text style={[styles.description, toneStyles[tone].description]}>
          {description}
        </Text>
      </View>

      {ctaLabel ? (
        <View style={[styles.ctaPill, toneStyles[tone].ctaPill]}>
          <Text style={[styles.ctaText, toneStyles[tone].ctaText]}>
            {ctaLabel}
          </Text>
        </View>
      ) : null}
    </BubblePressable>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        {card}
      </Link>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    flex: 1,
    gap: 12,
    minWidth: 156,
    padding: 15,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  meta: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  copy: {
    gap: 5,
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  description: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 15,
  },
});

const toneStyles = {
  neutral: {
    card: {},
    meta: {
      color: SitGuruColors.textSoft,
    },
    title: {},
    description: {},
    ctaPill: {
      backgroundColor: SitGuruColors.background,
    },
    ctaText: {
      color: SitGuruColors.primary,
    },
  },
  primary: {
    card: {
      borderColor: SitGuruColors.primaryLight,
    },
    meta: {
      color: SitGuruColors.primary,
    },
    title: {},
    description: {},
    ctaPill: {
      backgroundColor: SitGuruColors.surfaceSoft,
    },
    ctaText: {
      color: SitGuruColors.primary,
    },
  },
  warning: {
    card: {
      borderColor: 'rgba(181, 71, 8, 0.22)',
    },
    meta: {
      color: SitGuruColors.warning,
    },
    title: {},
    description: {},
    ctaPill: {
      backgroundColor: 'rgba(181, 71, 8, 0.1)',
    },
    ctaText: {
      color: SitGuruColors.warning,
    },
  },
  danger: {
    card: {
      borderColor: 'rgba(180, 35, 24, 0.18)',
    },
    meta: {
      color: SitGuruColors.danger,
    },
    title: {},
    description: {},
    ctaPill: {
      backgroundColor: 'rgba(180, 35, 24, 0.08)',
    },
    ctaText: {
      color: SitGuruColors.danger,
    },
  },
  dark: {
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.16)',
    },
    meta: {
      color: '#DCEFE2',
    },
    title: {
      color: '#FFFFFF',
    },
    description: {
      color: '#DCEFE2',
    },
    ctaPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    ctaText: {
      color: '#FFFFFF',
    },
  },
};
