"use server";

import { revalidatePath } from "next/cache";
import { requireEventHostPartnerAccount } from "@/lib/community/partner-access";
import {
  autosavePartnerEventWithAccess,
  cancelPartnerEventWithAccess,
  createPartnerEventDraftWithAccess,
  createPartnerEventSeriesWithAccess,
  deletePartnerEventDraftWithAccess,
  duplicatePartnerEventWithAccess,
  submitPartnerEventForReviewWithAccess,
} from "@/lib/community/partner-event-mutations";
import type { RecurrenceRule } from "@/lib/community/recurring";
import type { CommunityEventDraftInput } from "@/lib/community/types";

function revalidatePartnerEventPaths(eventId?: string, slug?: string) {
  revalidatePath("/partners/dashboard/community/events");
  revalidatePath("/admin/community/events");
  if (eventId) {
    revalidatePath(`/partners/dashboard/community/events/${eventId}/edit`);
  }
  if (slug) {
    revalidatePath(`/community/events/${slug}`);
  }
}

export async function createPartnerEventDraft(input: CommunityEventDraftInput = {}) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.partner || !access.userId) {
    return { ok: false as const, error: access.error || "Partner access required." };
  }

  const result = await createPartnerEventDraftWithAccess(
    { userId: access.userId, partner: access.partner },
    input,
  );

  if (result.ok) {
    revalidatePartnerEventPaths();
  }

  return result;
}

export async function autosavePartnerEvent(eventId: string, input: CommunityEventDraftInput) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.partner || !access.userId) {
    return { ok: false as const, error: access.error || "Partner access required." };
  }

  const result = await autosavePartnerEventWithAccess(
    { userId: access.userId, partner: access.partner },
    eventId,
    input,
  );

  if (result.ok) {
    revalidatePartnerEventPaths(eventId, result.event.slug);
  }

  return result;
}

export async function submitPartnerEventForReview(eventId: string) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.partner || !access.userId) {
    return { ok: false as const, error: access.error || "Partner access required." };
  }

  const result = await submitPartnerEventForReviewWithAccess(
    { userId: access.userId, partner: access.partner },
    eventId,
  );

  if (result.ok) {
    revalidatePartnerEventPaths(eventId);
  }

  return result;
}

export async function cancelPartnerEvent(eventId: string) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.partner || !access.userId) {
    return { ok: false as const, error: access.error || "Partner access required." };
  }

  const result = await cancelPartnerEventWithAccess(
    { userId: access.userId, partner: access.partner },
    eventId,
  );

  if (result.ok) {
    revalidatePartnerEventPaths(eventId, result.event.slug);
  }

  return result;
}

export async function duplicatePartnerEvent(eventId: string) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.partner || !access.userId) {
    return { ok: false as const, error: access.error || "Partner access required." };
  }

  const result = await duplicatePartnerEventWithAccess(
    { userId: access.userId, partner: access.partner },
    eventId,
  );

  if (result.ok) {
    revalidatePartnerEventPaths();
  }

  return result;
}

export async function deletePartnerEventDraft(eventId: string) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.partner || !access.userId) {
    return { ok: false as const, error: access.error || "Partner access required." };
  }

  const result = await deletePartnerEventDraftWithAccess(
    { userId: access.userId, partner: access.partner },
    eventId,
  );

  if (result.ok) {
    revalidatePartnerEventPaths();
  }

  return result;
}

export async function createPartnerEventSeries(
  eventId: string,
  rule: RecurrenceRule,
  count: number,
) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.partner || !access.userId) {
    return { ok: false as const, error: access.error || "Partner access required." };
  }

  const result = await createPartnerEventSeriesWithAccess(
    { userId: access.userId, partner: access.partner },
    eventId,
    rule,
    count,
  );

  if (result.ok) {
    revalidatePartnerEventPaths();
  }

  return result;
}
