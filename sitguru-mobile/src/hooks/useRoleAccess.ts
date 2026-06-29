import { useCallback, useMemo } from 'react';

import { useAuth } from '@/hooks/useAuth';
import type { AppRole } from '@/types/auth';

export function useRoleAccess(requiredRole?: AppRole) {
  const { isAuthenticated, loading: authLoading, profileLoading, roles, primaryRole, profile, profileError, reloadProfileAndRoles } = useAuth();

  const roleSet = useMemo(() => new Set<AppRole>(roles), [roles]);
  const hasRole = useCallback((role: AppRole) => roleSet.has(role), [roleSet]);
  const hasAnyRole = useCallback((requiredRoles: AppRole[]) => requiredRoles.some((role) => roleSet.has(role)), [roleSet]);
  const canAccessRequiredRole = requiredRole ? roleSet.has(requiredRole) : true;

  return {
    loading: authLoading || profileLoading,
    isAuthenticated,
    roles,
    primaryRole,
    hasRole,
    hasAnyRole,
    canAccessRequiredRole,
    missingRole: Boolean(requiredRole && isAuthenticated && !canAccessRequiredRole),
    profile,
    profileError,
    reloadProfileAndRoles,
  };
}
