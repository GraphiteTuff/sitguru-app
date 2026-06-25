import type { ComponentProps } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SitGuruIconBadge, { type SitGuruIconName } from '@/components/SitGuruIconBadge';
import { SitGuruColors } from '@/constants/colors';

type LinkHref = ComponentProps<typeof Link>['href'];
type SitGuruDashboardTone = 'primary' | 'warning' | 'danger';

type SitGuruDashboardHeaderProps = {
  actionHref?: LinkHref;
  actionLabel?: string;
  icon: SitGuruIconName;
  roleLabel: string;
  statusText?: string;
  subtitle: string;
  title: string;
  tone?: SitGuruDashboardTone;
};

export default function SitGuruDashboardHeader({
  actionHref,
  actionLabel,
  icon,
  roleLabel,
  statusText,
  subtitle,
  title,
  tone = 'primary',
}: SitGuruDashboardHeaderProps) {
  const action =
    actionHref && actionLabel ? (
      <Link href={actionHref} asChild>
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            pressed ? styles.actionPressed : null,
          ]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      </Link>
    ) : null;

  return (
    <View style={[styles.header, toneStyles[tone].header]}>
      <View style={styles.topRow}>
        <View style={styles.roleRow}>
          <SitGuruIconBadge name={icon} size="medium" tone={toneStyles[tone].badgeTone} />

          <Text style={[styles.roleLabel, toneStyles[tone].roleLabel]}>
            {roleLabel}
          </Text>
        </View>

        {action}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {statusText ? (
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, toneStyles[tone].statusDot]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 13,
    elevation: 3,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  roleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  roleLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    textTransform: 'uppercase',
  },
  action: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SitGuruColors.primaryLight,
    backgroundColor: SitGuruColors.surface,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  actionPressed: {
    opacity: 0.76,
  },
  actionText: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 36,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  statusRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  statusText: {
    color: SitGuruColors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
});

const toneStyles = {
  primary: {
    header: {
      backgroundColor: SitGuruColors.surface,
      borderColor: SitGuruColors.primaryLight,
    },
    badgeTone: 'primary' as const,
    roleLabel: {
      color: SitGuruColors.primary,
    },
    statusDot: {
      backgroundColor: SitGuruColors.primary,
    },
  },
  warning: {
    header: {
      backgroundColor: 'rgba(181, 71, 8, 0.06)',
      borderColor: 'rgba(181, 71, 8, 0.22)',
    },
    badgeTone: 'warning' as const,
    roleLabel: {
      color: SitGuruColors.warning,
    },
    statusDot: {
      backgroundColor: SitGuruColors.warning,
    },
  },
  danger: {
    header: {
      backgroundColor: 'rgba(180, 35, 24, 0.05)',
      borderColor: 'rgba(180, 35, 24, 0.18)',
    },
    badgeTone: 'danger' as const,
    roleLabel: {
      color: SitGuruColors.danger,
    },
    statusDot: {
      backgroundColor: SitGuruColors.danger,
    },
  },
};
