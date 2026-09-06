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

const suffixes = {
  home: "",
  campaigns: "/campaigns",
  media: "/media",
  create: "/create",
  content: "/content",
  gurus: "/gurus",
  events: "/events",
  partners: "/partners",
  analytics: "/analytics",
} as const;

function href(basePath: string, suffix: string) {
  return `${basePath}${suffix}`;
}

function isActive(pathname: string, basePath: string, suffix: string) {
  const target = href(basePath, suffix);
  if (!suffix) return pathname === basePath;
  return pathname === target || pathname.startsWith(`${target}/`);
}

export default function GrowthPhoneBar({
  pathname,
  basePath = "/admin/growth",
}: {
  pathname: string;
  basePath?: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = [
    { suffix: suffixes.home, label: "Home", icon: Home },
    { suffix: suffixes.campaigns, label: "Campaigns", icon: Megaphone },
    { suffix: suffixes.media, label: "Media", icon: Images },
  ];
  const moreLinks = [
    { suffix: suffixes.create, label: "Create", icon: Plus },
    { suffix: suffixes.content, label: "Content", icon: FolderOpen },
    { suffix: suffixes.gurus, label: "Gurus", icon: Users },
    { suffix: suffixes.events, label: "Events", icon: CalendarDays },
    { suffix: suffixes.partners, label: "Partners", icon: Handshake },
    { suffix: suffixes.analytics, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="lg:hidden">
      <div className="h-28" />
      {moreOpen ? (
        <div className="fixed inset-x-0 bottom-24 z-40 px-3">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-3 shadow-xl">
            <div className="grid grid-cols-2 gap-2">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                const target = href(basePath, item.suffix);
                const active = isActive(pathname, basePath, item.suffix);
                return (
                  <Link
                    key={target}
                    href={target}
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
            const target = href(basePath, item.suffix);
            const active = isActive(pathname, basePath, item.suffix);
            return (
              <Link
                key={target}
                href={target}
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
            href={href(basePath, suffixes.create)}
            aria-label="Create"
            className="mb-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: "#0D5C3A" }}
          >
            <Plus size={30} />
          </Link>

          {primary.slice(2).map((item) => {
            const Icon = item.icon;
            const target = href(basePath, item.suffix);
            const active = isActive(pathname, basePath, item.suffix);
            return (
              <Link
                key={target}
                href={target}
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
