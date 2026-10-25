import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findInternByAccount } from "@/lib/internship/queries";
import { internshipWeekNumber } from "@/lib/internship/process";
import { loadCategories, loadInternTime, loadOwnEntries } from "@/lib/timekeeper/data";
import { saveManualTime, startWorkTimer, stopWorkTimer, submitInternWeek } from "@/lib/timekeeper/actions";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternTimePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login?next=/intern/time");
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  if (!intern) redirect("/intern");
  const params = searchParams ? await searchParams : {};
  const notice = first(params.ok) || first(params.error);
  const error = Boolean(first(params.error));
  const week = internshipWeekNumber(intern.academicStartDate, new Date(), intern.status);
  const required = Number(intern.requiredHours || 0);
  const weeks = Number(intern.internshipWeeks || 15);
  const target = Number(intern.plannedWeeklyHours || 10);
  const [categories, record, running] = await Promise.all([
    loadCategories("intern"),
    loadInternTime({ internId: intern.id, requiredHours: required, weeks, weeklyTarget: target, currentWeek: week }),
    loadOwnEntries(user.id),
  ]);
  const timer = running.find((entry) => entry.timerActive);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4">
      <section className="public-dark-section rounded-[1.6rem] p-5" data-brand-green style={{ background: "#0D5C3A" }}>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] !text-white/80">Employer-verified internship hours</p>
        <h1 className="mt-1 text-3xl font-black !text-white">Week {week || 0} of {weeks}</h1>
        <p className="mt-2 text-sm font-semibold !text-white/90">
          {required > 0 ? `${record?.credit ?? 0} / ${required} approved` : "University hour requirement pending confirmation"}
        </p>
      </section>
      {notice ? <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>{notice}</p> : null}
      {record ? (
        <section className="grid grid-cols-2 gap-2 text-sm">
          {[
            ["Approved", `${record.credit}`],
            ["Remaining", `${record.pace.remaining}`],
            ["Needed / week", `${record.pace.averageNeeded}`],
            ["Pace", record.pace.label],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">{label}</p>
              <p className="mt-1 font-black text-slate-950">{value}</p>
            </div>
          ))}
        </section>
      ) : null}
      {record?.overage.exceeds ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">{record.overage.message}</p> : null}
      <p className="text-sm font-semibold text-slate-600">The {target}-hour week is a planning pace, not a cap. SitGuru does not award academic credit.</p>
      <section className="rounded-[1.4rem] bg-white p-4 shadow-sm">
        <h2 className="font-black text-slate-950">{timer ? "Timer running" : "Start work"}</h2>
        <form action={timer ? stopWorkTimer : startWorkTimer} className="mt-3 grid gap-2">
          <input type="hidden" name="returnTo" value="/intern/time" />
          {timer ? null : (
            <select name="category" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-base font-semibold">
              {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
          )}
          <button className="min-h-12 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">{timer ? "Stop work" : "Start work"}</button>
        </form>
      </section>
      <section className="rounded-[1.4rem] bg-white p-4 shadow-sm">
        <h2 className="font-black text-slate-950">Add time by hand</h2>
        <form action={saveManualTime} className="mt-3 grid gap-2">
          <input type="hidden" name="returnTo" value="/intern/time" />
          <input type="hidden" name="weekNumber" value={week} />
          <input type="date" name="workedOn" required className="min-h-12 rounded-xl border border-emerald-100 px-3" />
          <input name="hours" inputMode="decimal" placeholder="Hours" required className="min-h-12 rounded-xl border border-emerald-100 px-3" />
          <input name="description" placeholder="What you worked on" required className="min-h-12 rounded-xl border border-emerald-100 px-3" />
          <button className="min-h-12 rounded-2xl border border-emerald-200 text-sm font-black text-emerald-900">Save draft</button>
        </form>
      </section>
      <form action={submitInternWeek}>
        <input type="hidden" name="weekNumber" value={week} />
        <textarea name="reflection" rows={2} placeholder="Weekly reflection" className="w-full rounded-xl border border-emerald-100 px-3 py-2" />
        <button className="mt-2 min-h-12 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">Submit this week</button>
      </form>
      <div className="grid gap-2">
        {(record?.entries || running).slice(0, 8).map((entry) => (
          <article key={entry.id} className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="font-black text-slate-950">{entry.workedOn} · {entry.hours} hrs</p>
            <p className="text-sm font-semibold text-slate-600">{entry.description}</p>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">{entry.status.replaceAll("_", " ")}</p>
          </article>
        ))}
      </div>
      <Link href="/intern" className="text-sm font-black text-emerald-800">Back to the intern portal</Link>
    </main>
  );
}
