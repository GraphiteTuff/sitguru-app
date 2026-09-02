"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireGrowthPortal } from "@/lib/admin/growth/access";
import {
  GROWTH_CAMPAIGN_STATUSES,
  GROWTH_CONTENT_STATUSES,
  channelLabel,
  kindMeta,
} from "@/lib/admin/growth/constants";
import {
  resolveDestination,
  uniqueCampaignSlug,
} from "@/lib/admin/growth/data";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

async function writeGrowthAudit(input: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: input.actorId,
      actor_email: input.actorEmail,
      action: input.action,
      area: "growth",
      target_type: input.targetType,
      target_id: input.targetId,
      metadata: input.metadata || {},
    });
  } catch (error) {
    console.warn("Growth audit skipped:", error);
  }
}

function refreshGrowth() {
  revalidatePath("/admin/growth");
  revalidatePath("/admin/growth/campaigns");
  revalidatePath("/admin/growth/content");
  revalidatePath("/admin/growth/media");
  revalidatePath("/admin/growth/analytics");
}

export async function createGrowthWork(formData: FormData) {
  const access = await requireGrowthPortal();
  if (!access.ok) return { ok: false, error: "Not allowed." };

  const kind = field(formData, "kind") || "post";
  const title = field(formData, "title");
  const channel = field(formData, "channel") || "instagram";
  const market = field(formData, "market");
  const caption = field(formData, "caption");
  const destination = field(formData, "destination");
  const sourceHref = field(formData, "sourceHref");
  const plannedDate = field(formData, "plannedDate");

  if (!title) return { ok: false, error: "Add a title." };

  const slug = await uniqueCampaignSlug(`${title}-${channel}`);
  const dest = destination || resolveDestination(kind, sourceHref || undefined);
  const meta = kindMeta(kind);

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("growth_campaigns")
    .insert({
      campaign_name: title,
      campaign_slug: slug,
      channel,
      campaign_type: kind,
      source: channel,
      medium: "social",
      utm_source: channel,
      utm_medium: "social",
      utm_campaign: slug,
      target_audience: meta.label,
      target_location: market || null,
      destination_url: dest,
      status: "active",
      notes: caption || null,
    })
    .select("id,campaign_slug")
    .single();

  if (campaignError || !campaign) {
    return {
      ok: false,
      error: campaignError?.message || "Could not create the campaign.",
    };
  }

  const { error: contentError } = await supabaseAdmin
    .from("admin_marketing_content_calendar")
    .insert({
      title,
      platform: channelLabel(channel),
      audience: kind === "guru" ? "Pet Parents" : "Mixed",
      campaign: title,
      status: access.actor.isSuperUser ? "Ready" : "Draft",
      planned_date: plannedDate || null,
      caption_direction: caption || null,
      owner_name: access.actor.email,
    });

  if (contentError) {
    console.warn("Growth content insert skipped:", contentError);
  }

  await writeGrowthAudit({
    actorId: access.actor.id,
    actorEmail: access.actor.email,
    action: "created campaign",
    targetType: "growth_campaign",
    targetId: campaign.id,
    metadata: { slug, kind, channel },
  });

  refreshGrowth();
  return { ok: true, campaignId: campaign.id, slug };
}

export async function updateGrowthCampaignStatus(formData: FormData) {
  const access = await requireGrowthPortal();
  if (!access.ok) return { ok: false, error: "Not allowed." };

  const id = field(formData, "id");
  const status = field(formData, "status").toLowerCase();
  if (!id || !GROWTH_CAMPAIGN_STATUSES.includes(status as (typeof GROWTH_CAMPAIGN_STATUSES)[number])) {
    return { ok: false, error: "Invalid campaign." };
  }

  const { error } = await supabaseAdmin
    .from("growth_campaigns")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await writeGrowthAudit({
    actorId: access.actor.id,
    actorEmail: access.actor.email,
    action: "updated campaign",
    targetType: "growth_campaign",
    targetId: id,
    metadata: { status },
  });

  refreshGrowth();
  return { ok: true };
}

export async function updateGrowthContentStatus(formData: FormData) {
  const access = await requireGrowthPortal();
  if (!access.ok) return { ok: false, error: "Not allowed." };

  const id = field(formData, "id");
  const status = field(formData, "status");
  if (!id || !GROWTH_CONTENT_STATUSES.includes(status as (typeof GROWTH_CONTENT_STATUSES)[number])) {
    return { ok: false, error: "Invalid content." };
  }

  if (status === "Ready" && !access.actor.isSuperUser) {
    return { ok: false, error: "Only Super Admins can approve." };
  }

  const { error } = await supabaseAdmin
    .from("admin_marketing_content_calendar")
    .update({
      status,
      ceo_review: status === "Ready" ? "Approved" : status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await writeGrowthAudit({
    actorId: access.actor.id,
    actorEmail: access.actor.email,
    action: status === "Ready" ? "approved content" : "updated content",
    targetType: "growth_content",
    targetId: id,
    metadata: { status },
  });

  refreshGrowth();
  return { ok: true };
}

export async function saveGrowthMedia(formData: FormData) {
  const access = await requireGrowthPortal();
  if (!access.ok) return { ok: false, error: "Not allowed." };

  const title = field(formData, "title");
  const source = field(formData, "source");
  if (!title || !source) return { ok: false, error: "Add a title and a Canva or CapCut link." };

  const { data, error } = await supabaseAdmin
    .from("admin_marketing_proof_library")
    .insert({
      title,
      proof_type: field(formData, "proofType") || "Link",
      source,
      status: "Collected",
      campaign_use: field(formData, "campaignUse") || null,
      suggested_use: field(formData, "suggestedUse") || null,
      notes: field(formData, "notes") || null,
      owner_name: access.actor.email,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await writeGrowthAudit({
    actorId: access.actor.id,
    actorEmail: access.actor.email,
    action: "uploaded media",
    targetType: "growth_media",
    targetId: data?.id || title,
    metadata: { title },
  });

  refreshGrowth();
  return { ok: true };
}

export async function submitFridayReport(formData: FormData) {
  const access = await requireGrowthPortal();
  if (!access.ok) return { ok: false, error: "Not allowed." };

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  const { error } = await supabaseAdmin.from("admin_marketing_weekly_reviews").insert({
    week_start: weekStart.toISOString().slice(0, 10),
    week_end: today.toISOString().slice(0, 10),
    week_label: field(formData, "weekLabel") || "This week",
    theme: field(formData, "best") || "Social growth",
    status: "submitted",
    best_content_reaction: field(formData, "best"),
    warmest_outreach: field(formData, "posts"),
    needs_next_week: field(formData, "next"),
    blocked_by: field(formData, "worst"),
    submitted_by: access.actor.email,
  });

  if (error) return { ok: false, error: error.message };

  await writeGrowthAudit({
    actorId: access.actor.id,
    actorEmail: access.actor.email,
    action: "submitted friday report",
    targetType: "growth_report",
    targetId: access.actor.id,
  });

  refreshGrowth();
  return { ok: true };
}

export async function updateGrowthCampaignStatusAction(formData: FormData) {
  await updateGrowthCampaignStatus(formData);
}

export async function updateGrowthContentStatusAction(formData: FormData) {
  await updateGrowthContentStatus(formData);
}

export async function saveGrowthMediaAction(formData: FormData) {
  await saveGrowthMedia(formData);
}

export async function submitFridayReportAction(formData: FormData) {
  await submitFridayReport(formData);
}
