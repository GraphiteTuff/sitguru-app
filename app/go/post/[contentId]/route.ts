import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isOfficialReviewStage, legacyStatusToStage } from "@/lib/internship/review-flow";

export const dynamic = "force-dynamic";

/**
 * Shareable, post-specific CTA link. Approved items only; destinations are
 * limited to SitGuru. Records a first-party click, not a paid conversion.
 */
const ALLOWED_PLATFORMS = new Set(["facebook", "instagram", "tiktok", "youtube", "x"]);
const SITE = "https://www.sitguru.com";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function safeDestination(value: string): URL | null {
  try {
    const url = new URL(value, SITE);
    if (url.protocol !== "https:" || !["sitguru.com", "www.sitguru.com"].includes(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, context: {
  params: Promise<{ contentId: string }> | { contentId: string };
}) {
  const { contentId } = await context.params;
  const fallback = new URL("/", SITE);
  if (!UUID.test(contentId)) return NextResponse.redirect(fallback, 307);
  const { data: content, error } = await supabaseAdmin.from("internship_content")
    .select("id,platform,review_stage,status,campaign_id,published_url")
    .eq("id", contentId).maybeSingle();
  if (error || !content) return NextResponse.redirect(fallback, 307);
  const stage = legacyStatusToStage(String(content.status || ""), String(content.review_stage || ""));
  if (!content.published_url && !isOfficialReviewStage(stage) && stage !== "ceo_approved") {
    return NextResponse.redirect(fallback, 307);
  }
  let campaign = null as { name?: string | null; utm_campaign?: string | null; tracking_url?: string | null } | null;
  if (content.campaign_id) {
    const result = await supabaseAdmin.from("internship_campaigns")
      .select("name,utm_campaign,tracking_url").eq("id", content.campaign_id).maybeSingle();
    campaign = result.data;
  }
  const fromUrl = String(request.nextUrl.searchParams.get("platform") || "").toLowerCase();
  const defaultPlatform = String(content.platform || "").toLowerCase();
  const platform = ALLOWED_PLATFORMS.has(fromUrl)
    ? fromUrl
    : ALLOWED_PLATFORMS.has(defaultPlatform) ? defaultPlatform : "social";
  const trackingKey = "sg_" + content.id;
  const slug = String(campaign?.utm_campaign || "").trim() || "content-studio";
  const destination = safeDestination(String(campaign?.tracking_url || ""))
    || new URL("/signup?role=pet_parent", SITE);
  destination.searchParams.set("utm_source", platform);
  destination.searchParams.set("utm_medium", "social");
  destination.searchParams.set("utm_campaign", slug);
  destination.searchParams.set("utm_content", trackingKey);

  try {
    const { error: insertError } = await supabaseAdmin.from("growth_campaign_events").insert({
      campaign_name: String(campaign?.name || "Content Studio"),
      campaign_slug: slug,
      event_type: "click",
      source: platform,
      medium: "social",
      metadata: {
        utm_content: trackingKey,
        via: "social_intelligence_post_link",
      },
    });
    if (insertError) console.warn("SitGuru post click not recorded:", insertError.code);
  } catch {
    console.warn("SitGuru post click not recorded.");
  }
  return NextResponse.redirect(destination, 307);
}
