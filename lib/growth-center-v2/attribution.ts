import { supabaseAdmin } from "@/lib/supabase/admin";
import { publishGrowthCenterUpdate } from "./publish";

type Tracking = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  referralCode?: string | null;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Idempotent first-party signup attribution into growth_campaign_events.
 * Only writes when campaign tracking evidence exists.
 */
export async function recordGrowthSignupAttribution(input: {
  userId: string;
  profileId?: string | null;
  guruId?: string | null;
  role: "pet_parent" | "guru" | "ambassador" | string;
  tracking?: Tracking | null;
  actorUserId?: string | null;
}) {
  const tracking = input.tracking || {};
  const campaignSlug =
    text(tracking.utmCampaign) || text(tracking.campaign) || "";
  const source = text(tracking.utmSource) || text(tracking.source) || "";
  const medium = text(tracking.utmMedium) || text(tracking.medium) || "";
  const referralCode = text(tracking.referralCode);

  if (!campaignSlug && !referralCode && !source) {
    // Still publish refresh for first-party registration KPIs.
    await publishGrowthCenterUpdate({
      actorUserId: input.actorUserId || input.userId,
      eventType: "growth_registration",
      entityId: input.userId,
      recipientUserIds: [input.actorUserId || input.userId],
    });
    return { recorded: false, reason: "no_attribution_evidence" as const };
  }

  const idempotencyKey = `signup:${input.userId}:${campaignSlug || referralCode || source}`;

  try {
    const { data: existing } = await supabaseAdmin
      .from("growth_campaign_events")
      .select("id")
      .contains("metadata", { idempotency_key: idempotencyKey })
      .limit(1);
    if (existing?.length) {
      return { recorded: false, reason: "duplicate" as const };
    }
  } catch {
    // continue — older schemas may not support contains filter cleanly
  }

  let campaignId: string | null = null;
  let campaignName = campaignSlug || referralCode || source;
  if (campaignSlug) {
    const { data } = await supabaseAdmin
      .from("growth_campaigns")
      .select("id,campaign_name,campaign_slug")
      .eq("campaign_slug", campaignSlug)
      .limit(1)
      .maybeSingle();
    if (data) {
      campaignId = text((data as { id?: string }).id) || null;
      campaignName =
        text((data as { campaign_name?: string }).campaign_name) || campaignName;
    }
  }

  const payload = {
    campaign_id: campaignId,
    campaign_name: campaignName,
    campaign_slug: campaignSlug || null,
    event_type: "signup",
    source: source || "sitguru",
    medium: medium || "registration",
    user_id: input.userId,
    profile_id: input.profileId || null,
    guru_id: input.guruId || null,
    referral_code: referralCode || null,
    metadata: {
      idempotency_key: idempotencyKey,
      role: input.role,
      utm_content: text(tracking.utmContent) || null,
      attribution: "last_touch_registration",
    },
  };

  const { error } = await supabaseAdmin.from("growth_campaign_events").insert(payload);
  if (error) {
    console.warn("Growth signup attribution insert failed:", error.message);
    return { recorded: false, reason: "insert_failed" as const };
  }

  await publishGrowthCenterUpdate({
    actorUserId: input.actorUserId || input.userId,
    eventType: "growth_registration",
    entityId: input.userId,
    recipientUserIds: [input.actorUserId || input.userId],
  });

  return { recorded: true, reason: "ok" as const };
}
