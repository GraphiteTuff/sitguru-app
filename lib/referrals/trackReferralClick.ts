import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type TrackReferralClickInput = {
  referralCodeId: string;
  landingPage: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

function getHeaderValue(name: string) {
  const headerStore = headers();
  return headerStore.get(name) || null;
}

function getIpSource() {
  return (
    getHeaderValue("x-forwarded-for") ||
    getHeaderValue("x-real-ip") ||
    getHeaderValue("cf-connecting-ip") ||
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
  landingPage,
  utmSource,
  utmMedium,
  utmCampaign,
}: TrackReferralClickInput) {
  try {
    const supabase = await createClient();

    const ipHash = await sha256(getIpSource());
    const userAgent = getHeaderValue("user-agent");
    const referrer = getHeaderValue("referer");

    const { error } = await supabase.from("referral_clicks").insert({
      referral_code_id: referralCodeId,
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
