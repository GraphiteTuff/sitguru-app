/**
 * Request wiring for the SitGuru AI companion streams.
 *
 * The companion routes live on the Next.js web app and already accept mobile
 * bearer auth. `EXPO_PUBLIC_SITGURU_API_URL` is preferred, but chat falls back
 * to the production origin so the screen is never dead in a build that has not
 * set the variable yet.
 */

import type { AiCompanionProfile } from '@/constants/companions';
import { getSitGuruApiBaseUrl } from '@/lib/data/api';
import type { AppRole } from '@/types/auth';

export const SITGURU_WEB_ORIGIN_FALLBACK = 'https://www.sitguru.com';

export function getCompanionWebOrigin() {
  return getSitGuruApiBaseUrl() || SITGURU_WEB_ORIGIN_FALLBACK;
}

export function companionWebUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getCompanionWebOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Round companion portrait served from the SitGuru web `public/images`. */
export function companionAvatarUrl(companion: AiCompanionProfile) {
  return companionWebUrl(companion.avatarPath);
}

/** Audience label Rogue's server-side persona uses for tone adaptation. */
export function toRogueAudienceLabel(roles: AppRole[], signedIn: boolean) {
  if (roles.includes('admin')) return 'Admin';
  if (roles.includes('ambassador')) return 'Ambassador';
  if (roles.includes('guru')) return 'Guru';
  if (roles.includes('pet_parent')) return 'Pet Parent';
  return signedIn ? 'Pet Parent' : 'Guest Pet Parent';
}

export type CompanionTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type CompanionRequestContext = {
  companion: AiCompanionProfile;
  turns: CompanionTurn[];
  firstName: string;
  roles: AppRole[];
  accessToken: string | null;
};

export type CompanionRequest = {
  url: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
};

/**
 * Scout requires the guru role and Taco the ambassador role for the
 * `dashboard` surface; everyone else gets the public marketing surface.
 */
export function resolveOfficerSurface(
  companion: AiCompanionProfile,
  roles: AppRole[],
  accessToken: string | null,
): 'public' | 'dashboard' {
  if (!accessToken || !companion.dashboardRole) return 'public';
  return roles.includes(companion.dashboardRole) ? 'dashboard' : 'public';
}

export function buildCompanionRequest({
  companion,
  turns,
  firstName,
  roles,
  accessToken,
}: CompanionRequestContext): CompanionRequest {
  const headers: Record<string, string> = {
    'X-SitGuru-Client': 'sitguru-mobile',
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  if (companion.id === 'rogue') {
    return {
      url: companionWebUrl(companion.streamPath),
      headers,
      body: {
        messages: turns,
        companion: 'rogue',
        channel: 'HOMEPAGE_LEAD',
        pagePath: companion.pagePath,
        userRole: toRogueAudienceLabel(roles, Boolean(accessToken)),
        ...(firstName ? { client_first_name: firstName } : {}),
      },
    };
  }

  return {
    url: companionWebUrl(companion.streamPath),
    headers,
    body: {
      messages: turns,
      officer: companion.id,
      surface: resolveOfficerSurface(companion, roles, accessToken),
      pagePath: companion.pagePath,
      ...(accessToken ? { accessToken } : {}),
    },
  };
}
