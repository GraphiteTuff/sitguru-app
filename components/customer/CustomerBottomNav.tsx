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

export default function CustomerBottomNav() {
  const pathname = usePathname() || "";

  return (
    <nav
      className="pointer-events-auto fixed inset-x-3 bottom-3 z-[60] grid grid-cols-5 gap-1 rounded-[1.5rem] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.2)] backdrop-blur md:hidden"
      aria-label="Pet Parent navigation"
      data-customer-bottom-nav
    >
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-black transition ${
              active
                ? "bg-emerald-50 text-emerald-800"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
