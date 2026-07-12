import { router } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import { AppFonts } from '@/constants/fonts';
import {
    setThemePreference,
    type SitGuruThemePreference,
    useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';

type RecordRow = Record<string, unknown>;

type GuruHeaderActionsProps = {
  avatarSize?: number;
};

const THEME_OPTIONS: Array<{
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
}> = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

export function GuruHeaderActions({
  avatarSize = 40,
}: GuruHeaderActionsProps) {
  const { user, profile } = useAuth();
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const styles = createStyles(isDark, avatarSize);
  const [imageFailed, setImageFailed] = useState(false);

  const profileRecord = (profile ?? {}) as RecordRow;
  const profileName =
    firstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Guru';

  const avatarUrl = resolveSupabaseStorageUrl(
    firstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]),
  );

  return (
    <View style={styles.root}>
      <View style={styles.modeToggle}>
        {THEME_OPTIONS.map((option) => {
          const active = themePreference === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${option.label} mode`}
              accessibilityState={{ selected: active }}
              onPress={() => setThemePreference(option.value)}
              style={[
                styles.modeButton,
                active && styles.modeButtonActive,
              ]}
            >
              <SitGuruIcon
                name={option.icon}
                size={15}
                color={
                  active
                    ? option.value === 'light'
                      ? '#F3AA1F'
                      : '#F0CF62'
                    : isDark
                      ? '#9DB0A5'
                      : '#738078'
                }
                strokeWidth={2.4}
              />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Guru profile"
        onPress={() => router.push('/guru-profile')}
        style={styles.avatarButton}
      >
        <View style={styles.avatarFrame}>
          {avatarUrl && !imageFailed ? (
            <Image
              onError={() => setImageFailed(true)}
              resizeMode="cover"
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarFallback}>
              {initials(profileName)}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function firstString(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (!parts.length) return 'GG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function createStyles(isDark: boolean, avatarSize: number) {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 0,
      gap: 6,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: isDark ? '#0B2118' : '#FFFEFA',
      borderColor: isDark ? '#B9831B' : '#F2822E',
      borderRadius: 13,
      borderWidth: 1.2,
      flexDirection: 'row',
      gap: 2,
      padding: 2,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 10,
      height: 28,
      justifyContent: 'center',
      width: 31,
    },
    modeButtonActive: {
      backgroundColor: isDark
        ? 'rgba(226,170,45,0.18)'
        : '#FFF4D8',
    },
    avatarButton: {
      borderRadius: avatarSize / 2,
    },
    avatarFrame: {
      alignItems: 'center',
      backgroundColor: isDark ? '#173527' : '#EEF5EE',
      borderColor: isDark ? '#2E6C4B' : '#FFFFFF',
      borderRadius: avatarSize / 2,
      borderWidth: 2,
      height: avatarSize,
      justifyContent: 'center',
      overflow: 'hidden',
      width: avatarSize,
    },
    avatarImage: {
      height: '100%',
      width: '100%',
    },
    avatarFallback: {
      color: isDark ? '#39D982' : '#087449',
      fontFamily: AppFonts.extraBold,
      fontSize: Math.max(11, avatarSize * 0.28),
    },
  });
}