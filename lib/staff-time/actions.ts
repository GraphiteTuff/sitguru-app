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
import { parsePositiveHours } from "@/lib/staff-time/money";
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

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("staff_time_entries")
    .update({ status: "submitted", updated_at: now })
    .eq("payment_period_id", periodId)
    .eq("engagement_id", engagement.id);

  const { error } = await supabaseAdmin
    .from("staff_payment_periods")
    .update({
      status: "submitted",
      submitted_at: now,
      submitted_by: actor.id,
      needs_correction_at: null,
      correction_note: "",
      updated_at: now,
    })
    .eq("id", periodId);
  if (error) bounce(myTimeHome(formData), "error", "Could not submit payment period.");

  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.TIME_PERIOD_SUBMITTED,
    resourceType: "staff_payment_periods",
    resourceId: periodId,
    scope: "payments",
    actorUserId: actor.id,
    actorLabel: actor.email,
    notify: true,
    notifyTitle: `${engagement.displayName} submitted a payment period`,
    notifyBody: "Review hours and approve for payment.",
    notifyHref: "/admin/hr/people/payments",
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

  await recalculatePeriod(periodId);
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("staff_payment_periods")
    .update({
      status: "ready_for_payment",
      approved_at: now,
      approved_by: actor.id,
      ready_at: now,
      updated_at: now,
    })
    .eq("id", periodId)
    .eq("status", "submitted");
  if (error) bounce("/admin/hr/people/payments", "error", "Approval failed.");

  await supabaseAdmin
    .from("staff_time_entries")
    .update({ status: "locked", updated_at: now })
    .eq("payment_period_id", periodId);

  await publishStaffTimeEvent({
    engagement,
    eventType: SITGURU_DOMAIN_EVENTS.TIME_PERIOD_APPROVED,
    resourceType: "staff_payment_periods",
    resourceId: periodId,
    scope: "payments",
    actorUserId: actor.id,
    actorLabel: actor.email,
    notify: true,
    notifyTitle: "Payment period approved",
    notifyBody: "Your period is Ready for Payment.",
    notifyHref: "/admin/growth/payments",
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

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("staff_payment_periods")
    .update({
      status: "needs_correction",
      needs_correction_at: now,
      correction_note: note,
      updated_at: now,
    })
    .eq("id", periodId);
  await supabaseAdmin
    .from("staff_time_entries")
    .update({ status: "draft", updated_at: now })
    .eq("payment_period_id", periodId);

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
    notifyHref: "/admin/growth/my-time",
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
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    bounce("/admin/hr/people/payments", "error", "Enter a valid payment amount.");
  }
  const paidOn = text(formData, "paidOn") || isoToday();
  const method = text(formData, "paymentMethod") || "manual_bank_ach";
  const externalReference = text(formData, "externalReference");
  const notes = text(formData, "notes");

  const entries = await listPeriodEntries(periodId);
  const rates = await listCompensationRates(engagement.id);
  const totals = calculatePeriodTotals(entries, rates);
  const now = new Date().toISOString();

  const { error: periodError } = await supabaseAdmin
    .from("staff_payment_periods")
    .update({
      status: "paid",
      paid_at: now,
      amount_cents: amountCents,
      total_hours: totals.totalHours,
      updated_at: now,
    })
    .eq("id", periodId);
  if (periodError) {
    bounce("/admin/hr/people/payments", "error", "Could not mark period Paid.");
  }

  const { error: recordError } = await supabaseAdmin.from("staff_payment_records").upsert(
    {
      engagement_id: engagement.id,
      payment_period_id: periodId,
      approved_hours: totals.totalHours,
      amount_cents: amountCents,
      currency: engagement.currency,
      rate_summary: totals.rateSummary,
      payment_method: method,
      provider: "graff_enterprises_llc",
      expense_category: "Contract Labor",
      initiated_on: paidOn,
      paid_on: paidOn,
      external_reference: externalReference,
      recorded_by: actor.id,
      notes,
      status: "paid",
      updated_at: now,
    },
    { onConflict: "payment_period_id" },
  );
  if (recordError) {
    console.warn("[staff-time] payment record", recordError.message);
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
    notifyTitle: "Payment recorded as Paid",
    notifyBody: `Your ${paidOn} payment was marked Paid.`,
    notifyHref: "/admin/growth/payments",
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
