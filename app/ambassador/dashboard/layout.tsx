"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LineChart,
  Menu,
  MessageCircle,
  QrCode,
  Share2,
  Users,
  WalletCards,
} from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";
import { openCompanionChat } from "@/lib/companions/open-companion-chat";
import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";

type AmbassadorDashboardLayoutProps = {
  children: ReactNode;
};

type AmbassadorNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  isActive: (pathname: string) => boolean;
};

const navItems: AmbassadorNavItem[] = [
  {
    label: "Home",
    href: "/ambassador/dashboard",
    icon: <LayoutDashboard size={16} />,
    isActive: (pathname) => pathname === "/ambassador/dashboard",
  },
  {
    label: "Workspace",
    href: "/ambassador/dashboard#ambassador-workspace",
    icon: <BriefcaseBusiness size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/command-center"),
  },
  {
    label: "Referrals",
    href: "/ambassador/dashboard/referrals",
    icon: <Users size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/referrals"),
  },
  {
    label: "Social",
    href: "/ambassador/dashboard/social",
    icon: <Share2 size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/social"),
  },
  {
    label: "Performance",
    href: "/ambassador/dashboard/performance",
    icon: <LineChart size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/performance"),
  },
  {
    label: "Training",
    href: "/ambassador/dashboard/training",
    icon: <GraduationCap size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/training"),
  },
  {
    label: "Messages",
    href: "/ambassador/dashboard/messages?support=admin&role=ambassador",
    icon: <MessageCircle size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/messages"),
  },
  {
    label: "Support",
    href: "/ambassador/dashboard/support",
    icon: <Headphones size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/support"),
  },
  {
    label: "Rewards",
    href: "/ambassador/dashboard/commissions",
    icon: <WalletCards size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/commissions") ||
      pathname.startsWith("/ambassador/dashboard/payouts"),
  },
];

export default function AmbassadorDashboardLayout({
  children,
}: AmbassadorDashboardLayoutProps) {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");
  useBrowserChromeInset();

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  return (
    <div className="min-h-[100svh] bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#effcf5_100%)]">
      <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-6">
          <div className="flex min-h-16 items-center justify-between gap-4 py-2">
            <Link
              href="/ambassador/dashboard"
              className="min-w-0 shrink-0"
              aria-label="Open Ambassador Dashboard"
            >
              <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#0D5C3A]">
                SitGuru Ambassador
              </p>
              <p className="truncate text-base font-black tracking-tight text-slate-950">
                My Workspace
              </p>
            </Link>

            <nav
              aria-label="Ambassador dashboard navigation"
              className="hidden min-w-0 flex-1 overflow-x-auto lg:block"
            >
              <div className="ml-auto flex w-max items-center gap-1.5 py-1">
                {navItems.map((item) => {
                  const active = item.isActive(pathname);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition sm:text-sm ${
                        active
                          ? "bg-[#0D5C3A] text-white shadow-sm"
                          : "text-slate-600 hover:bg-sky-50 hover:text-[#0D5C3A]"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <details key={pathname} className="relative lg:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 text-sm font-black text-green-900 marker:content-none">
                  <Menu size={19} aria-hidden="true" />
                  Menu
                </summary>
                <nav
                  aria-label="All Ambassador pages"
                  className="absolute right-0 top-full z-[70] mt-2 max-h-[70svh] w-[min(88vw,290px)] overflow-y-auto rounded-2xl border border-green-100 bg-white p-2 shadow-xl"
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      openCompanionChat("taco");
                    }}
                    className="mb-2 flex min-h-12 w-full items-center gap-3 rounded-xl bg-emerald-700 px-3 text-left text-sm font-black text-white transition hover:bg-emerald-800"
                    aria-label="Chat with Taco, your Ambassador advocate"
                  >
                    <MessageCircle size={19} aria-hidden="true" />
                    Chat with Taco
                  </button>
                  <div className="mb-2 border-b border-green-100" />
                  {navItems.map((item) => {
                    const active = item.isActive(pathname);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-sm font-black transition ${
                          active
                            ? "bg-green-800 text-white"
                            : "text-slate-700 hover:bg-green-50 hover:text-green-900"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </details>
              <SiteAccountMenu compact />
            </div>
          </div>
        </div>
      </header>

      <div className="pb-[calc(6rem+env(safe-area-inset-bottom,0px)+var(--sg-chrome-bottom,0px))] lg:pb-0">{children}</div>

      <nav
        aria-label="Ambassador quick navigation"
        data-ambassador-bottom-nav
        className="pointer-events-auto fixed inset-x-0 z-[60] border-t border-emerald-200 bg-white/95 shadow-[0_-10px_28px_rgba(15,23,42,0.09)] backdrop-blur-md lg:hidden"
        style={{
          bottom: "var(--sg-chrome-bottom, 0px)",
          paddingBottom:
            "max(0.4rem, calc(env(safe-area-inset-bottom, 0px) + 0.15rem))",
        }}
      >
        <div className="mx-auto grid max-w-[650px] grid-cols-5 gap-0.5 px-1.5 pt-1.5">
          {[
            { label: "Home", href: "/ambassador/dashboard", icon: LayoutDashboard },
            { label: "My QR", href: "/ambassador/dashboard/referrals", icon: QrCode },
            { label: "Social", href: "/ambassador/dashboard/social", icon: Share2 },
            { label: "Workspace", href: "/ambassador/dashboard#ambassador-workspace", icon: BriefcaseBusiness },
            { label: "Inbox", href: "/ambassador/dashboard/messages?support=admin&role=ambassador", icon: MessageCircle },
          ].map((item) => {
            const itemPath = item.href.split("?")[0].split("#")[0];
            const active =
              item.label === "Workspace"
                ? pathname.startsWith("/ambassador/dashboard/command-center") ||
                  (pathname === "/ambassador/dashboard" && activeHash === "#ambassador-workspace")
                : item.label === "Home"
                  ? pathname === "/ambassador/dashboard" && activeHash !== "#ambassador-workspace"
                  : pathname === itemPath ||
                    (itemPath !== "/ambassador/dashboard" && pathname.startsWith(itemPath + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[65px] min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 text-[12px] font-black leading-tight transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  active ? "bg-emerald-50 text-[#0D5C3A]" : "text-slate-700 hover:bg-emerald-50"
                }`}
              >
                <span className={`grid h-9 w-11 shrink-0 place-items-center rounded-2xl ${
                  active ? "bg-white" : ""
                }`}>
                  <Icon
                    className={`h-[24px] w-[24px] ${active ? "stroke-[2.4]" : "stroke-[2]"}`}
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
    </div>
  );
}