import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LAST_WORKSPACE_KEY,
  WORKSPACE_ORDER,
} from '@/constants/workspaces';
import { normalizeRole, type AppRole } from '@/types/auth';

type WorkspaceListener = (role: AppRole | null) => void;

const listeners = new Set<WorkspaceListener>();

export const JOINABLE_ROLES: AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
];

export function subscribeActiveWorkspace(listener: WorkspaceListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitActiveWorkspace(role: AppRole | null) {
  listeners.forEach((listener) => listener(role));
}

export async function readStoredWorkspace(): Promise<AppRole | null> {
  try {
    return normalizeRole(await AsyncStorage.getItem(LAST_WORKSPACE_KEY));
  } catch {
    return null;
  }
}

export async function persistActiveWorkspace(role: AppRole): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_WORKSPACE_KEY, role);
  } catch {
    // Navigation can continue if the preference write fails.
  }
  emitActiveWorkspace(role);
}

export async function clearStoredWorkspace(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_WORKSPACE_KEY);
  } catch {
    // Keep going with in-memory fallback.
  }
  emitActiveWorkspace(null);
}

export function resolveValidWorkspace(
  stored: AppRole | null,
  roles: AppRole[],
  primaryRole: AppRole | null,
): AppRole | null {
  if (stored && roles.includes(stored)) return stored;
  if (primaryRole && roles.includes(primaryRole)) return primaryRole;
  if (roles.includes('pet_parent')) return 'pet_parent';
  return roles[0] ?? null;
}

export function authorizedWorkspaces(roles: AppRole[]): AppRole[] {
  return WORKSPACE_ORDER.filter((role) => roles.includes(role));
}

export function joinableWorkspaces(roles: AppRole[]): AppRole[] {
  return JOINABLE_ROLES.filter((role) => !roles.includes(role));
}
