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
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBFD_0%,#F3FAF8_48%,#EEF6FF_100%)] pb-[calc(7.75rem+env(safe-area-inset-bottom,0px)+var(--sg-chrome-bottom,0px))] text-slate-900 md:pb-8">
      {children}
    </div>
  );
}
