import Link from "next/link";
import { Mail, MessageCircle, Phone, Search, ShieldAlert } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateSitGuruProfileCompletion } from "@/lib/profileCompletion";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type PageProps = {
  searchParams?: Promise<{
    role?: string;
    issue?: string;
    missing?: string;
    q?: string;
  }>;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getName(profile: AnyRow | null) {
  const fullName = asString(profile?.full_name) || asString(profile?.name);
  if (fullName) return fullName;
  return [asString(profile?.first_name), asString(profile?.last_name)].filter(Boolean).join(" ") || "SitGuru User";
}

function getPhoto(profile: AnyRow | null) {
  return asString(profile?.avatar_url) || asString(profile?.profile_photo_url) || asString(profile?.photo_url) || asString(profile?.image_url);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SG";
}

function getField(row: AnyRow | null, keys: string[]) {
  for (const key of keys) {
    const value = asString(row?.[key]);
    if (value) return value;
  }
  return "";
}

async function getRows() {
  const [profilesResult, rolesResult, gurusResult, ambassadorsResult, referralCodesResult, logsResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000),
    supabaseAdmin.from("user_roles").select("user_id, role"),
    supabaseAdmin.from("gurus").select("*").limit(1000),
    supabaseAdmin.from("ambassadors").select("*").limit(1000),
    supabaseAdmin.from("pawperks_account_referral_codes").select("account_id, code, status"),
    supabaseAdmin.from("communication_logs").select("user_id, created_at, status, channel").order("created_at", { ascending: false }).limit(2000),
  ]);

  const roleMap = new Map<string, string[]>();
  ((rolesResult.data || []) as AnyRow[]).forEach((row) => {
    const userId = asString(row.user_id);
    const role = asString(row.role);
    if (!userId || !role) return;
    roleMap.set(userId, [...(roleMap.get(userId) || []), role]);
  });

  const guruMap = new Map<string, AnyRow>();
  ((gurusResult.data || []) as AnyRow[]).forEach((row) => {
    const userId = asString(row.user_id);
    if (userId) guruMap.set(userId, row);
  });

  const ambassadorMap = new Map<string, AnyRow>();
  ((ambassadorsResult.data || []) as AnyRow[]).forEach((row) => {
    const userId = asString(row.user_id);
    if (userId) ambassadorMap.set(userId, row);
  });

  const referralMap = new Map<string, string>();
  ((referralCodesResult.data || []) as AnyRow[]).forEach((row) => {
    const userId = asString(row.account_id);
    const code = asString(row.code);
    if (userId && code) referralMap.set(userId, code);
  });

  const contactMap = new Map<string, AnyRow>();
  ((logsResult.data || []) as AnyRow[]).forEach((row) => {
    const userId = asString(row.user_id);
    if (userId && !contactMap.has(userId)) contactMap.set(userId, row);
  });

  return ((profilesResult.data || []) as AnyRow[]).map((profile) => {
    const userId = asString(profile.id);
    const guru = guruMap.get(userId) || null;
    const ambassador = ambassadorMap.get(userId) || null;
    const roles = roleMap.get(userId) || [asString(profile.role)].filter(Boolean);
    const referralCode = referralMap.get(userId) || asString(profile.referral_code) || asString(ambassador?.referral_code);
    const completion = calculateSitGuruProfileCompletion({
      userId,
      email: asString(profile.email),
      roles,
      profile: { ...profile, referral_code: referralCode },
      guru,
      ambassador,
      hasPricing: Boolean(asString(guru?.hourly_rate) || asString(guru?.rate) || asString(guru?.price)),
      hasAvailability: Boolean(guru?.has_availability || guru?.availability_enabled),
    });

    return {
      userId,
      profile,
      guru,
      ambassador,
      completion,
      lastContact: contactMap.get(userId) || null,
      name: getName(profile),
      email: getField(profile, ["email", "contact_email", "login_email"]),
      phone: getField(profile, ["phone", "phone_number", "mobile_phone"]),
      zip: getField(profile, ["zip_code", "zip", "postal_code"]),
      serviceArea: getField(profile, ["service_area", "local_area", "community_area", "city"]),
      photo: getPhoto(profile),
      referralCode,
      createdAt: asString(profile.created_at),
      updatedAt: asString(profile.updated_at),
    };
  }).filter((row) => row.completion.completion_status !== "complete");
}

export default async function AdminIncompleteProfilesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const rows = await getRows();
  const filteredRows = rows.filter((row) => {
    const q = asString(params.q).toLowerCase();
    if (q && !`${row.name} ${row.email} ${row.phone} ${row.userId}`.toLowerCase().includes(q)) return false;
    if (params.role && !row.completion.roles.includes(params.role)) return false;
    if (params.issue && row.completion.likely_issue_type !== params.issue) return false;
    if (params.missing && !row.completion.missing_required_fields.some((field) => field.toLowerCase().includes(String(params.missing).toLowerCase()))) return false;
    return true;
  });

  const issueTypes = Array.from(new Set(rows.map((row) => row.completion.likely_issue_type))).sort();

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
              <ShieldAlert className="h-4 w-4" /> Possible website issue detection
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Incomplete SitGuru profiles</h1>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-700">
              This page uses the shared completion checker to separate likely user abandonment from missing profile records, role mismatches, and other data-wiring problems.
            </p>
          </div>
          <div className="grid gap-2 text-sm font-black text-slate-800 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-100">{rows.length}<br /><span className="text-xs text-slate-500">Incomplete</span></div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-100">{rows.filter((row) => row.completion.likely_issue_type.includes("missing") || row.completion.likely_issue_type.includes("role")).length}<br /><span className="text-xs text-slate-500">Possible tech issues</span></div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-100">{rows.filter((row) => !row.lastContact).length}<br /><span className="text-xs text-slate-500">Not contacted</span></div>
          </div>
        </div>
      </section>

      <form className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={params.q || ""} placeholder="Search UUID, email, name, phone" className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-400" />
        </label>
        <select name="role" defaultValue={params.role || ""} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">
          <option value="">All roles</option>
          <option value="pet_parent">Pet Parent</option>
          <option value="guru">Guru</option>
          <option value="ambassador">Ambassador</option>
        </select>
        <select name="issue" defaultValue={params.issue || ""} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">
          <option value="">All issue types</option>
          {issueTypes.map((issue) => <option key={issue} value={issue}>{issue}</option>)}
        </select>
        <select name="missing" defaultValue={params.missing || ""} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">
          <option value="">All missing fields</option>
          <option value="profile picture">Missing photo</option>
          <option value="phone">Missing phone</option>
          <option value="ZIP">Missing ZIP</option>
          <option value="service">Missing service area</option>
          <option value="referral">Missing referral code</option>
        </select>
        <button className="h-11 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white">Filter</button>
      </form>

      <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1350px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">ZIP / Area</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Missing</th>
                <th className="px-4 py-3">Issue type</th>
                <th className="px-4 py-3">Referral</th>
                <th className="px-4 py-3">Last contacted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.userId} className="align-top">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-sm font-black text-emerald-800 ring-1 ring-emerald-100">
                        {row.photo ? <img src={row.photo} alt="" className="h-full w-full object-cover" /> : getInitials(row.name)}
                      </div>
                      <div>
                        <p className="font-black text-slate-950">{row.name}</p>
                        <p className="text-xs font-semibold text-slate-500">Signed up {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "unknown"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-700">{row.completion.roles.join(", ")}</td>
                  <td className="px-4 py-4 text-xs font-semibold leading-5 text-slate-700"><div>{row.email || "Missing email"}</div><div>{row.phone || "Missing phone"}</div></td>
                  <td className="px-4 py-4 text-xs font-semibold leading-5 text-slate-700"><div>{row.zip || "Missing ZIP"}</div><div>{row.serviceArea || "Missing area"}</div></td>
                  <td className="px-4 py-4"><div className="font-black text-slate-950">{row.completion.completion_percentage}%</div><div className="mt-1 h-2 w-28 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${row.completion.completion_percentage}%` }} /></div></td>
                  <td className="px-4 py-4"><div className="flex max-w-sm flex-wrap gap-1">{row.completion.missing_required_fields.map((field) => <span key={field} className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-700 ring-1 ring-rose-100">{field}</span>)}</div></td>
                  <td className="px-4 py-4"><span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-800 ring-1 ring-amber-100">{row.completion.likely_issue_type}</span></td>
                  <td className="px-4 py-4 text-xs font-black text-slate-700">{row.referralCode || "Missing"}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">{row.lastContact ? `${asString(row.lastContact.channel)} ${new Date(asString(row.lastContact.created_at)).toLocaleString()}` : "Not contacted"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/account-lifecycle?query=${encodeURIComponent(row.userId)}`} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-slate-700">Lifecycle</Link>
                      <Link href={`/messages/new?to=${encodeURIComponent(row.userId)}`} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-black text-emerald-700"><MessageCircle className="mr-1 inline h-3 w-3" />Message</Link>
                      {row.email ? <a href={`mailto:${row.email}?subject=${encodeURIComponent("Need help finishing your SitGuru profile?")}`} className="rounded-lg border border-sky-200 px-2 py-1 text-xs font-black text-sky-700"><Mail className="mr-1 inline h-3 w-3" />Email</a> : null}
                      {row.phone ? <a href={`tel:${row.phone}`} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-slate-700"><Phone className="mr-1 inline h-3 w-3" />Call</a> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
