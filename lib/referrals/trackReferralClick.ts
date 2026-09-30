import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { normalizeReferralCode } from "@/lib/ambassador/creator-referral";

type TrackReferralClickInput = {
  referralCodeId?: string;
  code?: string;
  landingPage: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

async function getHeaderValue(name: string) {
  const headerStore = await headers();
  return headerStore.get(name) || null;
}

async function getIpSource() {
  return (
    (await getHeaderValue("x-forwarded-for")) ||
    (await getHeaderValue("x-real-ip")) ||
    (await getHeaderValue("cf-connecting-ip")) ||
    ""
  );
}

async function sha256(value: string) {
  if (!value) return null;

  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function trackReferralClick({
  referralCodeId,
  code,
  landingPage,
  utmSource,
  utmMedium,
  utmCampaign,
}: TrackReferralClickInput) {
  try {
    const resolvedId = await resolveReferralCodeId(referralCodeId, code);
    if (!resolvedId) return;

    const supabase = await createClient();

    const ipHash = await sha256(await getIpSource());
    const userAgent = await getHeaderValue("user-agent");
    const referrer = await getHeaderValue("referer");

    const { error } = await supabase.from("referral_clicks").insert({
      referral_code_id: resolvedId,
      landing_page: landingPage,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer,
    });

    if (error) {
      console.error("Referral click tracking error:", error);
    }
  } catch (error) {
    console.error("Referral click tracking failed:", error);
  }
}

async function resolveReferralCodeId(referralCodeId?: string, code?: string) {
  const supplied = String(referralCodeId || "").trim();
  if (supplied) return supplied;
  const normalized = normalizeReferralCode(code);
  if (!normalized) return "";
  const { data, error } = await supabaseAdmin
    .from("referral_codes")
    .select("id")
    .ilike("code", normalized)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error || !data) return "";
  return String((data as { id?: string }).id || "");
}