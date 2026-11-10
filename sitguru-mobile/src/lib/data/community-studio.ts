import { getSitGuruApiBaseUrl } from '@/lib/data/api';

export const COMMUNITY_COLLECTIONS = [
  { id: 'pack', label: 'The SitGuru Pack' },
  { id: 'pet_of_week', label: 'Pet of the Week' },
  { id: 'gallery', label: 'Community Gallery' },
  { id: 'guru_spotlight', label: 'Guru Spotlights' },
] as const;
export type CommunityKind = typeof COMMUNITY_COLLECTIONS[number]['id'];
export type CommunityItem = {
  id: string; kind: CommunityKind; title: string; petName: string; story: string;
  location: string; status: string; feedback: string; imageUrl: string;
  submitterName: string; updatedAt: string; publishAt: string; weekOf: string;
  taskId: string; contentId: string; canEdit: boolean; canReview: boolean;
  mediaUrl?: string; mediaMime?: string; publicConsent?: boolean; socialConsent?: boolean;
  featuresClientPet?: boolean; bookingId?: string;
  parentPermissionStatus?: 'not_required' | 'pending' | 'approved' | 'declined' | 'revoked';
};
export type CommunityWorkspace = {
  items: CommunityItem[]; ready?: boolean; error?: string; canModerate?: boolean;
  tasks?: { id: string; title: string }[]; content?: { id: string; title: string }[];
  bookings?: { id: string; label: string }[];
};

export type CommunityParentPermission = {
  id: string; submissionId: string; title: string; story: string; mediaUrl: string;
  mediaMime: string; requesterName: string; publicConsent: boolean; socialConsent: boolean;
  status: string; updatedAt: string;
};

export function communityDevelopmentError() {
  if (!__DEV__) return '';
  const origin = getSitGuruApiBaseUrl();
  let production = true;
  try {
    const parsed = new URL(origin);
    production = !['https:', 'http:'].includes(parsed.protocol) || parsed.hostname === 'sitguru.com' || parsed.hostname.endsWith('.sitguru.com');
  } catch { /* Invalid API origins fail closed. */ }
  if (process.env.EXPO_PUBLIC_SITGURU3_ISOLATED_DEVELOPMENT !== 'true' || production) {
    return 'Community development requires an isolated API origin and EXPO_PUBLIC_SITGURU3_ISOLATED_DEVELOPMENT=true. Production community requests are disabled in development.';
  }
  return '';
}
