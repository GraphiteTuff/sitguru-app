import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import DeskSettings, { type DeskSettingsPrefs } from "@/components/portal/DeskSettings";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
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
  const notice = (Array.isArray(params.error) ? params.error[0] : params.error) || (Array.isArray(params.ok) ? params.ok[0] : params.ok) || "";
  const data = await loadInternSectionWorkspace();
  const intern = data?.workspace.intern;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const saved = (user?.user_metadata?.desk_settings || {}) as Record<string, unknown>;

  return (
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
      notice={notice || null}
    />
  );
}
