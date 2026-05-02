"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { ReactNode, useMemo, useState } from "react";

type AdminShellProps = {
  children: ReactNode;
};

const primaryNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Gurus", href: "/admin/gurus", icon: ShieldCheck },
  { label: "Messages", href: "/admin/messages", icon: MessageCircle },
  { label: "Programs", href: "/admin/programs", icon: Sparkles },
  { label: "Partners", href: "/admin/partners", icon: Users },
];

const financialNav = [
  { label: "Financial Overview", href: "/admin/financials", icon: CircleDollarSign },
  { label: "Profit & Loss", href: "/admin/financials/profit-loss", icon: FileText },
  { label: "Balance Sheet", href: "/admin/financials/balance-sheet", icon: BookOpen },
  { label: "Cash Flow", href: "/admin/financials/cash-flow", icon: WalletCards },
  { label: "Pro Forma", href: "/admin/financials/pro-forma", icon: BarChart3 },
  { label: "Commissions", href: "/admin/financials/commissions", icon: ClipboardList },
  { label: "Payouts", href: "/admin/financials/payouts", icon: Download },
];

const analyticsNav = [
  { label: "Analytics", href: "/admin/analytics", icon: Gauge },
  { label: "Reports & Exports", href: "/admin/reports", icon: FileText },
  { label: "Activity Logs", href: "/admin/activity", icon: ClipboardList },
];

function NavItem({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: any;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
        active
          ? "bg-[#007F3D] text-white shadow-sm"
          : "text-[#173C2A] hover:bg-[#E8F6EE] hover:text-[#007F3D]",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-7 w-7 place-items-center rounded-lg",
          active ? "bg-white/15 text-white" : "bg-[#F1F7F3] text-[#007F3D]",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: typeof primaryNav;
  pathname: string;
}) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#6D7C72]">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/admin/dashboard"
              ? pathname === "/admin" || pathname === "/admin/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <NavItem
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              active={active}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const pageTitle = useMemo(() => {
    if (pathname === "/admin" || pathname === "/admin/dashboard") return "Dashboard";

    const allItems = [...primaryNav, ...financialNav, ...analyticsNav];

    const found = allItems
      .slice()
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

    return found?.label ?? "Admin Control";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#173C2A]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-[#DDE8DF] bg-white/95 shadow-sm lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-[#E4EEE6] px-5 py-4">
            <Link
              href="/"
              aria-label="Back to SitGuru homepage"
              className="inline-flex items-center gap-3 rounded-2xl transition hover:opacity-90"
            >
              <img
                src="/images/sitguru-logo-cropped.png"
                alt="SitGuru"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <div className="mt-4">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#007F3D]">
                Platform Admin
              </p>
              <h1 className="mt-1 text-2xl font-black leading-none text-[#173C2A]">
                Admin Control
              </h1>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#6D7C72]">
                Trusted pet care. Simplified.
              </p>
            </div>

            <Link
              href="/"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#BFDCCB] bg-[#F4FBF7] px-3 py-2 text-xs font-black text-[#007F3D] transition hover:bg-[#E8F6EE]"
            >
              <Home className="h-4 w-4" />
              Back to Homepage
            </Link>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
            <NavGroup title="Dashboard" items={primaryNav} pathname={pathname} />
            <NavGroup title="Financial" items={financialNav} pathname={pathname} />
            <NavGroup title="Analytics" items={analyticsNav} pathname={pathname} />
          </div>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-[#DDE8DF] bg-white/90 backdrop-blur">
          <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[#DDE8DF] bg-white text-[#007F3D] shadow-sm transition hover:bg-[#F4FBF7] lg:hidden"
                aria-label="Back to homepage"
              >
                <Home className="h-5 w-5" />
              </Link>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#007F3D]">
                  Admin
                </p>
                <h2 className="text-lg font-black text-[#173C2A] sm:text-xl">
                  {pageTitle}
                </h2>
              </div>
            </div>

            <div className="hidden min-w-[320px] max-w-xl flex-1 items-center rounded-2xl border border-[#DDE8DF] bg-[#F7F9F6] px-4 py-2.5 xl:flex">
              <Search className="mr-3 h-4 w-4 text-[#6D7C72]" />
              <input
                className="w-full bg-transparent text-sm font-semibold text-[#173C2A] outline-none placeholder:text-[#8A988E]"
                placeholder="Search anything..."
              />
              <span className="ml-3 rounded-lg border border-[#DDE8DF] bg-white px-2 py-1 text-[10px] font-black text-[#6D7C72]">
                ⌘K
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="hidden items-center gap-2 rounded-xl border border-[#BFDCCB] bg-[#F4FBF7] px-4 py-2 text-sm font-black text-[#007F3D] transition hover:bg-[#E8F6EE] md:inline-flex"
              >
                <Home className="h-4 w-4" />
                Homepage
              </Link>

              <Link
                href="/admin/gurus/new"
                className="hidden items-center gap-2 rounded-xl bg-[#007F3D] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#006E35] md:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Add Guru
              </Link>

              <Link
                href="/admin/reports"
                className="hidden items-center gap-2 rounded-xl border border-[#BFDCCB] bg-white px-4 py-2 text-sm font-black text-[#007F3D] transition hover:bg-[#F4FBF7] md:inline-flex"
              >
                <Download className="h-4 w-4" />
                Export
              </Link>

              <Link
                href="/admin/messages"
                className="relative grid h-11 w-11 place-items-center rounded-2xl border border-[#DDE8DF] bg-white text-[#007F3D] shadow-sm transition hover:bg-[#F4FBF7]"
                aria-label="Admin messages"
              >
                <Mail className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#007F3D]" />
              </Link>

              <Link
                href="/admin/notifications"
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[#DDE8DF] bg-white text-[#007F3D] shadow-sm transition hover:bg-[#F4FBF7]"
                aria-label="Admin notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-2xl border border-[#DDE8DF] bg-white px-2 py-2 shadow-sm transition hover:bg-[#F4FBF7]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#007F3D] text-xs font-black text-white">
                    A
                  </span>

                  <span className="hidden text-left lg:block">
                    <span className="block text-sm font-black leading-none text-[#173C2A]">
                      Admin User
                    </span>
                    <span className="mt-1 block text-[11px] font-bold leading-none text-[#6D7C72]">
                      Super Admin
                    </span>
                  </span>

                  <ChevronDown
                    className={[
                      "h-4 w-4 text-[#007F3D] transition",
                      profileOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-[#DDE8DF] bg-white shadow-xl">
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#173C2A] hover:bg-[#F4FBF7]"
                    >
                      <Settings className="h-4 w-4 text-[#007F3D]" />
                      Admin Settings
                    </Link>

                    <Link
                      href="/admin/messages"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#173C2A] hover:bg-[#F4FBF7]"
                    >
                      <MessageCircle className="h-4 w-4 text-[#007F3D]" />
                      Messages
                    </Link>

                    <Link
                      href="/"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#173C2A] hover:bg-[#F4FBF7]"
                    >
                      <Home className="h-4 w-4 text-[#007F3D]" />
                      Back to Homepage
                    </Link>

                    <Link
                      href="/logout"
                      className="flex w-full items-center gap-3 border-t border-[#E4EEE6] px-4 py-3 text-left text-sm font-bold text-[#B42318] hover:bg-[#FFF4F2]"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}