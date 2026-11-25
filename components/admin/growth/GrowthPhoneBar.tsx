"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";
import { SITGURU_MOBILE_NAV as NAV, SITGURU_MOBILE_NAV_INSET } from "@/lib/portal/mobile-nav-style";

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
  useBrowserChromeInset();

  useEffect(() => {
    if (!moreOpen) return;
    document.body.setAttribute("data-sitguru-more-open", "1");
    return () => document.body.removeAttribute("data-sitguru-more-open");
  }, [moreOpen]);
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
        { suffix: "/insights", label: "Insights", icon: Lightbulb, href: "" },
        { suffix: suffixes.intelligence, label: "Intelligence", icon: Lightbulb, href: "" },
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
        { suffix: "/insights", label: "Insights", icon: Lightbulb, href: "" },
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

  const moreActive = moreLinks.some((item) => activeOf(item));
  const recordUrl = href(basePath, `${suffixes.events}#record-results`);
  const tabs = [
    primary[0],
    primary[1],
    { suffix: suffixes.events, label: "Record", icon: ClipboardList, href: recordUrl },
    primary[2],
  ];

  return (
    <div className={rootClass}>
      <div className="h-28" />
      {moreOpen ? (
        <div className="fixed inset-x-0 z-[97] px-3" style={{ bottom: "calc(6.5rem + env(safe-area-inset-bottom, 0px) + var(--sg-chrome-bottom, 0px))" }}>
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

      <nav
        aria-label="SitGuru growth navigation"
        data-growth-phone-nav
        className={`${NAV.surface} !z-[96]`}
        style={SITGURU_MOBILE_NAV_INSET}
      >
        <div className={NAV.grid}>
          {tabs.map((item) => {
            const Icon = item.icon;
            const target = targetOf(item);
            const active = item.label === "Record"
              ? pathname === href(basePath, suffixes.events) || pathname.startsWith(href(basePath, suffixes.events) + "/")
              : activeOf(item);
            return (
              <Link
                key={item.label}
                href={target}
                aria-current={active ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
                className={`${NAV.tab} ${active ? NAV.active : NAV.idle}`}
              >
                <span className={`${NAV.icon} ${active ? NAV.iconActive : ""}`}>
                  <Icon className={`${NAV.iconSize} ${active ? NAV.iconStrokeActive : NAV.iconStrokeIdle}`} aria-hidden="true" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-label="More growth tools"
            className={`${NAV.tab} ${moreOpen || moreActive ? NAV.active : NAV.idle}`}
          >
            <span className={`${NAV.icon} ${moreOpen || moreActive ? NAV.iconActive : ""}`}>
              <FolderOpen className={`${NAV.iconSize} ${moreOpen || moreActive ? NAV.iconStrokeActive : NAV.iconStrokeIdle}`} aria-hidden="true" />
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
