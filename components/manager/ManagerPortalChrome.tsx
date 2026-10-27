"use client";

import ManagerPortalShell from "@/components/manager/ManagerPortalShell";

export default function ManagerPortalChrome({
  children,
  unreadMessages = 0,
}: {
  children: React.ReactNode;
  unreadMessages?: number;
}) {
  return (
    <ManagerPortalShell unreadMessages={unreadMessages}>{children}</ManagerPortalShell>
  );
}
