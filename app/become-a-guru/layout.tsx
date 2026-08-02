import "@/app/platform-dark.css";
import type { ReactNode } from "react";
import FloatingOfficerBubble from "@/components/officers/FloatingOfficerBubble";

/**
 * Become-a-Guru marketing layout — mounts Scout (Guru Matching Officer)
 * for public signup / onboarding FAQ help. Bubble sits outside the dark
 * text-white wrapper so chat text stays readable.
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
      <FloatingOfficerBubble role="GURU" surface="public" />
    </>
  );
}
