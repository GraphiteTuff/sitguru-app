"use client";

import {
  approvePaymentPeriod,
  recordStaffPaymentPaid,
  returnPaymentPeriod,
} from "@/lib/staff-time/actions";
import { formatHours, formatUsdFromCents } from "@/lib/staff-time/money";
import { staffCategoryLabel } from "@/lib/staff-time/categories";
import { paymentStatusLabel } from "@/lib/staff-time/status";
import type { StaffEngagement, StaffPaymentPeriod, StaffTimeEntry } from "@/lib/staff-time/types";
import StatusChip from "@/components/staff-time/StatusChip";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";
import { formatPeriodLabel } from "@/lib/staff-time/periods";

export type QueueItem = {
  period: StaffPaymentPeriod;
  engagement: StaffEngagement;
  statusLabel: string;
  entries?: StaffTimeEntry[];
};

export default function AdminPaymentQueue({
  items,
  notice,
  mode = "all",
  canAct = true,
}: {
  items: QueueItem[];
  notice?: { kind: "ok" | "error"; message: string } | null;
  /** hours = approvals only; payments = ACH recording only; all = both */
  mode?: "all" | "hours" | "payments";
  canAct?: boolean;
}) {
  const ready = items.filter((item) =>
    ["approved", "ready_for_payment", "processing"].includes(item.period.status),
  );
  const submitted = items.filter((item) => item.period.status === "submitted");
  const corrections = items.filter((item) => item.period.status === "needs_correction");
  const saved = items.filter((item) => item.period.status === "draft");
  const paidPeriods = items.filter((item) => item.period.status === "paid");
  const showHours = mode === "all" || mode === "hours";
  const showPayments = mode === "all" || mode === "payments";

  return (
    <div className="space-y-4">
      {notice ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            notice.kind === "ok"
              ? "bg-emerald-50 text-emerald-950"
              : "bg-rose-50 text-rose-950"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      <div id="approvals" className="scroll-mt-28" />
      {showHours ? (
      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Contractor Hours Approvals</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Submitted payment periods awaiting founder review. Drafts are visible below, separately from submitted hours.
        </p>
        <div className="mt-4 space-y-3">
          {submitted.map((item) => (
            <article
              key={item.period.id}
              className="rounded-[1.4rem] border border-amber-100 bg-amber-50/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-black text-slate-950">
                    {item.engagement.displayName}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {formatPeriodLabel({
                      start: item.period.periodStart,
                      end: item.period.periodEnd,
                    })}{" "}
                    · {formatHours(item.period.totalHours)} hrs ·{" "}
                    {formatUsdFromCents(item.period.amountCents)}
                  </p>
                </div>
                <StatusChip status={item.period.status} label={item.statusLabel} />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">Submitted: {item.period.submittedAt ? new Date(item.period.submittedAt).toLocaleString("en-US") : "Timestamp unavailable"} · {item.engagement.paymentCadence} cadence</p>
              {item.entries?.length ? <details className="mt-3 rounded-xl border border-amber-200 bg-white/75 p-3"><summary className="cursor-pointer text-sm font-black text-slate-800">Review {item.entries.length} time entries</summary><ul className="mt-2 space-y-2">{item.entries.map((entry) => <li key={entry.id} className="border-t border-slate-200 py-2 text-xs text-slate-700"><strong>{entry.workedOn} · {formatHours(entry.hours)} hrs · {staffCategoryLabel(entry.categorySlug)}</strong><p className="mt-1">{entry.description}</p></li>)}</ul></details> : <p className="mt-2 text-sm font-semibold text-amber-900">No time entry details found. Verify before approving.</p>}
{canAct ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={approvePaymentPeriod}>
                  <input type="hidden" name="periodId" value={item.period.id} />
                  <button
                    type="submit"
                    disabled={!item.entries?.length || item.period.totalHours <= 0 || item.period.amountCents <= 0}
                    title={!item.entries?.length || item.period.totalHours <= 0 || item.period.amountCents <= 0 ? "Verify submitted time entries and an active rate before approval" : "Approve hours for payment"}
                    className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: "#0D5C3A" }}
                  >
                    Approve
                  </button>
                </form>
                <form action={returnPaymentPeriod} className="flex min-w-[16rem] flex-1 flex-wrap gap-2">
                  <input type="hidden" name="periodId" value={item.period.id} />
                  <input
                    name="correctionNote"
                    required
                    placeholder="What needs correction?"
                    className="min-h-11 min-w-[12rem] flex-1 rounded-2xl border border-amber-200 px-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center rounded-2xl border border-amber-300 px-4 text-sm font-black text-amber-950"
                  >
                    Needs Correction
                  </button>
                </form>
              </div>
              ) : <p className="mt-3 text-xs font-semibold text-slate-500">Read-only. Authorized Finance or HR administrators can approve or request corrections.</p>}
            </article>
          ))}
          {!submitted.length ? (
            <p className="text-sm font-semibold text-slate-500">No submitted periods.</p>
          ) : null}
        </div>
      </GrowthCard>
      ) : null}

      <div id="drafts" className="scroll-mt-28" />
      {showHours && saved.length > 0 ? (
        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Saved, Not Submitted</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">These drafts are not yet eligible for approval.</p>
          <div className="mt-3 space-y-3">{saved.map((item) => (
            <article key={item.period.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.engagement.displayName}</strong><StatusChip status="draft" label="Draft — not submitted" /></div>
              <p className="mt-1 text-sm font-semibold">{formatPeriodLabel({start:item.period.periodStart,end:item.period.periodEnd})} · {formatHours(item.period.totalHours)} hours · {formatUsdFromCents(item.period.amountCents)}</p>
              {item.entries?.length ? <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold">View {item.entries.length} entries</summary><ul className="mt-2 space-y-1 text-sm">{item.entries.map((entry) => <li key={entry.id}>{entry.workedOn} · {formatHours(entry.hours)} hours · {entry.description}</li>)}</ul></details> : null}
            </article>
          ))}</div>
        </GrowthCard>
      ) : null}

      <div id="payment-queue" className="scroll-mt-28" />
      {showPayments ? (
      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Contractor Payments</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          SitGuru calculates the amount. Record Business ACH only after the bank transfer is confirmed. A bank confirmation/reference is required. Approving hours does not send money.
        </p>
        <div className="mt-4 space-y-4">
          {ready.map((item) => (
            <article
              key={item.period.id}
              className="rounded-[1.4rem] border border-emerald-100 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-black text-slate-950">
                    {item.engagement.displayName}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {formatPeriodLabel({
                      start: item.period.periodStart,
                      end: item.period.periodEnd,
                    })}{" "}
                    · {formatHours(item.period.totalHours)} approved hours ·{" "}
                    {formatUsdFromCents(item.period.amountCents)} · Business ACH
                  </p>
                </div>
                <StatusChip
                  status={item.period.status}
                  label={paymentStatusLabel(item.period.status)}
                />
              </div>
              {canAct ? (
              <form action={recordStaffPaymentPaid} className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="hidden" name="periodId" value={item.period.id} />
                <label className="grid gap-1 text-sm font-semibold">
                  Amount
                  <input
                    name="amountDollars"
                    required
                    defaultValue={(item.period.amountCents / 100).toFixed(2)}
                    className="min-h-11 rounded-2xl border border-emerald-100 px-3"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Payment Date
                  <input
                    type="date"
                    name="paidOn"
                    required
                    className="min-h-11 rounded-2xl border border-emerald-100 px-3"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Payment Method
                  <select
                    name="paymentMethod"
                    defaultValue="manual_bank_ach"
                    className="min-h-11 rounded-2xl border border-emerald-100 px-3"
                  >
                    <option value="manual_bank_ach">Business ACH</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  External / Bank Reference
                  <input
                    name="externalReference"
                    required
                    minLength={4}
                    className="min-h-11 rounded-2xl border border-emerald-100 px-3"
                    placeholder="Confirmed Navy Federal ACH reference"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                  Notes
                  <input
                    name="notes"
                    className="min-h-11 rounded-2xl border border-emerald-100 px-3"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white md:col-span-2 md:justify-self-start"
                  style={{ background: "#0D5C3A" }}
                >
                  Record Confirmed ACH as Paid
                </button>
              </form>
              ) : <p className="mt-3 text-xs font-semibold text-slate-500">Read-only financial information.</p>}
            </article>
          ))}
          {!ready.length ? (
            <p className="text-sm font-semibold text-slate-500">No payments ready.</p>
          ) : null}
        </div>
      </GrowthCard>
      ) : null}

      <div id="paid-history" className="scroll-mt-28" />
      {(showHours || showPayments) && paidPeriods.length > 0 ? (
        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Recent Paid Periods</h2>
          <div className="mt-3 space-y-2">{paidPeriods.map((item) => (
            <div key={item.period.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 p-3 text-sm font-semibold">
              <span>{item.engagement.displayName} · {formatPeriodLabel({start:item.period.periodStart,end:item.period.periodEnd})} · {formatHours(item.period.totalHours)} hours · {formatUsdFromCents(item.period.amountCents)}</span>
              <StatusChip status="paid" label="Paid" />
            </div>
          ))}</div>
        </GrowthCard>
      ) : null}

      <div id="corrections" className="scroll-mt-28" />
      {showHours && corrections.length ? (
        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Needs Correction</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
            {corrections.map((item) => (
              <li key={item.period.id}>
                {item.engagement.displayName} · {item.period.correctionNote}
              </li>
            ))}
          </ul>
        </GrowthCard>
      ) : null}
    </div>
  );
}
