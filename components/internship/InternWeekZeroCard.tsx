"use client";

import { saveStartChecks } from "@/lib/internship/portal-actions";
import { WEEK_ZERO_ITEMS, weekZeroProgress } from "@/lib/internship/week-zero";

export default function InternWeekZeroCard({
  internId,
  completedKeys,
  ready,
  preview = false,
}: {
  internId: string;
  completedKeys: string[];
  ready: boolean;
  preview?: boolean;
}) {
  const progress = weekZeroProgress(completedKeys);
  const done = new Set(completedKeys);

  if (ready) {
    return (
      <section className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">Week 0</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Ready to begin internship</h2>
        <p className="mt-1 text-sm font-semibold text-emerald-900">
          Start Here is complete. Week 1 opens on your internship start date.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.6rem] border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800">Start here · Week 0</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Before Week 1</h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        {progress.label}. Week 1 stays closed until this list is done or Jason approves it.
      </p>
      {preview ? (
        <ul className="mt-3 space-y-2">
          {WEEK_ZERO_ITEMS.map((item) => (
            <li key={item.key} className="text-sm font-semibold text-slate-700">
              {done.has(item.key) ? "Done" : "Still open"} — {item.label}
            </li>
          ))}
        </ul>
      ) : (
        <form action={saveStartChecks} className="mt-3 space-y-2">
          <input type="hidden" name="internId" value={internId} />
          {WEEK_ZERO_ITEMS.map((item) => (
            <label key={item.key} className="flex min-h-11 items-start gap-3 rounded-2xl bg-[#FAF6EE] px-3 py-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                name="item"
                value={item.key}
                defaultChecked={done.has(item.key)}
                className="mt-1 h-5 w-5"
              />
              <span>{item.label}</span>
            </label>
          ))}
          <button className="min-h-12 w-full rounded-2xl bg-[#2563EB] px-4 text-sm font-black !text-white sm:w-auto">
            Save Start Here
          </button>
        </form>
      )}
    </section>
  );
}
