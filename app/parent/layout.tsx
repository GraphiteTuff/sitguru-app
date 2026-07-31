import type { ReactNode } from "react";

/**
 * Minimal chrome for consumer mobile live-walk routes.
 * Keeps the experience phone-first without admin/customer dashboard shells.
 */
export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-[100dvh] bg-white text-slate-950"
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      {children}
    </div>
  );
}
