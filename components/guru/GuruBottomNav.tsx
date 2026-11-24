"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  MessageCircle,
  UserRound,
  Clock3,
} from "lucide-react";
import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";

const ITEMS = [
  {
    label: "Home",
    href: "/guru/dashboard",
    icon: Home,
    match: (path: string) => path === "/guru/dashboard",
  },
  {
    label: "Bookings",
    href: "/guru/dashboard/bookings",
    icon: CalendarDays,
    match: (path: string) => path.includes("/bookings"),
  },
  {
    label: "Schedule",
    href: "/guru/dashboard/availability",
    icon: Clock3,
    match: (path: string) => path.includes("/availability"),
  },
  {
    label: "Messages",
    href: "/guru/dashboard/messages",
    icon: MessageCircle,
    match: (path: string) => path.includes("/messages"),
  },
  {
    label: "Profile",
    href: "/guru/dashboard/profile",
    icon: UserRound,
    match: (path: string) => path.includes("/profile") || path.includes("/settings"),
  },
] as const;

/** Thumb-friendly Guru navigation for mobile web; native Expo owns its tab bar. */
export default function GuruBottomNav() {
  const pathname = usePathname() || "";
  useBrowserChromeInset();

  return (
    <nav
      aria-label="Guru mobile navigation"
      className="pointer-events-auto fixed inset-x-0 z-[60] border-t border-emerald-100 bg-white/95 shadow-[0_-10px_28px_rgba(15,23,42,0.09)] backdrop-blur-md lg:hidden"
      style={{
        bottom: "var(--sg-chrome-bottom, 0px)",
        paddingBottom: "max(0.4rem, calc(env(safe-area-inset-bottom, 0px) + 0.15rem))",
      }}
      data-guru-mobile-bottom-nav
    >
      <div className="grid grid-cols-5 gap-0 px-1 pt-1">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] font-black leading-tight transition active:scale-[0.98] " +
                (active ? "text-[#0D5C3A]" : "text-slate-600 hover:bg-emerald-50")
              }
            >
              <span className={"grid h-8 w-12 shrink-0 place-items-center rounded-2xl " + (active ? "bg-emerald-50" : "")}>
                <Icon className={"h-[23px] w-[23px] " + (active ? "stroke-[2.4]" : "stroke-[2]")} aria-hidden="true" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
