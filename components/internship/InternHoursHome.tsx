"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, Check, Clock3, Download, GraduationCap, MoreHorizontal, PawPrint, Trophy, X } from "lucide-react";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { saveManualTime, startWorkTimer, stopWorkTimer, submitInternWeek } from "@/lib/timekeeper/actions";
import {
  hoursAreApproved,
  hoursStatusLabel,
  internHoursCsv,
  type DashboardEntry,
  type HoursDashboard,
} from "@/lib/timekeeper/hours-dashboard";

function hoursText(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function oneDecimal(value: number) {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function prettyDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function conic(parts: { percent: number; color: string }[]) {
  let cursor = 0;
  const stops = parts.filter((part) => part.percent > 0).map((part) => {
    const start = cursor;
    cursor += part.percent;
    return `${part.color} ${start}% ${Math.min(cursor, 100)}%`;
  });
  if (cursor < 100) stops.push(`#E2E8F0 ${cursor}% 100%`);
  return `conic-gradient(${stops.join(", ")})`;
}

function statusClass(status: string) {
  if (hoursAreApproved(status)) return "bg-[#DCFCE7] text-[#166534]";
  if (status === "submitted" || status === "manager_recommended") return "bg-[#DBEAFE] text-[#1D4ED8]";
  if (status === "returned") return "bg-[#FFEDD5] text-[#C2410C]";
  return "bg-slate-100 text-slate-600";
}

export default function InternHoursHome({
  dashboard,
  categories,
  preview,
  timerActive,
  weekNumber,
  overage,
}: {
  dashboard: HoursDashboard;
  categories: { slug: string; name: string }[];
  preview: boolean;
  timerActive: boolean;
  weekNumber: number;
  overage: string;
}) {
  const [logOpen, setLogOpen] = useState(false);
  const [logDate, setLogDate] = useState(dashboard.todayKey);
  const [showAll, setShowAll] = useState(false);
  const [weekDetails, setWeekDetails] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState(false);
  const [openEntry, setOpenEntry] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => {
    const [year, month] = dashboard.todayKey.split("-").map(Number);
    return { year, month: month - 1 };
  });
  const rows = showAll ? dashboard.recent : dashboard.recent.slice(0, 5);
  const axisTop = Math.max(20, Math.ceil(Math.max(dashboard.weeklyTarget, ...dashboard.chartWeeks.map((week) => week.hours), 1) / 5) * 5);
  const axisTicks = [axisTop, axisTop * 0.75, axisTop * 0.5, axisTop * 0.25, 0];
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const marked = new Set(dashboard.markedDays);

  function openLog(date = dashboard.todayKey) {
    if (preview) return;
    setLogDate(date);
    setLogOpen(true);
  }

  function downloadReport() {
    const csv = internHoursCsv(dashboard.recent);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sitguru-internship-hours.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function shiftMonth(delta: number) {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <div className="space-y-4">
      {overage ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">{overage}</p> : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Clock3 size={18} />}
          tint="bg-[#DBEAFE] text-[#2563EB]"
          wash="bg-[#F8FBFF]"
          label="Hours Completed"
          value={dashboard.requirementPending ? hoursText(dashboard.logged) : `${hoursText(dashboard.credit)} / ${hoursText(dashboard.requiredHours)}`}
          detail={dashboard.requirementPending ? "Requirement pending" : ""}
          percentLabel={dashboard.requirementPending ? "" : `${dashboard.completedPercent}%`}
          percent={dashboard.completedPercent}
          bar="bg-[#2563EB]"
        />
        <Stat
          icon={<CalendarDays size={18} />}
          tint="bg-[#DCFCE7] text-[#16A34A]"
          wash="bg-[#F7FDF9]"
          label="Hours This Week"
          value={oneDecimal(dashboard.hoursThisWeek)}
          detail={`Target: ${hoursText(dashboard.weeklyTarget)} hrs/week`}
          percentLabel={`${dashboard.weekTargetPercent}%`}
          percent={dashboard.weekTargetPercent}
          bar="bg-[#16A34A]"
        />
        <Stat
          icon={<BarChart3 size={18} />}
          tint="bg-[#EDE9FE] text-[#7C3AED]"
          wash="bg-[#FBF9FF]"
          label="Hours Remaining"
          value={dashboard.remaining == null ? "Pending" : hoursText(dashboard.remaining)}
          detail={dashboard.requirementPending ? "University hours not confirmed" : `${dashboard.weeksRemaining} weeks left`}
          percentLabel=""
          percent={dashboard.requirementPending ? 0 : Math.max(0, 100 - dashboard.completedPercent)}
          bar="bg-[#7C3AED]"
        />
        <article className="flex items-center gap-3 rounded-2xl border border-amber-100/80 bg-[#FFF8E8] p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)]">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FDE68A] text-[#D97706]"><Trophy size={20} /></span>
          <div>
            <p className="text-xl font-black text-[#0F2744]">{dashboard.paceTitle}</p>
            <p className="mt-1 text-sm font-medium leading-5 text-slate-600">
              {dashboard.paceStatus === "on_track" ? "You're meeting your internship hour goals!" : dashboard.paceDetail}
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.25fr_0.85fr_0.9fr]">
        <article className={`${DESK_UI.card} p-4`} id="weekly-hours">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-[#0F2744]">Weekly Hours</h2>
            <button type="button" onClick={() => setWeekDetails((open) => !open)} className="text-sm font-bold text-[#2563EB]">
              {weekDetails ? "Hide details" : "View Details →"}
            </button>
          </div>
          <p className="mt-3 flex justify-center gap-4 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#60A5FA]" />Hours Logged</span>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#86EFAC]" />Target Hours</span>
          </p>
          <div className="mt-3 flex gap-2">
            <div className="flex h-44 flex-col justify-between pb-10 text-[10px] font-semibold text-slate-400">
              {axisTicks.map((tick) => <span key={tick}>{tick}</span>)}
            </div>
            <div className="grid flex-1 grid-cols-6 items-end gap-1">
              {dashboard.chartWeeks.map((week) => (
                <div key={week.week} className="text-center">
                  <p className="text-[10px] font-bold text-[#2563EB]">{oneDecimal(week.hours)}</p>
                  <div className="mt-1 flex h-36 items-end justify-center gap-1">
                    <span className="w-3 rounded-t-md bg-[#60A5FA]" style={{ height: `${Math.max(week.hours > 0 ? 6 : 0, (week.hours / axisTop) * 100)}%` }} />
                    <span className="w-3 rounded-t-md bg-[#86EFAC]" style={{ height: `${Math.max(8, (week.target / axisTop) * 100)}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] font-bold text-[#0F2744]">{week.label}</p>
                  <p className="text-[10px] font-medium text-slate-400">{week.range.split(" – ")[0]}</p>
                </div>
              ))}
            </div>
          </div>
          {weekDetails ? (
            <ul className="mt-4 grid gap-1 text-sm">
              {dashboard.chartWeeks.map((week) => (
                <li key={week.week} className="flex justify-between rounded-xl bg-[#F8FAFC] px-3 py-2 font-semibold text-slate-700">
                  <span>{week.label}{week.range ? ` · ${week.range}` : ""}</span>
                  <span>{hoursText(week.hours)} / {hoursText(week.target)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className={`${DESK_UI.card} p-4`} id="hours-progress">
          <h2 className="font-black text-[#0F2744]">Hours Progress</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: conic([{ percent: dashboard.completedPercent, color: "#22C55E" }, { percent: Math.max(0, 100 - dashboard.completedPercent), color: "#E2E8F0" }]) }}>
              <div className="grid h-[5.6rem] w-[5.6rem] place-items-center rounded-full bg-white text-center">
                <span>
                  <strong className="block text-2xl font-black text-[#0F2744]">{dashboard.requirementPending ? "—" : `${dashboard.completedPercent}%`}</strong>
                  <span className="text-[10px] font-semibold leading-4 text-slate-500">{dashboard.requirementPending ? "Pending" : `${hoursText(dashboard.credit)} of ${hoursText(dashboard.requiredHours)} hours`}</span>
                </span>
              </div>
            </div>
            <ul className="space-y-2 text-sm font-semibold text-slate-600">
              <li className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#22C55E]" />Completed <span className="ml-auto font-black text-[#0F2744]">{hoursText(dashboard.credit)}</span></li>
              <li className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#2563EB]" />Remaining <span className="ml-auto font-black text-[#0F2744]">{dashboard.remaining == null ? "Pending" : hoursText(dashboard.remaining)}</span></li>
              <li className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#86EFAC]" />Target Pace <span className="ml-auto font-black text-[#0F2744]">{hoursText(dashboard.targetPace)}</span></li>
            </ul>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F0FDF4] px-3 py-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><Check size={16} /></span>
            <p className="text-sm font-semibold leading-5 text-[#166534]">
              {dashboard.paceStatus === "on_track" ? "You're on track! Keep logging your hours consistently to stay on pace for your internship goals." : dashboard.paceDetail}
            </p>
            <PawPrint size={18} className="ml-auto shrink-0 text-[#F59E0B]" />
          </div>
          {dashboard.logged !== dashboard.credit ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">{hoursText(dashboard.logged)} logged · {hoursText(dashboard.credit)} approved</p>
          ) : null}
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black text-[#0F2744]">Current Week</h2>
            <p className="text-xs font-bold text-slate-500">{dashboard.weekRangeLabel}</p>
          </div>
          <ul className="mt-2">
            {dashboard.weekDays.map((day) => (
              <li key={day.key}>
                <button type="button" onClick={() => openLog(day.key)} className="flex w-full items-center gap-2 rounded-xl px-1 py-1.5 text-left text-sm hover:bg-[#F8FAFC]">
                  <span className="w-[4.5rem] shrink-0 font-semibold text-slate-500">{day.weekday} {day.dateLabel}</span>
                  <span className="w-10 shrink-0 font-black text-[#0F2744]">{oneDecimal(day.hours)}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-600">{day.category || "—"}</span>
                  {day.approved ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><Check size={12} /></span>
                  ) : day.hasEntry ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DBEAFE] text-[10px] font-black text-[#1D4ED8]">•</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr]">
        <article className={`${DESK_UI.card} overflow-hidden`} id="recent-hours">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
            <h2 className="font-black text-[#0F2744]">Recent Hours</h2>
            <div className="flex items-center gap-3">
              {preview ? null : (
                <button type="button" onClick={() => openLog()} className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Log Hours</button>
              )}
              <button type="button" onClick={() => setShowAll((open) => !open)} className="text-sm font-bold text-[#2563EB]">
                {showAll ? "Show less" : "View All →"}
              </button>
            </div>
          </div>
          {rows.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Hours</th>
                    <th className="px-4 py-2">Assignment / activity</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <EntryRow key={row.id} row={row} open={openEntry === row.id} onToggle={() => setOpenEntry(openEntry === row.id ? null : row.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-8 text-sm font-semibold text-slate-500">No hours logged yet. Log hours after you finish a block of work.</p>
          )}
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between">
            <h2 className="font-black text-[#0F2744]">Calendar</h2>
            <Link href="/intern/calendar" className="text-sm font-bold text-[#2563EB]">View Full Calendar →</Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm font-bold text-[#0F2744]">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="rounded-full px-2 py-1 hover:bg-slate-100">‹</button>
            <span>{monthLabel}</span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="rounded-full px-2 py-1 hover:bg-slate-100">›</button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm font-semibold">
            {Array.from({ length: firstWeekday }, (_, index) => <span key={`pad-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const today = key === dashboard.todayKey;
              const hasHours = marked.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openLog(key)}
                  className={`mx-auto grid h-8 w-8 place-items-center rounded-full ${today ? "bg-[#2563EB] !text-white" : hasHours ? "bg-[#DCFCE7] text-[#166534]" : "text-[#0F2744] hover:bg-slate-100"}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFE] text-[#2563EB]"><GraduationCap size={18} /></span>
            <h2 className="font-black text-[#0F2744]">Hour Requirements</h2>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Requirement label="Total Required Hours" value={dashboard.requirementPending ? "Pending" : hoursText(dashboard.requiredHours)} />
            <Requirement label="Program Weeks" value={String(dashboard.programWeeks)} />
            <Requirement label="Average per Week" value={`${hoursText(dashboard.weeklyTarget)} hours`} />
            <Requirement label="Your Current Pace" value={dashboard.loggedPace == null ? "Not started" : `${hoursText(dashboard.loggedPace)} hours/week`} />
          </dl>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${dashboard.completedPercent}%` }} />
          </div>
          <p className="mt-1 text-right text-xs font-bold text-slate-500">{dashboard.requirementPending ? "Pending confirmation" : `${dashboard.completedPercent}%`}</p>
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black text-[#0F2744]">Hours by Category</h2>
            <button type="button" onClick={() => setCategoryDetails((open) => !open)} className="text-sm font-bold text-[#2563EB]">{categoryDetails ? "Hide details" : "View Details →"}</button>
          </div>
          {dashboard.categories.length ? (
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: conic(dashboard.categories) }}>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center">
                  <span className="text-sm font-black leading-4 text-[#0F2744]">{hoursText(dashboard.logged)}<br />Hours</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-600">
                {dashboard.categories.map((category) => (
                  <li key={category.slug} className="flex items-center gap-2">
                    <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: category.color }} />
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                    <span className="font-black text-[#0F2744]">{oneDecimal(category.hours)} ({category.percent}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : <p className="mt-4 text-sm font-semibold text-slate-500">Categories appear after you log hours.</p>}
          {categoryDetails && dashboard.categories.length ? (
            <p className="mt-3 text-xs font-semibold text-slate-500">Percents use every logged hour, including drafts. Approved hours are the ones that count toward the requirement.</p>
          ) : null}
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Action label="Log Hours" icon={<Clock3 size={16} />} tint="bg-[#ECFDF5] text-[#047857]" onClick={() => openLog()} disabled={preview} />
            <Link href="/intern/calendar" className="flex items-center gap-2 rounded-2xl bg-[#F5F3FF] px-3 py-3 text-sm font-bold text-[#6D28D9]"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white"><CalendarDays size={16} /></span>View Calendar</Link>
            <a href="#hours-progress" className="flex items-center gap-2 rounded-2xl bg-[#EFF6FF] px-3 py-3 text-sm font-bold text-[#1D4ED8]"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white"><BarChart3 size={16} /></span>View Progress</a>
            <button type="button" onClick={downloadReport} className="flex items-center gap-2 rounded-2xl bg-[#FFF7ED] px-3 py-3 text-left text-sm font-bold text-[#C2410C]"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white"><Download size={16} /></span>Export Hours Report</button>
          </div>
          {!preview && dashboard.draftsThisWeek > 0 ? (
            <form action={submitInternWeek} className="mt-3 grid gap-2">
              <input type="hidden" name="weekNumber" value={weekNumber} />
              <textarea name="reflection" rows={2} placeholder="Weekly reflection" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <button className="rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold !text-white">Submit this week</button>
            </form>
          ) : null}
        </article>
      </section>

      {timerActive && !preview ? (
        <form action={stopWorkTimer} className={`${DESK_UI.card} flex items-center justify-between gap-3 p-4`}>
          <input type="hidden" name="returnTo" value="/intern/time" />
          <p className="text-sm font-bold text-[#0F2744]">A work timer is running.</p>
          <button className="rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold !text-white">Stop work</button>
        </form>
      ) : null}

      <p className="text-sm font-semibold text-slate-500">The {hoursText(dashboard.weeklyTarget)}-hour week is a planning pace, not a cap. SitGuru does not award academic credit.</p>

      {logOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="log-hours-title">
          <div className={`${DESK_UI.card} max-h-[90vh] w-full max-w-lg overflow-y-auto p-4`}>
            <div className="flex items-center justify-between">
              <h2 id="log-hours-title" className="text-lg font-black text-[#0F2744]">Log hours</h2>
              <button type="button" onClick={() => setLogOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form action={saveManualTime} className="mt-3 grid gap-2">
              <input type="hidden" name="returnTo" value="/intern/time" />
              <input type="hidden" name="weekNumber" value={weekNumber} />
              <label className="text-xs font-bold text-slate-500">Date<input type="date" name="workedOn" required defaultValue={logDate} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
              <label className="text-xs font-bold text-slate-500">Hours<input name="hours" inputMode="decimal" required placeholder="2.5" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
              <label className="text-xs font-bold text-slate-500">Category
                <select name="category" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold">
                  {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">What you worked on<textarea name="description" required minLength={3} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
              <button className="min-h-11 rounded-full bg-[#2563EB] text-sm font-bold !text-white">Save draft</button>
            </form>
            {timerActive ? null : (
              <form action={startWorkTimer} className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
                <input type="hidden" name="returnTo" value="/intern/time" />
                <p className="text-sm font-black text-[#0F2744]">Or start the timer</p>
                <select name="category" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold">
                  {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </select>
                <button className="min-h-11 rounded-full bg-[#0D5C3A] text-sm font-bold !text-white">Start work</button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  icon, tint, wash, label, value, detail, percent, percentLabel, bar,
}: {
  icon: ReactNode;
  tint: string;
  wash: string;
  label: string;
  value: string;
  detail: string;
  percent: number;
  percentLabel: string;
  bar: string;
}) {
  return (
    <article className={`${DESK_UI.card} ${wash} p-4`}>
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tint}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-[1.65rem] font-black leading-none text-[#0F2744]">{value}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
          {detail ? <p className={`mt-0.5 text-xs font-semibold ${detail.startsWith("Target") ? "text-[#16A34A]" : "text-slate-500"}`}>{detail}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
        </div>
        {percentLabel ? <span className="text-xs font-bold text-slate-500">{percentLabel}</span> : null}
      </div>
    </article>
  );
}

function Requirement({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="font-black text-[#0F2744]">{value}</dd>
    </div>
  );
}

function Action({
  label, icon, tint, onClick, disabled,
}: {
  label: string;
  icon: ReactNode;
  tint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-bold disabled:opacity-50 ${tint}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white">{icon}</span>{label}
    </button>
  );
}

function EntryRow({ row, open, onToggle }: { row: DashboardEntry; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="border-t border-slate-100">
        <td className="px-4 py-3 font-semibold text-slate-700">{prettyDate(row.workedOn)}</td>
        <td className="px-4 py-3 font-black text-[#0F2744]">{oneDecimal(row.hours)}</td>
        <td className="px-4 py-3 font-semibold text-slate-700">{row.description || "—"}</td>
        <td className="px-4 py-3 font-semibold text-slate-600">{row.categoryName}</td>
        <td className="px-4 py-3">
          {hoursAreApproved(row.status) ? (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-[#16A34A]"><Check size={14} />Approved</span>
          ) : (
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClass(row.status)}`}>{hoursStatusLabel(row.status)}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <button type="button" onClick={onToggle} aria-label={open ? "Hide entry details" : "Entry actions"} className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100">
            <MoreHorizontal size={16} />
          </button>
        </td>
      </tr>
      {open ? (
        <tr className="border-t border-slate-100 bg-[#F8FAFC]">
          <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-slate-600">
            {row.description || "No note"} · {hoursStatusLabel(row.status)} · {row.weekNumber ? `Week ${row.weekNumber}` : "Week not set"}
          </td>
        </tr>
      ) : null}
    </>
  );
}
