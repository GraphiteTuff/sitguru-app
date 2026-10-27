"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, Users } from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";
import {
  MANAGER_PORTAL_BRAND,
  MANAGER_PORTAL_NAV,
} from "@/lib/admin/growth/manager-portal";
import {
  internGhostBtnClass,
  internPrimaryBtnClass,
} from "@/lib/internship/intern-ui";

function isActive(pathname: string, href: string) {
  if (href === "/manager") return pathname === "/manager";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ManagerPortalHeader() {
  const pathname = usePathname() || "/manager";

  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/80 bg-[#FAF6EE]/95 shadow-sm backdrop-blur print:hidden">
      <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-3 py-2 sm:px-5 lg:px-6">
        <Link
          href={MANAGER_PORTAL_BRAND.homePath}
          className="min-w-0"
          aria-label="Open Manager Portal"
        >
          <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-amber-800">
            {MANAGER_PORTAL_BRAND.kicker}
          </p>
          <p className="flex items-center gap-1.5 truncate text-base font-black tracking-tight text-slate-950">
            <Megaphone size={16} className="shrink-0 text-emerald-800" />
            {MANAGER_PORTAL_BRAND.title}
          </p>
        </Link>

        <nav
          aria-label="Manager Portal"
          className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {MANAGER_PORTAL_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "whitespace-nowrap rounded-full bg-[#166534] px-3 py-2 text-xs font-black !text-white"
                    : "whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-950"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={MANAGER_PORTAL_BRAND.deskPath}
            className={`${internPrimaryBtnClass} min-h-11 px-3 text-xs sm:px-4`}
          >
            <Users size={14} />
            <span className="hidden sm:inline">Intern Team Desk</span>
            <span className="sm:hidden">Desk</span>
          </Link>
          <Link
            href={MANAGER_PORTAL_BRAND.adminGrowthPath}
            className={`${internGhostBtnClass} hidden min-h-11 px-3 text-xs md:inline-flex`}
          >
            Admin Growth
          </Link>
          <SiteAccountMenu />
        </div>
      </div>
    </header>
  );
}
