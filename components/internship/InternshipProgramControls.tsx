import { redirect } from "next/navigation";
import { transitionInternshipProgram } from "@/lib/internship/program-control-actions";
import {
  getProgramControlsActor, listProgramCohorts, loadProgramControls, PROGRAM_CONTROL_PATHS,
  programTransitionsEnabled, type ProgramControlsMode,
} from "@/lib/internship/program-controls";
import { isProgramStatus, PROGRAM_ACTION_LABELS, PROGRAM_STATUS_LABELS, PROGRAM_TRANSITIONS } from "@/lib/internship/program-status";
import ProgramStatusBanner from "./ProgramStatusBanner";

const buttonClass = "inline-flex min-h-12 items-center rounded-xl bg-[#10583f] px-4 text-sm font-bold !text-white disabled:opacity-50";
const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium", timeStyle: "short", timeZone: "UTC",
});

function formatTimestamp(timestamp: string) {
  return `${dateTime.format(new Date(timestamp))} UTC`;
}

export default async function InternshipProgramControls({ mode, searchParams }: {
  mode: ProgramControlsMode;
  searchParams: Promise<{ cohort?: string; result?: string }>;
}) {
  const path = PROGRAM_CONTROL_PATHS[mode];
  const actor = await getProgramControlsActor(mode);
  if (!actor) return <p className="m-4 rounded-xl bg-white p-4">Program Controls requires authorized internship staff access.</p>;

  const params = await searchParams;
  const { data: cohorts, error } = await listProgramCohorts(actor);
  const cohort = params.cohort ? cohorts?.find((row) => row.id === params.cohort) : cohorts?.[0];
  if (params.cohort && !error && !cohort) redirect(path);
  const program = cohort ? await loadProgramControls(cohort.id) : null;
  const transitionsEnabled = programTransitionsEnabled();
  const readiness = cohort && program ? [
    { label: "Official start and end dates", ready: Boolean(cohort.starts_on && cohort.ends_on && cohort.ends_on >= cohort.starts_on) },
    { label: "Cohort instructor and supervisor assigned", ready: Boolean(cohort.default_manager_user_id && cohort.default_supervisor_user_id) },
    { label: "Interns enrolled with portal access", ready: program.enrollment > 0 },
    { label: "Program Controls release verified", ready: transitionsEnabled },
  ] : [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-8 sm:px-5">
      {/* Keep the content hero independent of Admin HQ's white shell-header styles. */}
      <div data-brand-green className="rounded-3xl bg-[#10583f] p-5 sm:p-7">
        <h1 className="text-2xl font-black !text-white sm:text-3xl">Program Controls</h1>
        <p className="mt-2 text-sm !text-white">Internship semester status and activation history</p>
      </div>
      {params.result === "saved" && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-950">Semester status updated.</p>}
      {params.result === "error" && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-950">The status could not be updated. Review the current status, readiness, and confirmation before trying again.</p>}
      {cohorts?.length ? (
        <form action={path} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4">
          <label className="min-w-0 grow text-sm font-bold">
            Cohort
            <select name="cohort" defaultValue={cohort?.id} className="mt-1 block min-h-12 w-full rounded-xl border border-slate-400 px-3 text-base">
              {cohorts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </label>
          <button className={buttonClass}>View cohort</button>
        </form>
      ) : <p className="rounded-xl bg-white p-4">{error ? "Cohorts are temporarily unavailable." : "No cohorts are assigned to this account."}</p>}
      {cohort && !program && <ProgramStatusBanner status={null} />}
      {cohort && program && (
        <>
          <ProgramStatusBanner status={program.status} />
          <section className="space-y-4 rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-black text-emerald-950">{cohort.name}</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Official start date", cohort.starts_on || "Pending"],
                ["Official end date", cohort.ends_on || "Pending"],
                ["Enrolled interns", program.enrollment],
                ["Activated at", program.activatedAt ? formatTimestamp(program.activatedAt) : "Awaiting activation"],
                ["Activated by", program.activatedBy || "Awaiting activation"],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="font-bold">{label}</dt>
                  <dd className="break-words text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm font-bold">Semester activation {program.status === "active" ? "ON" : "OFF"}</p>
          </section>
          <section className="space-y-3 rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="text-lg font-black text-emerald-950">Program readiness</h2>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {readiness.map(({ label, ready }) => <li key={label}><strong>{ready ? "Ready" : "Pending"}</strong> · {label}</li>)}
            </ul>
            {PROGRAM_TRANSITIONS[program.status].length > 0 && (
              <form action={transitionInternshipProgram} className="space-y-3 border-t border-slate-200 pt-3">
                <input type="hidden" name="mode" value={mode} />
                <input type="hidden" name="cohort" value={cohort.id} />
                <input type="hidden" name="revision" value={program.revision} />
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="confirmed" value="yes" required disabled={!transitionsEnabled} />
                  Confirm the selected status change for {cohort.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROGRAM_TRANSITIONS[program.status].map((transition) => (
                    <button key={transition} name="transition" value={transition} className={buttonClass}
                      role={transition === "activate" || transition === "pause" ? "switch" : undefined}
                      aria-checked={transition === "activate" ? false : transition === "pause" ? true : undefined}
                      aria-label={transition === "activate" || transition === "pause" ? "Semester activation" : undefined}
                      disabled={!transitionsEnabled || (transition === "activate" && readiness.some((item) => !item.ready))}>
                      {PROGRAM_ACTION_LABELS[transition]}
                    </button>
                  ))}
                </div>
              </form>
            )}
          </section>
          <section className="space-y-3 rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="text-lg font-black text-emerald-950">Activation history</h2>
            {program.history.length ? (
              <ul className="divide-y divide-slate-200 text-sm">
                {program.history.map((event) => (
                  <li key={event.revision} className="break-words py-2">
                    <strong>{isProgramStatus(event.from_status) ? PROGRAM_STATUS_LABELS[event.from_status] : event.from_status}
                      {" → "}{isProgramStatus(event.to_status) ? PROGRAM_STATUS_LABELS[event.to_status] : event.to_status}</strong>
                    <p>{event.actorName} · {event.actor_role} · {formatTimestamp(event.occurred_at)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-700">No changes recorded.</p>}
          </section>
        </>
      )}
    </main>
  );
}
