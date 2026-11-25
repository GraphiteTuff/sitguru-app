import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getInternReleasedAssignmentEvaluations } from "@/lib/internship/assignment-evaluations";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { assignmentGrowthPillar, readAssignmentBrief } from "@/lib/internship/manager-assignment";
import { ASSIGNMENT_RUBRIC } from "@/lib/internship/assignment-rubric";
import { GROWTH_PILLARS } from "@/lib/internship/university-syllabus";

export const dynamic = "force-dynamic";

function assignmentStanding(status: string, dueOn: string | null, submittedAt: string | null, today: string) {
  if (status === "excused") return "Excused";
  if (status === "revision_requested") return "Revision requested";
  if (dueOn && submittedAt && submittedAt.slice(0, 10) > dueOn) return "Submitted late";
  if (status === "approved") return "Approved";
  if (status === "submitted") return "Submitted";
  if (dueOn && dueOn < today && !submittedAt) return "Missing";
  return "Ungraded";
}

export default async function InternGradebookPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const data = await loadInternSectionWorkspace();
  if (!data) return <p className="rounded-2xl bg-white p-5">Grades require a linked intern account.</p>;

  const { intern, tasks } = data.workspace;
  const [result, program] = await Promise.all([
    getInternReleasedAssignmentEvaluations(intern.id),
    supabaseAdmin.from("internship_evaluations").select("id,kind,presented_at,payload")
      .eq("intern_id", intern.id).eq("status", "released").in("kind", ["midpoint", "final"])
      .order("created_at", { ascending: false }).limit(30),
  ]);
  const releases = new Map<string, (typeof result.entries)[number]>();
  for (const evaluation of result.entries) {
    if (!releases.has(evaluation.task_id)) releases.set(evaluation.task_id, evaluation);
  }

  const today = new Date().toISOString().slice(0, 10);
  const assignments = tasks.filter((task) => task.internId === intern.id);

  return (
    <div className="space-y-4">
      <header className="rounded-3xl bg-[#10583f] p-5 sm:p-7" data-brand-green>
        <h1 className="text-2xl font-black !text-white sm:text-3xl">My grades</h1>
        <p className="mt-2 text-sm !text-white">SitGuru employer evaluations. Official course grades come from your university.</p>
      </header>
      {result.unavailable ? <p role="alert" className="rounded-xl bg-white p-4 text-sm text-rose-900">Released evaluations are temporarily unavailable.</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {GROWTH_PILLARS.map((pillar) => {
            const scores = assignments.filter((task) => task.status !== "excused" && assignmentGrowthPillar(readAssignmentBrief(task.briefPayload)) === pillar.id)
              .flatMap((task) => {
                const release = releases.get(task.id);
                return release ? [release] : [];
              });
            const earned = scores.reduce((total, score) => total + score.total, 0);
            const possible = scores.reduce((total, score) => total + score.total_possible, 0);
            return (
              <section key={pillar.id} className="rounded-2xl border border-emerald-950/10 bg-white p-4">
                <h2 className="font-black text-emerald-950">{pillar.label}</h2>
                <p className="mt-1 text-sm text-slate-700">{possible ? `${earned} of ${possible} released points` : "No released evaluations"}</p>
              </section>
            );
          })}
        </div>
      )}
      <section className="rounded-2xl border border-emerald-950/10 bg-white p-4 sm:p-6">
        <h2 className="text-xl font-black text-emerald-950">Assignment evaluations</h2>
        {assignments.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {assignments.map((task) => {
              const evaluation = releases.get(task.id);
              return (
                <li key={task.id} className="space-y-2 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/intern/assignments/${encodeURIComponent(task.id)}`} className="inline-flex min-h-11 min-w-0 items-center break-words font-bold text-emerald-900 hover:underline">{task.title}</Link>
                    <p className="text-sm text-slate-700">{assignmentStanding(task.status, task.dueOn, task.submittedAt, today)}</p>
                  </div>
                  {evaluation ? (
                    <details className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <summary className="flex min-h-10 cursor-pointer items-center text-sm font-bold text-slate-900">Released evaluation · {evaluation.total} / {evaluation.total_possible}</summary>
                      <dl className="space-y-1 py-2 text-sm text-slate-800">
                        {ASSIGNMENT_RUBRIC.map(({ title, index }) => (
                          <div key={title} className="flex flex-wrap justify-between gap-x-3">
                            <dt>{title}</dt><dd>{evaluation.scores[index]} / {evaluation.maximums[index]}</dd>
                          </div>
                        ))}
                      </dl>
                      {evaluation.feedback ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{evaluation.feedback}</p> : null}
                    </details>
                  ) : !result.unavailable ? <p className="text-sm text-slate-600">No evaluation released.</p> : null}
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-2 text-sm text-slate-600">No assignments yet.</p>}
      </section>
      <section className="rounded-2xl border border-emerald-950/10 bg-white p-4 sm:p-6">
        <h2 className="text-xl font-black text-emerald-950">Midpoint &amp; final employer evaluations</h2>
        {program.error ? <p role="alert" className="mt-2 text-sm text-rose-900">Program evaluations are temporarily unavailable.</p> :
          program.data?.length ? (
            <ul className="mt-2 space-y-2">
              {program.data.map((entry) => (
                <li key={entry.id} className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-800">
                  <p className="font-bold capitalize">{entry.kind} · {entry.presented_at}</p>
                  <p className="whitespace-pre-wrap break-words">{String(entry.payload?.summary || "")}</p>
                  <p className="whitespace-pre-wrap break-words">{String(entry.payload?.nextSteps || "")}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-slate-600">No program evaluations released.</p>}
      </section>
    </div>
  );
}
