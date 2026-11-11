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
      className="pointer-events-auto fixed inset-x-0 z-[60] border-t border-slate-200/90 bg-white/96 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
      style={{
        bottom: "var(--sg-chrome-bottom, 0px)",
        paddingBottom:
          "max(0.4rem, calc(env(safe-area-inset-bottom, 0px) + 0.15rem))",
      }}
      aria-label="Pet Parent navigation"
      data-customer-bottom-nav
    >
      <div className="grid grid-cols-5 gap-0 px-1 pt-1">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-black leading-tight transition active:scale-[0.97] ${
                active
                  ? "text-[#0D5C3A]"
                  : "text-slate-500 active:bg-slate-50"
              }`}
            >
              <span
                className={`grid h-8 w-12 place-items-center rounded-2xl transition ${
                  active ? "bg-emerald-50" : "bg-transparent"
                }`}
              >
                <Icon
                  className={`h-[22px] w-[22px] ${
                    active ? "stroke-[2.35]" : "stroke-[2]"
                  }`}
                  aria-hidden
                />
              </span>
              <span className={active ? "text-[#0D5C3A]" : undefined}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
