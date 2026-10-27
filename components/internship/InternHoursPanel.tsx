"use client";

import { saveTimeEntry } from "@/lib/internship/portal-actions";
import { formatHours, type HourSummary } from "@/lib/internship/hours";
import type { InternshipTask, InternshipTimeLog } from "@/lib/internship/types";

function statusText(status: string) {
  if (status === "ava_approved") return "Manager approved";
  if (status === "supervisor_verified") return "Jason verified";
  if (status === "submitted") return "Needs manager review";
  if (status === "changes_requested") return "Changes requested";
  return "Draft";
}

export default function InternHoursPanel({
  internId,
  summary,
  logs,
  tasks,
  preview = false,
}: {
  internId: string;
  summary: HourSummary;
  logs: InternshipTimeLog[];
  tasks: InternshipTask[];
  preview?: boolean;
}) {
  const planned = summary.plannedWeeklyHours ?? 0;
  return (
    <section id="hours" className="rounded-[1.6rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">Hours</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">{summary.weekLabel}</h2>
      {summary.pendingRequirement ? (
        <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-950">
          {summary.pendingMessage}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Logged this week {formatHours(summary.loggedThisWeek)} / {formatHours(planned)} planned
          </p>
          <div
            className="mt-3 h-3 overflow-hidden rounded-full bg-emerald-50"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={summary.requiredHours || 0}
            aria-valuenow={summary.approvedHours}
            aria-label="Approved internship hours"
          >
            <div
              className="h-full rounded-full bg-[#2563EB]"
              style={{ width: `${summary.progressPercent || 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-black text-slate-950">{summary.progressLabel}</p>
        </>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {[
          ["Submitted", formatHours(summary.submittedHours)],
          ["Approved", formatHours(summary.approvedHours)],
          ["Verified", formatHours(summary.verifiedHours)],
          ["Expected", summary.expectedHours == null ? "Pending" : formatHours(summary.expectedHours)],
          ["Required", summary.requiredHours == null ? "Pending" : formatHours(summary.requiredHours)],
          ["Remaining", summary.remainingHours == null ? "Pending" : formatHours(summary.remainingHours)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-[#FAF6EE] px-3 py-3">
            <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">{label}</dt>
            <dd className="mt-1 font-black text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm font-black text-slate-950">
        Pace: {summary.paceLabel}
      </p>

      <div className="mt-4 space-y-2 md:hidden">
        {logs.slice(0, 8).map((log) => (
          <article key={log.id} className="rounded-2xl border border-emerald-100 p-3">
            <p className="font-black text-slate-950">{log.workedOn}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{log.activity}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {log.weekNumber ? `Week ${log.weekNumber}` : "Start here"}
            </p>
            <p className="mt-2 text-sm font-black text-slate-950">{formatHours(log.hours)} hours</p>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">{statusText(log.status)}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Internship hour log</caption>
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Activity</th>
              <th className="py-2 pr-3">Week</th>
              <th className="py-2 pr-3">Hours</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 12).map((log) => (
              <tr key={log.id} className="border-t border-emerald-50">
                <td className="py-2 pr-3 font-semibold">{log.workedOn}</td>
                <td className="py-2 pr-3 font-semibold">{log.activity}</td>
                <td className="py-2 pr-3">{log.weekNumber ? `Week ${log.weekNumber}` : "Start"}</td>
                <td className="py-2 pr-3 font-black">{formatHours(log.hours)}</td>
                <td className="py-2">{statusText(log.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!logs.length ? (
        <p className="mt-3 text-sm font-semibold text-slate-500">No hours logged yet.</p>
      ) : null}

      {preview ? null : (
        <form action={saveTimeEntry} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="internId" value={internId} />
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Date</span>
            <input name="workedOn" type="date" required className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Hours</span>
            <input name="hours" inputMode="decimal" required placeholder="1.25" className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Activity</span>
            <input name="activity" required placeholder="Pet Parent research" className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Related work</span>
            <select name="workItemId" className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold">
              <option value="">Not tied to one assignment</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.weekNumber ? `Week ${task.weekNumber} — ` : ""}
                  {task.title}
                </option>
              ))}
            </select>
            <input type="hidden" name="workItemType" value="task" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Notes</span>
            <textarea name="notes" rows={2} className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-base font-semibold" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Evidence link</span>
            <input name="evidenceUrl" placeholder="https://" className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          </label>
          <button name="submit" value="yes" className="min-h-12 rounded-2xl bg-[#2563EB] px-4 text-sm font-black !text-white">
            Submit hours to Ava
          </button>
          <button name="submit" value="no" className="min-h-12 rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">
            Save draft
          </button>
        </form>
      )}
    </section>
  );
}
