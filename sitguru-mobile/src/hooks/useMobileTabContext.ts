import { useMemo } from 'react';

import type { SitGuruTabRole } from '@/components/SitGuruTabBar';
import { useAuth } from '@/hooks/useAuth';
import type { AppRole } from '@/types/auth';

function roleToTabRole(role: AppRole | null, isAuthenticated: boolean): SitGuruTabRole {
  if (!isAuthenticated) return 'visitor';
  if (role === 'guru') return 'guru';
  if (role === 'ambassador') return 'ambassador';
  return 'petParent';
}

/** Resolves tab bar role + optional message badge for the signed-in user. */
export function useMobileTabContext() {
  const { isAuthenticated, primaryRole, user } = useAuth();

  const tabRole = useMemo(
    () => roleToTabRole(primaryRole, isAuthenticated),
    [isAuthenticated, primaryRole],
  );

  return {
    tabRole,
    isAuthenticated,
    userId: user?.id ?? null,
  };
}
