"use client";

import Link from "next/link";
import { Clock3, Play, Square, Trash2 } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import {
  deleteDraftTimeEntry,
  saveManualTimeEntry,
  startTimer,
  stopTimer,
  submitPaymentPeriod,
} from "@/lib/staff-time/actions";
import { STAFF_TIME_CATEGORIES, staffCategoryLabel } from "@/lib/staff-time/categories";
import { formatHours } from "@/lib/staff-time/money";
import type { MyTimeDashboard } from "@/lib/staff-time/types";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { isoToday, weekBoundsContaining } from "@/lib/staff-time/periods";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function PaceCard({
  label,
  value,
  detail,
  pct,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  pct: number;
  tone: string;
}) {
  return (
    <article className={`rounded-2xl p-4 ${tone}`}>
      <p className="text-2xl font-black text-[#0F2744]">{value}</p>
      <p className="text-sm font-black">{label}</p>
      <p className="text-xs font-semibold opacity-80">{detail}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
        <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${pct}%` }} />
      </div>
    </article>
  );
}

export default function MyTimeDesk({
  data,
  notice,
  initiatives,
}: {
  data: MyTimeDashboard;
  notice?: { kind: "ok" | "error"; message: string } | null;
  initiatives: Array<{ id: string; name: string }>;
}) {
  const running = data.entries.find((entry) => entry.timerStartedAt && !entry.timerStoppedAt);
  const editable = data.period.status === "draft" || data.period.status === "needs_correction";
  const returnField = <input type="hidden" name="returnBase" value="/manager" />;
  const week = weekBoundsContaining(isoToday());
  const weekEntries = data.entries.filter((entry) => entry.workedOn >= week.start && entry.workedOn <= week.end);
  const byDay = DAYS.map((label, index) => {
    const [year, month, day] = week.start.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + index));
    const key = date.toISOString().slice(0, 10);
    const hours = weekEntries.filter((entry) => entry.workedOn === key).reduce((sum, entry) => sum + entry.hours, 0);
    return { label, key, hours };
  });
  const maxDay = Math.max(...byDay.map((day) => day.hours), data.week.expectedMax / 5, 1);
  const planned = data.week.expectedMax || 0;
  const weekPct = planned ? Math.min(100, Math.round((data.week.hours / planned) * 100)) : 0;
  const periodGoal = planned * 2;
  const periodPct = periodGoal ? Math.min(100, Math.round((data.period.totalHours / periodGoal) * 100)) : 0;
  const pace = data.week.hours - planned / 2;
  const categories = STAFF_TIME_CATEGORIES.map((cat) => ({
    ...cat,
    hours: data.entries.filter((entry) => entry.categorySlug === cat.slug).reduce((sum, entry) => sum + entry.hours, 0),
  })).filter((cat) => cat.hours > 0);
  const categoryTotal = categories.reduce((sum, cat) => sum + cat.hours, 0) || 1;

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<Clock3 size={22} />}
        title="My Time"
        subtitle="Track your work, manage your hours, and stay on pace."
        quote={"Time today\nbuilds a bigger\nbrighter tomorrow."}
      />
      {notice ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${notice.kind === "ok" ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950"}`}>
          {notice.message}
        </p>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PaceCard label="My Time This Week" value={`${formatHours(data.week.hours)} hrs`} detail={`of ${formatHours(planned)} planned`} pct={weekPct} tone="bg-[#ECFDF5] text-[#047857]" />
        <PaceCard label="This Period" value={`${formatHours(data.period.totalHours)} hrs`} detail={data.periodLabel} pct={periodPct} tone="bg-[#F5F3FF] text-[#6D28D9]" />
        <PaceCard label="15-week Goal" value={`${formatHours(planned * 15)} hrs`} detail="Planning target from your weekly max" pct={planned ? Math.min(100, Math.round((data.period.totalHours / (planned * 15)) * 100)) : 0} tone="bg-[#EFF6FF] text-[#1D4ED8]" />
        <article className="rounded-2xl bg-[#FFF7ED] p-4 text-[#C2410C]">
          <p className="text-2xl font-black">{pace >= 0 ? "On Track" : "Behind"}</p>
          <p className="text-sm font-black">Pacing Status</p>
          <p className="text-xs font-semibold">{pace >= 0 ? `${formatHours(pace)} hours ahead of midweek pace` : `${formatHours(Math.abs(pace))} hours behind midweek pace`}</p>
        </article>
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">This Week</h2>
          <div className="mt-4 flex h-36 items-end gap-2">
            {byDay.map((day) => (
              <div key={day.key} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end"><div className="w-full rounded-t-md bg-[#3B82F6]" style={{ height: `${Math.max(day.hours ? 8 : 0, (day.hours / maxDay) * 100)}%` }} /></div>
                <span className="text-[10px] font-bold text-slate-500">{day.label}</span>
              </div>
            ))}
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Time Summary</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
            <li>Hours logged {formatHours(data.week.hours)} / {formatHours(planned)}</li>
            <li>Remaining this week {formatHours(Math.max(0, planned - data.week.hours))}</li>
            <li>This period {formatHours(data.period.totalHours)} · {data.periodLabel}</li>
            <li>Rate {data.currentRateLabel}</li>
            <li>Estimated pay {data.estimatedPaymentLabel}</li>
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Pacing & Goals</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">{data.week.rangeLabel}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Status {data.period.status.replaceAll("_", " ")}</p>
          {editable ? (
            <form action={submitPaymentPeriod} className="mt-3">
              {returnField}
              <input type="hidden" name="periodId" value={data.period.id} />
              <button className="rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold !text-white">Submit Payment Period</button>
            </form>
          ) : null}
          {running ? (
            <form action={stopTimer} className="mt-2">
              {returnField}
              <input type="hidden" name="id" value={running.id} />
              <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold !text-white"><Square size={14} /> Stop Timer</button>
            </form>
          ) : (
            <form action={startTimer} className="mt-2 flex gap-2">
              {returnField}
              <select name="categorySlug" className="min-h-10 rounded-xl border border-slate-200 px-2 text-sm" defaultValue="social_content">
                {STAFF_TIME_CATEGORIES.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.label}</option>)}
              </select>
              <button disabled={!editable} className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-3 text-sm font-bold !text-white disabled:opacity-50"><Play size={14} /> Start</button>
            </form>
          )}
        </article>
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <article className={`${DESK_UI.card} overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-lg font-black text-[#0F2744]">Recent Time Entries</h2>
            <Link href="/manager/payments" className="text-xs font-bold text-[#2563EB]">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs font-bold text-slate-400"><tr><th className="px-4 py-2">Date</th><th>Hours</th><th>Type</th><th>Description</th><th /></tr></thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold">{entry.workedOn}</td>
                    <td className="font-black">{formatHours(entry.hours)}</td>
                    <td>{staffCategoryLabel(entry.categorySlug)}</td>
                    <td className="text-slate-600">{entry.description}</td>
                    <td>
                      {editable && entry.status === "draft" ? (
                        <form action={deleteDraftTimeEntry}>
                          {returnField}
                          <input type="hidden" name="id" value={entry.id} />
                          <button className="text-rose-700" aria-label="Delete draft"><Trash2 size={14} /></button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!data.entries.length ? <tr><td colSpan={5} className="px-4 py-6 text-slate-500">No time logged yet this period.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Add Time Entry</h2>
          {editable ? (
            <form action={saveManualTimeEntry} className="mt-3 grid gap-2">
              {returnField}
              <label className="text-xs font-bold text-slate-500">Date<input type="date" name="workedOn" required className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
              <label className="text-xs font-bold text-slate-500">Hours<input name="hours" inputMode="decimal" required placeholder="2.5" className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
              <label className="text-xs font-bold text-slate-500">Type
                <select name="categorySlug" className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" defaultValue="social_content">
                  {STAFF_TIME_CATEGORIES.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Assignment
                <select name="growthInitiativeId" className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" defaultValue="">
                  <option value="">None</option>
                  {initiatives.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Notes<textarea name="description" required rows={3} placeholder="What did you work on?" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
              <button className="min-h-10 rounded-full bg-[#2563EB] text-sm font-bold !text-white">Add Entry</button>
            </form>
          ) : <p className="mt-3 text-sm text-slate-500">This pay period is locked.</p>}
        </article>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Time Breakdown</h2>
          <ul className="mt-3 space-y-2">
            {categories.map((cat) => (
              <li key={cat.slug} className="flex justify-between text-sm font-semibold text-slate-700">
                <span>{cat.label}</span><span>{formatHours(cat.hours)} · {Math.round((cat.hours / categoryTotal) * 100)}%</span>
              </li>
            ))}
            {!categories.length ? <li className="text-sm text-slate-500">Categories appear after you log time.</li> : null}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Weekly Goals</h2>
          <p className="mt-3 text-sm font-semibold text-slate-700">Log {formatHours(planned)} hours this week · {weekPct}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#22C55E]" style={{ width: `${weekPct}%` }} /></div>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm font-bold">
            <Link href="/manager/calendar" className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-[#1D4ED8]">View My Calendar</Link>
            <Link href="/manager/payments" className="rounded-2xl bg-[#ECFDF5] px-3 py-3 text-[#047857]">My Payments</Link>
            <Link href="/manager/reports" className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-[#6D28D9]">View Progress Report</Link>
            <Link href="/manager/help" className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-[#C2410C]">Help</Link>
          </div>
        </article>
      </section>
    </div>
  );
}
