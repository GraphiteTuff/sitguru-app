import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import SitGuruIconBadge, { type SitGuruIconName } from '@/components/SitGuruIconBadge';
import { SitGuruColors } from '@/constants/colors';

type SitGuruCardTone = 'neutral' | 'primary' | 'warning' | 'danger';

type SitGuruCardProps = {
  detail?: string;
  icon?: SitGuruIconName;
  description: string;
  rightContent?: ReactNode;
  size?: 'default' | 'compact';
  title: string;
  tone?: SitGuruCardTone;
};

export default function SitGuruCard({
  detail,
  icon,
  description,
  rightContent,
  size = 'default',
  title,
  tone = 'neutral',
}: SitGuruCardProps) {
  const badgeSize = size === 'compact' ? 'small' : 'medium';

  return (
    <View style={[styles.card, size === 'compact' ? styles.compactCard : null, toneStyles[tone].card]}>
      {icon ? (
        <SitGuruIconBadge name={icon} size={badgeSize} tone={tone} />
      ) : null}

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>

      {rightContent ? <View>{rightContent}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SitGuruColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SitGuruColors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 2,
  },
  compactCard: {
    padding: 14,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  description: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  detail: {
    color: SitGuruColors.textSoft,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
});

const toneStyles = {
  neutral: {
    card: {},
  },
  primary: {
    card: {
      borderColor: SitGuruColors.primaryLight,
    },
  },
  warning: {
    card: {
      borderColor: 'rgba(181, 71, 8, 0.24)',
    },
  },
  danger: {
    card: {
      borderColor: 'rgba(180, 35, 24, 0.20)',
    },
  },
};
