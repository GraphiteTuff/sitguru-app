/**
 * Canonical display helpers for SitGuru identity and role labels.
 *
 * Identity model notes:
 * - Supabase Auth user = login identity only.
 * - profiles = account-level identity row.
 * - future user_roles = many-to-many roles per user.
 * - gurus / ambassadors / Pet Parent records = role-specific data only.
 */

export const SITGURU_SUPER_USER_EMAILS = [
  'jason@sitguru.com',
  'nette@sitguru.com',
] as const;

export type SitGuruSuperUserEmail = (typeof SITGURU_SUPER_USER_EMAILS)[number];

export function normalizeEmailForLookup(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? '';
}

const SITGURU_SUPER_USER_EMAIL_LOOKUP = new Set<string>(
  SITGURU_SUPER_USER_EMAILS.map(normalizeEmailForLookup),
);

export function isSitGuruSuperUser(email: string | null | undefined): boolean {
  return SITGURU_SUPER_USER_EMAIL_LOOKUP.has(normalizeEmailForLookup(email));
}

export const CANONICAL_ROLE = {
  PET_PARENT: 'pet_parent',
  GURU: 'guru',
  AMBASSADOR: 'ambassador',
  ADMIN: 'admin',
} as const;

export type CanonicalRole = (typeof CANONICAL_ROLE)[keyof typeof CANONICAL_ROLE];

export const PET_PARENT_DISPLAY_LABEL = 'Pet Parent';
export const PET_PARENTS_DISPLAY_LABEL = 'Pet Parents';

const ROLE_ALIASES: Record<string, CanonicalRole> = {
  pet_parent: CANONICAL_ROLE.PET_PARENT,
  'pet parent': CANONICAL_ROLE.PET_PARENT,
  customer: CANONICAL_ROLE.PET_PARENT,
  parent: CANONICAL_ROLE.PET_PARENT,
  client: CANONICAL_ROLE.PET_PARENT,
  guru: CANONICAL_ROLE.GURU,
  sitter: CANONICAL_ROLE.GURU,
  provider: CANONICAL_ROLE.GURU,
  walker: CANONICAL_ROLE.GURU,
  dog_walker: CANONICAL_ROLE.GURU,
  'dog walker': CANONICAL_ROLE.GURU,
  ambassador: CANONICAL_ROLE.AMBASSADOR,
  admin: CANONICAL_ROLE.ADMIN,
};

export function normalizeRoleAlias(role: string | null | undefined): CanonicalRole | null {
  if (!role) {
    return null;
  }

  const normalizedRole = role.trim().toLowerCase().replace(/[-\s]+/g, ' ');
  const underscoredRole = normalizedRole.replace(/\s+/g, '_');

  return ROLE_ALIASES[normalizedRole] ?? ROLE_ALIASES[underscoredRole] ?? null;
}

export function displayNameFallback(
  displayName: string | null | undefined,
  fallback = 'SitGuru User',
): string {
  return displayName?.trim() || fallback;
}

export function emailFallback(
  email: string | null | undefined,
  fallback = 'No email on file',
): string {
  return email?.trim() || fallback;
}

export function phoneFallback(
  phone: string | null | undefined,
  fallback = 'No phone on file',
): string {
  return phone?.trim() || fallback;
}

export function avatarImageFallback(
  imageUrl: string | null | undefined,
  fallback = '/avatar-placeholder.png',
): string {
  return imageUrl?.trim() || fallback;
}

export const profileImageFallback = avatarImageFallback;

export function fallbackInitials(
  name: string | null | undefined,
  email?: string | null,
  fallback = 'SG',
): string {
  const source = name?.trim() || email?.trim() || '';

  if (!source) {
    return fallback;
  }

  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || fallback;
}
