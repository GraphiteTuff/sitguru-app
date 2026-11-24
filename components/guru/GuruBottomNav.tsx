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
      className="pointer-events-auto fixed inset-x-0 z-[60] border-t border-emerald-200 bg-white/95 shadow-[0_-10px_28px_rgba(15,23,42,0.09)] backdrop-blur-md xl:hidden"
      style={{
        bottom: "var(--sg-chrome-bottom, 0px)",
        paddingBottom: "max(0.4rem, calc(env(safe-area-inset-bottom, 0px) + 0.15rem))",
      }}
      data-guru-mobile-bottom-nav
    >
      <div className="mx-auto grid max-w-[650px] grid-cols-5 gap-0.5 px-1.5 pt-1.5">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "flex min-h-[65px] min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 text-[12px] font-black leading-tight transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 " +
                (active ? "bg-emerald-50 text-[#0D5C3A]" : "text-slate-700 hover:bg-emerald-50")
              }
            >
              <span className={"grid h-9 w-11 shrink-0 place-items-center rounded-2xl " + (active ? "bg-white" : "")}>
                <Icon className={"h-[24px] w-[24px] " + (active ? "stroke-[2.4]" : "stroke-[2]")} aria-hidden="true" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
