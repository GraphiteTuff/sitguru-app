import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import {
  ceoApproveInternAccess,
  completeInternAccess,
  denyInternAccess,
  revokeInternAccess,
  verifyInternUniversity,
} from "@/lib/internship/intern-access-actions";
import { INTERN_ACCESS_ROLE_LABEL, internAccessLabel } from "@/lib/internship/intern-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function StaffAccessRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin || (isGrowthOnlyRole(actor.role) && !actor.isSuperUser)) {
    redirect("/admin/login?next=/admin/hr/access-requests");
  }
  const params = searchParams ? await searchParams : {};
  const notice = first(params.ok) || first(params.error);
  const error = Boolean(first(params.error));
  const { data } = await supabaseAdmin
    .from("staff_access_requests")
    .select("id,full_name,email,university_name,academic_program,status,created_at")
    .eq("role_key", "social_media_community_growth_intern")
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-3 py-6">
      <Link href="/admin/hr" className="text-sm font-bold text-[#2563EB]">Hiring & People</Link>
      <h1 className="text-3xl font-black text-slate-950">Staff Access Requests</h1>
      <p className="text-sm font-semibold text-slate-600">
        {INTERN_ACCESS_ROLE_LABEL} requests stay on the student&apos;s existing SitGuru account. CEO review comes first. University verification opens the Intern Portal.
      </p>
      {notice ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>{notice}</p>
      ) : null}
      <div className="grid gap-3">
        {(data || []).map((row) => (
          <article key={row.id} className="rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="font-black text-slate-950">{row.full_name}</p>
            <p className="text-sm font-semibold text-slate-600">{row.email}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{row.university_name}{row.academic_program ? ` · ${row.academic_program}` : ""}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">{internAccessLabel(String(row.status))}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {row.status === "pending_ceo_review" ? (
                <form action={ceoApproveInternAccess}><input type="hidden" name="requestId" value={row.id} /><button className="min-h-11 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-black !text-white">CEO approve</button></form>
              ) : null}
              {row.status === "pending_university_approval" ? (
                <form action={verifyInternUniversity}><input type="hidden" name="requestId" value={row.id} /><button className="min-h-11 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-black !text-white">Verify university</button></form>
              ) : null}
              {row.status === "approved" || row.status === "active" ? (
                <form action={completeInternAccess}><input type="hidden" name="requestId" value={row.id} /><button className="min-h-11 rounded-2xl border border-emerald-200 px-3 text-sm font-black text-emerald-900">Mark completed</button></form>
              ) : null}
              {row.status !== "denied" && row.status !== "completed" ? (
                <form action={row.status === "active" || row.status === "approved" ? revokeInternAccess : denyInternAccess}>
                  <input type="hidden" name="requestId" value={row.id} />
                  <button className="min-h-11 rounded-2xl border border-rose-200 px-3 text-sm font-black text-rose-800">{row.status === "active" || row.status === "approved" ? "Revoke access" : "Deny"}</button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
        {!data?.length ? <p className="text-sm font-semibold text-slate-600">No internship access requests yet.</p> : null}
      </div>
    </main>
  );
}
