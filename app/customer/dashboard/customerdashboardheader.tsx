"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";

type CustomerDashboardHeaderProps = {
  customerName?: string | null;
  customerImageUrl?: string | null;
};

type CustomerNavItem = { label: string; href: string; activePaths: string[] };

const navItems: CustomerNavItem[] = [
  { label: "Dashboard", href: "/customer/dashboard", activePaths: ["/customer/dashboard"] },
  { label: "Find a Guru", href: "/search", activePaths: ["/customer/find-guru", "/find-guru", "/search", "/find-care"] },
  { label: "Bookings", href: "/customer/dashboard/bookings", activePaths: ["/customer/dashboard/bookings", "/customer/bookings", "/bookings"] },
  { label: "Messages", href: "/customer/dashboard/messages", activePaths: ["/customer/dashboard/messages", "/customer/messages", "/messages"] },
  { label: "My Pets", href: "/customer/dashboard#multi-pet-center", activePaths: ["/customer/dashboard/pets", "/customer/pets"] },
  { label: "PawPerks", href: "/parent/perks", activePaths: ["/parent/perks", "/customer/dashboard/pawperks"] },
  { label: "My Profile", href: "/customer/dashboard/profile", activePaths: ["/customer/dashboard/profile", "/customer/profile"] },
];

/**
 * Keep the Pet Parent navigation intact, but use the universal Manager/Intern
 * profile menu and canonical account avatar. Promotional Guru photos and
 * pet photos should never override the signed-in person's account avatar.
 */
export default function CustomerDashboardHeader(_props: CustomerDashboardHeaderProps) {
  const pathname = usePathname() || "";

  function isActive(paths: string[]) {
    return paths.some((path) =>
      path === "/customer/dashboard"
        ? pathname === path
        : pathname === path || pathname.startsWith(path + "/")
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/customer/dashboard" className="flex min-w-fit items-center gap-3" aria-label="SitGuru Pet Parent dashboard">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-sky-50 ring-1 ring-sky-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/sitguru-logo-cropped.png" alt="SitGuru" className="h-9 w-9 object-contain" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-black tracking-tight text-slate-950">SitGuru</span>
            <span className="block text-xs font-semibold text-[#0D5C3A]">Pet Parent Portal</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Pet Parent navigation">
          {navItems.map((item) => {
            const active = isActive(item.activePaths);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-4 py-2 text-sm font-bold transition ${active ? "bg-[#0D5C3A] text-white shadow-sm" : "text-slate-600 hover:bg-sky-50 hover:text-[#0D5C3A]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/customer/dashboard/bookings" className="hidden min-h-11 items-center rounded-full border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-[#0D5C3A] shadow-sm hover:bg-white md:inline-flex">
            My Care
          </Link>
          <NotificationBell compact />
          <SiteAccountMenu variant="desk" />
        </div>
      </div>

      <nav className="border-t border-emerald-50 bg-white px-3 py-2 lg:hidden" aria-label="Pet Parent mobile navigation">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.activePaths);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`min-w-fit rounded-full px-4 py-2 text-sm font-bold transition ${active ? "bg-emerald-600 text-white shadow-sm" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
