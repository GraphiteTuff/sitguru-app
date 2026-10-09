import type { Href } from 'expo-router';
import { useCallback, useRef, useState, type ReactNode } from 'react';

import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { playAppHaptic } from '@/lib/haptics';
import type { AppRole } from '@/types/auth';

type UseOwnAvatarWorkspaceMenusOptions = {
  currentRole: AppRole;
  /**
   * When false, tap/long-press are no-ops (booking, checkout, onboarding).
   * Defaults to true for dashboard/account chrome.
   */
  enabled?: boolean;
  profileHref?: Href;
  profileLabel?: string;
};

/**
 * Own-avatar interaction:
 * - tap → full SitGuruWorkspaceSwitcher
 * - long-press → roles-only quick switcher
 * Long-press suppresses the following tap release.
 */
export function useOwnAvatarWorkspaceMenus({
  currentRole,
  enabled = true,
  profileHref,
  profileLabel,
}: UseOwnAvatarWorkspaceMenusOptions) {
  const [fullOpen, setFullOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const skipNextPressRef = useRef(false);

  const onPress = useCallback(() => {
    if (skipNextPressRef.current) {
      skipNextPressRef.current = false;
      return;
    }

    if (!enabled) {
      return;
    }

    setQuickOpen(false);
    setFullOpen(true);
  }, [enabled]);

  const onLongPress = useCallback(() => {
    if (!enabled) {
      return;
    }

    skipNextPressRef.current = true;
    playAppHaptic('medium');
    setFullOpen(false);
    setQuickOpen(true);
  }, [enabled]);

  const menus: ReactNode = (
    <>
      <SitGuruWorkspaceSwitcher
        currentRole={currentRole}
        onClose={() => setFullOpen(false)}
        profileHref={profileHref}
        profileLabel={profileLabel}
        variant="full"
        visible={fullOpen}
      />
      <SitGuruWorkspaceSwitcher
        currentRole={currentRole}
        onClose={() => setQuickOpen(false)}
        variant="quick"
        visible={quickOpen}
      />
    </>
  );

  return {
    avatarPressProps: {
      accessibilityHint: enabled
        ? 'Double tap for the full workspace menu. Touch and hold for a quick role switch.'
        : undefined,
      delayLongPress: 380,
      onLongPress: enabled ? onLongPress : undefined,
      onPress: enabled ? onPress : undefined,
    },
    menus,
    openFullMenu: () => {
      if (!enabled) return;
      setQuickOpen(false);
      setFullOpen(true);
    },
  };
}
