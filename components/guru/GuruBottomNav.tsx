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
import { SITGURU_MOBILE_NAV as NAV, SITGURU_MOBILE_NAV_INSET } from "@/lib/portal/mobile-nav-style";

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
      className={`${NAV.surface} xl:hidden`}
      style={SITGURU_MOBILE_NAV_INSET}
      data-guru-mobile-bottom-nav
    >
      <div className={NAV.grid}>
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                NAV.tab + " " + (active ? NAV.active : NAV.idle)
              }
            >
              <span className={NAV.icon + (active ? " " + NAV.iconActive : "")}>
                <Icon className={NAV.iconSize + " " + (active ? NAV.iconStrokeActive : NAV.iconStrokeIdle)} aria-hidden="true" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
