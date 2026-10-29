import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { reviewStaffRoleRequest } from "@/lib/staff-access/actions";

export const dynamic = "force-dynamic";

export default async function StaffRequestsPage({searchParams}: {searchParams?:Promise<{ok?:string;error?:string}>}) {
  const actor = await getAdminIdentity();
  if (!actor?.isSuperUser || !actor.canManageRoles) redirect("/admin");
  const params = await searchParams;
  const {data: requests,error} = await supabaseAdmin.from("staff_role_requests")
    .select("id,user_id,email,full_name,requested_role,reason,status,requested_at,reviewed_at,review_note")
    .order("requested_at",{ascending:false}).limit(200);
  const pending=(requests||[]).filter(r=>r.status==="pending");
  const processed=(requests||[]).filter(r=>r.status!=="pending");
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 text-slate-950">
      <Link href="/admin/hr" className="text-sm font-bold text-emerald-800">← Hiring & People</Link>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Admin HQ · CEO review</p>
        <h1 className="mt-2 text-3xl font-black">Staff access requests</h1>
        <p className="mt-2 text-sm text-slate-600">Review a verified user's request before granting a staff role. A request is never permission by itself.</p>
      </div>
      {params?.ok ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{params.ok}</p>:null}
      {params?.error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{params.error}</p>:null}
      {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Unable to load requests. Check that the database migration has been applied.</p>:null}
      <h2 className="text-xl font-black">Pending review ({pending.length})</h2>
      {pending.length ? <div className="grid gap-4">{pending.map(r=>(
        <div key={r.id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h3 className="text-lg font-black">{r.full_name}</h3><p className="text-sm text-slate-600">{r.email}</p></div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">Pending</span>
          </div>
          <p className="mt-3 text-sm font-bold">Social Media & Community Growth Manager</p>
          <p className="mt-1 text-sm text-slate-600">{r.reason || "No hiring reference provided."}</p>
          <p className="mt-2 text-xs text-slate-500">Requested {new Date(r.requested_at).toLocaleString()} · account {r.user_id}</p>
          <form action={reviewStaffRoleRequest} className="mt-4 space-y-3">
            <input name="requestId" type="hidden" value={r.id}/>
            <label className="block text-sm font-bold">Review note (optional)
              <textarea name="note" rows={2} maxLength={500} className="mt-1 w-full rounded-xl border border-slate-200 p-3" placeholder="Reason for approval or denial"/>
            </label>
            <div className="flex flex-wrap gap-2">
              <button name="decision" value="approve" className="rounded-xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white">Approve staff access</button>
              <button name="decision" value="deny" className="rounded-xl border border-rose-200 px-5 py-3 text-sm font-black text-rose-800">Deny request</button>
            </div>
          </form>
        </div>
      ))}</div>:<p className="rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-slate-600">No pending staff requests.</p>}
      <h2 className="text-xl font-black">Review history</h2>
      <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="p-3">Person</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3">Note</th></tr></thead>
          <tbody>{processed.slice(0,50).map(r=><tr key={r.id} className="border-t border-slate-100"><td className="p-3">{r.full_name}<div className="text-xs text-slate-500">{r.email}</div></td><td className="p-3">Growth Manager</td><td className="p-3 capitalize">{r.status}</td><td className="p-3">{new Date(r.reviewed_at||r.requested_at).toLocaleDateString()}</td><td className="p-3">{r.review_note||"—"}</td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
