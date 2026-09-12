import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, type Href } from 'expo-router';

import { LAST_WORKSPACE_KEY } from '@/constants/workspaces';
import type { AppRole } from '@/types/auth';

/**
 * Dashboard targets used by SitGuruWorkspaceSwitcher.
 * Keep these identical so tap and long-press share one switch path.
 */
export const WORKSPACE_DASHBOARD_PATHS: Record<AppRole, Href> = {
  pet_parent: '/pet-parent-dashboard',
  guru: '/guru-dashboard',
  ambassador: '/ambassador-dashboard',
  admin: '/admin-dashboard',
};

/** Roles shown in the long-press quick switcher (no admin). */
export const QUICK_WORKSPACE_ROLES: readonly AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
] as const;

export const WORKSPACE_ROLE_ORDER: readonly AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
  'admin',
] as const;

/**
 * Canonical workspace switch used by the full sheet and quick sheet.
 * Persists last valid role, then replaces to that role's dashboard.
 */
export async function switchSitGuruWorkspace(role: AppRole): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_WORKSPACE_KEY, role);
  } catch {
    // Navigation can continue even if local preference storage fails.
  }

  router.replace(WORKSPACE_DASHBOARD_PATHS[role]);
}
