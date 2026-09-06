import { loadMarketDensity } from "@/lib/admin/load-market-density";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  emptyInternSocialCounts,
  internCampaignMatchesClick,
  internSocialPlatformFromText,
  type InternSafeKpiSnapshot,
} from "@/lib/internship/intern-kpis";
import type { InternshipCampaign } from "@/lib/internship/types";

type CountFilter = {
  column: string;
  operator: "eq" | "in";
  value: string | boolean | string[];
};

async function safeCount(table: string, filters: CountFilter[] = []) {
  try {
    let query = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
    for (const filter of filters) {
      if (filter.operator === "eq") query = query.eq(filter.column, filter.value);
      if (filter.operator === "in" && Array.isArray(filter.value)) {
        query = query.in(filter.column, filter.value);
      }
    }
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function isAssignedMarket(input: {
  state?: string | null;
  city?: string | null;
  label?: string | null;
  region?: string | null;
}) {
  const state = String(input.state || "").trim().toUpperCase();
  if (state === "PA" || state === "PENNSYLVANIA") return true;
  const hay = `${input.label || ""} ${input.city || ""} ${input.region || ""}`.toLowerCase();
  return /philadelphia|bucks|montgomery|abington|doylestown/.test(hay);
}

/** Intern-safe SitGuru counts: People totals + per-site tracking. No names, queues, or payouts. */
export async function loadInternSafeKpiSnapshot(input?: {
  region?: string | null;
  campaigns?: InternshipCampaign[];
  includeMarket?: boolean;
}): Promise<InternSafeKpiSnapshot> {
  const includeMarket = input?.includeMarket !== false;
  const [petParents, gurus, bookableGurus, ambassadors, density, clicks] = await Promise.all([
    safeCount("profiles", [{ column: "role", operator: "eq", value: "customer" }]),
    safeCount("gurus"),
    safeCount("gurus", [{ column: "is_public", operator: "eq", value: true }]),
    safeCount("ambassadors", [{ column: "status", operator: "eq", value: "active" }]),
    includeMarket ? loadMarketDensity().catch(() => null) : Promise.resolve(null),
    supabaseAdmin
      .from("referral_clicks")
      .select("utm_source, utm_medium, utm_campaign, landing_page")
      .then((result) => (result.error ? [] : result.data || []))
      .catch(() => []),
  ]);

  const social = emptyInternSocialCounts();
  const campaigns = input?.campaigns || [];

  for (const row of clicks as Array<Record<string, unknown>>) {
    const platform = internSocialPlatformFromText(
      String(row.utm_source || row.landing_page || ""),
    );
    if (!platform) continue;
    const medium = String(row.utm_medium || "").toLowerCase();
    const landing = String(row.landing_page || "").toLowerCase();
    const isQr = medium === "qr" || landing.includes("via=qr");
    if (isQr) social[platform].scans += 1;
    else social[platform].visits += 1;
    if (
      internCampaignMatchesClick(campaigns, {
        utmSource: String(row.utm_source || ""),
        utmCampaign: String(row.utm_campaign || ""),
      })
    ) {
      social[platform].attributed += 1;
    }
  }

  const marketPeople = { petParents: 0, gurus: 0, ambassadors: 0 };
  if (density?.markets?.length) {
    for (const market of density.markets) {
      if (
        !isAssignedMarket({
          state: market.state,
          city: market.city,
          label: market.label,
          region: input?.region,
        })
      ) {
        continue;
      }
      marketPeople.petParents += market.petParentCount;
      marketPeople.gurus += market.guruCount;
      marketPeople.ambassadors += market.ambassadorCount;
    }
  }

  return {
    marketLabel: String(input?.region || "").trim() || "Greater Philadelphia",
    people: {
      petParents,
      gurus,
      bookableGurus,
      ambassadors,
    },
    marketPeople,
    social,
    capturedAt: new Date().toISOString(),
  };
}

export function internSnapshotValues(snapshot: InternSafeKpiSnapshot) {
  return {
    "people.pet_parents": snapshot.people.petParents,
    "people.gurus": snapshot.people.gurus,
    "people.ambassadors": snapshot.people.ambassadors,
    "social.facebook": snapshot.social.facebook.visits + snapshot.social.facebook.scans,
    "social.instagram": snapshot.social.instagram.visits + snapshot.social.instagram.scans,
    "social.tiktok": snapshot.social.tiktok.visits + snapshot.social.tiktok.scans,
    "social.x": snapshot.social.x.visits + snapshot.social.x.scans,
    "social.youtube": snapshot.social.youtube.visits + snapshot.social.youtube.scans,
  } as const;
}
