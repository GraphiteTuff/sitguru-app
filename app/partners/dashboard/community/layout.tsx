"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  Megaphone,
  Plus,
  Sparkles,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/partners/dashboard/community/events",
    icon: LayoutDashboard,
    match: (path: string) =>
      path === "/partners/dashboard/community/events" ||
      path.startsWith("/partners/dashboard/community/events?"),
  },
  {
    label: "My Events",
    href: "/partners/dashboard/community/events",
    icon: CalendarDays,
    match: (path: string) => path.includes("/community/events"),
  },
  {
    label: "Create Event",
    href: "/partners/dashboard/community/events?create=1",
    icon: Plus,
    match: () => false,
  },
  {
    label: "Promotion",
    href: "/partners/dashboard/community/events",
    icon: Megaphone,
    match: (path: string) => path.includes("/promote"),
  },
  {
    label: "Event Analytics",
    href: "/partners/dashboard/community/events#performance",
    icon: BarChart3,
    match: () => false,
  },
  {
    label: "Organization Profile",
    href: "/partners/dashboard/community/organization",
    icon: Building2,
    match: (path: string) => path.includes("/organization"),
  },
  {
    label: "Help & Support",
    href: "/help/account/update-community-events",
    icon: CircleHelp,
    match: (path: string) => path.includes("/help/"),
  },
];

export default function PartnerCommunityLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() || "";

  return (
    <div className="min-h-[100svh] bg-[#f7f8f4]">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-[0.16em] text-[#0D5C3A]"
            >
              SitGuru
            </Link>
            <span className="hidden h-4 w-px bg-slate-200 sm:block" />
            <p className="hidden text-sm font-black text-slate-800 sm:block">
              Pet Event Manager
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/partners/dashboard"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700"
            >
              Partner hub
            </Link>
            <Link
              href="/community/host"
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-900"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Host hub
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black transition ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "text-slate-700 hover:bg-emerald-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-4 border-t border-slate-100 px-3 pt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Switch workspace
              </p>
              <div className="mt-2 space-y-1">
                {[
                  { label: "Pet Parent", href: "/dashboard" },
                  { label: "Guru", href: "/guru/dashboard" },
                  { label: "Ambassador", href: "/ambassador/dashboard" },
                  { label: "Partner", href: "/partners/dashboard" },
                  {
                    label: "Event Manager",
                    href: "/partners/dashboard/community/events",
                  },
                ].map((ws) => (
                  <Link
                    key={ws.label}
                    href={ws.href}
                    className="block rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {ws.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
