import { StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';
import type { AppRole } from '@/types/auth';

type SitGuruRoleStatusProps = {
  role: AppRole;
  statusLabel?: string;
  compact?: boolean;
};

const ROLE_LABELS: Record<AppRole, string> = {
  pet_parent: 'Pet Parent',
  guru: 'Guru',
  ambassador: 'Ambassador',
  admin: 'Admin',
};

export default function SitGuruRoleStatus({
  role,
  statusLabel = 'Live',
  compact = false,
}: SitGuruRoleStatusProps) {
  const isDark = useThemeMode() === 'dark';
  const roleLabel = ROLE_LABELS[role] ?? 'SitGuru';

  return (
    <View
      accessibilityLabel={`${roleLabel} workspace, ${statusLabel}`}
      style={styles.row}
    >
      <View
        style={[
          styles.dot,
          compact ? styles.dotCompact : styles.dotRegular,
          { backgroundColor: isDark ? '#39D982' : '#0A9A5A' },
        ]}
      />

      <Text
        numberOfLines={1}
        style={[
          styles.text,
          compact ? styles.textCompact : styles.textRegular,
          { color: isDark ? '#AFC2B7' : '#5E756B' },
        ]}
      >
        {roleLabel} {'\u2022'} {statusLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    minWidth: 0,
  },
  dot: {
    borderRadius: 999,
    marginRight: 5,
  },
  dotCompact: {
    height: 6,
    marginRight: 4,
    width: 6,
  },
  dotRegular: {
    height: 7,
    width: 7,
  },
  text: {
    flexShrink: 1,
    fontFamily: AppFonts.medium,
  },
  textCompact: {
    fontSize: 8,
    lineHeight: 11,
    marginTop: 1,
  },
  textRegular: {
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },
});