import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import ManagerMessagesHome from "@/components/manager/ManagerMessagesHome";
import { loadStaffInbox } from "@/lib/messaging/staff-data";

export const dynamic = "force-dynamic";

export default async function InternMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const error = Array.isArray(params.error) ? params.error[0] : params.error || "";
  const inbox = await loadStaffInbox(access.actor.id, false, "intern");

  return (
    <ManagerMessagesHome
      me={inbox.me}
      conversations={inbox.conversations}
      showAdminRecord={false}
      returnTo="/intern/messages"
      notice={error || notice || null}
      noticeError={Boolean(error)}
      audience="intern"
    />
  );
}
