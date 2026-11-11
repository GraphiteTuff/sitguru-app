import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DEMO_CONTENT,
  DEMO_TEAM,
  DEMO_TEAM_PICKS,
  DEMO_TOPICS,
} from "./demo-data";
import type {
  ReadsContent,
  ReadsContentDetail,
  ReadsContentType,
  ReadsSearchFilters,
  ReadsTeamMember,
  ReadsTeamPick,
  ReadsTopic,
} from "./types";

type ContentRow = ReadsContent & {
  reads_books?: unknown;
  reads_publications?: unknown;
  reads_podcasts?: unknown;
  reads_videos?: unknown;
  reads_people?: unknown;
};

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function mapDetail(row: ContentRow): ReadsContentDetail {
  return {
    ...row,
    book: asSingle(row.reads_books as never) as ReadsContentDetail["book"],
    publication: asSingle(
      row.reads_publications as never,
    ) as ReadsContentDetail["publication"],
    podcast: asSingle(
      row.reads_podcasts as never,
    ) as ReadsContentDetail["podcast"],
    video: asSingle(row.reads_videos as never) as ReadsContentDetail["video"],
    person: asSingle(row.reads_people as never) as ReadsContentDetail["person"],
  };
}

const DETAIL_SELECT = `
  *,
  reads_books (*),
  reads_publications (*),
  reads_podcasts (*),
  reads_videos (*),
  reads_people (*)
`;

async function publicClient() {
  return createClient();
}

function tableMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = String(error.message || "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table")
  );
}

export async function fetchReadsTopics(): Promise<ReadsTopic[]> {
  try {
    const supabase = await publicClient();
    const { data, error } = await supabase
      .from("reads_topics")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error || !data?.length) {
      if (error && !tableMissing(error)) console.error(error.message);
      return DEMO_TOPICS;
    }
    return data as ReadsTopic[];
  } catch {
    return DEMO_TOPICS;
  }
}

export async function fetchPublishedContent(
  filters: ReadsSearchFilters = {},
): Promise<ReadsContentDetail[]> {
  try {
    const supabase = await publicClient();
    let query = supabase
      .from("reads_content")
      .select(DETAIL_SELECT)
      .eq("status", "published")
      .eq("visibility", "public");

    if (filters.format && filters.format !== "all") {
      query = query.eq("content_type", filters.format);
    }
    if (filters.featured) {
      query = query.eq("featured", true);
    }
    if (filters.audience) {
      query = query.contains("audience", [filters.audience]);
    }
    if (filters.q) {
      query = query.or(
        `title.ilike.%${filters.q}%,subtitle.ilike.%${filters.q}%,description.ilike.%${filters.q}%,editorial_summary.ilike.%${filters.q}%`,
      );
    }

    query = query
      .order(filters.newest ? "published_at" : "featured", {
        ascending: false,
      })
      .order("published_at", { ascending: false })
      .range(
        filters.offset || 0,
        (filters.offset || 0) + (filters.limit || 48) - 1,
      );

    const { data, error } = await query;
    if (error || !data) {
      if (error && !tableMissing(error)) console.error(error.message);
      return filterDemo(filters);
    }
    if (!data.length) return filterDemo(filters);
    return (data as ContentRow[]).map(mapDetail);
  } catch {
    return filterDemo(filters);
  }
}

function filterDemo(filters: ReadsSearchFilters): ReadsContentDetail[] {
  let rows = [...DEMO_CONTENT];
  if (filters.format && filters.format !== "all") {
    rows = rows.filter((r) => r.content_type === filters.format);
  }
  if (filters.featured) rows = rows.filter((r) => r.featured);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter((r) =>
      [r.title, r.subtitle, r.description, r.editorial_summary]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }
  if (filters.topic) {
    rows = rows.filter((r) =>
      (r.topics || []).some((t) => t.slug === filters.topic),
    );
  }
  return rows.slice(0, filters.limit || 48);
}

export async function fetchContentBySlug(
  type: ReadsContentType,
  slug: string,
): Promise<ReadsContentDetail | null> {
  try {
    const supabase = await publicClient();
    const { data, error } = await supabase
      .from("reads_content")
      .select(DETAIL_SELECT)
      .eq("content_type", type)
      .eq("slug", slug)
      .eq("status", "published")
      .eq("visibility", "public")
      .maybeSingle();

    if (error || !data) {
      if (error && !tableMissing(error)) console.error(error.message);
      return (
        DEMO_CONTENT.find(
          (item) => item.content_type === type && item.slug === slug,
        ) || null
      );
    }

    const detail = mapDetail(data as ContentRow);
    const related = await fetchRelatedContent(detail.id);
    const topics = await fetchTopicsForContent(detail.id);
    const teamPicks = await fetchTeamPicksForContent(detail.id);
    return { ...detail, related, topics, team_picks: teamPicks };
  } catch {
    return (
      DEMO_CONTENT.find(
        (item) => item.content_type === type && item.slug === slug,
      ) || null
    );
  }
}

export async function fetchTopicsForContent(
  contentId: string,
): Promise<ReadsTopic[]> {
  if (contentId.startsWith("demo-")) {
    return (
      DEMO_CONTENT.find((c) => c.id === contentId)?.topics || DEMO_TOPICS.slice(0, 2)
    );
  }
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("reads_content_topics")
    .select("topic_id, reads_topics (*)")
    .eq("content_id", contentId);
  if (error || !data) return [];
  return data
    .map((row) => asSingle(row.reads_topics as never) as ReadsTopic | null)
    .filter(Boolean) as ReadsTopic[];
}

export async function fetchRelatedContent(
  contentId: string,
): Promise<ReadsContent[]> {
  if (contentId.startsWith("demo-")) {
    return DEMO_CONTENT.filter((c) => c.id !== contentId).slice(0, 4);
  }
  const supabase = await publicClient();
  const { data, error } = await supabase
    .from("reads_relationships")
    .select("to_content_id, reads_content:to_content_id (*)")
    .eq("from_content_id", contentId)
    .order("display_order", { ascending: true })
    .limit(12);
  if (error || !data) return [];
  return data
    .map((row) => asSingle(row.reads_content as never) as ReadsContent | null)
    .filter((row) => row && row.status === "published") as ReadsContent[];
}

export async function fetchFeaturedByType(
  featureType: string,
): Promise<ReadsContentDetail | null> {
  const rows = await fetchPublishedContent({ featured: true, limit: 24 });
  return (
    rows.find((r) => r.feature_type === featureType) ||
    rows.find((r) => r.content_type === featureType.replace("featured_", "").replace("_of_the_month", "").replace("_spotlight", "")) ||
    null
  );
}

export async function fetchTeamMembers(): Promise<ReadsTeamMember[]> {
  try {
    const supabase = await publicClient();
    const { data, error } = await supabase
      .from("reads_team_members")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error || !data?.length) return DEMO_TEAM;
    return data as ReadsTeamMember[];
  } catch {
    return DEMO_TEAM;
  }
}

export async function fetchTeamPicks(filters?: {
  memberSlug?: string;
  format?: ReadsContentType;
  topic?: string;
}): Promise<ReadsTeamPick[]> {
  try {
    const supabase = await publicClient();
    const { data, error } = await supabase
      .from("reads_team_picks")
      .select(
        `
        *,
        team_member:reads_team_members (*),
        content:reads_content (${DETAIL_SELECT})
      `,
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(100);

    if (error || !data?.length) {
      return filterTeamPicks(DEMO_TEAM_PICKS, filters);
    }

    const mapped = data.map((row) => {
      const teamMember = asSingle(row.team_member as never) as
        | ReadsTeamMember
        | null;
      const contentRow = asSingle(row.content as never) as ContentRow | null;
      return {
        ...(row as ReadsTeamPick),
        team_member: teamMember || undefined,
        content: contentRow ? mapDetail(contentRow) : undefined,
      };
    });
    return filterTeamPicks(mapped, filters);
  } catch {
    return filterTeamPicks(DEMO_TEAM_PICKS, filters);
  }
}

function filterTeamPicks(
  picks: ReadsTeamPick[],
  filters?: {
    memberSlug?: string;
    format?: ReadsContentType;
    topic?: string;
  },
) {
  let rows = picks;
  if (filters?.memberSlug) {
    rows = rows.filter((p) => p.team_member?.slug === filters.memberSlug);
  }
  if (filters?.format) {
    rows = rows.filter((p) => p.content?.content_type === filters.format);
  }
  if (filters?.topic) {
    rows = rows.filter((p) =>
      (p.content as ReadsContentDetail | undefined)?.topics?.some(
        (t) => t.slug === filters.topic,
      ),
    );
  }
  return rows;
}

export async function fetchTeamPicksForContent(contentId: string) {
  const picks = await fetchTeamPicks();
  return picks.filter((p) => p.content_id === contentId);
}

export async function fetchTopicBySlug(slug: string) {
  const topics = await fetchReadsTopics();
  return topics.find((t) => t.slug === slug) || null;
}

export async function fetchLandingBundle() {
  const [topics, content, teamPicks, team] = await Promise.all([
    fetchReadsTopics(),
    fetchPublishedContent({ limit: 48 }),
    fetchTeamPicks(),
    fetchTeamMembers(),
  ]);

  const books = content.filter((c) => c.content_type === "book");
  const magazines = content.filter((c) => c.content_type === "magazine");
  const podcasts = content.filter((c) => c.content_type === "podcast");
  const videos = content.filter((c) => c.content_type === "video");
  const authors = content.filter(
    (c) => c.content_type === "author" || c.content_type === "expert",
  );

  return {
    topics,
    team,
    teamPicks,
    books,
    magazines,
    podcasts,
    videos,
    authors,
    bookOfTheMonth:
      books.find((b) => b.feature_type === "book_of_the_month") || books[0] || null,
    magazineSpotlight:
      magazines.find((m) => m.feature_type === "magazine_spotlight") ||
      magazines[0] ||
      null,
    featuredPodcast:
      podcasts.find((p) => p.feature_type === "featured_podcast") ||
      podcasts[0] ||
      null,
    featuredAuthor:
      authors.find((a) => a.feature_type === "featured_author") ||
      authors[0] ||
      null,
    isDemo: content.every((c) => c.id.startsWith("demo-")),
  };
}

/** Staff listing — service role, never expose drafts publicly. */
export async function fetchStaffContent(options?: {
  status?: string;
  contentType?: string;
  createdBy?: string;
  assignedInternId?: string;
  limit?: number;
}) {
  let query = supabaseAdmin
    .from("reads_content")
    .select(DETAIL_SELECT)
    .order("updated_at", { ascending: false })
    .limit(options?.limit || 100);

  if (options?.status) query = query.eq("status", options.status);
  if (options?.contentType) query = query.eq("content_type", options.contentType);
  if (options?.createdBy) query = query.eq("created_by", options.createdBy);
  if (options?.assignedInternId) {
    query = query.eq("assigned_intern_id", options.assignedInternId);
  }

  const { data, error } = await query;
  if (error) {
    if (!tableMissing(error)) console.error(error.message);
    return [] as ReadsContentDetail[];
  }
  return ((data || []) as ContentRow[]).map(mapDetail);
}

export async function fetchStaffKpis(options?: { createdBy?: string }) {
  const rows = await fetchStaffContent({
    createdBy: options?.createdBy,
    limit: 500,
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const partners = await supabaseAdmin
    .from("reads_partners")
    .select("id,status,escalated_to_admin")
    .limit(500);

  const partnerRows = partners.data || [];

  return {
    needsReview: rows.filter((r) => r.status === "submitted").length,
    drafts: rows.filter((r) => r.status === "draft").length,
    scheduled: rows.filter((r) => r.status === "scheduled").length,
    publishedThisMonth: rows.filter(
      (r) =>
        r.status === "published" &&
        r.published_at &&
        r.published_at >= monthStart,
    ).length,
    changesRequested: rows.filter((r) => r.status === "changes_requested")
      .length,
    partnerLeads: partnerRows.filter((p) =>
      ["new", "under_review", "contacted"].includes(String(p.status)),
    ).length,
    activePartners: partnerRows.filter((p) => p.status === "active_partner")
      .length,
    escalations: partnerRows.filter((p) => p.escalated_to_admin).length,
  };
}

export async function searchReads(filters: ReadsSearchFilters) {
  const [content, topics, teamPicks] = await Promise.all([
    fetchPublishedContent({ ...filters, limit: filters.limit || 36 }),
    fetchReadsTopics(),
    filters.teamPick ? fetchTeamPicks() : Promise.resolve([]),
  ]);

  const topicMatch = filters.topic
    ? content.filter((c) =>
        (c.topics || []).some((t) => t.slug === filters.topic) ||
        c.tags?.includes(filters.topic || ""),
      )
    : content;

  return {
    results: topicMatch,
    topics,
    teamPicks,
  };
}
