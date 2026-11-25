import "server-only";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type TrackReferralClickInput = {
  referralCodeId: string;
  landingPage: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

async function digest(value: string): Promise<string | null> {
  if (!value) return null;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Single event per real short visit, regardless of how many components render.
 * Never count Next.js prefetches, and never rely on public anon INSERT policy.
 * A visit can be a link OR a QR scan (utm_medium=qr), not both.
 */
export async function trackReferralClick({
  referralCodeId,
  landingPage,
  utmSource,
  utmMedium,
  utmCampaign,
}: TrackReferralClickInput): Promise<{ recorded: boolean; reason: string }> {
  try {
    const requestHeaders = await headers();
    if (
      requestHeaders.get("next-router-prefetch") === "1" ||
      requestHeaders.get("purpose")?.includes("prefetch") ||
      requestHeaders.get("sec-purpose")?.includes("prefetch")
    ) return { recorded: false, reason: "prefetch" };

    const sourceIp =
      (requestHeaders.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
      requestHeaders.get("cf-connecting-ip") ||
      requestHeaders.get("x-real-ip") ||
      "";
    const ipHash = await digest(sourceIp);
    const userAgent = (requestHeaders.get("user-agent") || "").slice(0, 600) || null;
    const referrer = (requestHeaders.get("referer") || "").slice(0, 1200) || null;
    const medium = utmMedium === "qr" ? "qr" : String(utmMedium || "link").slice(0, 48);
    const channel = String(utmSource || "").slice(0, 120) || null;
    const campaign = String(utmCampaign || "").slice(0, 120) || null;

    // A rapid QR reload or route prefetch must not become a second referral.
    if (ipHash && userAgent) {
      const threshold = new Date(Date.now() - 90_000).toISOString();
      const { data: existing, error: lookupError } = await supabaseAdmin
        .from("referral_clicks")
        .select("id")
        .eq("referral_code_id", referralCodeId)
        .eq("ip_hash", ipHash)
        .eq("user_agent", userAgent)
        .eq("utm_medium", medium)
        .gte("created_at", threshold)
        .limit(1);
      if (!lookupError && existing?.length) return { recorded: false, reason: "deduped" };
    }

    const { error } = await supabaseAdmin.from("referral_clicks").insert({
      referral_code_id: referralCodeId,
      landing_page: landingPage.slice(0, 512),
      utm_source: channel,
      utm_medium: medium,
      utm_campaign: campaign,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer,
    });
    if (error) {
      console.warn("[referrals] Click insert failed:", error.message);
      return { recorded: false, reason: "write_failed" };
    }
    return { recorded: true, reason: "recorded" };
  } catch (error) {
    console.warn("[referrals] Click tracking unavailable:", error);
    return { recorded: false, reason: "unavailable" };
  }
}
