"use client";

import {
  approvePaymentPeriod,
  recordStaffPaymentPaid,
  returnPaymentPeriod,
} from "@/lib/staff-time/actions";
import { formatHours, formatUsdFromCents } from "@/lib/staff-time/money";
import { paymentStatusLabel } from "@/lib/staff-time/status";
import type { StaffEngagement, StaffPaymentPeriod } from "@/lib/staff-time/types";
import StatusChip from "@/components/staff-time/StatusChip";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";
import { formatPeriodLabel } from "@/lib/staff-time/periods";

export type QueueItem = {
  period: StaffPaymentPeriod;
  engagement: StaffEngagement;
  statusLabel: string;
};

export default function AdminPaymentQueue({
  items,
  notice,
}: {
  items: QueueItem[];
  notice?: { kind: "ok" | "error"; message: string } | null;
}) {
  const ready = items.filter((item) =>
    ["approved", "ready_for_payment", "processing"].includes(item.period.status),
  );
  const submitted = items.filter((item) => item.period.status === "submitted");
  const corrections = items.filter((item) => item.period.status === "needs_correction");

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

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Time Approvals</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Submitted payment periods awaiting founder review.
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
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={approvePaymentPeriod}>
                  <input type="hidden" name="periodId" value={item.period.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
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
            </article>
          ))}
          {!submitted.length ? (
            <p className="text-sm font-semibold text-slate-500">No submitted periods.</p>
          ) : null}
        </div>
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Ready for Payment</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          SitGuru calculates the amount. Record Business ACH after Graff Enterprises / SitGuru
          bank payment — SitGuru does not send money.
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
                    className="min-h-11 rounded-2xl border border-emerald-100 px-3"
                    placeholder="ACH confirmation"
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
                  Mark Paid
                </button>
              </form>
            </article>
          ))}
          {!ready.length ? (
            <p className="text-sm font-semibold text-slate-500">No payments ready.</p>
          ) : null}
        </div>
      </GrowthCard>

      {corrections.length ? (
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
