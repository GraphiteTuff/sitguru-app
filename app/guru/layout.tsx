import "@/app/platform-dark.css";
import type { ReactNode } from "react";
import FloatingOfficerBubble from "@/components/officers/FloatingOfficerBubble";

/**
 * Guru root layout — mounts Scout across Guru provider dashboards and
 * related role surfaces. Chat sits outside the dark text-white wrapper.
 */
export default function GuruLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen bg-[#020617] text-white">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_26%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)]">
          <div className="platform-dark-surface min-h-screen">
            {children}
          </div>
        </div>
      </div>
      <FloatingOfficerBubble role="GURU" surface="dashboard" />
    </>
  );
}
