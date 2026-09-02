"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  FolderOpen,
  Home,
  Images,
  Megaphone,
  Plus,
  Users,
  CalendarDays,
  Handshake,
} from "lucide-react";

const primary = [
  { href: "/admin/growth", label: "Home", icon: Home },
  { href: "/admin/growth/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/growth/media", label: "Media", icon: Images },
];

const moreLinks = [
  { href: "/admin/growth/create", label: "Create", icon: Plus },
  { href: "/admin/growth/content", label: "Content", icon: FolderOpen },
  { href: "/admin/growth/gurus", label: "Gurus", icon: Users },
  { href: "/admin/growth/events", label: "Events", icon: CalendarDays },
  { href: "/admin/growth/partners", label: "Partners", icon: Handshake },
  { href: "/admin/growth/analytics", label: "Analytics", icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/growth") return pathname === "/admin/growth";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function GrowthPhoneBar({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="h-28" />
      {moreOpen ? (
        <div className="fixed inset-x-0 bottom-24 z-40 px-3">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-3 shadow-xl">
            <div className="grid grid-cols-2 gap-2">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={
                      active
                    ? "flex min-h-14 items-center gap-2 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-black text-white"
                    : "flex min-h-14 items-center gap-2 rounded-2xl bg-emerald-50 px-3 text-sm font-black text-emerald-950"
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-100 bg-[#fcfdfb]/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-end justify-between gap-1">
          {primary.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-2xl text-[11px] font-black ${
                  active ? "text-[#0D5C3A]" : "text-slate-500"
                }`}
              >
                <Icon size={22} />
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/admin/growth/create"
            aria-label="Create"
            className="mb-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: "#0D5C3A" }}
          >
            <Plus size={30} />
          </Link>

          {primary.slice(2).map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-2xl text-[11px] font-black ${
                  active ? "text-[#0D5C3A]" : "text-slate-500"
                }`}
              >
                <Icon size={22} />
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-2xl text-[11px] font-black ${
              moreOpen ? "text-[#0D5C3A]" : "text-slate-500"
            }`}
          >
            <FolderOpen size={22} />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}
