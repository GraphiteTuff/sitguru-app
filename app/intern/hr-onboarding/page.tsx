import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { listCompensationRates } from "@/lib/staff-time/engagement";
import { currentRate } from "@/lib/staff-time/rates";
import { isoToday } from "@/lib/staff-time/periods";
import { saveStaffPersonalProfile } from "./actions";
import SecureProfileSubmitButton from "./SecureProfileSubmitButton";

export const dynamic = "force-dynamic";

const INPUT = "mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0F2744] focus:border-emerald-500 focus:outline-none";
const LABEL = "block text-xs font-black uppercase tracking-[0.08em] text-slate-600";

function first(raw: string | string[] | undefined) {
  return Array.isArray(raw) ? raw[0] : raw || "";
}

export default async function PaidInternHrOnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/intern/login?next=/intern/hr-onboarding");

  const [internRow, engagementRow, profileRow] = await Promise.all([
    supabaseAdmin.from("internship_interns")
      .select("id,full_name,internship_title,status,portal_enabled")
      .eq("user_id", user.id).eq("portal_enabled", true).limit(1).maybeSingle(),
    supabaseAdmin.from("staff_engagements")
      .select("id,title,employment_classification,w9_status")
      .eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle(),
    supabaseAdmin.from("staff_personal_profiles")
      .select("legal_name,preferred_name,contact_email,phone,address_line1,address_line2,city,state,postal_code,primary_work_state,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship,submitted_at")
      .eq("user_id", user.id).maybeSingle(),
  ]);
  const intern = internRow.data;
  const engagement = engagementRow.data;
  if (!intern || !engagement ||
      !["active", "approved", "accepted"].includes(String(intern.status))) {
    redirect("/intern");
  }

  const rates = await listCompensationRates(String(engagement.id));
  const rate = currentRate(rates, isoToday());
  const profile = profileRow.data;
  const complete = Boolean(profile?.submitted_at);
  const params = searchParams ? await searchParams : {};
  const ok = first(params.ok);
  const error = first(params.error);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-3 py-5 pb-24 sm:px-6">
      <section className="rounded-[1.75rem] bg-[#0F2744] p-5 text-white sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.15em] !text-emerald-200">SitGuru · Paid team onboarding</p>
        <h1 className="mt-2 text-2xl font-black !text-white sm:text-3xl">My secure HR forms</h1>
        <p className="mt-3 text-sm font-semibold leading-6 !text-white/90">
          Welcome, {intern.full_name}. Your Spring 2027 academic onboarding is already on file.
          This page is for separate paid-work HR information.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black !text-white">
            {rate ? "$" + (rate.hourlyRateCents / 100).toFixed(2) + "/hour" : "Rate under review"}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black !text-white">
            Personal sheet: {complete ? "Submitted" : "Action needed"}
          </span>
        </div>
      </section>

      {ok || error ? (
        <p role="status" className={ok
          ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900"
          : "rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900"}>
          {ok || error}
        </p>
      ) : null}

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-black text-[#0F2744]">HR onboarding checklist</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            {
              title: "Personal information sheet",
              status: complete ? "Received by SitGuru HR" : "Ready to complete below",
              done: complete,
            },
            {
              title: "Compensation agreement",
              status: "Awaiting classification / HR review",
              done: false,
            },
            {
              title: "Tax and payment setup",
              status: "Not requested; secure instructions will follow",
              done: false,
            },
            {
              title: "Intern confidentiality & access",
              status: "Managed separately in academic onboarding",
              done: true,
            },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-slate-100 bg-[#F7FAFC] p-3">
              <p className="text-sm font-black text-[#0F2744]">{step.title}</p>
              <p className={step.done
                ? "mt-1 text-xs font-bold text-emerald-800"
                : "mt-1 text-xs font-bold text-amber-800"}>{step.status}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
          Your hourly compensation record is separate from academic course credit.
          Work classification is still being reviewed by SitGuru, so no W-9 or other
          tax-status document is being requested through this page.
        </p>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#0F2744]">Personal information sheet</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              {complete ? "Submitted. You may update your information when it changes." :
                "Please complete this once for your confidential SitGuru HR record."}
            </p>
          </div>
          {complete ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">Received</span>
          ) : null}
        </div>
        <form action={saveStaffPersonalProfile} className="mt-5 space-y-5">
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-black text-[#0F2744]">Contact details</legend>
            <label className={LABEL}>Full legal name
              <input className={INPUT} name="legalName" defaultValue={profile?.legal_name || intern.full_name} maxLength={120} required autoComplete="name" />
            </label>
            <label className={LABEL}>Preferred name (optional)
              <input className={INPUT} name="preferredName" defaultValue={profile?.preferred_name || ""} maxLength={100} autoComplete="nickname" />
            </label>
            <label className={LABEL}>Account email (verified)
              <input className={INPUT + " bg-slate-50"} value={user.email || ""} readOnly aria-readonly="true" />
            </label>
            <label className={LABEL}>Mobile phone
              <input className={INPUT} name="phone" defaultValue={profile?.phone || ""} maxLength={40} type="tel" autoComplete="tel" required placeholder="(555) 555-5555" />
            </label>
          </fieldset>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-black text-[#0F2744]">Mailing and remote work location</legend>
            <label className={LABEL + " sm:col-span-2"}>Street address
              <input className={INPUT} name="address1" defaultValue={profile?.address_line1 || ""} maxLength={180} autoComplete="address-line1" required />
            </label>
            <label className={LABEL + " sm:col-span-2"}>Apartment / unit (optional)
              <input className={INPUT} name="address2" defaultValue={profile?.address_line2 || ""} maxLength={180} autoComplete="address-line2" />
            </label>
            <label className={LABEL}>City
              <input className={INPUT} name="city" defaultValue={profile?.city || "Manalapan"} maxLength={90} autoComplete="address-level2" required />
            </label>
            <label className={LABEL}>State abbreviation
              <input className={INPUT} name="state" defaultValue={profile?.state || "NJ"} maxLength={2} autoComplete="address-level1" required placeholder="NJ" />
            </label>
            <label className={LABEL}>ZIP code
              <input className={INPUT} name="zip" defaultValue={profile?.postal_code || ""} maxLength={10} autoComplete="postal-code" required inputMode="numeric" placeholder="12345" />
            </label>
            <label className={LABEL}>State where you physically perform SitGuru work
              <input className={INPUT} name="workState" defaultValue={profile?.primary_work_state || "NJ"} maxLength={2} required placeholder="NJ" />
            </label>
          </fieldset>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-black text-[#0F2744]">Emergency contact (optional)</legend>
            <p className="mb-2 text-xs font-semibold text-slate-500 sm:col-span-2">
              This is voluntary. You may leave all emergency contact fields blank.
            </p>
            <label className={LABEL}>Contact name
              <input className={INPUT} name="emergencyName" defaultValue={profile?.emergency_contact_name || ""} maxLength={120} autoComplete="off" />
            </label>
            <label className={LABEL}>Relationship
              <input className={INPUT} name="emergencyRelationship" defaultValue={profile?.emergency_contact_relationship || ""} maxLength={80} autoComplete="off" />
            </label>
            <label className={LABEL + " sm:col-span-2"}>Contact phone
              <input className={INPUT} name="emergencyPhone" defaultValue={profile?.emergency_contact_phone || ""} maxLength={40} type="tel" autoComplete="off" />
            </label>
          </fieldset>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold leading-6 text-slate-700">
              This form is only accessible through your SitGuru login and is stored in a
              restricted HR record. Do not enter a Social Security number, taxpayer ID,
              bank account, routing number or date of birth here. SitGuru will provide a
              separate secure channel if additional information is legally required.
            </p>
            <label className="mt-3 flex items-start gap-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" name="confirm" value="yes" required defaultChecked={complete} className="mt-1 h-4 w-4 shrink-0" />
              I confirm that this information is current and accurate to the best of my knowledge.
            </label>
          </div>
          <SecureProfileSubmitButton />
        </form>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href="/intern" className="text-sm font-black text-emerald-800">Back to Intern Portal</Link>
        <Link href="/intern/time" className="text-sm font-black text-emerald-800">Record paid work hours</Link>
      </div>
    </main>
  );
}
