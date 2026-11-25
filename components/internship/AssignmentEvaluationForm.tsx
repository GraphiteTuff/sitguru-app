import { randomUUID } from "node:crypto";
import { saveAssignmentEvaluation } from "@/lib/internship/assignment-evaluation-actions";
import { ASSIGNMENT_RUBRIC } from "@/lib/internship/assignment-rubric";
import type { listInstructorAssignmentEvaluations } from "@/lib/internship/assignment-evaluations";

const inputClass = "mt-1 block min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base";
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export default function AssignmentEvaluationForm({
  taskId, internId, submittedAt, canCustomize, canEvaluate, entries, unavailable,
}: Awaited<ReturnType<typeof listInstructorAssignmentEvaluations>> & {
  taskId: string;
  internId: string;
  submittedAt: string;
  canCustomize: boolean;
  canEvaluate: boolean;
}) {
  const latest = entries[0];
  const current = latest?.evaluated_submission_at === (submittedAt || null) ? latest : null;

  return (
    <section id="evaluation" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 className="text-xl font-black text-slate-950">Employer evaluation</h2>
      {unavailable ? <p role="alert" className="mt-2 text-sm text-rose-900">Evaluations are temporarily unavailable.</p> :
        !canEvaluate ? <p className="mt-2 text-sm text-slate-700">Scores can be saved after the intern submits work.</p> : (
          <form action={saveAssignmentEvaluation} className="mt-4 space-y-3">
            <input type="hidden" name="evaluationRequestId" value={randomUUID()} />
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="internId" value={internId} />
            <input type="hidden" name="evaluatedSubmissionAt" value={submittedAt} />
            <div className="grid gap-3 sm:grid-cols-2">
              {ASSIGNMENT_RUBRIC.map(({ title, description, index, defaultMaximum }) => {
                const maximum = latest?.maximums[index] ?? defaultMaximum;
                return (
                  <fieldset key={title} className="min-w-0 rounded-xl border border-slate-200 p-3">
                    <legend className="px-1 text-sm font-bold">{title}</legend>
                    <p className="text-sm text-slate-700">{description}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="text-sm font-semibold">
                        Score
                        <input name={`score-${index}`} type="number" min={0} max={canCustomize ? 1000 : maximum}
                          defaultValue={current?.scores[index]} required className={inputClass} />
                      </label>
                      <label className="text-sm font-semibold">
                        Maximum
                        <input name={`maximum-${index}`} type="number" min={1} max={1000}
                          defaultValue={maximum} required readOnly={!canCustomize} className={inputClass} />
                      </label>
                    </div>
                  </fieldset>
                );
              })}
            </div>
            <label className="block text-sm font-semibold">
              Feedback for the intern
              <textarea name="feedback" rows={3} maxLength={4000} defaultValue={current?.feedback} className={inputClass} />
            </label>
            <label className="block text-sm font-semibold">
              Private instructor notes
              <textarea name="privateNotes" rows={3} maxLength={4000} defaultValue={current?.private_notes} className={inputClass} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button name="evaluationIntent" value="draft" className="min-h-12 rounded-xl border border-emerald-900 px-4 py-2 text-sm font-bold text-emerald-900">Save evaluation draft</button>
              <button name="evaluationIntent" value="release" className="min-h-12 rounded-xl bg-emerald-900 px-4 py-2 text-sm font-bold !text-white">Release evaluation</button>
            </div>
          </form>
        )}
      {entries.length ? (
        <details className="mt-4 rounded-xl border border-slate-200 p-3">
          <summary className="cursor-pointer font-bold">Evaluation history</summary>
          <ul className="mt-2 space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                <p className="font-bold">{entry.released_at ? "Released" : "Draft"} · {entry.total} / {entry.total_possible} · {dateFormat.format(new Date(entry.created_at))}</p>
                {entry.feedback ? <p className="mt-1 whitespace-pre-wrap break-words">{entry.feedback}</p> : null}
                {entry.private_notes ? <p className="mt-1 whitespace-pre-wrap break-words">Private notes · {entry.private_notes}</p> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
