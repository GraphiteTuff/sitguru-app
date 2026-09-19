"use client";

import type { ReactNode } from "react";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBFD_0%,#F3FAF8_48%,#EEF6FF_100%)] pb-[7.5rem] text-slate-900 md:pb-8">
      {children}
      <CustomerBottomNav />
    </div>
  );
}
