/**
 * Community Events → SitGuru signup conversion helpers.
 * Keep this client-safe (no server-only imports).
 */

export const PENDING_EVENT_RSVP_KEY = "sitguru_pending_event_rsvp";

export type PendingEventRsvp = {
  eventId: string;
  slug: string;
  savedAt: number;
};

export type CommunitySignupRole = "pet_parent" | "guru" | "ambassador";

export const COMMUNITY_SIGNUP_ROLES: {
  id: CommunitySignupRole;
  label: string;
  short: string;
  signupIntent: CommunitySignupRole | "both";
}[] = [
  {
    id: "pet_parent",
    label: "Pet Parent",
    short: "RSVP & find local care",
    signupIntent: "pet_parent",
  },
  {
    id: "guru",
    label: "Pet Guru",
    short: "Show up & connect locally",
    signupIntent: "guru",
  },
  {
    id: "ambassador",
    label: "Ambassador",
    short: "Grow the community",
    signupIntent: "ambassador",
  },
];

export function isSafeCommunityNextPath(path: string) {
  const decoded = path.trim();
  if (!decoded.startsWith("/")) return false;
  if (decoded.startsWith("//")) return false;
  if (decoded.includes("://")) return false;
  if (decoded.startsWith("/admin")) return false;
  if (decoded.startsWith("/auth/")) return false;
  if (decoded.startsWith("/signup")) return false;

  return (
    decoded.startsWith("/events/") ||
    decoded.startsWith("/community/") ||
    decoded.startsWith("/customer/") ||
    decoded.startsWith("/guru/") ||
    decoded.startsWith("/ambassador/") ||
    decoded.startsWith("/search") ||
    decoded.startsWith("/find-care") ||
    decoded === "/events" ||
    decoded === "/community"
  );
}

export function buildEventReturnPath(slug: string, opts?: { rsvp?: boolean }) {
  const params = new URLSearchParams();
  if (opts?.rsvp !== false) params.set("rsvp", "1");
  const query = params.toString();
  return `/events/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`;
}

function roleToSignupParams(role: CommunitySignupRole) {
  if (role === "guru") return { role: "guru", intent: "guru" };
  if (role === "ambassador") return { role: "ambassador", intent: "ambassador" };
  return { role: "pet_parent", intent: "pet_parent" };
}

function roleToLoginParam(role: CommunitySignupRole) {
  if (role === "guru") return "guru";
  if (role === "ambassador") return "ambassador";
  return "pet_parent";
}

export function buildCommunityEventSignupHref(input: {
  slug: string;
  eventId?: string;
  role?: CommunitySignupRole;
  source?: string;
  campaign?: string;
}) {
  const role = input.role || "pet_parent";
  const roleParams = roleToSignupParams(role);
  const next = buildEventReturnPath(input.slug, { rsvp: true });
  const campaign =
    input.campaign ||
    (role === "guru"
      ? "community_event_guru"
      : role === "ambassador"
        ? "community_event_ambassador"
        : "community_event_im_going");

  const params = new URLSearchParams({
    ...roleParams,
    next,
    source: input.source || "community_events",
    platform: "web",
    campaign,
    utm_source: "sitguru",
    utm_medium: "community_events",
    utm_campaign: campaign,
    utm_content: input.slug,
  });

  if (input.eventId) {
    params.set("event_id", input.eventId);
  }

  return `/signup?${params.toString()}`;
}

export function buildCommunityEventLoginHref(input: {
  slug: string;
  role?: CommunitySignupRole;
}) {
  const role = input.role || "pet_parent";
  const next = buildEventReturnPath(input.slug, { rsvp: true });
  const params = new URLSearchParams({
    role: roleToLoginParam(role),
    next,
  });
  return `/login?${params.toString()}`;
}

/** @deprecated Use buildCommunityEventSignupHref */
export function buildCommunityPetParentSignupHref(input: {
  slug: string;
  eventId?: string;
  source?: string;
  campaign?: string;
}) {
  return buildCommunityEventSignupHref({ ...input, role: "pet_parent" });
}

/** @deprecated Use buildCommunityEventLoginHref */
export function buildCommunityPetParentLoginHref(input: {
  slug: string;
  source?: string;
}) {
  return buildCommunityEventLoginHref({ slug: input.slug, role: "pet_parent" });
}

export function buildCommunityJoinHref(input?: {
  next?: string;
  source?: string;
  campaign?: string;
  role?: CommunitySignupRole;
}) {
  const role = input?.role || "pet_parent";
  const roleParams = roleToSignupParams(role);
  const next = input?.next || "/events";
  const campaign =
    input?.campaign ||
    (role === "guru"
      ? "community_join_guru"
      : role === "ambassador"
        ? "community_join_ambassador"
        : "community_join_cta");

  const params = new URLSearchParams({
    ...roleParams,
    next: isSafeCommunityNextPath(next) ? next : "/events",
    source: input?.source || "community_events",
    platform: "web",
    campaign,
    utm_source: "sitguru",
    utm_medium: "community_events",
    utm_campaign: campaign,
  });
  return `/signup?${params.toString()}`;
}

/** Pending Google-discovery event to reopen after Pet Parent signup. */
export const PENDING_DISCOVERY_OPEN_KEY = "sitguru_pending_discovery_open";

export type PendingDiscoveryOpen = {
  eventId: string;
  title: string;
  eventUrl: string;
  savedAt: number;
};

export function savePendingDiscoveryOpen(pending: PendingDiscoveryOpen) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PENDING_DISCOVERY_OPEN_KEY,
      JSON.stringify(pending),
    );
  } catch {
    // private browsing
  }
}

export function readPendingDiscoveryOpen(): PendingDiscoveryOpen | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_DISCOVERY_OPEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingDiscoveryOpen;
    if (!parsed?.eventUrl || !parsed?.eventId) return null;
    if (Date.now() - Number(parsed.savedAt || 0) > 7 * 86400000) {
      window.localStorage.removeItem(PENDING_DISCOVERY_OPEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingDiscoveryOpen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_DISCOVERY_OPEN_KEY);
  } catch {
    // ignore
  }
}

/** One-tap Pet Parent capture from a Google discovery banner card. */
export function buildDiscoveryPetParentSignupHref(input: {
  eventId: string;
  title: string;
  source?: string;
  campaign?: string;
}) {
  const campaign = input.campaign || "google_discovery_banner";
  const params = new URLSearchParams({
    role: "pet_parent",
    intent: "pet_parent",
    next: "/community?welcome=1",
    source: input.source || "homepage_events_banner",
    platform: "web",
    campaign,
    utm_source: "sitguru",
    utm_medium: "community_events",
    utm_campaign: campaign,
    utm_content: input.eventId,
    event_id: input.eventId,
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
