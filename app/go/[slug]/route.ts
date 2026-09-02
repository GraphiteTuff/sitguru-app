import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function withUtm(destination: string, campaign: Record<string, unknown>) {
  try {
    const url = new URL(destination);
    const source = asText(campaign.utm_source) || asText(campaign.channel) || "social";
    const medium = asText(campaign.utm_medium) || "social";
    const slug = asText(campaign.utm_campaign) || asText(campaign.campaign_slug);
    if (!url.searchParams.get("utm_source")) url.searchParams.set("utm_source", source);
    if (!url.searchParams.get("utm_medium")) url.searchParams.set("utm_medium", medium);
    if (slug && !url.searchParams.get("utm_campaign")) {
      url.searchParams.set("utm_campaign", slug);
    }
    return url.toString();
  } catch {
    return destination || "https://sitguru.com";
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } },
) {
  const resolved = await context.params;
  const slug = decodeURIComponent(asText(resolved?.slug));
  const fallback = new URL("/", request.nextUrl.origin);

  if (!slug) {
    return NextResponse.redirect(fallback);
  }

  const { data } = await supabaseAdmin
    .from("growth_campaigns")
    .select(
      "id,campaign_name,campaign_slug,channel,source,medium,utm_source,utm_medium,utm_campaign,destination_url,status",
    )
    .eq("campaign_slug", slug)
    .limit(1)
    .maybeSingle();

  if (!data) {
    return NextResponse.redirect(fallback);
  }

  try {
    await supabaseAdmin.from("growth_campaign_events").insert({
      campaign_id: data.id,
      campaign_name: data.campaign_name,
      campaign_slug: data.campaign_slug,
      event_type: "click",
      source: data.utm_source || data.channel || "social",
      medium: data.utm_medium || "social",
      metadata: { via: "growth_go", referrer: request.headers.get("referer") },
    });
  } catch (error) {
    console.warn("Growth click log skipped:", error);
  }

  const destination = withUtm(
    asText(data.destination_url) || fallback.toString(),
    data,
  );

  return NextResponse.redirect(destination, 307);
}
