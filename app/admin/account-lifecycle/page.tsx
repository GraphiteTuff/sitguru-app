import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateSitGuruProfileCompletion } from "@/lib/profileCompletion";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;
type PageProps = { searchParams?: Promise<{ query?: string }> };

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function yesNo(value: unknown) {
  return value ? "Yes" : "No";
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-slate-900">{String(value || "Not provided")}</dd>
    </div>
  );
}

async function findProfile(query: string) {
  const clean = query.trim();
  if (!clean) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
  let request = supabaseAdmin.from("profiles").select("*").limit(1);

  if (isUuid) {
    request = request.eq("id", clean);
  } else {
    request = request.or(`email.ilike.%${clean}%,full_name.ilike.%${clean}%,first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%`);
  }

  const { data } = await request;
  return ((data || [])[0] || null) as AnyRow | null;
}

export default async function AccountLifecyclePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const query = params.query || "";
  const profile = await findProfile(query);
  const userId = asString(profile?.id);

  const [rolesResult, guruResult, ambassadorResult, referralsResult, logsResult] = userId
    ? await Promise.all([
        supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
        supabaseAdmin.from("gurus").select("*").eq("user_id", userId).maybeSingle(),
        supabaseAdmin.from("ambassadors").select("*").eq("user_id", userId).maybeSingle(),
        supabaseAdmin.from("pawperks_account_referral_codes").select("*").eq("account_id", userId).maybeSingle(),
        supabaseAdmin.from("communication_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      ])
    : [null, null, null, null, null];

  const roles = ((rolesResult?.data || []) as AnyRow[]).map((row) => asString(row.role)).filter(Boolean);
  const referralCode = asString((referralsResult?.data as AnyRow | null)?.code) || asString(profile?.referral_code) || asString((ambassadorResult?.data as AnyRow | null)?.referral_code);
  const completion = profile
    ? calculateSitGuruProfileCompletion({
        userId,
        email: asString(profile.email),
        roles,
        profile: { ...profile, referral_code: referralCode },
        guru: (guruResult?.data as AnyRow | null) || null,
        ambassador: (ambassadorResult?.data as AnyRow | null) || null,
      })
    : null;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Account lifecycle diagnostics</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Search by UUID, email, name, or phone to determine whether an incomplete user likely abandoned setup or hit a website/data-wiring issue.</p>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input name="query" defaultValue={query} placeholder="UUID, email, name, or phone" className="h-12 flex-1 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-emerald-400" />
          <button className="h-12 rounded-2xl bg-emerald-700 px-6 text-sm font-black text-white">Search</button>
        </form>
      </section>

      {!query ? null : !profile ? (
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 font-bold text-rose-800">No public profile row was found. If an auth user exists for this search, this is a possible profile creation issue or auth-only signup.</section>
      ) : (
        <>
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-black text-slate-950">Diagnosis</h2>
            <p className="mt-2 text-sm font-bold text-slate-700">Likely issue type: <span className="rounded-full bg-white px-2 py-1 text-amber-800 ring-1 ring-amber-200">{completion?.likely_issue_type}</span></p>
            <p className="mt-2 text-sm font-semibold text-slate-700">Completion: {completion?.completion_percentage}% — Missing: {completion?.missing_required_fields.join(", ") || "None"}</p>
          </section>

          <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Auth user ID / profile ID" value={userId} />
            <Field label="Profile row exists" value={yesNo(profile)} />
            <Field label="Public profile role" value={asString(profile.role) || asString(profile.account_type)} />
            <Field label="All roles" value={completion?.roles.join(", ")} />
            <Field label="Profile name" value={asString(profile.full_name) || `${asString(profile.first_name)} ${asString(profile.last_name)}`} />
            <Field label="Profile email" value={asString(profile.email)} />
            <Field label="Profile phone" value={asString(profile.phone) || asString(profile.phone_number)} />
            <Field label="Profile picture exists" value={yesNo(asString(profile.avatar_url) || asString(profile.profile_photo_url) || asString(profile.photo_url) || asString(profile.image_url))} />
            <Field label="ZIP code exists" value={yesNo(asString(profile.zip_code) || asString(profile.zip) || asString(profile.postal_code))} />
            <Field label="Service area exists" value={yesNo(asString(profile.service_area) || asString(profile.local_area) || asString(profile.city))} />
            <Field label="Referral code exists" value={referralCode || "No"} />
            <Field label="Guru profile exists" value={yesNo(guruResult?.data)} />
            <Field label="Ambassador profile exists" value={yesNo(ambassadorResult?.data)} />
            <Field label="Last updated" value={asString(profile.updated_at)} />
          </dl>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <Link href={`/messages/new?to=${encodeURIComponent(userId)}`} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Message in SitGuru</Link>
              {asString(profile.email) ? <a href={`mailto:${asString(profile.email)}`} className="rounded-xl border border-sky-200 px-4 py-2 text-sm font-black text-sky-700">Email</a> : null}
              {asString(profile.phone) ? <a href={`tel:${asString(profile.phone)}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">Call/Text</a> : null}
              <Link href={completion?.dashboard_url || "/admin"} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">Dashboard URL</Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Communication history</h2>
            <div className="mt-4 space-y-3">
              {((logsResult?.data || []) as AnyRow[]).map((log) => (
                <div key={asString(log.id)} className="rounded-2xl border border-slate-100 p-4 text-sm font-semibold text-slate-700">
                  <p className="font-black text-slate-950">{asString(log.channel)} · {asString(log.status)}</p>
                  <p>{asString(log.subject) || "No subject"}</p>
                  <p className="text-xs text-slate-500">{asString(log.created_at)}</p>
                </div>
              ))}
              {!(logsResult?.data || []).length ? <p className="text-sm font-semibold text-slate-500">No communication logs yet.</p> : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
