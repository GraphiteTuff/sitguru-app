/**
 * Mobile port of the web assistant marker parser.
 *
 * Source of truth (read-only reference):
 * - `lib/chat/homepage-cta.ts` — parseHomepageChatContent + CTA definitions
 * - `lib/gurus/guru-chat-snapshot.ts` — extractGuruCardsFromText / decode
 *
 * The server appends `[[guru_card:...]]` markers itself, so mobile only ever
 * decodes them. `lib/gurus/lookup-gurus-for-chat.ts` is service-role only and
 * must never be imported or reimplemented here.
 */

import { decodeBase64UrlToUtf8 } from '@/lib/ai/text-codec';

export type CompanionCtaId =
  | 'parent'
  | 'guru'
  | 'ambassador'
  | 'ambassador_video'
  | 'social';

export type CompanionCtaAction =
  /** Navigate inside the mobile app. */
  | { kind: 'route'; pathname: string; params?: Record<string, string> }
  /** Open a SitGuru web path in the in-app browser. */
  | { kind: 'web'; path: string }
  /** Render the @SitGuruOfficial follow row instead of a single button. */
  | { kind: 'social' };

export type CompanionCtaDef = {
  id: CompanionCtaId;
  label: string;
  action: CompanionCtaAction;
  /** Regex sources; compiled per parse so no global lastIndex leaks. */
  patterns: readonly string[];
};

export const SITGURU_OFFICIAL_HANDLE = '@SitGuruOfficial';

export type SitGuruSocialLink = {
  id: 'instagram' | 'facebook' | 'tiktok' | 'x' | 'youtube';
  label: string;
  url: string;
};

export const SITGURU_SOCIAL_LINKS: readonly SitGuruSocialLink[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/SitGuruOfficial',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/SitGuruOfficial',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    url: 'https://www.tiktok.com/@SitGuruOfficial',
  },
  { id: 'x', label: 'X', url: 'https://x.com/SitGuruOfficial' },
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/@SitGuruOfficial',
  },
];

/** Web `/ambassador/onboarding-video` has no native screen yet. */
export const AMBASSADOR_VIDEO_WEB_PATH = '/ambassador/onboarding-video';

/**
 * Mobile CTA table. Web `/register?role=…` maps onto the real `/signup`
 * route, and `/ambassador/join` onto the native `/ambassador-setup` screen.
 */
export const COMPANION_CTA_DEFS: readonly CompanionCtaDef[] = [
  {
    id: 'guru',
    label: 'Become a Guru',
    action: { kind: 'route', pathname: '/signup', params: { role: 'guru' } },
    patterns: [
      '\\[\\[cta:guru\\]\\]',
      '\\[Become a Guru[^\\]]*\\](?:\\([^)]*\\))?',
      '\\[Become a Handler[^\\]]*\\](?:\\([^)]*\\))?',
      '(?:^|\\s)(?:https?:\\/\\/[^\\s]+)?\\/(?:register|signup)\\?role=guru(?:\\s|$)',
    ],
  },
  {
    id: 'parent',
    label: 'Create Pet Parent Account',
    action: { kind: 'route', pathname: '/signup', params: { role: 'parent' } },
    patterns: [
      '\\[\\[cta:parent\\]\\]',
      '\\[Create Pet Parent Account[^\\]]*\\](?:\\([^)]*\\))?',
      '\\[Set up an account[^\\]]*\\](?:\\([^)]*\\))?',
      '(?:^|\\s)(?:https?:\\/\\/[^\\s]+)?\\/(?:register|signup)\\?role=parent(?:\\s|$)',
    ],
  },
  {
    id: 'ambassador',
    label: 'Claim My Referral Code',
    action: { kind: 'route', pathname: '/ambassador-setup' },
    patterns: [
      '\\[\\[cta:ambassador\\]\\]',
      '\\[Claim My Referral Code[^\\]]*\\](?:\\([^)]*\\))?',
      '\\[Become an Ambassador[^\\]]*\\](?:\\([^)]*\\))?',
      '\\[Join as Ambassador[^\\]]*\\](?:\\([^)]*\\))?',
      '(?:^|\\s)(?:https?:\\/\\/[^\\s]+)?\\/ambassador\\/join(?:\\s|$)',
    ],
  },
  {
    id: 'ambassador_video',
    label: 'Watch the Ambassador video',
    action: { kind: 'web', path: AMBASSADOR_VIDEO_WEB_PATH },
    patterns: [
      '\\[\\[cta:ambassador_video\\]\\]',
      '\\[\\[ambassador_video_card\\]\\]',
      '\\[ambassador_video_card\\]',
      '\\[Watch Ambassador Video[^\\]]*\\](?:\\([^)]*\\))?',
      '\\[Watch the (?:master )?pack video[^\\]]*\\](?:\\([^)]*\\))?',
      '(?:^|\\s)(?:https?:\\/\\/[^\\s]+)?\\/ambassador\\/onboarding-video(?:\\s|$)',
    ],
  },
  {
    id: 'social',
    label: `Follow ${SITGURU_OFFICIAL_HANDLE}`,
    action: { kind: 'social' },
    patterns: [
      '\\[\\[cta:social\\]\\]',
      '\\[Follow @?SitGuruOfficial[^\\]]*\\](?:\\([^)]*\\))?',
      '\\[Follow us on social[^\\]]*\\](?:\\([^)]*\\))?',
    ],
  },
];

export type GuruChatSnapshot = {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  services: string[];
  rate: number | null;
  location: string;
  rating: number | null;
  reviewCount: number;
  canBook: boolean;
  profileUrl: string;
  bookingUrl: string | null;
  blurb: string | null;
};

/** Compact wire format the server encodes into `[[guru_card:<base64>]]`. */
type CompactGuruCard = {
  i?: string;
  n?: string;
  s?: string;
  p?: string | null;
  v?: string[];
  r?: number | null;
  l?: string;
  a?: number | null;
  c?: number;
  b?: boolean;
  u?: string;
  k?: string | null;
};

const GURU_CARD_MARKER_SOURCE =
  '(?:`{1,3})?\\[\\[\\s*guru_card\\s*:\\s*([\\s\\S]*?)\\]\\](?:`{1,3})?';

/** Truncated markers with no closing brackets still need stripping. */
const GURU_CARD_ORPHAN_SOURCE =
  '(?:`{1,3})?\\[\\[\\s*guru_card\\s*:[^\\[]{8,}?(?=$|\\n\\n|\\[\\[)';

/** Leftover base64 crumbs after a broken orphan strip. */
const GURU_CARD_CRUMB_SOURCE =
  '(?:^|\\s)(?:eyJ|ewog)[A-Za-z0-9_+\\/= \\t\\r\\n-]{20,}(?:\\]\\])?';

function sanitizeCardPayload(payload: string) {
  return String(payload || '').replace(/[^A-Za-z0-9_+/=-]/g, '');
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function fromCompact(raw: unknown): GuruChatSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;

  // Legacy full snapshots and the compact format share this decoder.
  const slug = String(record.slug ?? record.s ?? '').trim();
  const name = String(record.name ?? record.n ?? '').trim();
  if (!slug || !name) return null;

  const services = Array.isArray(record.services)
    ? record.services
    : Array.isArray(record.v)
      ? record.v
      : [];

  const photo = record.photoUrl ?? record.p ?? null;
  const profileUrl = String(record.profileUrl ?? record.u ?? '').trim();
  const bookingUrl = record.bookingUrl ?? record.k ?? null;

  return {
    id: String(record.id ?? record.i ?? slug),
    name,
    slug,
    photoUrl: typeof photo === 'string' && photo.trim() ? photo.trim() : null,
    services: services
      .map((service) => String(service ?? '').trim())
      .filter(Boolean),
    rate: asNumberOrNull(record.rate ?? record.r),
    location: String(record.location ?? record.l ?? '').trim() || 'Local area',
    rating: asNumberOrNull(record.rating ?? record.a),
    reviewCount: asNumberOrNull(record.reviewCount ?? record.c) ?? 0,
    canBook: Boolean(record.canBook ?? record.b),
    profileUrl: profileUrl || `/guru/${slug}`,
    bookingUrl:
      typeof bookingUrl === 'string' && bookingUrl.trim()
        ? bookingUrl.trim()
        : null,
    blurb:
      typeof record.blurb === 'string' && record.blurb.trim()
        ? record.blurb.trim()
        : null,
  };
}

export function decodeGuruCardMarker(payload: string): GuruChatSnapshot | null {
  const json = decodeBase64UrlToUtf8(sanitizeCardPayload(payload));
  if (!json) return null;

  try {
    return fromCompact(JSON.parse(json) as CompactGuruCard);
  } catch {
    return null;
  }
}

function tidyText(value: string) {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Pull every `[[guru_card:...]]` out of assistant copy and return cleaned
 * text with the markers (including truncated ones) fully removed.
 */
export function extractGuruCardsFromText(raw: string): {
  text: string;
  cards: GuruChatSnapshot[];
} {
  let text = String(raw || '');
  const cards: GuruChatSnapshot[] = [];
  const seen = new Set<string>();

  text = text.replace(
    new RegExp(GURU_CARD_MARKER_SOURCE, 'gi'),
    (_full, payload: string) => {
      const card = decodeGuruCardMarker(payload);
      if (card && !seen.has(card.slug)) {
        seen.add(card.slug);
        cards.push(card);
      }
      return ' ';
    },
  );

  // Never leave raw token fragments in the bubble.
  text = text.replace(new RegExp(GURU_CARD_ORPHAN_SOURCE, 'gi'), ' ');
  text = text.replace(new RegExp(GURU_CARD_CRUMB_SOURCE, 'g'), ' ');
  text = text.replace(/\bmarker\s*:\s*/gi, ' ');

  return { text: tidyText(text), cards };
}

export type ParsedCompanionMessage = {
  /** Visible copy with every marker stripped. */
  text: string;
  ctas: CompanionCtaDef[];
  guruCards: GuruChatSnapshot[];
};

/**
 * Strip CTA + guru-card markers from assistant copy and return UI parts,
 * mirroring the web `parseHomepageChatContent` contract.
 */
export function parseCompanionMessage(raw: string): ParsedCompanionMessage {
  const extracted = extractGuruCardsFromText(raw);
  let text = extracted.text;
  const found = new Set<CompanionCtaId>();

  for (const def of COMPANION_CTA_DEFS) {
    for (const source of def.patterns) {
      const pattern = new RegExp(source, 'gi');
      if (pattern.test(text)) found.add(def.id);
      text = text.replace(new RegExp(source, 'gi'), ' ');
    }
  }

  return {
    text: tidyText(text),
    ctas: COMPANION_CTA_DEFS.filter((def) => found.has(def.id)),
    guruCards: extracted.cards,
  };
}

/**
 * Hide a marker that is still mid-flight so a half-arrived `[[cta:` or
 * `[[guru_card:` token never flashes in a streaming bubble.
 */
export function stripTrailingPartialMarker(text: string) {
  const opener = text.lastIndexOf('[[');
  if (opener === -1) return text;
  if (text.slice(opener).includes(']]')) return text;
  return text.slice(0, opener).trimEnd();
}

/**
 * Rogue leans on light Markdown (`**bold**`, `* bullets`). React Native has no
 * Markdown renderer here, so flatten the emphasis and normalize bullets.
 */
export function toPlainChatText(value: string) {
  // Ordered so list markers are converted before emphasis stripping, and no
  // lookbehind is used because Hermes does not support it.
  return String(value || '')
    .replace(/```+/g, '')
    .replace(/^#{1,6}[ \t]+/gm, '')
    .replace(/(^|\n)[ \t]*[*-][ \t]+/g, '$1• ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .trim();
}
