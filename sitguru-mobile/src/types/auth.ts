import type { Href } from 'expo-router';

export type AppRole = 'pet_parent' | 'guru' | 'ambassador' | 'admin';
export type ProfileSummary = { id: string; email: string | null; full_name: string | null; first_name: string | null; last_name: string | null; role: string | null; avatar_url: string | null };
export type UserRoleRecord = { id: string | number; user_id: string; role: string | null; created_at: string | null };
export type RoleOption = { role: AppRole; label: string; description: string; icon: string; dashboardPath: Href };

const roleMap: Record<string, AppRole> = { pet_parent: 'pet_parent', 'pet-parent': 'pet_parent', customer: 'pet_parent', 'pet parent': 'pet_parent', guru: 'guru', 'pet guru': 'guru', pet_guru: 'guru', ambassador: 'ambassador', admin: 'admin', super_admin: 'admin' };
export function normalizeRole(value: unknown): AppRole | null { if (typeof value !== 'string') return null; return roleMap[value.trim().toLowerCase().replace(/\s+/g, ' ')] ?? null; }
export function roleLabel(role: AppRole): string { switch (role) { case 'pet_parent': return 'Pet Parent'; case 'guru': return 'Pet Guru'; case 'ambassador': return 'Ambassador'; case 'admin': return 'Admin'; } }
export function roleDashboardPath(role: AppRole): Href { switch (role) { case 'pet_parent': return '/pet-parent-dashboard'; case 'guru': return '/guru-dashboard'; case 'ambassador': return '/ambassador-dashboard'; case 'admin': return '/admin-operations'; } }
export function roleDescription(role: AppRole): string { switch (role) { case 'pet_parent': return 'Find trusted local care, review messages, and prepare booking requests.'; case 'guru': return 'Manage Guru profile readiness, requests, messages, pricing, and care tools.'; case 'ambassador': return 'Grow the SitGuru community, track referrals, training, and rewards.'; case 'admin': return 'Open the internal operations preview for account and platform checks.'; } }
export function roleIcon(role: AppRole): string { switch (role) { case 'pet_parent': return '🐾'; case 'guru': return '🏡'; case 'ambassador': return '🌟'; case 'admin': return '🛠️'; } }
export function uniqueRoles(values: readonly unknown[]): AppRole[] { const seen = new Set<AppRole>(); values.forEach((value) => { const role = normalizeRole(value); if (role) seen.add(role); }); return Array.from(seen); }
