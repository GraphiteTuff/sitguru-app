import "@/app/platform-dark.css";
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
  return (
    <div className="platform-dark-surface min-h-screen bg-slate-950 text-white">
      {children}
    </div>
  );
}
