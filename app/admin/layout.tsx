"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CreditCard,
  FileBarChart,
  FileSpreadsheet,
  Gauge,
  HandCoins,
  Home,
  LineChart,
  MessageCircle,
  PawPrint,
  PieChart,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import AdminAccountMenu from "@/components/AdminAccountMenu";

const adminRoutes = {
  dashboard: "/admin",
  bookings: "/admin/bookings",
  customers: "/admin/customers",
  gurus: "/admin/gurus",
  messages: "/admin/messages",
  settings: "/admin/settings",
  financials: "/admin/financials",
  profitLoss: "/admin/financials/profit-loss",
  balanceSheet: "/admin/financials/balance-sheet",
  cashFlow: "/admin/financials/cash-flow",
  proForma: "/admin/financials/pro-forma",
  commissions: "/admin/commissions",
  payouts: "/admin/payouts",
  exports: "/admin/exports",
  activity: "/admin/activity",
  launchSignups: "/admin/launch-signups",
  programs: "/admin/programs",
  partners: "/admin/partners",
  analytics: "/admin/analytics",
};

const navSections = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", href: adminRoutes.dashboard, icon: Home },
      { label: "Bookings", href: adminRoutes.bookings, icon: CalendarDays },
      { label: "Customers", href: adminRoutes.customers, icon: Users },
      { label: "Gurus", href: adminRoutes.gurus, icon: PawPrint },
      { label: "Messages", href: adminRoutes.messages, icon: MessageCircle },
      { label: "Programs", href: adminRoutes.programs, icon: ShieldCheck },
      { label: "Partners", href: adminRoutes.partners, icon: HandCoins },
    ],
  },
  {
    title: "Financials",
    items: [
      { label: "Financial Overview", href: adminRoutes.financials, icon: LineChart },
      { label: "Profit & Loss", href: adminRoutes.profitLoss, icon: FileBarChart },
      { label: "Balance Sheet", href: adminRoutes.balanceSheet, icon: FileSpreadsheet },
      { label: "Cash Flow", href: adminRoutes.cashFlow, icon: CreditCard },
      { label: "Pro Forma", href: adminRoutes.proForma, icon: PieChart },
      { label: "Commissions", href: adminRoutes.commissions, icon: HandCoins },
      { label: "Payouts", href: adminRoutes.payouts, icon: WalletCards },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Analytics", href: adminRoutes.analytics, icon: Gauge },
      { label: "Reports & Exports", href: adminRoutes.exports, icon: BarChart3 },
      { label: "Activity Log", href: adminRoutes.activity, icon: Activity },
    ],
  },
];

const topHeaderLinks = [
  { label: "Homepage", href: "/" },
  { label: "Dashboard", href: adminRoutes.dashboard },
  { label: "Bookings", href: adminRoutes.bookings },
  { label: "Customers", href: adminRoutes.customers },
  { label: "Gurus", href: adminRoutes.gurus },
  { label: "Messages", href: adminRoutes.messages },
  { label: "Financials", href: adminRoutes.financials },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-2xl transition hover:opacity-90"
      aria-label="Back to SitGuru homepage"
    >
      <Image
        src="/images/sitguru-logo-cropped.png"
        alt="SitGuru"
        width={320}
        height={132}
        priority
        className="h-auto w-[132px]"
      />
    </Link>
  );
}

function SearchBar() {
  return (
    <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-[#dfe7df] bg-white px-4 py-3 shadow-sm xl:max-w-[460px]">
      <Search size={18} className="shrink-0 text-slate-400" />
      <input
        type="text"
        placeholder="Search anything..."
        className="ml-3 w-full min-w-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
      />
      <span className="ml-3 hidden rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-500 sm:inline-flex">
        ⌘K
      </span>
    </div>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
}: {
  title: string;
  pathname: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[];
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>

      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "group flex items-center gap-3 rounded-2xl bg-green-800 px-3 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
                  : "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-green-950 hover:shadow-sm"
              }
            >
              <span
                className={
                  active
                    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white"
                    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-[#edf2ec] transition group-hover:text-green-800"
                }
              >
                <Icon size={17} />
              </span>

              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <div className="border-t border-[#e5ebe2] bg-[#fcfdfb] px-4 py-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {topHeaderLinks.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black shadow-sm ${
                active
                  ? "border-green-800 bg-green-800 text-white"
                  : "border-green-100 bg-white text-green-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AdminFooter() {
  const footerSections = [
    {
      title: "Operations",
      links: [
        { label: "Bookings", href: adminRoutes.bookings },
        { label: "Customers", href: adminRoutes.customers },
        { label: "Gurus", href: adminRoutes.gurus },
        { label: "Messages", href: adminRoutes.messages },
      ],
    },
    {
      title: "Financials",
      links: [
        { label: "Financial Overview", href: adminRoutes.financials },
        { label: "Profit & Loss", href: adminRoutes.profitLoss },
        { label: "Balance Sheet", href: adminRoutes.balanceSheet },
        { label: "Cash Flow", href: adminRoutes.cashFlow },
      ],
    },
    {
      title: "Growth",
      links: [
        { label: "Launch Signups", href: adminRoutes.launchSignups },
        { label: "Programs", href: adminRoutes.programs },
        { label: "Partners", href: adminRoutes.partners },
        { label: "Analytics", href: adminRoutes.analytics },
      ],
    },
    {
      title: "Admin",
      links: [
        { label: "Reports & Exports", href: adminRoutes.exports },
        { label: "Activity Log", href: adminRoutes.activity },
        { label: "Settings", href: adminRoutes.settings },
      ],
    },
  ];

  return (
    <footer className="mt-6 rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="grid gap-8 xl:grid-cols-[1.1fr_2fr]">
        <div>
          <AdminLogo />

          <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-slate-600">
            SitGuru Admin keeps bookings, Gurus, customers, messages, financials,
            programs, referrals, partners, and reporting connected in one clean
            operating center.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-green-800 bg-green-800 px-4 py-2 text-xs font-black text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              Live Admin
            </span>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#dce9df] bg-white px-4 py-2 text-xs font-black text-green-800 transition hover:bg-green-50"
            >
              <Home size={14} />
              Back to Homepage
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-green-800">
                {section.title}
              </h3>

              <div className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm font-bold text-slate-600 transition hover:text-green-800"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-[#edf3ee] pt-5 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SitGuru. Admin portal.</p>

        <div className="flex flex-wrap gap-4">
          <Link href="/" className="transition hover:text-green-800">
            Homepage
          </Link>

          <Link href={adminRoutes.settings} className="transition hover:text-green-800">
            Settings
          </Link>

          <Link href={adminRoutes.exports} className="transition hover:text-green-800">
            Exports
          </Link>

          <Link href={adminRoutes.activity} className="transition hover:text-green-800">
            Activity
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminLoginPage = pathname === "/admin/login";

  if (isAdminLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8f4] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e5ebe2] bg-[#fcfdfb] lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-[#e8eee5] px-5 py-5">
              <AdminLogo />

              <div className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-green-700">
                  SitGuru HQ
                </p>

                <h2 className="mt-2 text-[3.35rem] font-black leading-[0.9] tracking-tight text-green-950">
                  Admin
                  <br />
                  Control
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Trusted Pet Care. Simplified.
                </p>
              </div>

              <Link
                href="/"
                className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-green-300 hover:bg-green-50"
              >
                <Home size={17} />
                Back to Homepage
              </Link>
            </div>

            <div className="px-5 pt-4">
              <div className="rounded-[1.5rem] border border-[#d8eadb] bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-green-800">
                  Platform View
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Oversee users, approvals, bookings, payments, disputes, partner
                  growth, reporting, and messages from one clean operations hub.
                </p>
              </div>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {navSections.map((section) => (
                <SidebarSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  pathname={pathname}
                />
              ))}
            </nav>

            <div className="border-t border-[#e8eee5] px-5 py-4">
              <Link
                href={adminRoutes.settings}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-green-950 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-[#edf2ec]">
                  <Settings size={17} />
                </span>

                <span>Settings</span>
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col overflow-x-hidden">
          <header className="sticky top-0 z-40 border-b border-[#e5ebe2] bg-[#fcfdfb]/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center justify-between gap-4 lg:hidden">
                  <AdminLogo />

                  <div className="flex items-center gap-2">
                    <Link
                      href={adminRoutes.messages}
                      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-green-800 text-white shadow-sm transition hover:bg-green-900"
                      aria-label="Admin messages"
                    >
                      <MessageCircle size={19} />
                      <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-white" />
                    </Link>

                    <div className="rounded-full border border-[#dfe7df] bg-white p-1 shadow-sm">
                      <NotificationBell />
                    </div>
                  </div>
                </div>

                <nav className="hidden min-w-0 items-center gap-1 rounded-2xl border border-[#dfe7df] bg-white p-1 shadow-sm lg:flex">
                  {topHeaderLinks.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition ${
                          active
                            ? "bg-green-800 text-white shadow-sm"
                            : "text-slate-600 hover:bg-white hover:text-green-900"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex min-w-0 flex-1 items-center gap-3 xl:justify-end">
                  <SearchBar />

                  <Link
                    href="/admin/gurus/new"
                    className="hidden items-center gap-2 rounded-2xl border border-[#dfe7df] bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-green-300 hover:bg-white sm:inline-flex"
                  >
                    <UserPlus size={16} />
                    Add Guru
                  </Link>

                  <Link
                    href={adminRoutes.exports}
                    className="hidden items-center gap-2 rounded-2xl border border-[#dfe7df] bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-green-300 hover:bg-white sm:inline-flex"
                  >
                    <BarChart3 size={16} />
                    Export
                  </Link>

                  <Link
                    href={adminRoutes.messages}
                    className="relative hidden h-12 w-12 items-center justify-center rounded-full bg-green-800 text-white shadow-sm transition hover:bg-green-900 lg:flex"
                    aria-label="Admin messages"
                  >
                    <MessageCircle size={20} />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-white" />
                  </Link>

                  <div className="hidden rounded-full border border-[#dfe7df] bg-white p-1 shadow-sm lg:flex">
                    <NotificationBell />
                  </div>

                  <AdminAccountMenu />
                </div>
              </div>
            </div>

            <MobileNav pathname={pathname} />
          </header>

          <main className="flex-1 overflow-x-hidden px-4 py-4 sm:px-5 lg:px-6 xl:px-6 2xl:px-7">
            <div className="w-full max-w-none">{children}</div>

            <AdminFooter />
          </main>
        </div>
      </div>
    </div>
  );
}