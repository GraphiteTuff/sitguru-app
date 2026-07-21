import { router } from 'expo-router';
import { BriefcaseBusiness, ChevronRight } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  const statusColor = isDark ? '#AFC2B7' : '#5E756B';
  const accentColor = isDark ? '#39D982' : '#0A9A5A';
  const portalBackground = isDark ? '#153F2A' : '#EAF8F0';
  const portalBorder = isDark ? '#276441' : '#B8E2C8';

  function openAmbassadorPortal() {
    router.push('/ambassador-command-center' as never);
  }

  return (
    <View style={styles.container}>
      <View
        accessibilityLabel={`${roleLabel} workspace, ${statusLabel}`}
        style={styles.row}
      >
        <View
          style={[
            styles.dot,
            compact ? styles.dotCompact : styles.dotRegular,
            { backgroundColor: accentColor },
          ]}
        />

        <Text
          numberOfLines={1}
          style={[
            styles.text,
            compact ? styles.textCompact : styles.textRegular,
            { color: statusColor },
          ]}
        >
          {roleLabel} {'\u2022'} {statusLabel}
        </Text>
      </View>

      {role === 'ambassador' ? (
        <Pressable
          accessibilityHint="Opens your calendar, activities, marketing, leads, and Headquarters tools."
          accessibilityLabel="Open SitGuru Ambassador Portal"
          accessibilityRole="button"
          onPress={openAmbassadorPortal}
          style={({ pressed }) => [
            styles.portalTab,
            compact ? styles.portalTabCompact : styles.portalTabRegular,
            {
              backgroundColor: portalBackground,
              borderColor: portalBorder,
            },
            pressed ? styles.portalTabPressed : null,
          ]}
        >
          <BriefcaseBusiness
            color={accentColor}
            size={compact ? 12 : 14}
            strokeWidth={2.5}
          />

          <Text
            style={[
              styles.portalTabText,
              compact
                ? styles.portalTabTextCompact
                : styles.portalTabTextRegular,
              { color: accentColor },
            ]}
          >
            Portal
          </Text>

          <ChevronRight
            color={accentColor}
            size={compact ? 12 : 14}
            strokeWidth={2.6}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    gap: 7,
    minWidth: 0,
  },
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
  portalTab: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  portalTabCompact: {
    gap: 4,
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  portalTabRegular: {
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  portalTabPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  portalTabText: {
    fontFamily: AppFonts.extraBold,
  },
  portalTabTextCompact: {
    fontSize: 8,
    lineHeight: 11,
  },
  portalTabTextRegular: {
    fontSize: 10,
    lineHeight: 13,
  },
});