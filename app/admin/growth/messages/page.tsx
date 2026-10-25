import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getAdminIdentity } from "@/lib/admin/access";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import StaffChat from "@/components/messaging/StaffChat";
import { loadStaffInbox } from "@/lib/messaging/staff-data";

export const dynamic = "force-dynamic";

export default async function GrowthMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const error = Array.isArray(params.error) ? params.error[0] : params.error || "";
  const admin = await getAdminIdentity();
  const kind = internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser });
  const seeAll = kind === "supervisor" || Boolean(admin?.isSuperUser);
  const inbox = await loadStaffInbox(access.actor.id, seeAll);

  return (
    <GrowthPageFrame
      kicker="Messages"
      title={`Hi, ${inbox.me.firstName}.`}
      detail="Team notes use first names and avatars, and every message is kept in Admin. Attach a photo, PDF, or text file when the work needs it."
    >
      {notice || error ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>
          {error || notice}
        </p>
      ) : null}
      <StaffChat me={inbox.me} conversations={inbox.conversations} showAdminRecord={access.actor.isSuperUser} />
    </GrowthPageFrame>
  );
}
