"use client";

import type { ReactNode } from "react";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] pb-[7.5rem] text-slate-900 md:pb-8">
      {children}
      <CustomerBottomNav />
    </div>
  );
}
