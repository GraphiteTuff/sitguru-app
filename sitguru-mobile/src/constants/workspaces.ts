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
  manager: {
    role: 'manager',
    label: 'Growth Manager',
    description: 'Review growth insights and coordinate SitGuru team assignments.',
    switcherDescription: 'Growth insights and team coordination',
    dashboardPath: '/growth-insights',
  },
  intern: {
    role: 'intern',
    label: 'SitGuru Intern',
    description: 'Assignments, weekly hours, live growth and manager reviews.',
    switcherDescription: 'Assignments, hours, check-ins and growth',
    dashboardPath: '/intern-portal',
  },
  admin: {
    role: 'admin',
    label: 'Super Admin HQ',
    description:
      'Authorized Super Admin queues: contractor hours, payables, approvals, Manager oversight, and operations.',
    switcherDescription: 'HQ queues, contractor hours, and operations',
    dashboardPath: '/admin-operations',
  },
};

export const WORKSPACE_ORDER: AppRole[] = [
  'pet_parent',
  'guru',
  'ambassador',
  'manager',
  'intern',
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