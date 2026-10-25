import Link from "next/link";
import { redirect } from "next/navigation";
import { GrowthCard, GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import { resolveMessageReport } from "@/lib/messaging/staff-actions";
import { loadModerationQueue } from "@/lib/messaging/staff-data";

export const dynamic = "force-dynamic";

export default async function MessageModerationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  if (!actor || !canEditRequirements(kind)) redirect("/admin/login?next=/admin/messages/moderation");
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const reports = await loadModerationQueue();
  const open = reports.filter((report) => report.status === "open").length;

  return (
    <main className="mx-auto max-w-3xl px-3 py-4">
      <GrowthPageFrame
        kicker="Communications"
        title="Reports and escalations"
        detail="This queue is for reported, flagged, and escalated messages. Routine conversations stay with the Growth Manager. Message text is not rewritten from here."
      >
        {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          <GrowthCard>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Open reports</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{open}</p>
          </GrowthCard>
          <GrowthCard>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">In the queue</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{reports.length}</p>
          </GrowthCard>
        </div>
        {reports.map((report) => (
          <GrowthCard key={report.id}>
            <p className="font-black text-slate-950">{report.reason || "Report"}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{report.status} · {report.route}</p>
            <form action={resolveMessageReport} className="mt-3 grid gap-2">
              <input type="hidden" name="reportId" value={report.id} />
              <input type="hidden" name="action" value="resolve" />
              <input name="note" placeholder="Moderation note" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
              <button className="min-h-12 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-black !text-white">Resolve report</button>
            </form>
          </GrowthCard>
        ))}
        {!reports.length ? <p className="text-sm font-semibold text-slate-600">No reports are waiting.</p> : null}
        <Link href="/admin/hr" className="text-sm font-black text-emerald-800">Back to HR</Link>
      </GrowthPageFrame>
    </main>
  );
}
