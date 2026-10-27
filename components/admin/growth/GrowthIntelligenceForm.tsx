"use client";

import { useState, useTransition } from "react";
import { saveGrowthIntelligenceAction } from "@/lib/admin/growth/outcome-actions";

const field =
  "mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold";
const label =
  "text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800";

/** Test → Learn → Recommend → Act → Measure */
export default function GrowthIntelligenceForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await saveGrowthIntelligenceAction(formData);
          if (!result.ok) {
            setMessage({ kind: "error", text: result.error });
            return;
          }
          setMessage({ kind: "ok", text: "Growth insight saved." });
          event.currentTarget.reset();
        });
      }}
    >
      <p className="rounded-2xl bg-sky-50 px-3 py-3 text-sm font-semibold text-sky-950">
        Drafting and distributing surveys stays in Teams + Planner. Record the
        learning chain here.
      </p>

      <label className="block">
        <span className={label}>What was tested</span>
        <input
          name="title"
          required
          className={field}
          placeholder="Event QR vs Instagram signup CTA"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Type</span>
          <select name="studyType" className={field} defaultValue="survey">
            <option value="survey">Survey</option>
            <option value="poll">Poll</option>
            <option value="market_test">Market test</option>
            <option value="experiment">Experiment</option>
            <option value="feedback">Feedback</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>Tested on</span>
          <input name="testedOn" type="date" className={field} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Audience</span>
          <input
            name="audience"
            className={field}
            placeholder="Pet Parents at Bucks events"
          />
        </label>
        <label className="block">
          <span className={label}>Response count</span>
          <input
            name="responseCount"
            type="number"
            min={0}
            defaultValue={0}
            inputMode="numeric"
            className={field}
          />
        </label>
      </div>

      <label className="block">
        <span className={label}>Objective</span>
        <input name="objective" className={field} />
      </label>
      <label className="block">
        <span className={label}>Key finding</span>
        <textarea name="keyFinding" rows={3} className={`${field} py-3`} />
      </label>
      <label className="block">
        <span className={label}>Business interpretation</span>
        <textarea
          name="businessInterpretation"
          rows={3}
          className={`${field} py-3`}
        />
      </label>
      <label className="block">
        <span className={label}>Recommendation</span>
        <textarea name="recommendation" rows={2} className={`${field} py-3`} />
      </label>
      <label className="block">
        <span className={label}>Action taken</span>
        <textarea name="actionTaken" rows={2} className={`${field} py-3`} />
      </label>
      <label className="block">
        <span className={label}>Follow-up test</span>
        <textarea name="followUpTest" rows={2} className={`${field} py-3`} />
      </label>

      {message ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            message.kind === "ok"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black !text-white disabled:opacity-60 sm:w-auto"
        style={{ background: "#0D5C3A" }}
      >
        {pending ? "Saving…" : "Save insight"}
      </button>
    </form>
  );
}
