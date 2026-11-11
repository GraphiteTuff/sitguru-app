"use client";

import type { ReactNode } from "react";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Bottom nav mounts from RouteShell (shared with /search + /messages).
  // Keep scroll clearance here for /customer/* pages only.
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] pb-[calc(5.25rem+env(safe-area-inset-bottom,0px)+var(--sg-chrome-bottom,0px))] text-slate-900 md:pb-8">
      {children}
    </div>
  );
}
