import { StyleSheet, Text, View } from 'react-native';

import { SitGuruColors } from '@/constants/colors';

type SitGuruStatTone = 'primary' | 'warning' | 'danger' | 'neutral';

type SitGuruStatCardProps = {
  detail: string;
  label: string;
  tone?: SitGuruStatTone;
  value: string;
  wide?: boolean;
};

export default function SitGuruStatCard({
  detail,
  label,
  tone = 'neutral',
  value,
  wide = false,
}: SitGuruStatCardProps) {
  return (
    <View style={[styles.card, wide ? styles.wideCard : null, toneStyles[tone].card]}>
      <View style={[styles.accent, toneStyles[tone].accent]} />
      <Text style={[styles.label, toneStyles[tone].label]}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SitGuruColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SitGuruColors.border,
    flex: 1,
    minWidth: 142,
    padding: 16,
    gap: 6,
    overflow: 'hidden',
    elevation: 2,
  },
  wideCard: {
    minWidth: 190,
  },
  accent: {
    borderRadius: 999,
    height: 4,
    marginBottom: 2,
    width: 36,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  value: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  detail: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});

const toneStyles = {
  neutral: {
    card: {},
    accent: {
      backgroundColor: SitGuruColors.border,
    },
    label: {
      color: SitGuruColors.textSoft,
    },
  },
  primary: {
    card: {
      borderColor: SitGuruColors.primaryLight,
    },
    accent: {
      backgroundColor: SitGuruColors.primary,
    },
    label: {
      color: SitGuruColors.primary,
    },
  },
  warning: {
    card: {
      borderColor: 'rgba(181, 71, 8, 0.22)',
    },
    accent: {
      backgroundColor: SitGuruColors.warning,
    },
    label: {
      color: SitGuruColors.warning,
    },
  },
  danger: {
    card: {
      borderColor: 'rgba(180, 35, 24, 0.18)',
    },
    accent: {
      backgroundColor: SitGuruColors.danger,
    },
    label: {
      color: SitGuruColors.danger,
    },
  },
};
