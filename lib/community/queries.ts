import { fetchDiscoveredEventByPublicSlug } from "@/lib/community/discovered-events";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  CommunityEventRow,
  CommunityEventStatus,
  CommunityEventWithPartner,
  PartnerEventTab,
} from "@/lib/community/types";

const PUBLIC_EVENT_SELECT = `
  *,
  partners:partner_id (
    id,
    business_name,
    slug,
    city,
    state,
    website,
    email
  )
`;

export type PublicEventFilters = {
  q?: string;
  city?: string;
  state?: string;
  category?: string;
  petFriendly?: boolean;
  isFree?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

function applyPublicFilters<T extends { eq: Function; gte: Function; lte: Function; ilike: Function; contains: Function; order: Function }>(
  query: T,
  filters: PublicEventFilters,
) {
  let next = query
    .eq("status", "published")
    .is("cancelled_at", null)
    .gte("start_at", filters.from || new Date().toISOString());

  if (filters.to) {
    next = next.lte("start_at", filters.to);
  }

  if (filters.city) {
    next = next.ilike("city", filters.city);
  }

  if (filters.state) {
    next = next.ilike("state", filters.state);
  }

  if (filters.category) {
    next = next.contains("categories", [filters.category]);
  }

  if (filters.petFriendly) {
    next = next.eq("pet_friendly", true);
  }

  if (typeof filters.isFree === "boolean") {
    next = next.eq("is_free", filters.isFree);
  }

  if (filters.q) {
    next = next.or(
      `title.ilike.%${filters.q}%,short_description.ilike.%${filters.q}%,venue_name.ilike.%${filters.q}%,city.ilike.%${filters.q}%`,
    );
  }

  return next.order("start_at", { ascending: true });
}

export async function fetchPublicEvents(filters: PublicEventFilters = {}) {
  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;

  const query = applyPublicFilters(
    supabaseAdmin.from("community_events").select(PUBLIC_EVENT_SELECT),
    filters,
  );

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("fetchPublicEvents:", error);
    return [];
  }

  return (data || []) as CommunityEventWithPartner[];
}

export async function fetchPublicEventBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("community_events")
    .select(PUBLIC_EVENT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .is("cancelled_at", null)
    .maybeSingle();

  if (error) {
    console.error("fetchPublicEventBySlug:", error);
  }

  if (data) return data as CommunityEventWithPartner;

  return fetchDiscoveredEventByPublicSlug(slug);
}

export type FeaturedEventQuery = {
  city?: string;
  state?: string;
  limit?: number;
};

export async function fetchFeaturedHomepageEvents(filters: FeaturedEventQuery = {}) {
  const now = new Date().toISOString();
  const limit = filters.limit ?? 4;

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .select(PUBLIC_EVENT_SELECT)
    .eq("status", "published")
    .is("cancelled_at", null)
    .neq("featured_status", "none")
    .gte("start_at", now)
    .or(`featured_end_at.is.null,featured_end_at.gte.${now}`)
    .or(`featured_start_at.is.null,featured_start_at.lte.${now}`)
    .order("featured_priority", { ascending: false })
    .order("start_at", { ascending: true })
    .limit(Math.max(limit * 3, 12));

  if (error) {
    console.error("fetchFeaturedHomepageEvents:", error);
    return [];
  }

  const rows = (data || []) as CommunityEventWithPartner[];

  const marketFiltered = rows.filter((event) => {
    if (!filters.city || !filters.state) return true;
    if (!event.featured_market_city && !event.featured_market_state) return true;

    return (
      event.featured_market_city?.toLowerCase() === filters.city.toLowerCase() &&
      event.featured_market_state?.toLowerCase() === filters.state.toLowerCase()
    );
  });

  return marketFiltered.slice(0, limit);
}

export async function fetchFeaturedCommunityPageEvents(filters: FeaturedEventQuery = {}) {
  const now = new Date().toISOString();
  const limit = filters.limit ?? 3;

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .select(PUBLIC_EVENT_SELECT)
    .eq("status", "published")
    .is("cancelled_at", null)
    .in("featured_status", ["community", "homepage", "market"])
    .gte("start_at", now)
    .or(`featured_end_at.is.null,featured_end_at.gte.${now}`)
    .or(`featured_start_at.is.null,featured_start_at.lte.${now}`)
    .order("featured_priority", { ascending: false })
    .order("start_at", { ascending: true })
    .limit(Math.max(limit * 2, 8));

  if (error) {
    console.error("fetchFeaturedCommunityPageEvents:", error);
    return [];
  }

  return ((data || []) as CommunityEventWithPartner[]).slice(0, limit);
}

export async function fetchFeaturedEventsForAdmin() {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .select(PUBLIC_EVENT_SELECT)
    .eq("status", "published")
    .is("cancelled_at", null)
    .neq("featured_status", "none")
    .gte("start_at", now)
    .order("featured_priority", { ascending: false })
    .order("start_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("fetchFeaturedEventsForAdmin:", error);
    return [];
  }

  return (data || []) as CommunityEventWithPartner[];
}

export async function fetchPartnerEvents(partnerId: string, tab: PartnerEventTab) {
  const now = new Date().toISOString();

  let query = supabaseAdmin
    .from("community_events")
    .select("*")
    .eq("partner_id", partnerId)
    .order("start_at", { ascending: tab === "past" ? false : true });

  switch (tab) {
    case "drafts":
      query = query.eq("status", "draft");
      break;
    case "pending":
      query = query.in("status", ["pending_review", "changes_requested", "approved"]);
      break;
    case "published":
      query = query.eq("status", "published");
      break;
    case "cancelled":
      query = query.eq("status", "cancelled");
      break;
    case "past":
      query = query.lt("start_at", now).neq("status", "draft");
      break;
    case "upcoming":
    default:
      query = query
        .gte("start_at", now)
        .in("status", ["draft", "pending_review", "changes_requested", "approved", "published"]);
      break;
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchPartnerEvents:", error);
    return [];
  }

  return (data || []) as CommunityEventRow[];
}

export async function fetchAdminEvents(filters: {
  q?: string;
  status?: CommunityEventStatus | "all";
  partnerId?: string;
  city?: string;
  state?: string;
  category?: string;
  limit?: number;
} = {}) {
  let query = supabaseAdmin
    .from("community_events")
    .select(`${PUBLIC_EVENT_SELECT}`)
    .order("start_at", { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.partnerId) {
    query = query.eq("partner_id", filters.partnerId);
  }

  if (filters.city) {
    query = query.ilike("city", filters.city);
  }

  if (filters.state) {
    query = query.ilike("state", filters.state);
  }

  if (filters.category) {
    query = query.contains("categories", [filters.category]);
  }

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,short_description.ilike.%${filters.q}%,venue_name.ilike.%${filters.q}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchAdminEvents:", error);
    return [];
  }

  return (data || []) as CommunityEventWithPartner[];
}

export async function fetchAdminEventById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("community_events")
    .select(PUBLIC_EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("fetchAdminEventById:", error);
    return null;
  }

  return (data as CommunityEventWithPartner | null) || null;
}
