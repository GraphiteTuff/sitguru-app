"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { READS_BRAND, READS_MOBILE_NAV } from "@/lib/reads/constants";

export default function ReadsChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/reads";
  const isLanding = pathname === "/reads" || pathname === "/reads/";

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#163127]">
      {!isLanding ? (
        <div
          className="border-b border-emerald-900/10 bg-[#0D5C3A] text-white public-dark-section"
          data-brand-green
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/reads" className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight !text-white sm:text-base">
                SitGuru{" "}
                <span style={{ color: READS_BRAND.orange }}>Reads &amp; Listen</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/reads/search"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold !text-white transition hover:bg-white/20"
              >
                <Search className="h-3.5 w-3.5" aria-hidden />
                Search
              </Link>
              <Link
                href="/reads/partner"
                className="hidden rounded-full px-3 py-2 text-xs font-bold !text-white sm:inline-flex"
                style={{ backgroundColor: READS_BRAND.orange }}
              >
                Partner with SitGuru
              </Link>
            </div>
          </div>
          <nav
            aria-label="Reads formats"
            className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8"
          >
            {READS_MOBILE_NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-white text-[#0D5C3A]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      <main>{children}</main>
    </div>
  );
}
