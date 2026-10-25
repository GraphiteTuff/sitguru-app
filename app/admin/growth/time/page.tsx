import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthCard, GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import { saveManualTime, startWorkTimer, stopWorkTimer } from "@/lib/timekeeper/actions";
import { loadCategories, loadOwnEntries } from "@/lib/timekeeper/data";

export const dynamic = "force-dynamic";

export default async function GrowthTimePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const error = Array.isArray(params.error) ? params.error[0] : params.error || "";
  const [categories, entries] = await Promise.all([
    loadCategories("contractor"),
    loadOwnEntries(access.actor.id),
  ]);
  const timer = entries.find((entry) => entry.timerActive);
  const today = new Date().toISOString().slice(0, 10);
  const todayHours = entries.filter((entry) => entry.workedOn === today).reduce((sum, entry) => sum + entry.hours, 0);
  const approved = entries.filter((entry) => entry.status === "founder_approved" || entry.status === "locked").reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <GrowthPageFrame kicker="Contractor time" title="My time" detail="Record contractor hours here. A founder approves them before they are invoice-ready. This is not payroll.">
      {notice || error ? <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>{error || notice}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <GrowthCard><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Today</p><p className="mt-1 text-3xl font-black">{todayHours}</p></GrowthCard>
        <GrowthCard><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Approved</p><p className="mt-1 text-3xl font-black">{approved}</p></GrowthCard>
      </div>
      <GrowthCard>
        <form action={timer ? stopWorkTimer : startWorkTimer} className="grid gap-2">
          <input type="hidden" name="returnTo" value="/admin/growth/time" />
          {timer ? null : (
            <select name="category" className="min-h-12 rounded-xl border border-emerald-100 px-3">
              {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
          )}
          <button className="min-h-12 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">{timer ? "Stop work" : "Start work"}</button>
        </form>
      </GrowthCard>
      <GrowthCard>
        <form action={saveManualTime} className="grid gap-2">
          <input type="hidden" name="returnTo" value="/admin/growth/time" />
          <input type="date" name="workedOn" required className="min-h-12 rounded-xl border border-emerald-100 px-3" />
          <input name="hours" placeholder="Hours" required className="min-h-12 rounded-xl border border-emerald-100 px-3" />
          <input name="description" placeholder="What you worked on" required className="min-h-12 rounded-xl border border-emerald-100 px-3" />
          <button className="min-h-12 rounded-2xl border border-emerald-200 text-sm font-black text-emerald-900">Save draft</button>
        </form>
      </GrowthCard>
      <div className="grid gap-2">
        {entries.slice(0, 8).map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-emerald-100 bg-white p-3">
            <p className="font-black text-slate-950">{entry.workedOn} · {entry.hours} hrs</p>
            <p className="text-sm font-semibold text-slate-600">{entry.description}</p>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">{entry.status.replaceAll("_", " ")}</p>
          </article>
        ))}
      </div>
      <Link href="/admin/growth" className="text-sm font-black text-emerald-800">Back to Growth</Link>
    </GrowthPageFrame>
  );
}
