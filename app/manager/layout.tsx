import ManagerPortalChrome from "@/components/manager/ManagerPortalChrome";
import WorkspaceLiveSyncMount from "@/components/realtime/WorkspaceLiveSyncMount";
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
  return (
    <>
      <WorkspaceLiveSyncMount />
      <ManagerPortalChrome unreadMessages={unreadMessages}>{children}</ManagerPortalChrome>
    </>
  );
}
