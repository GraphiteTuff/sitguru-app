import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requestInternAccess } from "@/lib/internship/intern-access-actions";
import { INTERN_ACCESS_ROLE_LABEL, internAccessLabel } from "@/lib/internship/intern-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternAccessRequestPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login?next=/intern/request");
  const params = searchParams ? await searchParams : {};
  const notice = first(params.ok) || first(params.error);
  const error = Boolean(first(params.error));
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();
  const { data: request } = await supabaseAdmin
    .from("staff_access_requests")
    .select("status,university_name,academic_program")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-lg space-y-4 px-3 py-6">
      <section className="public-dark-section rounded-[1.6rem] p-5" data-brand-green style={{ background: "#0D5C3A" }}>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] !text-white/80">Spring 2027</p>
        <h1 className="mt-1 text-3xl font-black !text-white">{INTERN_ACCESS_ROLE_LABEL}</h1>
        <p className="mt-2 text-sm font-semibold !text-white/90">
          Use the SitGuru account you already have. This does not replace Pet Parent, Guru, or Ambassador access.
        </p>
      </section>
      {notice ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>{notice}</p>
      ) : null}
      {request ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          Current status: {internAccessLabel(String(request.status))}
        </p>
      ) : null}
      <form action={requestInternAccess} className="grid gap-3 rounded-[1.4rem] bg-white p-4 shadow-sm">
        <label className="text-sm font-bold text-slate-950">
          Name
          <input name="fullName" defaultValue={String(profile?.full_name || "")} required className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3" />
        </label>
        <label className="text-sm font-bold text-slate-950">
          University
          <input name="universityName" required defaultValue={String(request?.university_name || "")} className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3" />
        </label>
        <label className="text-sm font-bold text-slate-950">
          Program
          <input name="academicProgram" defaultValue={String(request?.academic_program || "")} className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3" />
        </label>
        <button className="min-h-12 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">Request internship access</button>
      </form>
    </main>
  );
}
