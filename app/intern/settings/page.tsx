import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import DeskSettings, { type DeskSettingsPrefs } from "@/components/portal/DeskSettings";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { getUniversity } from "@/lib/internship/queries";
import { createClient } from "@/lib/supabase/server";
import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";

export const dynamic = "force-dynamic";

function prefs(raw: Record<string, unknown> | null | undefined): DeskSettingsPrefs {
  const value = raw || {};
  return {
    mentions: value.mentions !== false,
    assignments: value.assignments !== false,
    checkins: value.checkins !== false,
    events: value.events !== false,
    marketing: value.marketing === true,
    product: value.product !== false,
    landing: String(value.landing || "/intern"),
    timezone: String(value.timezone || "America/New_York"),
    emailFrequency: String(value.emailFrequency || "weekly"),
    dateFormat: String(value.dateFormat || "MDY"),
    appearance: String(value.appearance || "light"),
    profileVisibility: String(value.profileVisibility || "team"),
    activityVisibility: String(value.activityVisibility || "team"),
    analyticsInReports: value.analyticsInReports !== false,
    mfaRequested: value.mfaRequested === true,
  };
}

export default async function InternSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const error = (Array.isArray(params.error) ? params.error[0] : params.error) || "";
  const ok = (Array.isArray(params.ok) ? params.ok[0] : params.ok) || "";
  const data = await loadInternSectionWorkspace();
  const intern = data?.workspace.intern;
  const school = intern?.universityId ? await getUniversity(intern.universityId) : null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const saved = (user?.user_metadata?.desk_settings || {}) as Record<string, unknown>;
  const { data: paidStaff } = user
    ? await supabaseAdmin.from("staff_engagements").select("id")
        .eq("user_id", user.id).eq("status", "active").maybeSingle()
    : { data: null };

  return (
    <>
      {paidStaff ? (
        <section className="mb-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 sm:px-6">
          <h2 className="text-base font-black text-[#0F2744]">Secure paid-intern HR forms</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Keep your HR personal information up to date in the private SitGuru onboarding workspace.
          </p>
          <Link href="/intern/hr-onboarding" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
            Open my secure HR forms
          </Link>
        </section>
      ) : null}
      <DeskSettings
      audience="intern"
      fullName={intern?.fullName || "Intern"}
      email={intern?.email || access.actor.email}
      role={intern?.internshipTitle || "Social Media & Content Intern"}
      university={intern?.academicProgram || intern?.departmentName || ""}
      bio={intern?.bio || ""}
      avatarUrl={intern?.avatarUrl || ""}
      teamsConnected={isSitGuruWorkEmail(intern?.email || access.actor.email)}
      prefs={prefs(saved)}
      notice={error || ok || null}
      noticeIsError={Boolean(error)}
      schoolLogoUrl={school?.logoUrl || ""}
      />
    </>
  );
}
