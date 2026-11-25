"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  MessageCircle,
  PawPrint,
  Search,
  UserRound,
} from "lucide-react";
import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";
import { SITGURU_MOBILE_NAV as NAV, SITGURU_MOBILE_NAV_INSET } from "@/lib/portal/mobile-nav-style";

const ITEMS = [
  {
    label: "Home",
    href: "/customer/dashboard",
    match: (path: string) =>
      path === "/customer/dashboard" || path === "/customer",
    icon: PawPrint,
  },
  {
    label: "Find Care",
    href: "/search",
    match: (path: string) =>
      path.startsWith("/search") ||
      path.startsWith("/find-care") ||
      path.startsWith("/pet-gurus") ||
      path.startsWith("/book/"),
    icon: Search,
  },
  {
    label: "Bookings",
    href: "/customer/dashboard/bookings",
    match: (path: string) => path.includes("/bookings"),
    icon: CalendarDays,
  },
  {
    label: "Messages",
    href: "/customer/dashboard/messages",
    match: (path: string) => path.includes("/messages"),
    icon: MessageCircle,
  },
  {
    label: "Profile",
    href: "/customer/dashboard/profile",
    match: (path: string) =>
      path.includes("/profile") || path.includes("/pets"),
    icon: UserRound,
  },
] as const;

/**
 * App-style Pet Parent tab bar — flush to the bottom (like native apps),
 * large thumb targets, safe-area + Safari chrome cleared via CSS vars.
 */
export default function CustomerBottomNav() {
  const pathname = usePathname() || "";
  useBrowserChromeInset();

  return (
    <nav
      className={`${NAV.surface} md:hidden`}
      style={SITGURU_MOBILE_NAV_INSET}
      aria-label="Pet Parent navigation"
      data-customer-bottom-nav
    >
      <div className={NAV.grid}>
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${NAV.tab} ${active ? NAV.active : NAV.idle}`}
            >
              <span
                className={`${NAV.icon} ${active ? NAV.iconActive : ""}`}
              >
                <Icon
                  className={`${NAV.iconSize} ${active ? NAV.iconStrokeActive : NAV.iconStrokeIdle}`}
                  aria-hidden
                />
              </span>
              <span>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
