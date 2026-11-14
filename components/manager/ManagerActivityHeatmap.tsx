"use client";

import { useState } from "react";
import type { ActivityHeatmap, ActivityHeatmapDay } from "@/lib/internship/activity-heatmap";

const TONES = ["bg-slate-100", "bg-emerald-100", "bg-emerald-300", "bg-emerald-500", "bg-emerald-800"];

export default function ManagerActivityHeatmap({ data }: { data: ActivityHeatmap }) {
  const [metric, setMetric] = useState<"hours" | "submissions">("hours");
  const [selected, setSelected] = useState<ActivityHeatmapDay | null>(null);
  const max = Math.max(1, ...data.days.map((day) => day[metric]));
  const current = selected ? data.days.find((day) => day.date === selected.date) || selected : null;
  const weeks = Array.from({ length: data.days.length / 7 }, (_, index) => data.days.slice(index * 7, index * 7 + 7));
  const formatDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5" aria-label="Team activity heatmap">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0F2744]">Team activity</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">Eight weeks of submitted hours and work, from the interns on this desk. Dates in New York.</p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1" aria-label="Heatmap measure">
          {(["hours", "submissions"] as const).map((value) => <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)} className={`min-h-11 rounded-lg px-3 text-xs font-bold ${metric === value ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"}`}>{value === "hours" ? "Hours" : "Submissions"}</button>)}
        </div>
      </div>
      <div className="mt-5 flex min-w-0 max-w-full gap-1.5 sm:gap-3">
        <div className="grid w-3 shrink-0 grid-rows-7 gap-1 pt-5 text-[10px] text-slate-500 sm:w-4 sm:gap-1.5">{["M", "T", "W", "T", "F", "S", "S"].map((label, index) => <span key={index} className="flex items-center">{label}</span>)}</div>
        <div className="grid w-0 min-w-0 flex-1 gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
          {weeks.map((week) => <div key={week[0].date} className="min-w-0">
            <p className="mb-1 h-4 overflow-hidden whitespace-nowrap text-[9px] font-semibold text-slate-500 sm:text-[10px]">{formatDate(week[0].date)}</p>
            <div className="grid grid-rows-7 gap-1 sm:gap-1.5">{week.map((day) => {
              const value = day[metric];
              const tone = value === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(value / max * 4)));
              const label = `${formatDate(day.date)}: ${day.hours} submitted hours, ${day.approvedHours} approved hours, ${day.submissions} work submissions`;
              return <button key={day.date} type="button" title={label} aria-label={label} aria-pressed={current?.date === day.date} onClick={() => setSelected(day)} className={`min-h-7 w-full min-w-0 rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-emerald-900 sm:min-h-8 ${TONES[tone]} ${current?.date === day.date ? "ring-2 ring-emerald-900 ring-offset-1" : "hover:ring-1 hover:ring-emerald-600"}`} />;
            })}</div>
          </div>)}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
        <p className="min-w-0 break-words">{data.totalHours} submitted hours · {data.approvedHours} approved · {data.submissions} submissions · {data.activeDays} active days</p>
        <span className="flex items-center gap-1">Less {TONES.map((tone) => <i key={tone} className={`h-3 w-3 rounded-sm ${tone}`} />)} More</span>
      </div>
      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs font-medium text-slate-600" aria-live="polite">{current ? `${formatDate(current.date)} · ${current.hours} submitted hours, ${current.approvedHours} approved hours, ${current.submissions} work submissions.` : data.activeDays ? "Select any day to inspect its actual hours and submissions. Work submissions include assignments, content, and weekly check-ins." : "No submitted work in this period. Activity will appear when assigned interns submit hours or work."}</p>
    </section>
  );
}
