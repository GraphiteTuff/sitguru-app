import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { notifyPartnerSubmission } from "./notifications";
import type { ReadsPartnerSubmissionInput } from "./types";

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;

function hashIp(ip: string | null | undefined) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitReadsPartnerInquiry(
  input: ReadsPartnerSubmissionInput,
  meta?: { ip?: string | null; userAgent?: string | null },
) {
  if (!input.name?.trim()) throw new Error("Name is required.");
  if (!isValidEmail(String(input.email || ""))) {
    throw new Error("A valid email is required.");
  }
  if (!input.partner_type) throw new Error("Partner type is required.");
  if (!input.permission_agreed || !input.privacy_acknowledged) {
    throw new Error("Permission and privacy acknowledgement are required.");
  }

  // Turnstile when configured; allow local/dev without secret.
  if (process.env.TURNSTILE_SECRET_KEY) {
    const token = String(input.turnstileToken || "");
    const verified = await verifyTurnstileToken({
      token,
      remoteIp: meta?.ip,
      expectedAction: "reads_partner",
    });
    if (!verified.success) {
      throw new Error(verified.message || "Spam protection failed.");
    }
  }

  const ipHash = hashIp(meta?.ip);
  if (ipHash) {
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count } = await supabaseAdmin
      .from("reads_partner_submissions")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count || 0) >= RATE_LIMIT) {
      throw new Error("Too many submissions. Please try again later.");
    }
  }

  const { data: submission, error } = await supabaseAdmin
    .from("reads_partner_submissions")
    .insert({
      name: input.name.trim(),
      organization: input.organization?.trim() || null,
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      partner_type: input.partner_type,
      website: input.website?.trim() || null,
      social_links: input.social_links || {},
      work_title: input.work_title?.trim() || null,
      description: input.description?.trim() || null,
      topics: input.topics || [],
      publication_date: input.publication_date || null,
      publisher: input.publisher || null,
      isbn: input.isbn || null,
      interested_interview: Boolean(input.interested_interview),
      interested_giveaway: Boolean(input.interested_giveaway),
      review_copy_available: Boolean(input.review_copy_available),
      interested_social: Boolean(input.interested_social),
      interested_partnership: Boolean(input.interested_partnership),
      message: input.message?.trim() || null,
      permission_agreed: true,
      privacy_acknowledged: true,
      status: "new",
      ip_hash: ipHash,
      user_agent: meta?.userAgent?.slice(0, 300) || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { data: partner, error: partnerError } = await supabaseAdmin
    .from("reads_partners")
    .insert({
      name: input.name.trim(),
      organization: input.organization?.trim() || null,
      partner_type: input.partner_type,
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      website: input.website?.trim() || null,
      social_links: input.social_links || {},
      status: "new",
      topics: input.topics || [],
      notes_private: input.message?.trim() || null,
    })
    .select("id")
    .single();

  if (!partnerError && partner?.id) {
    await supabaseAdmin
      .from("reads_partner_submissions")
      .update({ partner_id: partner.id })
      .eq("id", submission.id);

    await supabaseAdmin.from("reads_partner_activity").insert({
      partner_id: partner.id,
      activity_type: "submission_received",
      note: "Public Reads partner form submission",
      metadata: { submission_id: submission.id },
    });
  }

  await notifyPartnerSubmission({
    submissionId: submission.id,
    name: input.name.trim(),
    partnerType: input.partner_type,
  });

  // Never return email/phone to callers beyond acknowledgement.
  return { ok: true, id: submission.id };
}

export async function updatePartnerPipeline(
  partnerId: string,
  input: {
    status?: string;
    notes_private?: string;
    escalated_to_admin?: boolean;
    escalation_reason?: string;
    actorId?: string;
    actorEmail?: string;
  },
) {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.status) update.status = input.status;
  if (typeof input.notes_private === "string") {
    update.notes_private = input.notes_private;
  }
  if (typeof input.escalated_to_admin === "boolean") {
    update.escalated_to_admin = input.escalated_to_admin;
  }
  if (input.escalation_reason) {
    update.escalation_reason = input.escalation_reason;
  }

  const { error } = await supabaseAdmin
    .from("reads_partners")
    .update(update)
    .eq("id", partnerId);
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("reads_partner_activity").insert({
    partner_id: partnerId,
    actor_id: input.actorId || null,
    actor_email: input.actorEmail || null,
    activity_type: input.escalated_to_admin ? "escalated" : "status_update",
    note: input.escalation_reason || input.notes_private || null,
    metadata: { status: input.status || null },
  });

  if (input.escalated_to_admin) {
    await notifyPartnerSubmission({
      submissionId: partnerId,
      name: "Partner",
      partnerType: "escalation",
      escalated: true,
    });
  }

  return { ok: true };
}

/** Public-safe partner list — strips email/phone. */
export function sanitizePartnerForPublic(partner: Record<string, unknown>) {
  const safe = { ...partner };
  delete safe.email;
  delete safe.phone;
  delete safe.notes_private;
  return safe;
}
