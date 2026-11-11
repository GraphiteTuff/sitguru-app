"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { READS_PRIMARY_PILLS } from "@/lib/reads/category-config";

export default function PrimaryFormatPills() {
  const pathname = usePathname() || "/reads";

  return (
    <div className="border-b border-emerald-100 bg-[#F4F7FB]">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-3 sm:px-6 lg:px-8">
        {READS_PRIMARY_PILLS.map((pill) => {
          const active =
            pathname === pill.href || pathname.startsWith(`${pill.href}/`);
          return (
            <Link
              key={pill.href}
              href={pill.href}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                active
                  ? "bg-[#E86A17] text-white shadow-sm"
                  : "border border-emerald-200 bg-white text-[#163127] hover:border-[#0D5C3A]/40"
              }`}
            >
              {pill.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
