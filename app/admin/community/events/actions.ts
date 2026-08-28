"use server";

import {
  notifyAttendeesEventCancelled,
  notifyPartnerChangesRequested,
  notifyPartnerEventPublished,
} from "@/lib/community/event-notifications";
import {
  autosaveAdminCommunityEvent,
  createAdminCommunityEvent,
  createAdminEventSeries,
  publishAdminCommunityEvent,
  saveAdminFeaturedSettings,
} from "@/lib/community/admin-event-mutations";
import {
  cancelRecurringSeriesChildren,
  publishRecurringSeriesChildren,
} from "@/lib/community/recurring";
import { requireAdminApi } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CommunityEventStatus, CommunityEventDraftInput } from "@/lib/community/types";
import type { RecurrenceRule } from "@/lib/community/recurring";
import { revalidatePath } from "next/cache";

type ModerationAction =
  | "approve"
  | "publish"
  | "request_changes"
  | "reject"
  | "unpublish"
  | "cancel"
  | "archive";

function cleanText(value: unknown, max = 2000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function revalidateCommunityEventPaths(eventId: string, slug?: string) {
  revalidatePath("/admin/community/events");
  revalidatePath("/admin/community/events/featured");
  revalidatePath(`/admin/community/events/${eventId}`);
  revalidatePath(`/admin/community/events/${eventId}/edit`);
  revalidatePath("/partners/dashboard/community/events");
  revalidatePath("/community/events");
  revalidatePath("/community");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/community/events/${slug}`);
  }
}

export async function createAdminEventDraft(input: {
  partnerId: string;
  draft?: CommunityEventDraftInput;
}) {
  const admin = await requireAdminApi();

  if (!admin.identity) {
    return { ok: false as const, error: "Admin access required." };
  }

  const result = await createAdminCommunityEvent({
    partnerId: input.partnerId,
    createdBy: admin.identity.id,
    draft: input.draft,
  });

  if (result.ok) {
    revalidateCommunityEventPaths(result.event.id, result.event.slug);
  }

  return result;
}

export async function autosaveAdminEvent(eventId: string, input: CommunityEventDraftInput) {
  const admin = await requireAdminApi();

  if (!admin.identity) {
    return { ok: false as const, error: "Admin access required." };
  }

  const result = await autosaveAdminCommunityEvent(eventId, input);

  if (result.ok) {
    revalidateCommunityEventPaths(eventId, result.event.slug);
  }

  return result;
}

export async function publishAdminEvent(input: {
  eventId: string;
  note?: string;
  publishSeries?: boolean;
}) {
  const admin = await requireAdminApi();

  if (!admin.identity) {
    return { ok: false as const, error: "Admin access required." };
  }

  const result = await publishAdminCommunityEvent({
    eventId: input.eventId,
    adminUserId: admin.identity.id,
    note: input.note,
    publishSeries: input.publishSeries,
  });

  if (result.ok) {
    revalidateCommunityEventPaths(input.eventId, result.event.slug);
  }

  return result;
}

export async function createAdminEventSeriesAction(
  eventId: string,
  rule: RecurrenceRule,
  count: number,
) {
  const admin = await requireAdminApi();

  if (!admin.identity) {
    return { ok: false as const, error: "Admin access required." };
  }

  const result = await createAdminEventSeries(eventId, rule, count);

  if (result.ok) {
    revalidateCommunityEventPaths(eventId);
  }

  return result;
}

export async function saveCommunityEventFeaturedSettings(input: {
  eventId: string;
  featuredStatus: string;
  featuredPriority: number;
  featuredStartAt?: string | null;
  featuredEndAt?: string | null;
  featuredMarketCity?: string | null;
  featuredMarketState?: string | null;
}) {
  const admin = await requireAdminApi();

  if (!admin.identity) {
    return { ok: false as const, error: "Admin access required." };
  }

  const result = await saveAdminFeaturedSettings({
    ...input,
    adminUserId: admin.identity.id,
  });

  if (result.ok) {
    revalidateCommunityEventPaths(input.eventId, result.event.slug);
  }

  return result;
}

export async function moderateCommunityEvent(input: {
  eventId: string;
  action: ModerationAction;
  note?: string;
  featuredStatus?: string;
  featuredPriority?: number;
  featuredStartAt?: string | null;
  featuredEndAt?: string | null;
  featuredMarketCity?: string | null;
  featuredMarketState?: string | null;
  publishSeries?: boolean;
}) {
  const admin = await requireAdminApi();

  if (!admin.identity) {
    return { ok: false as const, error: "Admin access required." };
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("community_events")
    .select("*")
    .eq("id", input.eventId)
    .maybeSingle();

  if (existingError || !existing) {
    return { ok: false as const, error: "Event not found." };
  }

  const now = new Date().toISOString();
  const note = cleanText(input.note);

  let status: CommunityEventStatus = existing.status;
  const patch: Record<string, unknown> = {
    moderated_by: admin.identity.id,
    moderated_at: now,
  };

  switch (input.action) {
    case "approve":
      status = "approved";
      patch.moderation_note = note || null;
      break;
    case "publish":
      status = "published";
      patch.published_at = now;
      patch.moderation_note = note || null;
      break;
    case "request_changes":
      status = "changes_requested";
      patch.moderation_note = note || "Please review and update your event.";
      break;
    case "reject":
      status = "archived";
      patch.moderation_note = note || "This event was not approved.";
      break;
    case "unpublish":
      status = "approved";
      patch.published_at = null;
      break;
    case "cancel":
      status = "cancelled";
      patch.cancelled_at = now;
      break;
    case "archive":
      status = "archived";
      break;
    default:
      return { ok: false as const, error: "Unknown moderation action." };
  }

  patch.status = status;

  if (input.featuredStatus !== undefined) {
    patch.featured_status = input.featuredStatus;
  }

  if (input.featuredPriority !== undefined) {
    patch.featured_priority = input.featuredPriority;
  }

  if (input.featuredStartAt !== undefined) {
    patch.featured_start_at = input.featuredStartAt;
  }

  if (input.featuredEndAt !== undefined) {
    patch.featured_end_at = input.featuredEndAt;
  }

  if (input.featuredMarketCity !== undefined) {
    patch.featured_market_city = input.featuredMarketCity;
  }

  if (input.featuredMarketState !== undefined) {
    patch.featured_market_state = input.featuredMarketState;
  }

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .update(patch)
    .eq("id", input.eventId)
    .select("*")
    .single();

  if (error) {
    console.error("moderateCommunityEvent:", error);
    return { ok: false as const, error: error.message || "Unable to update event." };
  }

  if (input.action === "publish" && data.is_series_parent && input.publishSeries !== false) {
    await publishRecurringSeriesChildren(data.id, admin.identity.id);
  }

  if (input.action === "cancel" && data.is_series_parent) {
    await cancelRecurringSeriesChildren(data.id);
  }

  try {
    if (input.action === "publish") {
      await notifyPartnerEventPublished({
        id: data.id,
        title: data.title,
        slug: data.slug,
        partner_id: data.partner_id,
      });
    }

    if (input.action === "request_changes") {
      await notifyPartnerChangesRequested({
        id: data.id,
        title: data.title,
        slug: data.slug,
        partner_id: data.partner_id,
        moderation_note: data.moderation_note,
      });
    }

    if (input.action === "cancel") {
      await notifyAttendeesEventCancelled({
        id: data.id,
        title: data.title,
        slug: data.slug,
        partner_id: data.partner_id,
      });
    }
  } catch (notifyError) {
    console.warn("Community event notification skipped:", notifyError);
  }

  revalidateCommunityEventPaths(input.eventId, data.slug);

  return { ok: true as const, event: data };
}

export async function adminUpdateCommunityEvent(
  eventId: string,
  patch: Record<string, unknown>,
) {
  const admin = await requireAdminApi();

  if (!admin.identity) {
    return { ok: false as const, error: "Admin access required." };
  }

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .update(patch)
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    return { ok: false as const, error: error.message || "Unable to update event." };
  }

  revalidateCommunityEventPaths(eventId, data.slug);

  return { ok: true as const, event: data };
}
