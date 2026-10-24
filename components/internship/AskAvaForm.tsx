"use client";

import { askAva } from "@/lib/internship/portal-actions";

export default function AskAvaForm({
  internId,
  targetType = "",
  targetId = "",
  targetTitle = "",
  returnTo = "/intern",
  label = "Ask your manager",
  placeholder = "What do you need your manager to answer?",
}: {
  internId: string;
  targetType?: string;
  targetId?: string;
  targetTitle?: string;
  returnTo?: string;
  label?: string;
  placeholder?: string;
}) {
  return (
    <form action={askAva} className="space-y-2 rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
      <input type="hidden" name="internId" value={internId} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="targetTitle" value={targetTitle} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-sky-900">{label}</span>
          <textarea
          name="question"
          required
          rows={2}
          placeholder={placeholder}
          className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-3 text-base font-semibold text-slate-950"
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" name="urgency" value="high" className="h-5 w-5" />
        This is blocking my work
      </label>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center rounded-2xl bg-sky-700 px-4 text-sm font-black !text-white"
      >
        {label}
      </button>
    </form>
  );
}
