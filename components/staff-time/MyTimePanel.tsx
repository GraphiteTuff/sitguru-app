"use client";

import Link from "next/link";
import { Clock3, Play, Square, Trash2 } from "lucide-react";
import {
  deleteDraftTimeEntry,
  saveManualTimeEntry,
  startTimer,
  stopTimer,
  submitPaymentPeriod,
} from "@/lib/staff-time/actions";
import { STAFF_TIME_CATEGORIES, staffCategoryLabel } from "@/lib/staff-time/categories";
import { formatHours, formatUsdFromCents } from "@/lib/staff-time/money";
import { paymentStatusLabel } from "@/lib/staff-time/status";
import type { MyTimeDashboard } from "@/lib/staff-time/types";
import StatusChip from "@/components/staff-time/StatusChip";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";

export default function MyTimePanel({
  data,
  notice,
  initiatives,
}: {
  data: MyTimeDashboard;
  notice?: { kind: "ok" | "error"; message: string } | null;
  initiatives: Array<{ id: string; name: string }>;
}) {
  const running = data.entries.find((entry) => entry.timerStartedAt && !entry.timerStoppedAt);
  const editable =
    data.period.status === "draft" || data.period.status === "needs_correction";

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

      <div className="grid gap-4 lg:grid-cols-3">
        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            This week
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {formatHours(data.week.hours)} hrs
          </p>
          <p
            className={`mt-2 text-sm font-semibold ${
              data.week.aboveExpected ? "text-amber-800" : "text-slate-600"
            }`}
          >
            {data.week.rangeLabel}
          </p>
        </GrowthCard>

        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            Current Payment Period
          </p>
          <p className="mt-2 text-xl font-black text-slate-950">{data.periodLabel}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-slate-500">Hours</dt>
              <dd className="font-black text-slate-950">
                {formatHours(data.period.totalHours)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Current Rate</dt>
              <dd className="font-black text-slate-950">{data.currentRateLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Estimated Payment</dt>
              <dd className="font-black text-slate-950">{data.estimatedPaymentLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="mt-1">
                <StatusChip
                  status={data.period.status}
                  label={paymentStatusLabel(data.period.status)}
                />
              </dd>
            </div>
          </dl>
          {data.period.correctionNote ? (
            <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
              Needs correction: {data.period.correctionNote}
            </p>
          ) : null}
        </GrowthCard>

        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            Quick actions
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {running ? (
              <form action={stopTimer}>
                <input type="hidden" name="id" value={running.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-black !text-white"
                >
                  <Square size={16} /> Stop Timer
                </button>
              </form>
            ) : (
              <form action={startTimer} className="grid gap-2">
                <select
                  name="categorySlug"
                  className="min-h-11 rounded-2xl border border-emerald-100 px-3 text-sm font-semibold"
                  defaultValue="social_content"
                >
                  {STAFF_TIME_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!editable}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black !text-white disabled:opacity-50"
                  style={{ background: "#0D5C3A" }}
                >
                  <Play size={16} /> Start Timer
                </button>
              </form>
            )}
            <Link
              href="/admin/growth/payments"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900"
            >
              My Payments
            </Link>
          </div>
        </GrowthCard>
      </div>

      {editable ? (
        <GrowthCard>
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-emerald-800" />
            <h2 className="text-lg font-black text-slate-950">Add Time Manually</h2>
          </div>
          <form action={saveManualTimeEntry} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Date
              <input
                type="date"
                name="workedOn"
                required
                className="min-h-11 rounded-2xl border border-emerald-100 px-3"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Hours
              <input
                type="text"
                name="hours"
                inputMode="decimal"
                placeholder="2.5"
                required
                className="min-h-11 rounded-2xl border border-emerald-100 px-3"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Category
              <select
                name="categorySlug"
                className="min-h-11 rounded-2xl border border-emerald-100 px-3"
                defaultValue="social_content"
              >
                {STAFF_TIME_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Growth Initiative (optional)
              <select
                name="growthInitiativeId"
                className="min-h-11 rounded-2xl border border-emerald-100 px-3"
                defaultValue=""
              >
                <option value="">None</option>
                {initiatives.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
              Short work description
              <input
                type="text"
                name="description"
                required
                placeholder="What did you work on?"
                className="min-h-11 rounded-2xl border border-emerald-100 px-3"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white md:col-span-2 md:justify-self-start"
              style={{ background: "#0D5C3A" }}
            >
              Save Time
            </button>
          </form>
        </GrowthCard>
      ) : null}

      <GrowthCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">Period time entries</h2>
          {editable ? (
            <form action={submitPaymentPeriod}>
              <input type="hidden" name="periodId" value={data.period.id} />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                style={{ background: "#0D5C3A" }}
              >
                Submit Payment Period
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {data.entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-emerald-100 bg-[#FAF6EE] p-3"
            >
              <p className="font-black text-slate-950">{entry.workedOn}</p>
              <p className="text-sm font-semibold text-slate-700">
                {formatHours(entry.hours)} hrs · {staffCategoryLabel(entry.categorySlug)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{entry.description}</p>
              {editable && entry.status === "draft" ? (
                <form action={deleteDraftTimeEntry} className="mt-2">
                  <input type="hidden" name="id" value={entry.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center gap-1 text-sm font-black text-rose-800"
                  >
                    <Trash2 size={14} /> Delete draft
                  </button>
                </form>
              ) : null}
            </article>
          ))}
          {!data.entries.length ? (
            <p className="text-sm font-semibold text-slate-500">No time logged yet this period.</p>
          ) : null}
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Hours</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Description</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr key={entry.id} className="border-t border-emerald-50">
                  <td className="px-2 py-3 font-semibold text-slate-900">{entry.workedOn}</td>
                  <td className="px-2 py-3 font-black">{formatHours(entry.hours)}</td>
                  <td className="px-2 py-3">{staffCategoryLabel(entry.categorySlug)}</td>
                  <td className="px-2 py-3 text-slate-600">{entry.description}</td>
                  <td className="px-2 py-3 capitalize">{entry.status}</td>
                  <td className="px-2 py-3">
                    {editable && entry.status === "draft" ? (
                      <form action={deleteDraftTimeEntry}>
                        <input type="hidden" name="id" value={entry.id} />
                        <button type="submit" className="font-black text-rose-800">
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Payment History</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Annual paid total {data.annualPaidLabel} (Paid only)
        </p>
        <div className="mt-4 space-y-3">
          {data.payments.map((payment) => (
            <article
              key={payment.id}
              className="rounded-2xl border border-emerald-100 px-3 py-3 sm:flex sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-black text-slate-950">
                  {payment.paidOn || payment.createdAt.slice(0, 10)}
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {formatHours(payment.approvedHours)} hrs · {payment.rateSummary}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2 sm:mt-0">
                <p className="font-black text-slate-950">
                  {formatUsdFromCents(payment.amountCents)}
                </p>
                <StatusChip status={payment.status} label="Paid" />
              </div>
            </article>
          ))}
          {!data.payments.length ? (
            <p className="text-sm font-semibold text-slate-500">No paid periods yet.</p>
          ) : null}
        </div>
      </GrowthCard>
    </div>
  );
}
