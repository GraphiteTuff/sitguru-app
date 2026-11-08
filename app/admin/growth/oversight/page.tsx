import Link from "next/link";
import { approveOutreach } from "@/lib/manager-growth/actions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerContentStudio, studioRowLabel } from "@/lib/internship/content-studio-actions";

export const dynamic = "force-dynamic";

export default async function GrowthOversightPage() {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  const { data } = await supabaseAdmin
    .from("manager_work_outreach")
    .select("id,partner_name,commitment,status,leadership_approved,next_action")
    .eq("leadership_approved", false)
    .limit(40);
  const waiting = (data || []).filter((row) => String(row.status) === "Needs leadership approval" || ["Contract", "Sponsorship", "Financial arrangement", "Legal agreement", "Major company partnership"].includes(String(row.commitment)));
  const studio = await loadManagerContentStudio(access.actor.id, true);
  const escalated = studio.items.filter((item) => studioRowLabel(item).action === "CEO review");
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-3xl font-black text-[#0F2744]">Growth oversight</h1>
      <p className="text-sm font-medium text-slate-600">Leadership sees commitments that need approval. Ordinary campaigns, polls, and outreach notes do not wait here.</p>
      <ul className="space-y-3">
        {waiting.map((row) => (
          <li key={String(row.id)} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-black text-[#0F2744]">{String(row.partner_name)}</p>
            <p className="text-sm text-slate-600">{String(row.commitment)} · {String(row.status)}</p>
            {access.actor.isSuperUser ? (
              <form action={approveOutreach} className="mt-2">
                <input type="hidden" name="id" value={String(row.id)} />
                <button className="min-h-10 rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">Approve activity</button>
              </form>
            ) : <p className="mt-2 text-sm font-semibold text-amber-800">Waiting for leadership approval.</p>}
          </li>
        ))}
        {!waiting.length ? <li className="text-sm text-slate-500">Nothing is waiting for a formal commitment.</li> : null}
      </ul>
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-black text-[#0F2744]">Content escalations</h2>
        <p className="mt-1 text-sm text-slate-600">Managers approve ordinary posts. Only escalated content is listed here.</p>
        <ul className="mt-3 space-y-2">
          {escalated.map((item) => (
            <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span className="font-black text-slate-950">{item.title}</span>
              <span className="text-slate-600"> · {item.internName}</span>
            </li>
          ))}
          {!escalated.length ? <li className="text-sm text-slate-500">No content is escalated.</li> : null}
        </ul>
        <Link href="/manager/campaigns-content" className="mt-3 inline-flex text-sm font-black text-[#1D4ED8]">Open Content Studio</Link>
      </section>
    </main>
  );
}
