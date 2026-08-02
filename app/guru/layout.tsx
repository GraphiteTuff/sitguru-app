import "@/app/platform-dark.css";
import type { ReactNode } from "react";
import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";
import ScoutFloatingAssistant from "@/components/officers/ScoutFloatingAssistant";

/**
 * Guru root layout — mounts Scout (Guru Logistics Captain) across provider
 * surfaces. Scout's chat accents use the mint/emerald provider palette;
 * Rogue admin AI remains untouched.
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
      {/* Outside dark text-white wrapper so Scout chat never inherits white text. */}
      <SafeAssistantBubble>
        <ScoutFloatingAssistant />
      </SafeAssistantBubble>
    </>
  );
}
