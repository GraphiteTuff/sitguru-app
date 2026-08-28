/**
 * Community Events → Pet Parent conversion helpers.
 * Keep this client-safe (no server-only imports).
 */

export const PENDING_EVENT_RSVP_KEY = "sitguru_pending_event_rsvp";

export type PendingEventRsvp = {
  eventId: string;
  slug: string;
  savedAt: number;
};

export function isSafeCommunityNextPath(path: string) {
  const decoded = path.trim();
  if (!decoded.startsWith("/")) return false;
  if (decoded.startsWith("//")) return false;
  if (decoded.includes("://")) return false;
  if (decoded.startsWith("/admin")) return false;
  if (decoded.startsWith("/auth/")) return false;
  if (decoded.startsWith("/signup")) return false;

  return (
    decoded.startsWith("/community/") ||
    decoded.startsWith("/customer/") ||
    decoded.startsWith("/search") ||
    decoded.startsWith("/find-care") ||
    decoded === "/community"
  );
}

export function buildEventReturnPath(slug: string, opts?: { rsvp?: boolean }) {
  const params = new URLSearchParams();
  if (opts?.rsvp !== false) params.set("rsvp", "1");
  const query = params.toString();
  return `/community/events/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`;
}

export function buildCommunityPetParentSignupHref(input: {
  slug: string;
  eventId?: string;
  source?: string;
  campaign?: string;
}) {
  const next = buildEventReturnPath(input.slug, { rsvp: true });
  const params = new URLSearchParams({
    role: "pet_parent",
    intent: "pet_parent",
    next,
    source: input.source || "community_events",
    platform: "web",
    campaign: input.campaign || "community_event_im_going",
    utm_source: "sitguru",
    utm_medium: "community_events",
    utm_campaign: input.campaign || "community_event_im_going",
    utm_content: input.slug,
  });

  if (input.eventId) {
    params.set("event_id", input.eventId);
  }

  return `/signup?${params.toString()}`;
}

export function buildCommunityPetParentLoginHref(input: {
  slug: string;
  source?: string;
}) {
  const next = buildEventReturnPath(input.slug, { rsvp: true });
  const params = new URLSearchParams({
    role: "pet_parent",
    next,
  });
  return `/login?${params.toString()}`;
}

export function buildCommunityJoinHref(input?: {
  next?: string;
  source?: string;
  campaign?: string;
}) {
  const next = input?.next || "/community/events";
  const params = new URLSearchParams({
    role: "pet_parent",
    intent: "pet_parent",
    next: isSafeCommunityNextPath(next) ? next : "/community/events",
    source: input?.source || "community_events",
    platform: "web",
    campaign: input?.campaign || "community_join_cta",
    utm_source: "sitguru",
    utm_medium: "community_events",
    utm_campaign: input?.campaign || "community_join_cta",
  });
  return `/signup?${params.toString()}`;
}

export function savePendingEventRsvp(pending: PendingEventRsvp) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_EVENT_RSVP_KEY, JSON.stringify(pending));
  } catch {
    // private browsing
  }
}

export function readPendingEventRsvp(): PendingEventRsvp | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_EVENT_RSVP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingEventRsvp;
    if (!parsed?.eventId || !parsed?.slug) return null;
    // Expire after 7 days
    if (Date.now() - Number(parsed.savedAt || 0) > 7 * 86400000) {
      window.localStorage.removeItem(PENDING_EVENT_RSVP_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingEventRsvp() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_EVENT_RSVP_KEY);
  } catch {
    // ignore
  }
}
