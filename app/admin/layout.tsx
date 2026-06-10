"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  BarChart3,
  ChevronDown,
  CalendarDays,
  CreditCard,
  FileBarChart,
  FileSpreadsheet,
  Gauge,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  Home,
  Landmark,
  LineChart,
  Link2,
  Megaphone,
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
  petParents: "/admin/customers",
  gurus: "/admin/gurus",
  ambassadors: "/admin/ambassadors",
  messages: "/admin/messages",
  settings: "/admin/settings",
  trustSafety: "/admin/background-checks",
  hr: "/admin/hr",
  universityTraining: "/admin/ambassador-training",
  universityAssignments: "/admin/university-assignments",
  financials: "/admin/financials",
  banking: "/admin/financials/plaid",
  stripe: "/admin/financials/stripe",
  profitLoss: "/admin/financials/profit-loss",
  balanceSheet: "/admin/financials/balance-sheet",
  cashFlow: "/admin/financials/cash-flow",
  generalLedger: "/admin/financials/general-ledger",
  reconciliation: "/admin/financials/reconciliation",
  proForma: "/admin/financials/pro-forma",
  taxReports: "/admin/financials/tax-reports",
  cpaHandoff: "/admin/financials/cpa-handoff",
  commissions: "/admin/commissions",
  payouts: "/admin/payouts",
  financialPayouts: "/admin/financials/payouts",
  financialExports: "/admin/financials/exports",
  reportsDaily: "/admin/financials/reports/daily",
  reportsWeekly: "/admin/financials/reports/weekly",
  reportsCustom: "/admin/financials/reports/custom",
  exports: "/admin/exports",
  auditTrail: "/admin/audit-trail",
  referrals: "/admin/referrals",
  salesMarketing: "/admin/sales-marketing",
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
      { label: "Pet Parents", href: adminRoutes.petParents, icon: Users },
      { label: "Gurus", href: adminRoutes.gurus, icon: PawPrint },
      { label: "Ambassadors", href: adminRoutes.ambassadors, icon: UserPlus },
      { label: "Human Resources", href: adminRoutes.hr, icon: HeartHandshake },
      {
        label: "SitGuru University",
        href: adminRoutes.universityTraining,
        icon: GraduationCap,
      },
      {
        label: "Trust & Safety",
        href: adminRoutes.trustSafety,
        icon: ShieldCheck,
      },
      { label: "Messages", href: adminRoutes.messages, icon: MessageCircle },
    ],
  },
  {
    title: "Growth & Marketing",
    items: [
      {
        label: "Sales & Marketing",
        href: adminRoutes.salesMarketing,
        icon: Megaphone,
      },
      {
        label: "Growth & Referrals",
        href: adminRoutes.referrals,
        icon: Link2,
      },
      { label: "Programs", href: adminRoutes.programs, icon: ShieldCheck },
      { label: "Partners", href: adminRoutes.partners, icon: HandCoins },
      { label: "Analytics", href: adminRoutes.analytics, icon: Gauge },
    ],
  },
  {
    title: "Financials",
    items: [
      {
        label: "Financial Overview",
        href: adminRoutes.financials,
        icon: LineChart,
      },
      { label: "Banking", href: adminRoutes.banking, icon: Landmark },
      {
        label: "Stripe Transactions",
        href: adminRoutes.stripe,
        icon: CreditCard,
      },
      {
        label: "Profit & Loss",
        href: adminRoutes.profitLoss,
        icon: FileBarChart,
      },
      {
        label: "Balance Sheet",
        href: adminRoutes.balanceSheet,
        icon: FileSpreadsheet,
      },
      { label: "Cash Flow", href: adminRoutes.cashFlow, icon: CreditCard },
      {
        label: "General Ledger",
        href: adminRoutes.generalLedger,
        icon: ClipboardList,
      },
      {
        label: "Reconciliation",
        href: adminRoutes.reconciliation,
        icon: ShieldCheck,
      },
      { label: "Pro Forma", href: adminRoutes.proForma, icon: PieChart },
      {
        label: "Tax Center",
        href: adminRoutes.taxReports,
        icon: FileSpreadsheet,
      },
      { label: "Commissions", href: adminRoutes.commissions, icon: HandCoins },
      { label: "Payouts", href: adminRoutes.payouts, icon: WalletCards },
    ],
  },
  {
    title: "Analytics & Admin",
    items: [
      {
        label: "Reports & Exports",
        href: adminRoutes.exports,
        icon: BarChart3,
      },
      {
        label: "Audit Trail",
        href: adminRoutes.auditTrail,
        icon: ClipboardList,
      },
      { label: "Settings", href: adminRoutes.settings, icon: Settings },
    ],
  },
];

const topHeaderLinks = [
  { label: "Homepage", href: "/" },
  { label: "Dashboard", href: adminRoutes.dashboard },
  { label: "Bookings", href: adminRoutes.bookings },
  { label: "Pet Parents", href: adminRoutes.petParents },
  { label: "Gurus", href: adminRoutes.gurus },
  { label: "Ambassadors", href: adminRoutes.ambassadors },
  { label: "Human Resources", href: adminRoutes.hr },
  { label: "SitGuru University", href: adminRoutes.universityTraining },
  { label: "Trust & Safety", href: adminRoutes.trustSafety },
  { label: "Messages", href: adminRoutes.messages },
  { label: "Financials", href: adminRoutes.financials },
];

const mobileQuickLinks = [
  {
    label: "Pet Parents",
    href: adminRoutes.petParents,
    icon: Users,
    description: "Profiles and activity",
    featured: true,
  },
  {
    label: "Gurus",
    href: adminRoutes.gurus,
    icon: PawPrint,
    description: "Applicants and profiles",
    featured: true,
  },
  {
    label: "Ambassadors",
    href: adminRoutes.ambassadors,
    icon: UserPlus,
    description: "Referrals and onboarding",
    featured: true,
  },
  {
    label: "HR",
    href: adminRoutes.hr,
    icon: HeartHandshake,
    description: "Hiring and onboarding",
    featured: false,
  },
  {
    label: "University",
    href: adminRoutes.universityTraining,
    icon: GraduationCap,
    description: "Training and academies",
    featured: false,
  },
  {
    label: "Growth",
    href: adminRoutes.referrals,
    icon: Link2,
    description: "Referrals and PawPerks",
    featured: false,
  },
];

const mobileGrowthLinks = [
  { label: "Ambassadors", href: adminRoutes.ambassadors, icon: UserPlus },
  { label: "Human Resources", href: adminRoutes.hr, icon: HeartHandshake },
  {
    label: "SitGuru University",
    href: adminRoutes.universityTraining,
    icon: GraduationCap,
  },
  {
    label: "Academy Assignments",
    href: adminRoutes.universityAssignments,
    icon: ClipboardList,
  },
  {
    label: "Sales & Marketing",
    href: adminRoutes.salesMarketing,
    icon: Megaphone,
  },
  { label: "Growth & Referrals", href: adminRoutes.referrals, icon: Link2 },
  { label: "Programs", href: adminRoutes.programs, icon: ShieldCheck },
  { label: "Partners", href: adminRoutes.partners, icon: HandCoins },
  { label: "Analytics", href: adminRoutes.analytics, icon: Gauge },
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
        className="h-auto w-[118px]"
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
        placeholder="Search admin..."
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
    <div className="mb-4">
      <p className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "group flex items-center gap-2.5 rounded-xl bg-green-800 px-2.5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
                  : "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-green-950 hover:shadow-sm"
              }
            >
              <span
                className={
                  active
                    ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white"
                    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-[#edf2ec] transition group-hover:text-green-800"
                }
              >
                <Icon size={16} />
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
    <div className="border-t border-[#e5ebe2] bg-[#fcfdfb] px-3 py-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mobileQuickLinks.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.featured || active
                  ? "min-w-[152px] rounded-2xl border border-green-800 bg-green-800 p-3 text-white shadow-sm"
                  : "min-w-[152px] rounded-2xl border border-green-100 bg-white p-3 text-green-950 shadow-sm"
              }
            >
              <span className="flex items-center gap-2 text-xs font-black">
                <span
                  className={
                    item.featured || active
                      ? "flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white"
                      : "flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-800"
                  }
                >
                  <Icon size={16} />
                </span>
                {item.label}
              </span>

              <span
                className={
                  item.featured || active
                    ? "mt-1 block text-[10px] font-bold leading-4 text-white/80"
                    : "mt-1 block text-[10px] font-bold leading-4 text-slate-500"
                }
              >
                {item.description}
              </span>
            </Link>
          );
        })}
      </div>

      <details className="group mt-3 rounded-2xl border border-green-100 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-green-950 marker:hidden">
          <span className="flex items-center gap-2">
            <Megaphone size={17} className="text-green-800" />
            HR, University & Growth
          </span>

          <ChevronDown
            size={18}
            className="text-green-800 transition group-open:rotate-180"
          />
        </summary>

        <div className="grid max-h-[48dvh] gap-2 overflow-y-auto border-t border-green-50 p-3">
          {mobileGrowthLinks.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex items-center gap-2 rounded-xl bg-green-800 px-3 py-2.5 text-xs font-black text-white"
                    : "flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-xs font-black text-green-900"
                }
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </details>

      <details className="group mt-3 rounded-2xl border border-[#dfe7df] bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-slate-900 marker:hidden">
          <span className="flex items-center gap-2">
            <Gauge size={17} className="text-green-800" />
            All admin sections
          </span>

          <ChevronDown
            size={18}
            className="text-green-800 transition group-open:rotate-180"
          />
        </summary>

        <div className="grid max-h-[58dvh] gap-4 overflow-y-auto border-t border-[#edf3ee] p-3">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                {section.title}
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        active
                          ? "flex items-center gap-2 rounded-xl bg-green-800 px-3 py-2.5 text-xs font-black text-white"
                          : "flex items-center gap-2 rounded-xl border border-green-50 bg-green-50 px-3 py-2.5 text-xs font-black text-green-900"
                      }
                    >
                      <Icon size={15} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </details>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        { label: "Dashboard", href: adminRoutes.dashboard },
        { label: "Bookings", href: adminRoutes.bookings },
        { label: "Pet Parents", href: adminRoutes.petParents },
        { label: "Gurus", href: adminRoutes.gurus },
        { label: "Ambassadors", href: adminRoutes.ambassadors },
        { label: "Human Resources", href: adminRoutes.hr },
        { label: "SitGuru University", href: adminRoutes.universityTraining },
        {
          label: "Academy Assignments",
          href: adminRoutes.universityAssignments,
        },
        { label: "Trust & Safety", href: adminRoutes.trustSafety },
        { label: "Messages", href: adminRoutes.messages },
      ],
    },
    {
      title: "Financial Statements",
      links: [
        { label: "Financial Overview", href: adminRoutes.financials },
        { label: "Profit & Loss", href: adminRoutes.profitLoss },
        { label: "Balance Sheet", href: adminRoutes.balanceSheet },
        { label: "Cash Flow", href: adminRoutes.cashFlow },
        { label: "General Ledger", href: adminRoutes.generalLedger },
        { label: "Reconciliation", href: adminRoutes.reconciliation },
        { label: "Pro Forma", href: adminRoutes.proForma },
      ],
    },
    {
      title: "Financial Operations",
      links: [
        { label: "Banking", href: adminRoutes.banking },
        { label: "Stripe Transactions", href: adminRoutes.stripe },
        { label: "Commissions", href: adminRoutes.commissions },
        { label: "Payouts", href: adminRoutes.payouts },
        {
          label: "Financial Payout Analytics",
          href: adminRoutes.financialPayouts,
        },
      ],
    },
    {
      title: "Reports, Taxes & Exports",
      links: [
        { label: "Tax Center", href: adminRoutes.taxReports },
        { label: "CPA Handoff", href: adminRoutes.cpaHandoff },
        { label: "Daily Report", href: adminRoutes.reportsDaily },
        { label: "Weekly Report", href: adminRoutes.reportsWeekly },
        { label: "Custom Report", href: adminRoutes.reportsCustom },
        {
          label: "Financial Export Center",
          href: adminRoutes.financialExports,
        },
      ],
    },
    {
      title: "Growth & Marketing",
      links: [
        { label: "Growth & Referrals", href: adminRoutes.referrals },
        { label: "Sales & Marketing", href: adminRoutes.salesMarketing },
        { label: "Programs", href: adminRoutes.programs },
        { label: "Partners", href: adminRoutes.partners },
        { label: "Analytics", href: adminRoutes.analytics },
      ],
    },
    {
      title: "Admin",
      links: [
        { label: "Reports & Exports", href: adminRoutes.exports },
        { label: "Audit Trail", href: adminRoutes.auditTrail },
        { label: "Settings", href: adminRoutes.settings },
      ],
    },
  ];

  return (
    <footer className="mt-6 rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="grid gap-8 xl:grid-cols-[1fr_3fr]">
        <div>
          <AdminLogo />

          <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-slate-600">
            SitGuru Admin keeps bookings, Gurus, Pet Parents, Ambassadors,
            messages, financials, training, academies, programs, referrals,
            partners, taxes, and reporting connected in one clean operating
            center.
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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

          <Link
            href={adminRoutes.settings}
            className="transition hover:text-green-800"
          >
            Settings
          </Link>

          <Link
            href={adminRoutes.financialExports}
            className="transition hover:text-green-800"
          >
            Exports
          </Link>

          <Link
            href={adminRoutes.taxReports}
            className="transition hover:text-green-800"
          >
            Tax Center
          </Link>

          <Link
            href={adminRoutes.auditTrail}
            className="transition hover:text-green-800"
          >
            Audit Trail
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
    <div className="min-h-dvh overflow-x-hidden bg-[#f7f8f4] text-slate-950">
      <div className="grid min-h-dvh lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e5ebe2] bg-[#fcfdfb] lg:block">
          <div className="sticky top-0 flex h-dvh min-h-0 flex-col">
            <div className="shrink-0 border-b border-[#e8eee5] px-4 py-4">
              <AdminLogo />

              <div className="mt-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-green-700">
                  SitGuru HQ
                </p>

                <h2 className="mt-1 text-[2.05rem] font-black leading-[0.92] tracking-tight text-green-950 xl:text-[2.35rem]">
                  Admin
                  <br />
                  Control
                </h2>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Trusted Pet Care. Simplified.
                </p>
              </div>

              <Link
                href="/"
                className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-white px-3 py-2 text-xs font-black text-green-900 shadow-sm transition hover:border-green-300 hover:bg-green-50"
              >
                <Home size={15} />
                Back to Homepage
              </Link>
            </div>

            <div className="shrink-0 px-4 pt-3">
              <div className="rounded-[1.15rem] border border-[#d8eadb] bg-white p-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-800">
                  Platform View
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                  Oversee Pet Parents, Gurus, Ambassadors, approvals, bookings,
                  payments, hiring, growth, training, academies, reporting,
                  taxes, and messages.
                </p>
              </div>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 pr-3 [scrollbar-width:thin]">
              {navSections.map((section) => (
                <SidebarSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  pathname={pathname}
                />
              ))}
            </nav>

            <div className="shrink-0 border-t border-[#e8eee5] px-4 py-3">
              <Link
                href={adminRoutes.settings}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-green-950 hover:shadow-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-[#edf2ec]">
                  <Settings size={16} />
                </span>

                <span>Settings</span>
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col overflow-x-hidden">
          <header className="sticky top-0 z-40 border-b border-[#e5ebe2] bg-[#fcfdfb]/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-3 py-3 sm:px-5 lg:px-6">
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

                <nav className="hidden min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-[#dfe7df] bg-white p-1 shadow-sm lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {topHeaderLinks.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-black transition xl:px-4 ${
                          active
                            ? "bg-green-800 text-white shadow-sm"
                            : "text-slate-600 hover:bg-green-50 hover:text-green-900"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex min-w-0 flex-1 items-center gap-2 xl:justify-end">
                  <SearchBar />

                  <Link
                    href="/admin/gurus/new"
                    className="hidden items-center gap-2 rounded-2xl border border-[#dfe7df] bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-green-300 hover:bg-white sm:inline-flex"
                  >
                    <UserPlus size={16} />
                    Add Guru
                  </Link>

                  <Link
                    href={adminRoutes.financialExports}
                    className="hidden items-center gap-2 rounded-2xl border border-[#dfe7df] bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-green-300 hover:bg-white sm:inline-flex"
                  >
                    <BarChart3 size={16} />
                    Export
                  </Link>

                  <Link
                    href={adminRoutes.messages}
                    className="relative hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-800 text-white shadow-sm transition hover:bg-green-900 lg:flex"
                    aria-label="Admin messages"
                  >
                    <MessageCircle size={20} />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-white" />
                  </Link>

                  <div className="hidden shrink-0 rounded-full border border-[#dfe7df] bg-white p-1 shadow-sm lg:flex">
                    <NotificationBell />
                  </div>

                  <AdminAccountMenu />
                </div>
              </div>
            </div>

            <MobileNav pathname={pathname} />
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-5 lg:px-6 xl:px-6 2xl:px-7">
            <div className="w-full max-w-none">{children}</div>

            <AdminFooter />
          </main>
        </div>
      </div>
    </div>
  );
}