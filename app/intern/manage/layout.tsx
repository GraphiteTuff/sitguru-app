import ManagerPortalChrome from "@/components/manager/ManagerPortalChrome";
import { getAdminIdentity } from "@/lib/admin/access";
import { isFounderPersonalMarketplaceEmail } from "@/lib/admin/super-users";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { countDeskUnread } from "@/lib/messaging/mark-conversation-read";
import { createClient } from "@/lib/supabase/server";

export default async function InternManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getAdminIdentity();
  const founderPersonal = actor ? isFounderPersonalMarketplaceEmail(actor.email) : false;
  const kind = actor
    ? founderPersonal
      ? "supervisor"
      : internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser })
    : "none";
  if (kind !== "manager" && kind !== "supervisor") return children;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const unreadMessages = user ? await countDeskUnread(user.id) : 0;
  return <ManagerPortalChrome unreadMessages={unreadMessages}>{children}</ManagerPortalChrome>;
}
