import type { ReactNode } from "react";
import GuruDashboardHeader from "./GuruDashboardHeader";

export default function GuruDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7fffb] text-slate-950">
      <GuruDashboardHeader />
      <main>{children}</main>
    </div>
  );
}
