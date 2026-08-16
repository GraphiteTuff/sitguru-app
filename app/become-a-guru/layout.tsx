import type { ReactNode } from "react";

/**
 * Become a Guru route chrome.
 * Scout mounts from RouteShell on `/become-a-guru` (public-guru).
 */
export default function BecomeAGuruLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-screen bg-[#f7faf7] text-slate-950">{children}</div>;
}
