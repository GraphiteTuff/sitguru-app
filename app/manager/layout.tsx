import ManagerPortalChrome from "@/components/manager/ManagerPortalChrome";
import WorkspaceLiveSyncMount from "@/components/realtime/WorkspaceLiveSyncMount";

export default function ManagerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WorkspaceLiveSyncMount />
      <ManagerPortalChrome>{children}</ManagerPortalChrome>
    </>
  );
}
