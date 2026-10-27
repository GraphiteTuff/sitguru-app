import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import DeskSettings, { type DeskSettingsPrefs } from "@/components/portal/DeskSettings";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";
import { MANAGER_PORTAL_BRAND } from "@/lib/admin/growth/manager-portal";

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
    landing: String(value.landing || "/manager"),
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

export default async function ManagerSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const notice = (Array.isArray(params.error) ? params.error[0] : params.error) || (Array.isArray(params.ok) ? params.ok[0] : params.ok) || "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, avatar_url, profile_photo_url")
    .eq("id", access.actor.id)
    .maybeSingle();
  const saved = (user?.user_metadata?.desk_settings || {}) as Record<string, unknown>;

  return (
    <DeskSettings
      audience="manager"
      fullName={String(profile?.full_name || user?.user_metadata?.full_name || access.actor.email.split("@")[0])}
      email={access.actor.email}
      role={MANAGER_PORTAL_BRAND.kicker}
      university=""
      bio=""
      avatarUrl={String(profile?.avatar_url || profile?.profile_photo_url || "")}
      teamsConnected={isSitGuruWorkEmail(access.actor.email)}
      prefs={prefs(saved)}
      notice={notice || null}
    />
  );
}
