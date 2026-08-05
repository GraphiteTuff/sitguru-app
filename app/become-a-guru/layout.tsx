import "@/app/platform-dark.css";
import type { ReactNode } from "react";

/**
 * Become a Guru route chrome. Scout mounts from the page via
 * `<Layout mode="public-guru">` so companion mode stays explicit.
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
