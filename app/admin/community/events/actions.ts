"use server";

import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CommunityEventStatus } from "@/lib/community/types";

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

  revalidatePath("/admin/community/events");
  revalidatePath(`/admin/community/events/${input.eventId}`);
  revalidatePath("/partners/dashboard/community/events");
  revalidatePath(`/community/events/${data.slug}`);
  revalidatePath("/");
  revalidatePath("/community/events");

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

  revalidatePath("/admin/community/events");
  revalidatePath(`/admin/community/events/${eventId}`);
  revalidatePath(`/community/events/${data.slug}`);
  revalidatePath("/");

  return { ok: true as const, event: data };
}
