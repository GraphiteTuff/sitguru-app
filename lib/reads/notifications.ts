import { dispatchNotification } from "@/lib/notifications";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_READS_BASE,
  INTERN_READS_BASE,
  MANAGER_READS_BASE,
} from "./constants";

type WorkflowNotifyInput = {
  action: string;
  contentTitle: string;
  contentId: string;
  actorEmail: string;
  note?: string;
  createdBy?: string | null;
  assignedManagerId?: string | null;
};

async function resolveManagerUserIds() {
  const { data } = await supabaseAdmin
    .from("admin_user_access")
    .select("user_id,email,role_key")
    .eq("is_active", true)
    .in("role_key", [
      "growth_manager",
      "marketing_manager",
      "marketing_admin",
      "founder",
      "owner",
      "super_admin",
    ])
    .limit(20);

  return (data || [])
    .map((row) => row.user_id)
    .filter(Boolean) as string[];
}

export async function notifyReadsWorkflow(input: WorkflowNotifyInput) {
  const recipients = new Set<string>();

  if (input.action === "submitted") {
    for (const id of await resolveManagerUserIds()) recipients.add(id);
    if (input.assignedManagerId) recipients.add(input.assignedManagerId);
  }

  if (
    ["changes_requested", "approved", "scheduled", "published"].includes(
      input.action,
    ) &&
    input.createdBy
  ) {
    recipients.add(input.createdBy);
  }

  const copy: Record<string, { title: string; body: string; href: string }> = {
    submitted: {
      title: "Reads content submitted",
      body: `${input.actorEmail} submitted “${input.contentTitle}” for review.`,
      href: `${MANAGER_READS_BASE}?tab=content`,
    },
    changes_requested: {
      title: "Changes requested",
      body: `Updates requested on “${input.contentTitle}”. ${input.note || ""}`.trim(),
      href: `${INTERN_READS_BASE}?tab=changes`,
    },
    approved: {
      title: "Reads content approved",
      body: `“${input.contentTitle}” was approved.`,
      href: `${INTERN_READS_BASE}?tab=published`,
    },
    scheduled: {
      title: "Reads content scheduled",
      body: `“${input.contentTitle}” is scheduled for publication.`,
      href: `${MANAGER_READS_BASE}?tab=calendar`,
    },
    published: {
      title: "Reads content published",
      body: `“${input.contentTitle}” is now live on SitGuru Reads & Listen.`,
      href: `/reads`,
    },
  };

  const message = copy[input.action];
  if (!message || recipients.size === 0) return;

  await Promise.allSettled(
    [...recipients].map((userId) =>
      dispatchNotification({
        userId,
        title: message.title,
        body: message.body,
        type: `reads_${input.action}`,
        href: message.href,
        metadata: {
          contentId: input.contentId,
          actorEmail: input.actorEmail,
        },
        channels: ["in_app"],
      }),
    ),
  );
}

export async function notifyPartnerSubmission(params: {
  submissionId: string;
  name: string;
  partnerType: string;
  escalated?: boolean;
}) {
  const managers = await resolveManagerUserIds();
  const href = params.escalated
    ? `${ADMIN_READS_BASE}?tab=escalations`
    : `${MANAGER_READS_BASE}?tab=partnerships`;

  await Promise.allSettled(
    managers.map((userId) =>
      dispatchNotification({
        userId,
        title: params.escalated
          ? "Reads partnership escalated"
          : "New Reads partner submission",
        body: `${params.name} (${params.partnerType}) submitted a Reads partnership inquiry.`,
        type: params.escalated
          ? "reads_partner_escalated"
          : "reads_partner_submission",
        href,
        metadata: { submissionId: params.submissionId },
        channels: ["in_app"],
      }),
    ),
  );
}
