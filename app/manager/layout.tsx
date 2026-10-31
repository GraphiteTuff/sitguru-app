import { Suspense } from "react";
import ManagerPortalChrome from "@/components/manager/ManagerPortalChrome";
import SuperUserPortalBar from "@/components/manager/SuperUserPortalBar";
import WorkspaceLiveSyncMount from "@/components/realtime/WorkspaceLiveSyncMount";
import { getAdminIdentity } from "@/lib/admin/access";
import { listSuperUserPortals } from "@/lib/admin/growth/super-user-portals";
import { countDeskUnread } from "@/lib/messaging/mark-conversation-read";
import { createClient } from "@/lib/supabase/server";

export default async function ManagerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const unreadMessages = user ? await countDeskUnread(user.id) : 0;
  const actor = await getAdminIdentity();
  const portals = actor?.isSuperUser ? await listSuperUserPortals() : null;
  return (
    <>
      <WorkspaceLiveSyncMount />
      <ManagerPortalChrome unreadMessages={unreadMessages}>
        {portals ? (
          <Suspense fallback={null}>
            <SuperUserPortalBar managers={portals.managers} interns={portals.interns} />
          </Suspense>
        ) : null}
        {children}
      </ManagerPortalChrome>
    </>
  );
}
