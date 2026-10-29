import { approveOutreach } from "@/lib/manager-growth/actions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";

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
    </main>
  );
}
