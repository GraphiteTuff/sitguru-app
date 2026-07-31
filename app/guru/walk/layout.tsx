import type { ReactNode } from "react";

/**
 * Phone-first chrome for Guru live-walk publisher routes.
 * Escapes the dark platform shell from app/guru/layout.tsx.
 */
export default function GuruWalkSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-white text-slate-950"
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      {children}
    </div>
  );
}
