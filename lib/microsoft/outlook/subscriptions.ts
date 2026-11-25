import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildInternAssignmentCalendar } from "@/lib/internship/intern-calendar";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { getInternWorkspace } from "@/lib/internship/queries";
import { outlookPortalIdentity } from "./access";
import { internshipCalendarIcs } from "./ical";
import { openOutlookValue, outlookHash, outlookPortal, outlookSecret, sealOutlookValue } from "./security";
import type { OutlookPortal, outlookSettings } from "./security";

type Settings = NonNullable<ReturnType<typeof outlookSettings>>;
const table = "internship_calendar_subscriptions";
const purpose = (userId: string, portal: OutlookPortal) => `outlook:feed:${userId}:${portal}`;

export async function getCalendarSubscription(settings: Settings, userId: string, portal: OutlookPortal) {
  const { data, error } = await supabaseAdmin.from(table).select("encrypted_secret").eq("user_id", userId).eq("portal", portal).maybeSingle();
  if (error) throw new Error("Calendar subscription unavailable");
  const secret = data ? openOutlookValue<string>(settings.key, purpose(userId, portal), data.encrypted_secret) : null;
  return secret ? new URL(`/api/internship/outlook/feed/${secret}`, settings.callback.origin).href : null;
}

export async function changeCalendarSubscription(settings: Settings, userId: string, portal: OutlookPortal, revoke: boolean) {
  const secret = outlookSecret();
  const operation = revoke
    ? supabaseAdmin.from(table).delete().eq("user_id", userId).eq("portal", portal)
    : supabaseAdmin.from(table).upsert({ user_id: userId, portal, secret_hash: outlookHash(secret),
      encrypted_secret: sealOutlookValue(settings.key, purpose(userId, portal), secret), created_at: new Date().toISOString(),
    }, { onConflict: "user_id,portal" });
  const { error } = await operation;
  if (error) throw new Error("Calendar subscription unavailable");
}

export async function readCalendarSubscription(secret: string) {
  if (!/^[a-zA-Z0-9_-]{43}$/.test(secret)) return null;
  const { data, error } = await supabaseAdmin.from(table).select("user_id,portal").eq("secret_hash", outlookHash(secret)).maybeSingle();
  if (error) throw new Error("Calendar subscription unavailable");
  const portal = outlookPortal(data?.portal);
  if (!data || !portal) return null;
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
  const identity = user ? await outlookPortalIdentity(user, portal) : null;
  if (!identity) return null;
  return internshipCalendarIcs(portal, await loadSitGuruCalendar(identity));
}

export async function loadSitGuruCalendar(identity: NonNullable<Awaited<ReturnType<typeof outlookPortalIdentity>>>) {
  if (identity.portal === "intern") {
    const workspace = await getInternWorkspace(identity.intern.id);
    if (!workspace) throw new Error("Intern calendar unavailable");
    return buildInternAssignmentCalendar({ internId: identity.intern.id, tasks: workspace.tasks });
  }
  const kind = internshipActorKind(identity.manager);
  const desk = await loadManagerDashboard({
    actorUserId: identity.userId, actorKind: kind === "supervisor" ? "supervisor" : "manager",
  });
  return desk.schedule;
}
