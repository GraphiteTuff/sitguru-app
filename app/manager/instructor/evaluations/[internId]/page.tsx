import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramEvaluationAccess } from "@/lib/internship/program-evaluation-access";
import { saveProgramEvaluation } from "@/lib/internship/program-evaluation-actions";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ProgramEvaluationPage({ params, searchParams }: {
  params: Promise<{ internId: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { internId } = await params;
  const access = await getProgramEvaluationAccess(internId);
  if (!access) notFound();
  const [flash, { data, error }] = await Promise.all([
    searchParams,
    supabaseAdmin.from("internship_evaluations").select("id,kind,status,payload,created_at")
      .eq("intern_id", internId).in("kind", ["midpoint", "final"]).order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <Link href="/manager/instructor" className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-900 underline">Instructor Center</Link>
      <h1 className="text-2xl font-black text-emerald-950">Employer evaluations · {access.intern.fullName}</h1>
      {flash.error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{flash.error}</p> : null}
      {flash.ok ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{flash.ok}</p> : null}
      <p className="text-sm text-slate-700">Record midpoint and final employer evaluations. The Internship Supervisor releases final evaluations.</p>
      {access.kind === "supervisor" ? (
        <a href={`/api/manager/instructor/evaluations/${internId}/export`} className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-900 underline">Download university reporting CSV</a>
      ) : null}
      <form action={saveProgramEvaluation} className="space-y-3">
        <input type="hidden" name="internId" value={internId} />
        <input type="hidden" name="requestId" value={randomUUID()} />
        <label className="block text-sm font-semibold">
          Evaluation period
          <select name="evaluationKind" className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base">
            <option value="midpoint">Midpoint</option>
            <option value="final">Final</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Summary
          <textarea name="summary" rows={5} maxLength={4000} required className="mt-1 block w-full rounded-xl border border-slate-300 p-3 text-base" />
        </label>
        <label className="block text-sm font-semibold">
          Next steps
          <textarea name="nextSteps" rows={3} maxLength={4000} className="mt-1 block w-full rounded-xl border border-slate-300 p-3 text-base" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button name="intent" value="draft" className="min-h-12 rounded-xl border border-emerald-900 px-4 text-sm font-bold text-emerald-900">Save draft</button>
          <button name="intent" value="released" className="min-h-12 rounded-xl bg-emerald-900 px-4 text-sm font-bold !text-white">Release evaluation</button>
        </div>
      </form>
      <section className="border-t border-slate-200 pt-4">
        <h2 className="font-black text-emerald-950">Evaluation history</h2>
        {error ? <p role="alert" className="mt-2 text-sm text-rose-900">Evaluation history is temporarily unavailable.</p> :
          data?.length ? (
            <ul className="mt-2 space-y-2">
              {data.map((entry) => (
                <li key={entry.id} className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-800">
                  <p className="font-bold capitalize">{entry.kind} · {entry.status} · {String(entry.created_at).slice(0, 10)}</p>
                  <p className="whitespace-pre-wrap break-words">{String(entry.payload?.summary || "")}</p>
                  <p className="whitespace-pre-wrap break-words">{String(entry.payload?.nextSteps || "")}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-slate-600">No evaluations recorded.</p>}
      </section>
    </div>
  );
}
