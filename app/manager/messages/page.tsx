import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getAdminIdentity } from "@/lib/admin/access";
import { internshipActorKind } from "@/lib/internship/manager-access";
import ManagerMessagesHome from "@/components/manager/ManagerMessagesHome";
import { loadStaffInbox } from "@/lib/messaging/staff-data";

export const dynamic = "force-dynamic";

export default async function ManagerMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const error = Array.isArray(params.error) ? params.error[0] : params.error || "";
  const admin = await getAdminIdentity();
  const kind = internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser });
  const seeAll = kind === "supervisor" || Boolean(admin?.isSuperUser);
  let inbox = { me: { firstName: "You", avatarUrl: "" }, conversations: [] as Awaited<ReturnType<typeof loadStaffInbox>>["conversations"] };
  try {
    inbox = await loadStaffInbox(access.actor.id, seeAll);
  } catch (loadError) {
    console.error("Manager messages could not be loaded", loadError);
  }

  return (
    <ManagerMessagesHome
      me={inbox.me}
      conversations={inbox.conversations}
      showAdminRecord={access.actor.isSuperUser}
      returnTo="/manager/messages"
      notice={error || notice || null}
      noticeError={Boolean(error)}
    />
  );
}
