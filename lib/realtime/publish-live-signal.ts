import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  NOTIFY_WORTHY_EVENTS,
  type LiveSignalScope,
  type SitGuruDomainEvent,
} from "@/lib/realtime/events";
import { stableEventId as hashStableEventId, uniqueUserIds } from "@/lib/realtime/pure";

export type PublishLiveSignalInput = {
  eventType: SitGuruDomainEvent | string;
  recipientUserIds: Array<string | null | undefined>;
  resourceType?: string;
  resourceId?: string;
  scope?: LiveSignalScope | string;
  paths?: string[];
  actorUserId?: string | null;
  /** Display label for audit — never the View-As target. */
  actorLabel?: string;
  resourceVersion?: string;
  /**
   * Stable idempotency key. Retries with the same eventId + recipient
   * do not insert duplicates (req 99).
   */
  eventId?: string;
  /** When true, also insert a lightweight in-app notification for recipients ≠ actor. */
  notify?: boolean;
  notifyTitle?: string;
  notifyBody?: string;
  notifyHref?: string;
  /** Server path revalidation for the mutating request (same-session). */
  revalidatePaths?: string[];
};

function buildEventId(input: PublishLiveSignalInput): string {
  if (input.eventId?.trim()) return input.eventId.trim();
  return hashStableEventId([
    input.eventType,
    input.resourceType || "",
    input.resourceId || "",
    input.resourceVersion || "",
    input.actorUserId || "",
    randomUUID(),
  ]);
}

/**
 * Publish authorized live-sync signals after an authoritative mutation.
 * Persistence of business data must already have succeeded — signals are sync only (req 104).
 */
export async function publishLiveSignals(
  input: PublishLiveSignalInput,
): Promise<{ eventId: string; recipientCount: number }> {
  const recipients = uniqueUserIds(input.recipientUserIds);
  const eventId = buildEventId(input);

  for (const path of input.revalidatePaths || []) {
    if (path) revalidatePath(path);
  }

  if (!recipients.length) {
    return { eventId, recipientCount: 0 };
  }

  const rows = recipients.map((recipientUserId) => ({
    event_id: eventId,
    recipient_user_id: recipientUserId,
    event_type: input.eventType,
    resource_type: input.resourceType || "",
    resource_id: input.resourceId || "",
    scope: input.scope || "workspace",
    paths: input.paths || [],
    actor_user_id: input.actorUserId || null,
    actor_label: input.actorLabel || "",
    resource_version: input.resourceVersion || "",
  }));

  const { error } = await supabaseAdmin
    .from("sitguru_live_signals")
    .upsert(rows, { onConflict: "event_id,recipient_user_id", ignoreDuplicates: true });

  if (error) {
    // Sync must never roll back the authoritative write.
    console.warn("[realtime] publishLiveSignals", error.message);
  }

  const shouldNotify =
    input.notify === true ||
    (input.notify !== false &&
      NOTIFY_WORTHY_EVENTS.has(input.eventType as SitGuruDomainEvent) &&
      Boolean(input.notifyTitle));

  if (shouldNotify && input.notifyTitle) {
    const notifyRecipients = recipients.filter(
      (id) => id !== input.actorUserId,
    );
    if (notifyRecipients.length) {
      const href = input.notifyHref || input.paths?.[0] || "/intern";
      const now = new Date().toISOString();
      const { error: notifyError } = await supabaseAdmin.from("notifications").insert(
        notifyRecipients.map((userId) => ({
          user_id: userId,
          title: input.notifyTitle,
          body: input.notifyBody || "",
          type: `workspace:${input.eventType}`,
          href,
          link: href,
          is_read: false,
          created_at: now,
        })),
      );
      if (notifyError) {
        console.warn("[realtime] notify", notifyError.message);
      }
    }
  }

  return { eventId, recipientCount: recipients.length };
}

export { hashStableEventId as stableEventId };
