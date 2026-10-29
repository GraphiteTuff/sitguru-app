import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { reviewTeamAccess } from "@/lib/staff-access/actions";
import { ceoApproveInternAccess, denyInternAccess, verifyInternUniversity } from "@/lib/internship/intern-access-actions";
import { REQUESTABLE_TEAM_ROLES } from "@/lib/staff-access/policy";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function StaffRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.isSuperUser || !actor.canManageRoles) redirect("/admin");
  const params = searchParams ? await searchParams : {};
  const ok = first(params.ok);
  const error = first(params.error);
  const { data: requests, error: loadError } = await supabaseAdmin
    .from("staff_access_requests")
    .select("id,user_id,email,full_name,role_key,university_name,status,created_at,decision_note")
    .order("created_at", { ascending: false })
    .limit(200);
  const pending = (requests || []).filter((row) => row.status === "pending_ceo_review");

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-8 text-slate-950">
      <Link href="/admin/hr" className="text-sm font-bold text-[#0D5C3A]">Hiring & People</Link>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">Admin HQ · CEO review</p>
        <h1 className="mt-1 text-3xl font-black !text-[#0F2744]">Staff Access Requests</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">{pending.length} waiting for CEO review. A request is not access.</p>
      </div>
      {ok ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">{ok}</p> : null}
      {error || loadError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{error || loadError?.message}</p> : null}
      <div className="grid gap-3">
        {pending.map((request) => {
          const label = REQUESTABLE_TEAM_ROLES.find((role) => role.key === request.role_key)?.label || request.role_key;
          const intern = request.role_key === "social_media_community_growth_intern";
          return (
            <article key={request.id} className="rounded-2xl border border-amber-200 bg-white p-4">
              <h2 className="text-lg font-black">{request.full_name}</h2>
              <p className="text-sm font-semibold text-slate-600">{request.email}</p>
              <p className="mt-2 text-sm font-bold">{label}</p>
              {request.university_name ? <p className="text-sm text-slate-600">{request.university_name}</p> : null}
              <p className="mt-1 text-sm text-slate-600">{request.decision_note || "No reference provided."}</p>
              <p className="mt-1 text-xs text-slate-500">{request.user_id}</p>
              {intern ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={ceoApproveInternAccess}><input type="hidden" name="returnTo" value="/admin/hr/staff-requests" /><input type="hidden" name="requestId" value={request.id} /><button className="rounded-xl bg-[#0D5C3A] px-4 py-2 text-sm font-black !text-white">Approve</button></form>
                  <form action={verifyInternUniversity}><input type="hidden" name="returnTo" value="/admin/hr/staff-requests" /><input type="hidden" name="requestId" value={request.id} /><button className="rounded-xl border px-4 py-2 text-sm font-black">Verify university</button></form>
                  <form action={denyInternAccess}><input type="hidden" name="returnTo" value="/admin/hr/staff-requests" /><input type="hidden" name="requestId" value={request.id} /><button className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-black text-rose-800">Deny</button></form>
                </div>
              ) : (
                <form action={reviewTeamAccess} className="mt-3 grid gap-2">
                  <input type="hidden" name="requestId" value={request.id} />
                  <textarea name="note" rows={2} maxLength={500} placeholder="Review note" className="rounded-xl border px-3 py-2 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    <button name="decision" value="approve" className="rounded-xl bg-[#0D5C3A] px-4 py-2 text-sm font-black !text-white">Approve</button>
                    <button name="decision" value="deny" className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-black text-rose-800">Deny</button>
                  </div>
                </form>
              )}
            </article>
          );
        })}
        {!pending.length ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600">No pending staff requests.</p> : null}
      </div>
    </main>
  );
}
