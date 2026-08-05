import "@/app/platform-dark.css";
import type { ReactNode } from "react";
import AIScoutCompanion from "@/components/officers/AIScoutCompanion";

/**
 * Become a Guru layout — mounts Scout onboarding companion outside the
 * dark text-white wrapper so chat stays readable on light panels.
 */
export default function BecomeAGuruLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="platform-dark-surface min-h-screen bg-slate-950 text-white">
        {children}
      </div>
      <AIScoutCompanion mode="onboarding" />
    </>
  );
}
