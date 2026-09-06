"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  FolderOpen,
  Handshake,
  Home,
  Images,
  Megaphone,
  Plus,
  Users,
} from "lucide-react";
import GrowthPhoneBar from "@/components/admin/growth/GrowthPhoneBar";
import { INTERNSHIP_GROWTH_PATH } from "@/lib/internship/intern-growth";

const links = [
  { href: INTERNSHIP_GROWTH_PATH, label: "Home", icon: Home },
  { href: `${INTERNSHIP_GROWTH_PATH}/create`, label: "Create", icon: Plus },
  { href: `${INTERNSHIP_GROWTH_PATH}/campaigns`, label: "Campaigns", icon: Megaphone },
  { href: `${INTERNSHIP_GROWTH_PATH}/content`, label: "Content", icon: FolderOpen },
  { href: `${INTERNSHIP_GROWTH_PATH}/gurus`, label: "Gurus", icon: Users },
  { href: `${INTERNSHIP_GROWTH_PATH}/events`, label: "Events", icon: CalendarDays },
  { href: `${INTERNSHIP_GROWTH_PATH}/partners`, label: "Partners", icon: Handshake },
  { href: `${INTERNSHIP_GROWTH_PATH}/media`, label: "Media", icon: Images },
  { href: `${INTERNSHIP_GROWTH_PATH}/analytics`, label: "Analytics", icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  if (href === INTERNSHIP_GROWTH_PATH) return pathname === INTERNSHIP_GROWTH_PATH;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function InternGrowthChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || INTERNSHIP_GROWTH_PATH;

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-5">
      <nav className="mb-4 hidden flex-wrap items-center gap-2 lg:flex">
        <Link
          href="/intern"
          className="inline-flex min-h-10 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-950"
        >
          Intern portal
        </Link>
        {links.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#0D5C3A] px-3 text-xs font-black !text-white"
                  : "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-900"
              }
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
      <GrowthPhoneBar pathname={pathname} basePath={INTERNSHIP_GROWTH_PATH} />
    </div>
  );
}
