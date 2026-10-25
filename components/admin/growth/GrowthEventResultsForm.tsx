"use client";

import { useState, useTransition } from "react";
import { saveGrowthEventResultAction } from "@/lib/admin/growth/outcome-actions";

const field =
  "mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-semibold";
const label =
  "text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800";

/** Mobile-first event-day results form — outcomes only, not Planner prep tasks. */
export default function GrowthEventResultsForm({
  defaultName = "",
  defaultLocation = "",
}: {
  defaultName?: string;
  defaultLocation?: string;
}) {
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
          const result = await saveGrowthEventResultAction(formData);
          if (!result.ok) {
            setMessage({ kind: "error", text: result.error });
            return;
          }
          setMessage({ kind: "ok", text: "Event results saved." });
          event.currentTarget.reset();
        });
      }}
    >
      <p className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-900">
        Record what happened at the tent. Preparation checklists stay in
        Planner. Mark offline counts as manual.
      </p>

      <label className="block">
        <span className={label}>Event name</span>
        <input
          name="eventName"
          required
          defaultValue={defaultName}
          className={field}
          placeholder="Bucks County pet adoption day"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Date</span>
          <input name="eventDate" type="date" className={field} />
        </label>
        <label className="block">
          <span className={label}>Location</span>
          <input
            name="location"
            defaultValue={defaultLocation}
            className={field}
            placeholder="Doylestown, PA"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Event type</span>
          <select name="eventType" className={field} defaultValue="community">
            <option value="community">Community</option>
            <option value="partner">Partner</option>
            <option value="campus">Campus</option>
            <option value="adoption">Adoption / rescue</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>Status</span>
          <select name="status" className={field} defaultValue="completed">
            <option value="planned">Planned</option>
            <option value="live">Live / in progress</option>
            <option value="completed">Completed</option>
            <option value="follow_up">Follow-up</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className={label}>Objective</span>
        <input
          name="objective"
          className={field}
          placeholder="Acquire Pet Parents + Guru leads"
        />
      </label>
      <label className="block">
        <span className={label}>Target audiences</span>
        <input
          name="targetAudiences"
          className={field}
          placeholder="Pet Parents, Gurus, Ambassadors"
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(
          [
            ["petParentLeads", "Pet Parent leads"],
            ["guruLeads", "Guru leads"],
            ["ambassadorLeads", "Ambassador leads"],
            ["qrScans", "QR scans"],
            ["petParentRegistrations", "Pet Parent regs"],
            ["guruRegistrations", "Guru regs"],
            ["ambassadorRegistrations", "Ambassador regs"],
            ["followUpCount", "Follow-ups"],
          ] as const
        ).map(([name, title]) => (
          <label key={name} className="block">
            <span className={label}>{title}</span>
            <input
              name={name}
              type="number"
              min={0}
              defaultValue={0}
              inputMode="numeric"
              className={field}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={label}>Leads source</span>
          <select name="leadsMetricSource" className={field} defaultValue="manual">
            <option value="manual">Manual</option>
            <option value="system">System</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>Registrations source</span>
          <select
            name="registrationsMetricSource"
            className={field}
            defaultValue="manual"
          >
            <option value="manual">Manual</option>
            <option value="system">System</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>QR source</span>
          <select
            name="qrScansMetricSource"
            className={field}
            defaultValue="manual"
          >
            <option value="manual">Manual</option>
            <option value="system">System</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className={label}>Notes</span>
        <textarea name="notes" rows={3} className={`${field} py-3`} />
      </label>
      <label className="block">
        <span className={label}>Lessons learned</span>
        <textarea name="lessonsLearned" rows={3} className={`${field} py-3`} />
      </label>
      <label className="block">
        <span className={label}>Recommended next action</span>
        <textarea
          name="recommendedNextAction"
          rows={2}
          className={`${field} py-3`}
        />
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
        {pending ? "Saving…" : "Save event results"}
      </button>
    </form>
  );
}
