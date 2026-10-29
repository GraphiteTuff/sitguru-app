import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requestStaffRole } from "@/lib/staff-access/actions";

export const dynamic = "force-dynamic";

export default async function StaffAccessPage({ searchParams }: { searchParams?: Promise<{ok?:string;error?:string}> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/staff-access");
  const params = await searchParams;
  const { data: requests } = await supabaseAdmin.from("staff_role_requests")
    .select("id,requested_role,status,requested_at,reviewed_at,review_note")
    .eq("user_id",user.id).order("requested_at",{ascending:false}).limit(10);
  const pending = (requests || []).some((r)=>r.status==="pending" || r.status==="processing");

  return (
    <main className="min-h-screen bg-[#F6FBF8] px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href="/account/settings" className="text-sm font-bold text-emerald-800">← Account settings</Link>
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-800">SitGuru Account</p>
          <h1 className="mt-2 text-3xl font-black">Request staff access</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Staff permissions are never automatic. Your account stays a regular SitGuru account until a SitGuru Super Admin approves your request. Do not use this form to apply for employment.</p>
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">Signed in as {user.email}</p>
          {params?.ok ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{params.ok}</p> : null}
          {params?.error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{params.error}</p> : null}
          {!user.email_confirmed_at ? <p className="mt-4 text-sm font-semibold text-amber-800">Verify your email address before requesting access.</p> : null}
          <form action={requestStaffRole} className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-slate-800">Full name
              <input name="name" required minLength={2} maxLength={120} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="First and last name" />
            </label>
            <label className="block text-sm font-bold text-slate-800">Requested position
              <select name="role" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3">
                <option value="social_community_manager">Social Media & Community Growth Manager</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-800">Reason / hiring reference (optional)
              <textarea name="reason" maxLength={600} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="e.g., Invited to join the growth team" />
            </label>
            <button type="submit" disabled={pending || !user.email_confirmed_at} className="w-full rounded-xl bg-[#0D5C3A] px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400">
              {pending ? "Request awaiting review" : "Submit staff access request"}
            </button>
          </form>
        </div>
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6">
          <h2 className="text-xl font-black">Request history</h2>
          <div className="mt-3 space-y-2">
            {(requests || []).length ? requests!.map((request)=>(
              <div key={request.id} className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold">Social Media & Community Growth Manager · <span className="capitalize">{request.status}</span></p>
                <p className="mt-1 text-xs text-slate-500">Requested {new Date(request.requested_at).toLocaleDateString()}</p>
                {request.review_note ? <p className="mt-2 text-sm text-slate-600">Admin note: {request.review_note}</p> : null}
                {request.status==="approved" ? <Link className="mt-2 inline-block text-sm font-bold text-emerald-800 underline" href="/manager">Open Manager's Desk</Link> : null}
              </div>
            )) : <p className="text-sm text-slate-500">No staff access requests yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
