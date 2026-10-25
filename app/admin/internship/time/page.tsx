import Link from "next/link";
import { redirect } from "next/navigation";
import { GrowthCard, GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import { findInternById } from "@/lib/internship/queries";
import { founderApproveWeeks } from "@/lib/timekeeper/actions";
import { loadFounderQueue } from "@/lib/timekeeper/data";

export const dynamic = "force-dynamic";

export default async function FounderTimePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  if (!actor || !canEditRequirements(kind)) redirect("/admin/login?next=/admin/internship/time");
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const queue = await loadFounderQueue();
  const named = await Promise.all(queue.map(async (week) => {
    const intern = await findInternById(week.internId);
    return { ...week, name: intern?.fullName || "Intern" };
  }));

  return (
    <main className="mx-auto max-w-3xl px-3 py-4">
      <GrowthPageFrame kicker="Founder approval" title="Hours waiting for final approval" detail="Only manager-recommended weeks are here. Approving them makes the hours official employer-verified internship time.">
        {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p> : null}
        {named.map((week) => (
          <GrowthCard key={week.id}>
            <h2 className="text-lg font-black text-slate-950">{week.name}</h2>
            <p className="text-sm font-semibold text-slate-600">Week {week.weekNumber} · Manager recommended</p>
          </GrowthCard>
        ))}
        {!named.length ? <p className="text-sm font-semibold text-slate-600">Nothing is waiting.</p> : (
          <form action={founderApproveWeeks} className="grid gap-2">
            <input type="hidden" name="weekIds" value={named.map((week) => week.id).join(",")} />
            <input name="exception" placeholder="Exception note, only if a week would pass the hour cap" className="min-h-12 rounded-xl border border-emerald-100 px-3" />
            <button className="min-h-12 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">Approve reviewed hours</button>
          </form>
        )}
        <Link href="/admin/internship" className="text-sm font-black text-emerald-800">Back to the internship program</Link>
      </GrowthPageFrame>
    </main>
  );
}
