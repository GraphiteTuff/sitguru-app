"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  Handshake,
  Home,
  Images,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Plus,
  Users,
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
  intelligence: "/intelligence",
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
  hideFrom = "lg",
}: {
  pathname: string;
  basePath?: string;
  /** Tailwind breakpoint at which the bar hides (sidebar takes over). */
  hideFrom?: "lg" | "xl";
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const staffHome = basePath === "/admin/growth" || basePath === "/manager";
  const desk = basePath === "/manager";
  const rootClass = hideFrom === "xl" ? "xl:hidden" : "lg:hidden";
  const primary = staffHome
    ? [
        { suffix: suffixes.home, label: "Home", icon: Home, href: "" },
        { suffix: "/messages", label: "Messages", icon: MessageCircle, href: "" },
        { suffix: "", label: "Interns", icon: Users, href: "/intern/manage" },
      ]
    : [
        { suffix: suffixes.home, label: "Home", icon: Home, href: "" },
        { suffix: suffixes.campaigns, label: "Campaigns", icon: Megaphone, href: "" },
        { suffix: suffixes.media, label: "Media", icon: Images, href: "" },
      ];
  const moreLinks = staffHome
    ? [
        { suffix: "/my-time", label: "My Time", icon: ClipboardCheck, href: "" },
        { suffix: "/payments", label: "Payments", icon: ClipboardList, href: "" },
        { suffix: "/onboarding", label: "Onboarding", icon: ClipboardCheck, href: "" },
        { suffix: suffixes.intelligence, label: "Insights", icon: Lightbulb, href: "" },
        { suffix: suffixes.create, label: "Create", icon: Plus, href: "" },
        { suffix: suffixes.content, label: "Content", icon: FolderOpen, href: "" },
        { suffix: suffixes.events, label: "Events", icon: CalendarDays, href: "" },
        { suffix: suffixes.partners, label: "Partners", icon: Handshake, href: "" },
        { suffix: suffixes.analytics, label: "Analytics", icon: BarChart3, href: "" },
      ]
    : [
        { suffix: suffixes.create, label: "Create", icon: Plus, href: "" },
        { suffix: suffixes.content, label: "Content", icon: FolderOpen, href: "" },
        { suffix: suffixes.gurus, label: "Gurus", icon: Users, href: "" },
        { suffix: suffixes.events, label: "Events", icon: CalendarDays, href: "" },
        { suffix: suffixes.partners, label: "Partners", icon: Handshake, href: "" },
        { suffix: suffixes.analytics, label: "Analytics", icon: BarChart3, href: "" },
      ];
  function targetOf(item: { suffix: string; href?: string }) {
    return item.href || href(basePath, item.suffix);
  }
  function activeOf(item: { suffix: string; href?: string }) {
    const target = targetOf(item);
    if (item.href) return pathname === target || pathname.startsWith(`${target}/`);
    return isActive(pathname, basePath, item.suffix);
  }

  return (
    <div className={rootClass}>
      <div className="h-28" />
      {moreOpen ? (
        <div className="fixed inset-x-0 bottom-24 z-40 px-3">
          <div className={`rounded-[1.5rem] border bg-white p-3 shadow-xl ${desk ? "border-sky-100" : "border-emerald-100"}`}>
            <div className="grid grid-cols-2 gap-2">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                const target = targetOf(item);
                const active = activeOf(item);
                return (
                  <Link
                    key={target}
                    href={target}
                    onClick={() => setMoreOpen(false)}
                    className={
                      active
                        ? `flex min-h-14 items-center gap-2 rounded-2xl px-3 text-sm font-black text-white ${desk ? "bg-[#2563EB]" : "bg-[#0D5C3A]"}`
                        : `flex min-h-14 items-center gap-2 rounded-2xl px-3 text-sm font-black ${desk ? "bg-[#EFF6FF] text-[#1D4ED8]" : "bg-emerald-50 text-emerald-950"}`
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

      <nav className={`fixed inset-x-0 bottom-0 z-50 border-t bg-[#F4F7FB]/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur ${desk ? "border-sky-100" : "border-emerald-100"}`}>
        <div className="mx-auto flex max-w-lg items-end justify-between gap-1">
          {primary.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const target = targetOf(item);
            const active = activeOf(item);
            return (
              <Link
                key={target}
                href={target}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-2xl text-[11px] font-black ${
                  active ? (desk ? "text-[#2563EB]" : "text-[#0D5C3A]") : "text-slate-500"
                }`}
              >
                <Icon size={22} />
                {item.label}
              </Link>
            );
          })}

          <Link
            href={href(basePath, `${suffixes.events}#record-results`)}
            aria-label="Record event results"
            className="mb-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: desk ? "#2563EB" : "#0D5C3A" }}
          >
            <ClipboardList size={28} />
          </Link>

          {primary.slice(2).map((item) => {
            const Icon = item.icon;
            const target = targetOf(item);
            const active = activeOf(item);
            return (
              <Link
                key={target}
                href={target}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-2xl text-[11px] font-black ${
                  active ? (desk ? "text-[#2563EB]" : "text-[#0D5C3A]") : "text-slate-500"
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
              moreOpen ? (desk ? "text-[#2563EB]" : "text-[#0D5C3A]") : "text-slate-500"
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
