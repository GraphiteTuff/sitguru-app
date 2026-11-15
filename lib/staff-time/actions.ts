"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isStaffTimeCategory } from "@/lib/staff-time/categories";
import {
  findEngagementById,
  listCompensationRates,
  resolveManagerEngagement,
} from "@/lib/staff-time/engagement";
import { parsePositiveHours, formatHours, formatUsdFromCents } from "@/lib/staff-time/money";
import { calculatePeriodTotals } from "@/lib/staff-time/rates";
import {
  ensurePaymentPeriod,
  listPeriodEntries,
  recalculatePeriod,
} from "@/lib/staff-time/queries";
import { canEditTimeEntry } from "@/lib/staff-time/status";
import { mapTimeEntry } from "@/lib/staff-time/mappers";
import {
  publishStaffTimeEvent,
  SITGURU_DOMAIN_EVENTS,
} from "@/lib/realtime/publish-staff-time";
import { isoToday } from "@/lib/staff-time/periods";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  const [base, existing] = path.split("?");
  const params = new URLSearchParams(existing || "");
  params.set(kind, message);
  redirect(`${base}?${params.toString()}`);
}

/** Manager Portal or Admin Growth — never arbitrary returnBase. */
function staffPortalBase(formData?: FormData) {
  const raw = formData ? text(formData, "returnBase") : "";
  return raw === "/manager" ? "/manager" : "/admin/growth";
}

function myTimeHome(formData?: FormData) {
  return `${staffPortalBase(formData)}/my-time`;
}

function paymentsHome(formData?: FormData) {
  return `${staffPortalBase(formData)}/payments`;
}

function refreshStaffPaths() {
  revalidatePath("/admin/growth", "layout");
  revalidatePath("/admin/growth/my-time");
  revalidatePath("/admin/growth/payments");
  revalidatePath("/manager", "layout");
  revalidatePath("/manager/my-time");
  revalidatePath("/manager/payments");
  revalidatePath("/admin/hr/people");
  revalidatePath("/admin/hr/people/payments");
  revalidatePath("/admin/hr");
  revalidatePath("/admin/financials/contractor-hours");
  revalidatePath("/admin/financials/contractor-payments");
  revalidatePath("/admin/action-center");
  revalidatePath("/admin/managers");
  revalidatePath("/admin");
}

async function requireActor() {
  const actor = await getAdminIdentity();
  if (!actor) redirect("/admin/login?next=/admin/growth/my-time");
  return actor;
}

async function requireOwnEngagement() {
  const actor = await requireActor();
  const engagement = await resolveManagerEngagement({
    userId: actor.id,
    email: actor.email,
    role: actor.role,
    isSuperUser: actor.isSuperUser,
  });
  if (!engagement) {
    bounce(
      "/admin/growth",
      "error",
      "My Time is available for active Growth Manager engagements.",
    );
  }
  return { actor, engagement };
}

function canApprovePayments(actor: { isSuperUser: boolean; role: string }) {
  if (actor.isSuperUser) return true;
  const role = actor.role.toLowerCase();
  return [
    "founder",
    "owner",
    "super_admin",
    "hr_admin",
    "operations_admin",
    "billing_admin",
    "finance_admin",
  ].includes(role);
}

export async function saveManualTimeEntry(formData: FormData) {
  const { actor, engagement } = await requireOwnEngagement();
  const hours = parsePositiveHours(text(formData, "hours"));
  if (!hours.ok) bounce(myTimeHome(formData), "error", hours.error);

  const workedOn = text(formData, "workedOn") || isoToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workedOn)) {
    bounce(myTimeHome(formData), "error", "Choose a valid work date.");
  }
  if (workedOn > isoToday()) {
    bounce(myTimeHome(formData), "error", "You can’t log future time.");
  }

  const category = text(formData, "categorySlug") || "other_approved";
  if (!isStaffTimeCategory(category)) {
    bounce(myTimeHome(formData), "error", "Pick a valid time category.");
  }

  const description = text(formData, "description");
  if (description.length < 3) {
    bounce(myTimeHome(formData), "error", "Add a short work description.");
  }

  const period = await ensurePaymentPeriod(engagement, workedOn);
  if (["approved", "ready_for_payment", "processing", "paid"].includes(period.status)) {
    bounce(
      "/admin/growth/my-time",
      "error",
      "This payment period is locked. Ask Admin if a correction is needed.",
    );
  }

  const entryId = text(formData, "id");
  const now = new Date().toISOString();
  const payload = {
    engagement_id: engagement.id,
    user_id: actor.id,
    payment_period_id: period.id,
    worked_on: workedOn,
    hours: hours.hours,
    category_slug: category,
    description,
    growth_initiative_id: text(formData, "growthInitiativeId") || null,
    status: period.status === "needs_correction" ? "draft" : "draft",
    updated_at: now,
  };

  if (entryId) {
    const { data: existing } = await supabaseAdmin
      .from("staff_time_entries")
      .select("*")
      .eq("id", entryId)
      .eq("engagement_id", engagement.id)
      .maybeSingle();
    if (!existing) bounce(myTimeHome(formData), "error", "That draft was not found.");
    const entry = mapTimeEntry(existing as Record<string, unknown>);
    if (!canEditTimeEntry(entry.status, period.status)) {
      bounce(myTimeHome(formData), "error", "That entry can no longer be edited.");
    }
    const { error } = await supabaseAdmin
      .from("staff_time_entries")
      .update(payload)
      .eq("id", entryId);
    if (error) bounce(myTimeHome(formData), "error", "Time could not be updated.");
    await recalculatePeriod(period.id);
    await publishStaffTimeEvent({
      engagement,
      eventType: SITGURU_DOMAIN_EVENTS.TIME_ENTRY_UPDATED,
      resourceType: "staff_time_entries",
      resourceId: entryId,
      actorUserId: actor.id,
      actorLabel: actor.email,
    });
  } else {
    const { data: created, error } = await supabaseAdmin
      .from("staff_time_entries")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error) bounce(myTimeHome(formData), "error", "Time could not be saved.");
    await recalculatePeriod(period.id);
    await publishStaffTimeEvent({
      engagement,
      eventType: SITGURU_DOMAIN_EVENTS.TIME_ENTRY_CREATED,
      resourceType: "staff_time_entries",
      resourceId: String(created?.id || now),
      actorUserId: actor.id,
      actorLabel: actor.email,
    });
  }

  refreshStaffPaths();
  bounce(myTimeHome(formData), "ok", entryId ? "Time updated." : "Time saved.");
}

export async function deleteDraftTimeEntry(formData: FormData) {
  const { actor, engagement } = await requireOwnEngagement();
  const id = text(formData, "id");
  const { data: existing } = await supabaseAdmin
    .from("staff_time_entries")
    .select("*")
    .eq("id", id)
    .eq("engagement_id", engagement.id)
    .maybeSingle();
  if (!existing) bounce(myTimeHome(formData), "error", "Entry not found.");
  const entry = mapTimeEntry(existing as Record<string, unknown>);
  const period = entry.paymentPeriodId
    ? (
        await supabaseAdmin
          .from("staff_payment_periods")
          .select("status")
          .eq("id", entry.paymentPeriodId)
          .maybeSingle()
      ).data
    : null;
  if (!canEditTimeEntry(entry.status, String(period?.status || "draft"))) {
    bounce(myTimeHome(formData), "error", "Only draft entries can be deleted.");
  }
  await supabaseAdmin.from("staff_time_entries").delete().eq("id", id);
  if (entry.paymentPeriodId) await recalculatePeriod(entry.paymentPeriodId);
  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.TIME_ENTRY_UPDATED,
    resourceType: "staff_time_entries",
    resourceId: id,
    actorUserId: actor.id,
    actorLabel: actor.email,
  });
  refreshStaffPaths();
  bounce(myTimeHome(formData), "ok", "Draft time removed.");
}

export async function startTimer(formData: FormData) {
  const { actor, engagement } = await requireOwnEngagement();
  const workedOn = isoToday();
  const period = await ensurePaymentPeriod(engagement, workedOn);
  if (["approved", "ready_for_payment", "processing", "paid"].includes(period.status)) {
    bounce(myTimeHome(formData), "error", "This payment period is locked.");
  }
  const category = text(formData, "categorySlug") || "other_approved";
  const description = text(formData, "description") || "In progress";
  const now = new Date().toISOString();
  const { data: created, error } = await supabaseAdmin
    .from("staff_time_entries")
    .insert({
      engagement_id: engagement.id,
      user_id: actor.id,
      payment_period_id: period.id,
      worked_on: workedOn,
      hours: 0.01,
      category_slug: isStaffTimeCategory(category) ? category : "other_approved",
      description,
      status: "draft",
      timer_started_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle();
  if (error) bounce(myTimeHome(formData), "error", "Timer could not start.");
  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.TIME_ENTRY_CREATED,
    resourceType: "staff_time_entries",
    resourceId: String(created?.id || now),
    actorUserId: actor.id,
    actorLabel: actor.email,
  });
  refreshStaffPaths();
  bounce(myTimeHome(formData), "ok", "Timer started.");
}

export async function stopTimer(formData: FormData) {
  const { actor, engagement } = await requireOwnEngagement();
  const id = text(formData, "id");
  const { data: existing } = await supabaseAdmin
    .from("staff_time_entries")
    .select("*")
    .eq("id", id)
    .eq("engagement_id", engagement.id)
    .maybeSingle();
  if (!existing?.timer_started_at) {
    bounce(myTimeHome(formData), "error", "No running timer found.");
  }
  const started = Date.parse(String(existing.timer_started_at));
  const elapsedHours = Math.max(
    0.01,
    Math.round(((Date.now() - started) / 3_600_000) * 100) / 100,
  );
  const capped = Math.min(24, elapsedHours);
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("staff_time_entries")
    .update({
      hours: capped,
      timer_stopped_at: now,
      updated_at: now,
      description:
        text(formData, "description") ||
        String(existing.description || "Timed work"),
    })
    .eq("id", id);
  if (error) bounce(myTimeHome(formData), "error", "Timer could not stop.");
  if (existing.payment_period_id) {
    await recalculatePeriod(String(existing.payment_period_id));
  }
  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.TIME_ENTRY_UPDATED,
    resourceType: "staff_time_entries",
    resourceId: id,
    actorUserId: actor.id,
    actorLabel: actor.email,
  });
  refreshStaffPaths();
  bounce(myTimeHome(formData), "ok", `Timer stopped · ${capped} hrs logged.`);
}

export async function submitPaymentPeriod(formData: FormData) {
  const { actor, engagement } = await requireOwnEngagement();
  const periodId = text(formData, "periodId");
  const { data: periodRow } = await supabaseAdmin
    .from("staff_payment_periods")
    .select("*")
    .eq("id", periodId)
    .eq("engagement_id", engagement.id)
    .maybeSingle();
  if (!periodRow) bounce(myTimeHome(formData), "error", "Payment period not found.");
  if (!["draft", "needs_correction"].includes(String(periodRow.status))) {
    bounce(myTimeHome(formData), "error", "This period was already submitted.");
  }

  const refreshed = await recalculatePeriod(periodId);
  if (!refreshed || refreshed.totalHours <= 0) {
    bounce(myTimeHome(formData), "error", "Add time before submitting this period.");
  }

  const entries = await listPeriodEntries(periodId);
  const rates = await listCompensationRates(engagement.id);
  const totals = calculatePeriodTotals(entries, rates);
  if (totals.missingRateDates.length || totals.totalHours <= 0 ||
      totals.amountCents <= 0 || entries.some((entry) =>
        entry.timerStartedAt && !entry.timerStoppedAt)) {
    bounce(myTimeHome(formData), "error", "Finish entries and check the hourly rate before submitting.");
  }
  // One database transaction locks the period, submits its entries, and
  // records a manager-submitted audit event. Never claim success on partial writes.
  const { data: submitted, error: submitError } = await supabaseAdmin.rpc(
    "staff_time_submit_period",
    { p_period_id: periodId, p_actor_id: actor.id },
  );
  if (submitError || submitted !== true) {
    console.error("[staff-time] atomic submission", submitError?.message || "Submission not confirmed");
    bounce(myTimeHome(formData), "error", "Submission could not be confirmed. Please try again.");
  }
  const now = new Date().toISOString();

  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.TIME_PERIOD_SUBMITTED,
    resourceType: "staff_payment_periods",
    resourceId: periodId,
    scope: "payments",
    actorUserId: actor.id,
    actorLabel: actor.email,
    notify: true,
    notifyTitle: `Review ${engagement.displayName}'s submitted hours`,
    notifyBody: `${formatHours(refreshed.totalHours)} hours · ${formatUsdFromCents(refreshed.amountCents)} · ${periodRow.period_start} through ${periodRow.period_end}. Review and approve in Admin HQ.`,
    notifyHref: `/admin/hr/people/payments#period-${periodId}`,
    resourceVersion: now,
  });

  refreshStaffPaths();
  bounce(myTimeHome(formData), "ok", "Payment period submitted for review.");
}

export async function approvePaymentPeriod(formData: FormData) {
  const actor = await requireActor();
  if (!canApprovePayments(actor)) {
    bounce("/admin/hr/people/payments", "error", "Only Admin can approve payments.");
  }
  const periodId = text(formData, "periodId");
  const { data: periodRow } = await supabaseAdmin
    .from("staff_payment_periods")
    .select("*")
    .eq("id", periodId)
    .maybeSingle();
  if (!periodRow) bounce("/admin/hr/people/payments", "error", "Period not found.");
  if (String(periodRow.status) !== "submitted") {
    bounce("/admin/hr/people/payments", "error", "Only submitted periods can be approved.");
  }

  const engagement = await findEngagementById(String(periodRow.engagement_id));
  if (!engagement) bounce("/admin/hr/people/payments", "error", "Engagement missing.");
  if (engagement.userId === actor.id && !actor.isSuperUser) {
    bounce(
      "/admin/hr/people/payments",
      "error",
      "You cannot approve your own payment period.",
    );
  }

  const totals = await recalculatePeriod(periodId);
  const submittedEntries = await listPeriodEntries(periodId);
  if (!totals || totals.totalHours <= 0 || totals.amountCents <= 0 || submittedEntries.length === 0) {
    bounce("/admin/hr/people/payments", "error",
      "Approval requires submitted time entries and a valid positive calculated amount.");
  }
  if (submittedEntries.some((entry) => entry.status !== "submitted")) {
    bounce("/admin/hr/people/payments", "error", "All hours must have been submitted before approval.");
  }
  const { data: approved, error: approvalError } = await supabaseAdmin.rpc(
    "staff_time_approve_period",
    { p_period_id: periodId, p_actor_id: actor.id },
  );
  if (approvalError || approved !== true) {
    console.error("[staff-time] atomic approval", approvalError?.message || "Approval not confirmed");
    bounce("/admin/hr/people/payments", "error", "Approval failed. No bank transfer was initiated.");
  }

  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.TIME_PERIOD_APPROVED,
    resourceType: "staff_payment_periods",
    resourceId: periodId,
    scope: "payments",
    actorUserId: actor.id,
    actorLabel: actor.email,
    notify: true,
    notifyTitle: "Your hours were reviewed and approved by Admin",
    notifyBody: `${formatHours(totals.totalHours)} hours · ${formatUsdFromCents(totals.amountCents)} are ready for payment.`,
    notifyHref: "/manager/payments",
  });
  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.PAYMENT_READY,
    resourceType: "staff_payment_periods",
    resourceId: periodId,
    scope: "payments",
    actorUserId: actor.id,
    actorLabel: actor.email,
    notify: false,
  });

  refreshStaffPaths();
  bounce("/admin/hr/people/payments", "ok", "Approved · Ready for Payment.");
}

export async function returnPaymentPeriod(formData: FormData) {
  const actor = await requireActor();
  if (!canApprovePayments(actor)) {
    bounce("/admin/hr/people/payments", "error", "Only Admin can return periods.");
  }
  const periodId = text(formData, "periodId");
  const note = text(formData, "correctionNote");
  if (note.length < 4) {
    bounce("/admin/hr/people/payments", "error", "Explain what needs correction.");
  }
  const { data: periodRow } = await supabaseAdmin
    .from("staff_payment_periods")
    .select("*")
    .eq("id", periodId)
    .maybeSingle();
  if (!periodRow || String(periodRow.status) !== "submitted") {
    bounce("/admin/hr/people/payments", "error", "Only submitted periods can be returned.");
  }
  const engagement = await findEngagementById(String(periodRow.engagement_id));
  if (!engagement) bounce("/admin/hr/people/payments", "error", "Engagement missing.");

  const { data: returned, error: returnError } = await supabaseAdmin.rpc(
    "staff_time_return_period",
    { p_period_id: periodId, p_actor_id: actor.id, p_note: note },
  );
  if (returnError || returned !== true) {
    console.error("[staff-time] return to contractor", returnError?.message || "Return not confirmed");
    bounce("/admin/hr/people/payments", "error", "Correction request could not be saved.");
  }

  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.TIME_PERIOD_RETURNED,
    resourceType: "staff_payment_periods",
    resourceId: periodId,
    scope: "payments",
    actorUserId: actor.id,
    actorLabel: actor.email,
    notify: true,
    notifyTitle: "Payment period needs correction",
    notifyBody: note,
    notifyHref: "/manager/my-time",
  });

  refreshStaffPaths();
  bounce("/admin/hr/people/payments", "ok", "Returned for correction.");
}

export async function recordStaffPaymentPaid(formData: FormData) {
  const actor = await requireActor();
  if (!canApprovePayments(actor)) {
    bounce("/admin/hr/people/payments", "error", "Only Admin can record payments.");
  }
  const periodId = text(formData, "periodId");
  const { data: periodRow } = await supabaseAdmin
    .from("staff_payment_periods")
    .select("*")
    .eq("id", periodId)
    .maybeSingle();
  if (!periodRow) bounce("/admin/hr/people/payments", "error", "Period not found.");
  if (!["ready_for_payment", "processing", "approved"].includes(String(periodRow.status))) {
    bounce("/admin/hr/people/payments", "error", "Period is not ready for payment.");
  }

  const engagement = await findEngagementById(String(periodRow.engagement_id));
  if (!engagement) bounce("/admin/hr/people/payments", "error", "Engagement missing.");
  if (engagement.userId === actor.id && !actor.isSuperUser) {
    bounce("/admin/hr/people/payments", "error", "You cannot mark your own payment Paid.");
  }

  const amountRaw = text(formData, "amountDollars");
  const amountCents = Math.round(Number(amountRaw) * 100);
  if (!Number.isFinite(amountCents) || amountCents !== Number(periodRow.amount_cents)) {
    bounce("/admin/hr/people/payments", "error", "Payment amount must match the approved payable. Request a correction before adjusting.");
  }
  const paidOn = text(formData, "paidOn");
  const method = text(formData, "paymentMethod");
  const externalReference = text(formData, "externalReference");
  const notes = text(formData, "notes");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn) || paidOn > isoToday() ||
      method !== "manual_bank_ach" || externalReference.length < 4) {
    bounce("/admin/hr/people/payments", "error",
      "Enter the confirmed bank ACH date and reference after completing the transfer.");
  }

  // The payable amount is frozen at approval. This transaction records the
  // bank confirmation and Paid state together; it never initiates an ACH.
  const { data: paid, error: paymentError } = await supabaseAdmin.rpc(
    "staff_time_record_confirmed_ach",
    {
      p_period_id: periodId,
      p_actor_id: actor.id,
      p_paid_on: paidOn,
      p_reference: externalReference,
      p_amount_cents: amountCents,
      p_rate_summary: (await listCompensationRates(engagement.id))
        .map((rate) => formatUsdFromCents(rate.hourlyRateCents) + "/hr").join(", "),
      p_note: notes,
    },
  );
  if (paymentError || paid !== true) {
    console.error("[staff-time] atomic bank reconciliation", paymentError?.message || "Payment not confirmed");
    bounce("/admin/hr/people/payments", "error",
      "The payment was NOT marked Paid. Verify the confirmed bank reference and retry.");
  }

  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.PAYMENT_PAID,
    resourceType: "staff_payment_records",
    resourceId: periodId,
    scope: "payments",
    actorUserId: actor.id,
    actorLabel: actor.email,
    notify: true,
    notifyTitle: "Your contractor payment was marked Paid",
    notifyBody: `${formatUsdFromCents(amountCents)} · confirmed external ACH dated ${paidOn}.`,
    notifyHref: "/manager/payments",
  });

  refreshStaffPaths();
  bounce("/admin/hr/people/payments", "ok", "Payment marked Paid.");
}

export async function updateEngagementRate(formData: FormData) {
  const actor = await requireActor();
  if (!canApprovePayments(actor)) {
    bounce("/admin/hr/people", "error", "Only Admin can change compensation rates.");
  }
  const engagementId = text(formData, "engagementId");
  const engagement = await findEngagementById(engagementId);
  if (!engagement) bounce("/admin/hr/people", "error", "Engagement not found.");
  if (engagement.userId === actor.id && !actor.isSuperUser) {
    bounce("/admin/hr/people", "error", "You cannot change your own compensation.");
  }

  const dollars = Number(text(formData, "hourlyRateDollars"));
  if (!Number.isFinite(dollars) || dollars <= 0) {
    bounce("/admin/hr/people", "error", "Enter a valid hourly rate.");
  }
  const effectiveOn = text(formData, "effectiveOn") || isoToday();
  const rateCents = Math.round(dollars * 100);

  // End previous open rates the day before the new effective date.
  const { data: openRates } = await supabaseAdmin
    .from("staff_compensation_rates")
    .select("id,effective_on,ended_on")
    .eq("engagement_id", engagementId)
    .is("ended_on", null);

  for (const rate of openRates || []) {
    if (String(rate.effective_on) >= effectiveOn) continue;
    const end = new Date(`${effectiveOn}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() - 1);
    const endedOn = end.toISOString().slice(0, 10);
    await supabaseAdmin
      .from("staff_compensation_rates")
      .update({ ended_on: endedOn })
      .eq("id", rate.id);
  }

  await supabaseAdmin.from("staff_compensation_rates").insert({
    engagement_id: engagementId,
    hourly_rate_cents: rateCents,
    effective_on: effectiveOn,
    created_by: actor.id,
    notes: text(formData, "notes") || "Rate change",
  });

  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.COMPENSATION_RATE_UPDATED,
    resourceType: "staff_compensation_rates",
    resourceId: engagementId,
    scope: "payments",
    actorUserId: actor.id,
    actorLabel: actor.email,
    notify: false,
  });

  refreshStaffPaths();
  bounce("/admin/hr/people", "ok", "Effective-dated rate saved.");
}
