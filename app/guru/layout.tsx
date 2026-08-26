import "@/app/platform-dark.css";
import type { ReactNode } from "react";

/**
 * Guru root layout — light chrome.
 * Scout mounts from RouteShell on Guru workspace / onboarding paths
 * so public `/guru/[slug]` profiles keep Rogue for Pet Parents.
 */
export default function GuruLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="platform-light-surface min-h-screen bg-[#f7fffb] text-slate-950">
      {children}
    </div>
  );
}
