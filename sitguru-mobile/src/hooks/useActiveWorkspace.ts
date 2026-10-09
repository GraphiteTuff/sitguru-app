import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getWorkspaceDashboardPath,
  getWorkspaceSetupPath,
} from '@/constants/workspaces';
import { useAuth } from '@/hooks/useAuth';
import { playAppHaptic } from '@/lib/haptics';
import {
  authorizedWorkspaces,
  clearStoredWorkspace,
  joinableWorkspaces,
  persistActiveWorkspace,
  readStoredWorkspace,
  resolveValidWorkspace,
  subscribeActiveWorkspace,
} from '@/lib/workspaces/switch';
import type { AppRole } from '@/types/auth';

const SWITCH_ERROR = "We couldn't switch workspaces. Try again.";

export function useActiveWorkspace() {
  const { isAuthenticated, loading, primaryRole, profileLoading, roles } =
    useAuth();
  const [stored, setStored] = useState<AppRole | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [switching, setSwitching] = useState(false);
  const switchingRef = useRef(false);

  useEffect(() => {
    let active = true;

    void readStoredWorkspace().then((role) => {
      if (!active) return;
      setStored(role);
      setHydrated(true);
    });

    const unsubscribe = subscribeActiveWorkspace((role) => {
      setStored(role);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const authorizedRoles = useMemo(
    () => authorizedWorkspaces(roles),
    [roles],
  );

  const joinableRoles = useMemo(() => joinableWorkspaces(roles), [roles]);

  const activeWorkspace = useMemo(
    () => resolveValidWorkspace(stored, roles, primaryRole),
    [primaryRole, roles, stored],
  );

  useEffect(() => {
    if (!hydrated || loading || profileLoading || !isAuthenticated) return;
    if (!roles.length || !stored) return;
    if (roles.includes(stored)) return;

    const fallback = resolveValidWorkspace(null, roles, primaryRole);
    if (fallback) {
      void persistActiveWorkspace(fallback);
      return;
    }

    void clearStoredWorkspace();
  }, [
    hydrated,
    isAuthenticated,
    loading,
    primaryRole,
    profileLoading,
    roles,
    stored,
  ]);

  const rememberWorkspace = useCallback(async (role: AppRole) => {
    if (!roles.includes(role)) return;
    await persistActiveWorkspace(role);
  }, [roles]);

  const switchWorkspace = useCallback(
    async (role: AppRole) => {
      if (!isAuthenticated || !roles.includes(role)) {
        return { ok: false as const, error: SWITCH_ERROR };
      }

      if (switchingRef.current) {
        return { ok: false as const, error: null };
      }

      if (role === activeWorkspace) {
        return { ok: true as const, error: null, same: true as const };
      }

      switchingRef.current = true;
      setSwitching(true);

      try {
        await persistActiveWorkspace(role);
        playAppHaptic('success');
        router.replace(getWorkspaceDashboardPath(role));
        return { ok: true as const, error: null };
      } catch {
        return { ok: false as const, error: SWITCH_ERROR };
      } finally {
        switchingRef.current = false;
        setSwitching(false);
      }
    },
    [activeWorkspace, isAuthenticated, roles],
  );

  const startRoleSetup = useCallback((role: AppRole) => {
    router.push(getWorkspaceSetupPath(role));
  }, []);

  return {
    activeWorkspace,
    authorizedRoles,
    joinableRoles,
    hydrated,
    switching,
    rememberWorkspace,
    switchWorkspace,
    startRoleSetup,
  };
}

/** Persist the current screen's workspace when that role is authorized. */
export function useSyncWorkspace(role: AppRole) {
  const { hydrated, authorizedRoles, rememberWorkspace } = useActiveWorkspace();

  useEffect(() => {
    if (!hydrated || !authorizedRoles.includes(role)) return;
    void rememberWorkspace(role);
  }, [authorizedRoles, hydrated, rememberWorkspace, role]);
}
