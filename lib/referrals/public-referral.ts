import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type PublicReferral = {
  id: string;
  code: string;
  slug: string | null;
  ownerType: string;
  partnerId: string | null;
  ambassadorId: string | null;
  displayName: string;
  portraitUrl: string | null;
  partnerStatus: string | null;
  partnerSlug: string | null;
  region: string;
  isPublicAmbassador: boolean;
};

const safeCode = (value: string) => /^[A-Za-z0-9_-]{2,64}$/.test(value);

type CodeRow = {
  id: string; code: string; slug: string | null; owner_type: string | null;
  partner_id: string | null; ambassador_id: string | null; owner_name: string | null; status: string | null;
};

export async function resolvePublicReferral(raw: string): Promise<PublicReferral | null> {
  const value = String(raw || "").trim();
  if (!safeCode(value)) return null;

  const columns = "id, code, slug, owner_type, partner_id, ambassador_id, owner_name, status";
  const { data: codeMatch } = await supabaseAdmin
    .from("referral_codes").select(columns).ilike("code", value).eq("status", "active").limit(1).maybeSingle();
  let row = codeMatch as CodeRow | null;

  if (!row) {
    const { data: slugMatch } = await supabaseAdmin
      .from("referral_codes").select(columns).eq("slug", value).eq("status", "active").limit(1).maybeSingle();
    row = slugMatch as CodeRow | null;
  }
  if (!row || !safeCode(row.code)) return null;

  let displayName = String(row.owner_name || "").trim();
  let portraitUrl: string | null = null;
  let partnerStatus: string | null = null;
  let partnerSlug: string | null = null;
  let region = "";
  let isPublicAmbassador = false;

  if (row.ambassador_id) {
    const { data } = await supabaseAdmin.from("ambassadors")
      .select("full_name,display_name,status,photo_approved,ambassador_photo_url,city,state")
      .eq("id", row.ambassador_id).maybeSingle();
    const ambassador = data as {
      full_name?: string | null; display_name?: string | null; status?: string | null;
      photo_approved?: boolean | null; ambassador_photo_url?: string | null;
      city?: string | null; state?: string | null;
    } | null;
    const status = String(ambassador?.status || "").toLowerCase();
    // A still-active code may outlive an archived person; preserve visitor attribution,
    // but don't display an archived person as an active SitGuru representative.
    isPublicAmbassador = Boolean(ambassador && !["archived","inactive","suspended","rejected","paused"].includes(status));
    if (isPublicAmbassador && ambassador) {
      displayName = ambassador.display_name || ambassador.full_name || displayName;
      portraitUrl = ambassador.photo_approved ? ambassador.ambassador_photo_url || null : null;
      region = [ambassador.city, ambassador.state].filter(Boolean).join(", ");
    }
  }
  if (row.partner_id) {
    const { data } = await supabaseAdmin.from("partners")
      .select("business_name,status,slug,city,state").eq("id", row.partner_id).maybeSingle();
    const partner = data as { business_name?: string | null; status?: string | null; slug?: string | null; city?: string | null; state?: string | null } | null;
    partnerStatus = partner?.status || null;
    partnerSlug = partner?.slug || null;
    displayName = partner?.business_name || displayName;
    region = [partner?.city, partner?.state].filter(Boolean).join(", ");
    if (partnerStatus !== "active") return null;
  }

  return {
    id: row.id, code: row.code, slug: row.slug,
    ownerType: row.owner_type || (row.partner_id ? "partner" : row.ambassador_id ? "ambassador" : "general"),
    partnerId: row.partner_id, ambassadorId: row.ambassador_id,
    displayName: displayName || (row.ambassador_id ? "SitGuru Ambassador" : "SitGuru Community"),
    portraitUrl, partnerStatus, partnerSlug, region, isPublicAmbassador,
  };
}

export function referralCampaign(referral: PublicReferral): string {
  return referral.partnerId ? "partner_referral" :
    referral.ambassadorId ? "ambassador_referral" : "community_referral";
}

export function referralSignupUrl(referral: PublicReferral, role: "pet_parent" | "guru", tracking: {
  medium: string; source: string; campaign: string;
}): string {
  const params = new URLSearchParams({
    role, type: role, ref: referral.code,
    source: tracking.source, medium: tracking.medium,
    campaign: tracking.campaign, program: referral.partnerId ? "partner" : referral.ambassadorId ? "ambassador" : "referral",
    utm_source: tracking.source, utm_medium: tracking.medium, utm_campaign: tracking.campaign,
    next: role === "guru" ? "/guru/dashboard" : "/customer/dashboard",
  });
  if (referral.ambassadorId) params.set("ambassador_referral_code", referral.code);
  return "/signup?" + params.toString();
}
