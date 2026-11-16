import { supabaseAdmin } from "@/lib/supabase/admin";
import { socialReuseAllowed } from "@/lib/community-studio/rights";
import { surveyIsOpen } from "@/lib/manager-growth/model";

export type PromotionCategory = "reads" | "events" | "community" | "surveys" | "brand";
export type PromotionOpportunity = {
  id: string;
  kind: PromotionCategory;
  label: string;
  title: string;
  summary: string;
  destination: string;
  publicUrl: string | null;
  reviewNote: string;
};

const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
function internalPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/";
}
const REVIEW_NOTES: Record<PromotionCategory, string> = {
  reads: "Link to SitGuru's published editorial page. Verify the creator's artwork and promotional permissions before reusing third-party media.",
  events: "Promote an already published, upcoming event. Check date, organizer permissions, and event graphics before posting.",
  community: "Social reuse and any required Pet Parent consent verified for this published SitGuru Pack story. Recheck before exporting media.",
  surveys: "Only an active, publicly open poll can be promoted; responses and participant information stay private.",
  brand: "Use approved Brand Kit files in Content Studio. Recheck third-party branding rights before posting.",
};

export function promoCampaignHref(source: Pick<PromotionOpportunity, "title" | "destination" | "kind">) {
  const query = new URLSearchParams({
    type: source.kind === "events" ? "event" : "post",
    title: source.title.slice(0, 150),
    dest: internalPath(source.destination),
    href: internalPath(source.destination),
  });
  return "/manager/create?" + query.toString();
}

/**
 * Promotion Hub only queries public/published or approved content.
 * No survey response rows, internal conversion data, personal details,
 * draft community stories or unapproved Brand Kit assets are exposed.
 */
export async function loadPromotionOpportunities(input: {
  managerUserId: string;
  includeStaffAssets?: boolean;
}): Promise<PromotionOpportunity[]> {
  const { managerUserId, includeStaffAssets = true } = input;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const now = new Date().toISOString();
  const [reads, events, community, surveys, brand] = await Promise.all([
    supabaseAdmin
      .from("reads_content")
      .select("id,slug,title,description,editorial_summary,content_type,disclosure_label,status,visibility")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("published_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("community_events")
      .select("id,slug,title,short_description,city,state,status,start_at,cancelled_at")
      .eq("status", "published")
      .is("cancelled_at", null)
      .gte("start_at", now)
      .order("start_at", { ascending: true })
      .limit(10),
    supabaseAdmin
      .from("community_studio_submissions")
      .select("id,title,story,status,public_consent,social_consent,media_safe,image_path,approved_at,features_client_pet,parent_permission_status,parent_user_id,parent_social_consent")
      .eq("status", "published")
      .eq("social_consent", true)
      .not("approved_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(20),
    managerUserId
      ? supabaseAdmin
          .from("manager_work_surveys")
          .select("id,code,title,question,status,start_on,end_on,owner_user_id")
          .eq("owner_user_id", managerUserId)
          .eq("status", "Open")
          .limit(20)
      : Promise.resolve({ data: [] }),
    includeStaffAssets
      ? supabaseAdmin
          .from("growth_brand_assets")
          .select("id,title,category,description,mime_type,verified,approval_status")
          .eq("verified", true)
          .eq("approval_status", "approved")
          .order("updated_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
  ]);

  const output: PromotionOpportunity[] = [];
  for (const item of reads.data || []) {
    const slug = asText(item.slug);
    const type = asText(item.content_type);
    if (!slug || !["book", "magazine", "podcast", "video", "author", "expert", "publication"].includes(type)) continue;
    const section: Record<string, string> = {
      book: "books", magazine: "magazines", podcast: "podcasts",
      video: "videos", author: "authors", expert: "authors", publication: "magazines",
    };
    const destination = internalPath("/reads/" + section[type] + "/" + encodeURIComponent(slug));
    output.push({
      id: String(item.id), kind: "reads", label: "Reads & Listens • " + type,
      title: asText(item.title), summary: asText(item.editorial_summary || item.description).slice(0, 190),
      destination, publicUrl: destination, reviewNote: REVIEW_NOTES.reads,
    });
  }
  for (const item of events.data || []) {
    const slug = asText(item.slug);
    if (!slug) continue;
    const destination = internalPath("/events/" + encodeURIComponent(slug));
    output.push({
      id: String(item.id), kind: "events", label: "Local event",
      title: asText(item.title),
      summary: [asText(item.short_description), [asText(item.city), asText(item.state)].filter(Boolean).join(", ")].filter(Boolean).join(" • ").slice(0, 190),
      destination, publicUrl: destination, reviewNote: REVIEW_NOTES.events,
    });
  }
  for (const item of community.data || []) {
    if (!socialReuseAllowed(item) || !asText(item.approved_at)) continue;
    const destination = "/pack#story-" + encodeURIComponent(String(item.id));
    output.push({
      id: String(item.id), kind: "community", label: "Community Studio • social consent approved",
      title: asText(item.title), summary: asText(item.story).slice(0, 190),
      destination, publicUrl: destination, reviewNote: REVIEW_NOTES.community,
    });
  }
  for (const item of surveys.data || []) {
    const code = asText(item.code);
    if (!code || !surveyIsOpen({
      status: asText(item.status),
      startOn: asText(item.start_on),
      endOn: asText(item.end_on),
      today,
    })) continue;
    const destination = "/s/" + encodeURIComponent(code);
    output.push({
      id: String(item.id), kind: "surveys", label: "Public poll • currently open",
      title: asText(item.title), summary: asText(item.question).slice(0, 190),
      destination, publicUrl: destination, reviewNote: REVIEW_NOTES.surveys,
    });
  }
  for (const item of brand.data || []) {
    // All approved categories appear in Brand Kit, but only promotional
    // creative is offered for campaign reuse; legal/payment badges excluded.
    if (!["social_graphics", "flyers", "videos", "official_logos", "seasonal", "templates", "photography_stock"].includes(asText(item.category))) continue;
    output.push({
      id: String(item.id), kind: "brand", label: "Approved Brand Kit asset",
      title: asText(item.title), summary: asText(item.description).slice(0, 190),
      destination: "/manager/toolkit/brand#asset-" + encodeURIComponent(String(item.id)),
      publicUrl: null, reviewNote: REVIEW_NOTES.brand,
    });
  }
  return output.filter(item => item.title);
}