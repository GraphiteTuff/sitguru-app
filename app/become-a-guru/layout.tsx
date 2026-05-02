import "@/app/platform-dark.css";
import type { ReactNode } from "react";

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
