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
  conversationId?: string | null;
  clientMessageId?: string | null;
};

export type CompanionRequest = {
  url: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
};

/**
 * Scout requires the guru role and Taco the ambassador role for the
 * `dashboard` surface; Rogue and Delilah stay on the public surface.
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
  conversationId,
  clientMessageId,
}: CompanionRequestContext): CompanionRequest {
  const headers: Record<string, string> = {
    'X-SitGuru-Client': 'sitguru-mobile',
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const sharedIds = {
    ...(conversationId ? { conversationId } : {}),
    ...(clientMessageId ? { clientMessageId } : {}),
  };

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
        ...sharedIds,
      },
    };
  }

  return {
    url: companionWebUrl(companion.streamPath),
    headers,
    body: {
      messages: turns,
      officer: companion.id,
      companion: companion.id,
      surface: resolveOfficerSurface(companion, roles, accessToken),
      pagePath: companion.pagePath,
      ...(accessToken ? { accessToken } : {}),
      ...sharedIds,
    },
  };
}

/** Ensure / restore the signed-in user's server conversation for a companion. */
export async function ensureCompanionConversation(opts: {
  companionId: string;
  accessToken: string;
  includeMessages?: boolean;
}): Promise<{
  conversationId: string | null;
  messages: CompanionTurn[];
}> {
  try {
    const res = await fetch(companionWebUrl('/api/companions/conversations'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.accessToken}`,
        'X-SitGuru-Client': 'sitguru-mobile',
      },
      body: JSON.stringify({
        companion: opts.companionId,
        includeMessages: opts.includeMessages !== false,
      }),
    });
    if (!res.ok) {
      return { conversationId: null, messages: [] };
    }
    const json = (await res.json().catch(() => ({}))) as {
      conversation?: { id?: string };
      messages?: Array<{ role?: string; content?: string }>;
    };
    const messages = (json.messages || [])
      .filter(
        (row) =>
          (row.role === 'user' || row.role === 'assistant') &&
          String(row.content || '').trim(),
      )
      .map((row) => ({
        role: row.role as 'user' | 'assistant',
        content: String(row.content || '').trim(),
      }));
    return {
      conversationId: json.conversation?.id || null,
      messages,
    };
  } catch {
    return { conversationId: null, messages: [] };
  }
}
