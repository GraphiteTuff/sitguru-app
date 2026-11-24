import type { ReactNode } from "react";
import GuruDashboardHeader from "./GuruDashboardHeader";
import GuruBottomNav from "@/components/guru/GuruBottomNav";

export default function GuruDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="platform-light-surface min-h-screen bg-[#f7fffb] text-slate-950">
      <GuruDashboardHeader />
      <main className="pb-[calc(6rem+env(safe-area-inset-bottom,0px)+var(--sg-chrome-bottom,0px))] xl:pb-0">{children}</main>
      <GuruBottomNav />
    </div>
  );
}
