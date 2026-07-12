import type { Href } from 'expo-router';

import type { AppRole } from '@/types/auth';

export const LAST_WORKSPACE_KEY = 'sitguru-last-workspace';

export type SitGuruWorkspaceDefinition = {
  role: AppRole;
  label: string;
  description: string;
  switcherDescription: string;
  dashboardPath: Href;
  setupPath?: Href;
};

export const WORKSPACES: Record<AppRole, SitGuruWorkspaceDefinition> = {
  pet_parent: {
    role: 'pet_parent',
    label: 'Pet Parent',
    description:
      'Manage pets, care requests, bookings, messages, payments, PawReports, and PawPerks.',
    switcherDescription: 'Pets, care, bookings, and payments',
    dashboardPath: '/pet-parent-dashboard',
    setupPath: '/pet-parent-setup',
  },
  guru: {
    role: 'guru',
    label: 'Pet Guru',
    description:
      'Run your pet-care business, manage requests, clients, pricing, earnings, and PawReports.',
    switcherDescription: 'Requests, clients, earnings, and PawReports',
    dashboardPath: '/guru-dashboard',
    setupPath: '/guru-setup',
  },
  ambassador: {
    role: 'ambassador',
    label: 'Ambassador',
    description:
      'Grow the SitGuru community through referrals, local outreach, rewards, training, and partnerships.',
    switcherDescription: 'Referrals, rewards, outreach, and training',
    dashboardPath: '/ambassador-dashboard',
    setupPath: '/ambassador-setup',
  },
  admin: {
    role: 'admin',
    label: 'SitGuru Admin',
    description:
      'Manage SitGuru operations, users, active care, payouts, support, safety, growth, and platform activity.',
    switcherDescription: 'Operations, accounts, payouts, and platform tools',
    dashboardPath: '/admin-operations',
  },
};

export const WORKSPACE_ORDER: AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
  'admin',
];

export const NEW_ACCOUNT_ROLES: AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
];

export function getWorkspace(role: AppRole): SitGuruWorkspaceDefinition {
  return WORKSPACES[role];
}

export function getWorkspaceDashboardPath(role: AppRole): Href {
  return WORKSPACES[role].dashboardPath;
}

export function getWorkspaceSetupPath(role: AppRole): Href {
  return WORKSPACES[role].setupPath ?? WORKSPACES[role].dashboardPath;
}