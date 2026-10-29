import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requestTeamAccess } from "@/lib/staff-access/actions";
import { REQUESTABLE_TEAM_ROLES } from "@/lib/staff-access/policy";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

const STATUS_LABEL: Record<string, string> = {
  pending_ceo_review: "Pending CEO Review",
  pending_university_approval: "Pending University Approval",
  approved: "Approved",
  active: "Active",
  denied: "Denied",
  completed: "Completed",
  revoked: "Revoked",
};

export default async function StaffAccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/staff-access");
  const params = searchParams ? await searchParams : {};
  const ok = first(params.ok);
  const error = first(params.error);
  const { data: requests } = await supabaseAdmin
    .from("staff_access_requests")
    .select("id,role_key,status,created_at,decision_note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);
  const pending = (requests || []).some((row) => ["pending_ceo_review", "pending_university_approval", "approved"].includes(String(row.status)));

  return (
    <main className="min-h-screen bg-[#F6FBF8] px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/account/settings" className="text-sm font-bold text-[#0D5C3A]">Account Settings</Link>
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">SitGuru Account</p>
          <h1 className="mt-2 text-3xl font-black text-[#0F2744]">Join the SitGuru Team</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Already part of the pack? Request access to your SitGuru team workspace.</p>
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold">Verified email: {user.email}</p>
          {ok ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">{ok}</p> : null}
          {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{error}</p> : null}
          {!user.email_confirmed_at ? <p className="mt-3 text-sm font-semibold text-amber-800">Verify your email before requesting access.</p> : null}
          <form action={requestTeamAccess} className="mt-4 grid gap-3">
            <label className="text-sm font-bold">Full name
              <input name="name" required minLength={2} maxLength={120} className="mt-1 min-h-12 w-full rounded-xl border px-3" />
            </label>
            <label className="text-sm font-bold">Requested team role
              <select name="role" className="mt-1 min-h-12 w-full rounded-xl border bg-white px-3">
                {REQUESTABLE_TEAM_ROLES.map((role) => <option key={role.key} value={role.key}>{role.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">University, if this is an internship
              <input name="universityName" className="mt-1 min-h-12 w-full rounded-xl border px-3" />
            </label>
            <label className="text-sm font-bold">Program
              <input name="academicProgram" className="mt-1 min-h-12 w-full rounded-xl border px-3" />
            </label>
            <label className="text-sm font-bold">Reason or reference
              <textarea name="reason" maxLength={600} rows={3} className="mt-1 w-full rounded-xl border px-3 py-2" />
            </label>
            <button disabled={pending || !user.email_confirmed_at} className="min-h-12 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white disabled:bg-slate-400">
              {pending ? "Request awaiting review" : "Submit request"}
            </button>
          </form>
        </section>
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6">
          <h2 className="text-xl font-black">Request history</h2>
          <div className="mt-3 grid gap-2">
            {(requests || []).length ? (requests || []).map((request) => {
              const label = REQUESTABLE_TEAM_ROLES.find((role) => role.key === request.role_key)?.label || "Team role";
              return (
                <article key={request.id} className="rounded-xl bg-slate-50 px-3 py-3 text-sm">
                  <p className="font-black text-[#0F2744]">{label}</p>
                  <p className="font-semibold text-slate-600">{STATUS_LABEL[String(request.status)] || request.status}</p>
                  {request.decision_note ? <p className="mt-1 text-slate-600">{request.decision_note}</p> : null}
                </article>
              );
            }) : <p className="text-sm font-semibold text-slate-500">No team requests yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
