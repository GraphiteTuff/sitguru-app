import { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { ButtonMetrics } from '@/constants/button-tokens';
import { AppFonts } from '@/constants/fonts';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import { getWorkspace } from '@/constants/workspaces';
import { useThemeMode } from '@/hooks/use-theme';
import { useActiveWorkspace } from '@/hooks/useActiveWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { MAX_CHROME_FONT_MULTIPLIER } from '@/lib/a11y/type-scale';
import { playAppHaptic } from '@/lib/haptics';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import type { AppRole } from '@/types/auth';

type WorkspaceAvatarButtonProps = {
  size?: number;
  /** Small current-role label next to a header avatar. */
  showRoleCue?: boolean;
  disabled?: boolean;
  /**
   * `tab` is the Instagram / TikTok / Facebook placement:
   * last dock slot, thumb-side, circular photo.
   */
  variant?: 'header' | 'tab';
  selected?: boolean;
  onSheetChange?: (open: boolean) => void;
};

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'SG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function roleBadgeColor(role: AppRole | null, isDark: boolean) {
  if (role === 'ambassador') return isDark ? '#F0CF62' : '#E39B12';
  if (role === 'guru') return isDark ? '#39D982' : '#2A9D6A';
  if (role === 'admin') return isDark ? '#8CB4FF' : '#3B6BD4';
  return isDark ? '#39D982' : '#2FA36B';
}

/**
 * Own-account avatar: tap opens the full workspace sheet,
 * long-press opens the role-only shortcut.
 */
export default function WorkspaceAvatarButton({
  size = 42,
  showRoleCue = false,
  disabled = false,
  variant = 'header',
  selected = false,
  onSheetChange,
}: WorkspaceAvatarButtonProps) {
  const isDark = useThemeMode() === 'dark';
  const { user, profile } = useAuth();
  const { activeWorkspace } = useActiveWorkspace();
  const [sheet, setSheet] = useState<'full' | 'quick' | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const longPressOpened = useRef(false);

  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const profileName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    stringValue(metadata.full_name) ||
    stringValue(metadata.name) ||
    user?.email?.split('@')[0] ||
    'SitGuru member';

  const avatarUrl = resolveSupabaseStorageUrl(
    profile?.avatar_url ||
      stringValue(metadata.avatar_url) ||
      stringValue(metadata.picture) ||
      null,
  );

  const roleLabel = activeWorkspace
    ? getWorkspace(activeWorkspace).label
    : 'SitGuru';
  const showImage = Boolean(avatarUrl) && !imageFailed;
  const tabSize = 26;
  const styles = createStyles(isDark, variant === 'tab' ? tabSize : size);
  const badgeColor = roleBadgeColor(activeWorkspace, isDark);

  function openSheet(next: 'full' | 'quick') {
    setSheet(next);
    onSheetChange?.(true);
  }

  function closeSheet() {
    setSheet(null);
    onSheetChange?.(false);
  }

  const photo = (
    <View style={styles.avatarWrap}>
      <View
        style={[
          styles.avatar,
          variant === 'tab' && selected && styles.avatarSelected,
        ]}
      >
        {showImage ? (
          <Image
            accessibilityLabel={`${profileName} profile photo`}
            alt={`${profileName} profile photo`}
            onError={() => setImageFailed(true)}
            resizeMode="cover"
            source={{ uri: avatarUrl as string }}
            style={styles.photo}
          />
        ) : (
          <Text
            maxFontSizeMultiplier={MAX_CHROME_FONT_MULTIPLIER}
            style={styles.fallback}
          >
            {initials(profileName)}
          </Text>
        )}
      </View>
      {variant === 'tab' ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          pointerEvents="none"
          style={[styles.roleBadge, { backgroundColor: badgeColor }]}
        />
      ) : null}
    </View>
  );

  return (
    <>
      <Pressable
        accessibilityHint="Opens your SitGuru workspaces. Profile, settings, and sign out are inside."
        accessibilityLabel={`Account and workspace. Currently using SitGuru as ${roleLabel}.`}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        delayLongPress={380}
        disabled={disabled}
        hitSlop={6}
        onLongPress={() => {
          if (disabled) return;
          longPressOpened.current = true;
          playAppHaptic('selection');
          openSheet('quick');
        }}
        onPress={() => {
          if (disabled || longPressOpened.current) {
            longPressOpened.current = false;
            return;
          }
          openSheet('full');
        }}
        onPressOut={() => {
          requestAnimationFrame(() => {
            longPressOpened.current = false;
          });
        }}
        style={variant === 'tab' ? styles.tabPressable : styles.pressable}
      >
        {variant === 'tab' ? <View style={styles.iconWell}>{photo}</View> : photo}

        {variant === 'tab' ? (
          <Text
            adjustsFontSizeToFit
            allowFontScaling
            maxFontSizeMultiplier={MAX_CHROME_FONT_MULTIPLIER}
            minimumFontScale={0.82}
            numberOfLines={1}
            style={[
              styles.tabLabel,
              { color: selected ? (isDark ? '#39D982' : '#087449') : isDark ? '#9DB0A5' : '#738078' },
            ]}
          >
            {roleLabel}
          </Text>
        ) : null}

        {variant === 'header' && showRoleCue ? (
          <View style={styles.cue}>
            <Text
              maxFontSizeMultiplier={MAX_CHROME_FONT_MULTIPLIER}
              numberOfLines={1}
              style={styles.cueText}
            >
              {roleLabel}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <SitGuruWorkspaceSwitcher
        currentRole={activeWorkspace ?? undefined}
        onClose={closeSheet}
        variant={sheet === 'quick' ? 'quick' : 'full'}
        visible={sheet !== null}
      />
    </>
  );
}

function createStyles(isDark: boolean, size: number) {
  return StyleSheet.create({
    pressable: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      maxWidth: 148,
    },
    tabPressable: {
      alignItems: 'center',
      flex: 1,
      gap: ButtonMetrics.tabGap,
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
      overflow: 'visible',
      paddingHorizontal: 2,
      paddingVertical: 4,
      width: '100%',
    },
    iconWell: {
      alignItems: 'center',
      height: 32,
      justifyContent: 'center',
      overflow: 'visible',
      width: 36,
    },
    avatarWrap: {
      height: size,
      overflow: 'visible',
      width: size,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: isDark ? '#173527' : '#EEF5EE',
      borderColor: isDark ? '#2E6C4B' : '#FFFFFF',
      borderRadius: size / 2,
      borderWidth: 2,
      height: size,
      justifyContent: 'center',
      overflow: 'hidden',
      width: size,
    },
    avatarSelected: {
      borderColor: isDark ? '#39D982' : '#2FA36B',
    },
    photo: {
      borderRadius: size / 2,
      height: '100%',
      overflow: 'hidden',
      width: '100%',
    },
    fallback: {
      color: isDark ? '#39D982' : '#087449',
      fontFamily: AppFonts.extraBold,
      fontSize: Math.max(10, size * 0.28),
    },
    roleBadge: {
      borderColor: isDark ? '#15271F' : '#FFFFFF',
      borderRadius: 999,
      borderWidth: 1.5,
      bottom: -1,
      height: 9,
      position: 'absolute',
      right: -1,
      width: 9,
    },
    tabLabel: {
      fontFamily: AppFonts.bold,
      fontSize: ButtonMetrics.tabLabel,
      paddingHorizontal: 2,
      textAlign: 'center',
      width: '100%',
    },
    cue: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 1,
      gap: 2,
      minWidth: 0,
    },
    cueText: {
      color: isDark ? '#C5D6CC' : '#3C6855',
      flexShrink: 1,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
  });
}
