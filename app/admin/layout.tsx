"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  ClipboardList,
  BarChart3,
  BriefcaseBusiness,
  ChevronDown,
  CalendarDays,
  CreditCard,
  FileSpreadsheet,
  Gauge,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  Home,
  Landmark,
  LifeBuoy,
  LineChart,
  Link2,
  MapPin,
  Mail,
  Megaphone,
  MessageCircle,
  PawPrint,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
  Images,
  FolderOpen,
  Lightbulb,
  PanelLeftClose,
  PanelLeft,
  Inbox,
  Clock3,
  AlertTriangle,
  Globe,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import AdminAccountMenu from "@/components/AdminAccountMenu";
import RogueFloatingAssistant from "@/components/admin/RogueFloatingAssistant";
import GrowthPhoneBar from "@/components/admin/growth/GrowthPhoneBar";
import DeskChatDock from "@/components/messaging/DeskChatDock";
import WorkspaceLiveSyncMount from "@/components/realtime/WorkspaceLiveSyncMount";
import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";
import {
  isNavSectionOn,
  type AdminNavAccess,
} from "@/lib/admin/nav-access";
import { isAdminPathAllowedForModules } from "@/lib/admin/portal-areas";
import {
  HQ_HEADER_LINKS,
  HQ_NAV_SECTIONS,
  isActiveAdminPath,
  type HqNavIcon,
} from "@/lib/admin/hq-nav";
import { DESK_BANNER, DESK_LOGO, DESK_UI } from "@/lib/portal/desk-ui";

const HQ_ICON_MAP: Record<
  HqNavIcon,
  ComponentType<{ size?: number; className?: string }>
> = {
  home: Home,
  inbox: Inbox,
  clipboard: ClipboardCheck,
  messages: MessageCircle,
  audit: ClipboardList,
  radio: Radio,
  users: Users,
  paw: PawPrint,
  userPlus: UserPlus,
  heart: HeartHandshake,
  briefcase: BriefcaseBusiness,
  grad: GraduationCap,
  shield: ShieldCheck,
  lifeBuoy: LifeBuoy,
  calendar: CalendarDays,
  reviews: ClipboardList,
  disputes: AlertTriangle,
  payments: CreditCard,
  payouts: WalletCards,
  megaphone: Megaphone,
  link: Link2,
  programs: ShieldCheck,
  partners: HandCoins,
  map: MapPin,
  mail: Mail,
  gauge: Gauge,
  insights: Lightbulb,
  finance: LineChart,
  bank: Landmark,
  card: CreditCard,
  chart: BarChart3,
  sheet: FileSpreadsheet,
  wallet: WalletCards,
  clock: Clock3,
  settings: Settings,
  website: Globe,
  fraud: AlertTriangle,
  security: ShieldCheck,
};

const adminRoutes = {
  dashboard: "/admin",
  liveWalks: "/admin/dashboard/live-walks",
  bookings: "/admin/bookings",
  petParents: "/admin/petparents",
  gurus: "/admin/gurus",
  ambassadors: "/admin/ambassadors",
  ambassadorLedger: "/admin/ambassadors/ledger",
  messages: "/admin/messages",
  support: "/admin/support",
  settings: "/admin/settings",
  growth: "/admin/growth",
  growthCreate: "/admin/growth/create",
  growthCampaigns: "/admin/growth/campaigns",
  growthContent: "/admin/growth/content",
  growthGurus: "/admin/growth/gurus",
  growthEvents: "/admin/growth/events",
  growthPartners: "/admin/growth/partners",
  growthMedia: "/admin/growth/media",
  growthAnalytics: "/admin/growth/analytics",
  growthIntelligence: "/admin/growth/intelligence",
  trustSafety: "/admin/background-checks",
  hr: "/admin/hr",
  internship: "/admin/internship",
  universityTraining: "/admin/ambassador-training",
  universityAssignments: "/admin/university-assignments",
  universityProgress: "/admin/university-progress",
  universityCurriculum: "/admin/ambassador-training/manage",
  financials: "/admin/financials",
  banking: "/admin/financials/plaid",
  stripe: "/admin/financials/payment-gateway",
  paymentGateway: "/admin/financials/payment-gateway",
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
  reports: "/admin/financials/reports",
  reportsDaily: "/admin/financials/reports/daily",
  reportsWeekly: "/admin/financials/reports/weekly",
  reportsCustom: "/admin/financials/reports/custom",
  exports: "/admin/exports",
  auditTrail: "/admin/audit-trail",
  referrals: "/admin/referrals",
  salesMarketing: "/admin/sales-marketing",
  marketGrowth: "/admin/market-growth",
  emailUpdates: "/admin/email-updates",
  programs: "/admin/programs",
  partners: "/admin/partners",
  communityEvents: "/admin/community/events",
  communityMarkets: "/admin/community/markets",
  analytics: "/admin/analytics",
  insights: "/admin/insights",
};

const growthNavSections = [
  {
    title: "Growth",
    items: [
      { label: "Home", href: adminRoutes.growth, icon: Home },
      { label: "Messages", href: "/admin/growth/messages", icon: MessageCircle },
      { label: "Intern team", href: "/intern/manage", icon: Users },
      { label: "My Time", href: "/admin/growth/my-time", icon: ClipboardCheck },
      { label: "My Payments", href: "/admin/growth/payments", icon: CreditCard },
      { label: "Onboarding", href: "/admin/growth/onboarding", icon: GraduationCap },
      { label: "Events", href: adminRoutes.growthEvents, icon: CalendarDays },
      { label: "Campaigns", href: adminRoutes.growthCampaigns, icon: Megaphone },
      { label: "Intelligence", href: adminRoutes.growthIntelligence, icon: Lightbulb },
      { label: "Analytics", href: adminRoutes.growthAnalytics, icon: BarChart3 },
      { label: "Tracking links", href: adminRoutes.growthCreate, icon: Plus },
      { label: "Content", href: adminRoutes.growthContent, icon: FolderOpen },
      { label: "Gurus", href: adminRoutes.growthGurus, icon: PawPrint },
      { label: "Partners", href: adminRoutes.growthPartners, icon: HandCoins },
      { label: "Media", href: adminRoutes.growthMedia, icon: Images },
    ],
  },
];

const growthHeaderLinks = [
  { label: "Home", href: adminRoutes.growth },
  { label: "Messages", href: "/admin/growth/messages" },
  { label: "Intern team", href: "/intern/manage" },
  { label: "My Time", href: "/admin/growth/my-time" },
  { label: "My Payments", href: "/admin/growth/payments" },
  { label: "Onboarding", href: "/admin/growth/onboarding" },
];

const navSections = HQ_NAV_SECTIONS.map((section) => ({
  title: section.title,
  items: section.items.map((item) => ({
    label: item.label,
    href: item.href,
    icon: HQ_ICON_MAP[item.icon] || Home,
  })),
}));

const topHeaderLinks = HQ_HEADER_LINKS;

const mobileQuickLinks = [
  {
    label: "Social Media Manager",
    href: adminRoutes.growth,
    icon: Sparkles,
    description: "Campaigns, posts, and signups",
    featured: true,
  },
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
    label: "Internship Program",
    href: adminRoutes.internship,
    icon: BriefcaseBusiness,
    description: "Intern portal and employer review",
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
    label: "Academy Progress",
    href: adminRoutes.universityProgress,
    icon: ClipboardCheck,
  },
  {
    label: "Sales & Marketing",
    href: adminRoutes.salesMarketing,
    icon: Megaphone,
  },
  {
    label: "Market Growth Map",
    href: adminRoutes.marketGrowth,
    icon: MapPin,
  },
  {
    label: "Email Updates",
    href: adminRoutes.emailUpdates,
    icon: Mail,
  },
  { label: "Growth & Referrals", href: adminRoutes.referrals, icon: Link2 },
  { label: "Programs", href: adminRoutes.programs, icon: ShieldCheck },
  { label: "Partners", href: adminRoutes.partners, icon: HandCoins },
  { label: "Analytics", href: adminRoutes.analytics, icon: Gauge },
];

function isActivePath(pathname: string, href: string) {
  return isActiveAdminPath(pathname, href);
}

function AdminLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/admin"
      className="inline-flex min-w-0 items-center transition hover:opacity-90"
      aria-label="SitGuru Admin HQ"
    >
      <Image
        src={DESK_LOGO}
        alt="SitGuru. Trusted Pet Care Simplified."
        width={420}
        height={140}
        priority
        className={`h-auto w-full object-contain object-left mix-blend-multiply ${
          compact ? "max-h-10 max-w-[140px]" : "max-h-12 max-w-[168px]"
        }`}
      />
    </Link>
  );
}

function SearchBar() {
  return (
    <label className="relative flex h-11 w-11 shrink-0 items-center justify-center text-slate-500 transition hover:text-[#2563EB] xl:w-[13.5rem] xl:justify-start 2xl:w-[15.5rem]">
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 hidden -translate-y-1/2 text-slate-400 xl:block"
        aria-hidden
      />
      <Search size={18} className="shrink-0 xl:hidden" aria-hidden />
      <input
        type="search"
        placeholder="Search HQ…"
        className={`hidden xl:block ${DESK_UI.search}`}
        aria-label="Search admin"
      />
    </label>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
  open,
  onToggle,
  collapsed = false,
}: {
  title: string;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  collapsed?: boolean;
  items: {
    label: string;
    href: string;
    icon: ComponentType<{ size?: number; className?: string }>;
  }[];
}) {
  const hasActive = items.some((item) => isActivePath(pathname, item.href));

  if (collapsed) {
    // Icon rail: keep only the first few destinations per group so the
    // collapsed HQ shell stays light and does not mount every route icon.
    const railItems = items.slice(0, 4);
    return (
      <div className="mb-2 space-y-1">
        {railItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={
                active
                  ? `flex h-11 w-11 items-center justify-center rounded-2xl ${DESK_UI.sidebarActive}`
                  : `flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-slate-200/80 transition ${DESK_UI.sidebarIdle}`
              }
            >
              <Icon size={16} />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-2xl px-3 py-1.5 text-left text-[10px] font-black uppercase tracking-[0.14em] transition ${
          hasActive
            ? "text-[#2563EB]"
            : "text-slate-400 hover:bg-[#EEF2F6] hover:text-[#0F2744]"
        }`}
      >
        <span>{title}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={
                  active
                    ? `group flex min-h-10 items-center gap-3 rounded-2xl px-3 text-[13px] font-bold ${DESK_UI.sidebarActive}`
                    : `group flex min-h-10 items-center gap-3 rounded-2xl px-3 text-[13px] font-semibold ${DESK_UI.sidebarIdle}`
                }
              >
                <Icon size={16} className="shrink-0 opacity-90" />
                <span className="min-w-0 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MobileNav({
  pathname,
  growthOnly = false,
  modules = null,
}: {
  pathname: string;
  growthOnly?: boolean;
  modules?: AdminNavAccess | null;
}) {
  const allow = (href: string) =>
    !modules || href === "/" || isAdminPathAllowedForModules(href, modules);

  const primaryLinks = growthOnly
    ? (growthNavSections[0]?.items || []).slice(0, 6)
    : [
        ...mobileQuickLinks.filter((item) => item.featured && allow(item.href)),
        ...topHeaderLinks
          .filter((item) => allow(item.href))
          .filter(
            (item) =>
              !mobileQuickLinks.some((quick) => quick.href === item.href) &&
              item.href !== "/admin/messages",
          )
          .slice(0, 4)
          .map((item) => ({
            label: item.label,
            href: item.href,
            icon: Home,
            description: "",
            featured: false,
          })),
      ];

  return (
    <div className="border-t border-slate-200/80 bg-white px-3 py-2 lg:hidden">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {primaryLinks.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          const featured = "featured" in item ? Boolean(item.featured) : false;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={
                featured || active
                  ? `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold ${DESK_UI.sidebarActive}`
                  : "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-[11px] font-bold text-[#0F2744]"
              }
            >
              <Icon size={14} className="shrink-0 opacity-90" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {growthOnly ? null : (
        <details className={`group mt-2 ${DESK_UI.card}`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-black text-[#0F2744] marker:hidden">
            <span className="flex items-center gap-2">
              <Gauge size={16} className="text-[#2563EB]" />
              More HQ
            </span>
            <ChevronDown
              size={16}
              className="text-[#2563EB] transition group-open:rotate-180"
            />
          </summary>

          <div className="grid max-h-[min(58dvh,28rem)] gap-4 overflow-y-auto border-t border-slate-100 p-3">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                HR, University & Growth
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {mobileGrowthLinks.filter((item) => allow(item.href)).map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        active
                          ? `flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${DESK_UI.sidebarActive}`
                          : "flex items-center gap-2 rounded-2xl bg-[#EEF2F6] px-3 py-2 text-xs font-bold text-[#0F2744]"
                      }
                    >
                      <Icon size={14} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {navSections
              .filter((section) => !modules || isNavSectionOn(section.title, modules))
              .map((section) => (
                <div key={section.title}>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {section.items.filter((item) => allow(item.href)).map((item) => {
                      const Icon = item.icon;
                      const active = isActivePath(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={
                            active
                              ? `flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${DESK_UI.sidebarActive}`
                              : "flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#0F2744]"
                          }
                        >
                          <Icon size={14} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}

function AdminFooter({
  modules,
  limitNav,
}: {
  modules: AdminNavAccess | null;
  limitNav: boolean;
}) {
  const showLink = (href: string) =>
    !limitNav || !modules || href === "/" || isAdminPathAllowedForModules(href, modules);
  const footerSections = [
    {
      title: "Operations",
      links: [
        { label: "Dashboard", href: adminRoutes.dashboard },
        { label: "Live Walks", href: adminRoutes.liveWalks },
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
        {
          label: "Academy Progress",
          href: adminRoutes.universityProgress,
        },
        { label: "Trust & Safety", href: adminRoutes.trustSafety },
        { label: "Support", href: adminRoutes.support },
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
        { label: "Payment Gateway", href: adminRoutes.paymentGateway },
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
        { label: "Reports Hub", href: adminRoutes.reports },
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
        { label: "Social Media Manager", href: adminRoutes.growth },
        { label: "Growth & Referrals", href: adminRoutes.referrals },
        { label: "Sales & Marketing", href: adminRoutes.salesMarketing },
        { label: "Email Updates", href: adminRoutes.emailUpdates },
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
  ]
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => showLink(link.href)),
    }))
    .filter((section) => section.links.length > 0);

  const footerLead =
    limitNav && modules && !modules.financials
      ? "SitGuru Admin keeps the areas open on this account together: bookings, pet parents, gurus, ambassadors, growth, messages, programs, and reporting."
      : "SitGuru Admin keeps bookings, Gurus, Pet Parents, Ambassadors, messages, financials, training, academies, programs, referrals, partners, taxes, and reporting connected in one clean operating center.";

  return (
    <footer className={`mt-6 p-5 ${DESK_UI.card}`}>
      <div className="grid gap-8 xl:grid-cols-[1fr_3fr]">
        <div>
          <AdminLogo />

          <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-slate-600">
            {footerLead}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${DESK_UI.primary}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              Live Admin
            </span>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-black text-[#0F2744] transition hover:bg-[#EEF2F6]"
            >
              <Home size={14} />
              Back to Homepage
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#2563EB]">
                {section.title}
              </h3>

              <div className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block text-sm font-bold text-slate-600 transition ${DESK_UI.link}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SitGuru. Admin portal.</p>

        <div className="flex flex-wrap gap-4">
          <Link href="/" className={`transition ${DESK_UI.link}`}>
            Homepage
          </Link>

          {showLink(adminRoutes.settings) ? (
          <Link
            href={adminRoutes.settings}
            className={`transition ${DESK_UI.link}`}
          >
            Settings
          </Link>
          ) : null}

          {showLink(adminRoutes.financialExports) ? (
          <Link
            href={adminRoutes.financialExports}
            className={`transition ${DESK_UI.link}`}
          >
            Exports
          </Link>
          ) : null}

          {showLink(adminRoutes.taxReports) ? (
          <Link
            href={adminRoutes.taxReports}
            className={`transition ${DESK_UI.link}`}
          >
            Tax Center
          </Link>
          ) : null}

          {showLink(adminRoutes.auditTrail) ? (
          <Link
            href={adminRoutes.auditTrail}
            className={`transition ${DESK_UI.link}`}
          >
            Audit Trail
          </Link>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminLoginPage = pathname === "/admin/login";
  const [workspace, setWorkspace] = useState<"full" | "growth">("full");
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [modules, setModules] = useState<AdminNavAccess | null>(null);
  const [openSection, setOpenSection] = useState<string>("Overview & Work");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const onGrowthPortal = pathname.startsWith("/admin/growth");
  const isMessagesWorkspace = pathname.startsWith("/admin/messages");
  const isGrowthChrome =
    workspace === "growth" || (onGrowthPortal && isSuperUser);
  const limitNav =
    Boolean(modules) &&
    !isSuperUser &&
    !isGrowthChrome &&
    !Object.values(modules || {}).every(Boolean);
  const visibleNavSections = (isGrowthChrome ? growthNavSections : navSections)
    .map((section) => ({
      ...section,
      items:
        !limitNav || !modules
          ? section.items
          : section.items.filter((item) =>
              isAdminPathAllowedForModules(item.href, modules),
            ),
    }))
    .filter((section) => {
      if (!section.items.length) return false;
      if (isGrowthChrome || !limitNav || !modules) return true;
      return isNavSectionOn(section.title, modules);
    });
  const visibleHeaderLinks = (
    isGrowthChrome ? growthHeaderLinks : topHeaderLinks
  ).filter((item) =>
    !limitNav || !modules
      ? true
      : item.href === "/" || isAdminPathAllowedForModules(item.href, modules),
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.workspace === "growth") setWorkspace("growth");
        else setWorkspace("full");
        setIsSuperUser(Boolean(data.isSuperUser));
        if (data.modules) setModules(data.modules as AdminNavAccess);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sitguru-admin-hq-nav-collapsed");
      if (saved === "1") setNavCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "sitguru-admin-hq-nav-collapsed",
        navCollapsed ? "1" : "0",
      );
    } catch {
      /* ignore */
    }
  }, [navCollapsed]);

  useEffect(() => {
    const match = visibleNavSections.find((section) =>
      section.items.some((item) => isActivePath(pathname, item.href)),
    );
    setOpenSection(
      match?.title ?? visibleNavSections[0]?.title ?? "Overview & Work",
    );
  }, [pathname, isGrowthChrome]);

  if (isAdminLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
    <div className={`min-h-dvh overflow-x-hidden text-[#0F2744] ${DESK_UI.pageBg}`}>
      <div
        className={`mx-auto grid min-h-dvh min-w-0 max-w-[1600px] ${
          navCollapsed && !isGrowthChrome
            ? "lg:grid-cols-[72px_minmax(0,1fr)]"
            : "lg:grid-cols-[248px_minmax(0,1fr)]"
        }`}
      >
        <aside className="hidden min-w-0 border-r border-slate-200/80 bg-white lg:block">
          <div className="sticky top-0 flex h-dvh min-h-0 flex-col">
            <div className="shrink-0 border-b border-slate-100 px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <AdminLogo compact />
                {!navCollapsed || isGrowthChrome ? (
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2563EB]">
                    {isGrowthChrome ? "Growth" : "HQ"}
                  </p>
                ) : null}
              </div>
              {!isGrowthChrome ? (
                <button
                  type="button"
                  onClick={() => setNavCollapsed((value) => !value)}
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-[#F8FAFC] text-xs font-bold text-[#0F2744] transition hover:bg-[#EEF2F6]"
                  aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
                  title={navCollapsed ? "Expand navigation" : "Collapse navigation"}
                >
                  {navCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                  {navCollapsed ? null : <span>Collapse</span>}
                </button>
              ) : null}

              {isGrowthChrome || (limitNav && !modules?.social_media) ? null : (
                <Link
                  href={adminRoutes.growth}
                  className="mt-2 flex min-h-10 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black text-white shadow-sm"
                  style={{ background: DESK_UI.teal }}
                >
                  <Sparkles size={15} />
                  Social Media Manager
                </Link>
              )}

              {isSuperUser && onGrowthPortal && workspace !== "growth" ? (
                <Link
                  href="/admin"
                  className="mt-2 flex min-h-9 items-center justify-center rounded-2xl px-3 text-xs font-black text-white"
                  style={{ background: DESK_UI.teal }}
                >
                  Back to Full HQ
                </Link>
              ) : null}
            </div>

            <nav
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 [scrollbar-width:thin] ${
                navCollapsed && !isGrowthChrome ? "px-2" : "px-3"
              }`}
            >
              {visibleNavSections.map((section) => (
                <SidebarSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  pathname={pathname}
                  collapsed={navCollapsed && !isGrowthChrome}
                  open={
                    visibleNavSections.length === 1 ||
                    openSection === section.title ||
                    (navCollapsed && !isGrowthChrome)
                  }
                  onToggle={() =>
                    setOpenSection((current) =>
                      current === section.title && visibleNavSections.length > 1
                        ? ""
                        : section.title,
                    )
                  }
                />
              ))}
            </nav>

            <div className="shrink-0 space-y-3 border-t border-slate-100 p-3">
              {isGrowthChrome || (limitNav && !modules?.analytics_admin) ? null : (
              <Link
                href={adminRoutes.settings}
                className={`flex min-h-10 items-center gap-3 rounded-2xl px-3 text-[13px] font-semibold ${
                  isActivePath(pathname, adminRoutes.settings)
                    ? DESK_UI.sidebarActive
                    : DESK_UI.sidebarIdle
                }`}
              >
                <Settings size={16} className="shrink-0 opacity-90" />
                <span>Settings</span>
              </Link>
              )}
              {navCollapsed && !isGrowthChrome ? null : (
                <div className="overflow-hidden rounded-2xl bg-[#F0FDFA]">
                  <div className="relative h-24">
                    <Image
                      src={DESK_BANNER}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="220px"
                    />
                  </div>
                  <p className="flex items-start gap-2 px-3 py-3 text-xs font-semibold leading-5 text-[#0F2744]">
                    <PawPrint size={14} className="mt-0.5 shrink-0 text-[#2563EB]" />
                    Same people. Happier pets. Bigger impact.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className={`flex min-w-0 flex-col overflow-x-hidden ${isMessagesWorkspace ? "h-dvh min-h-0" : ""}`}>
          <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
            <div className={`px-3 sm:px-5 lg:px-6 ${isMessagesWorkspace ? "py-2" : "py-2"}`}>
              <div className="flex min-h-14 items-center gap-2 sm:min-h-[3.75rem] sm:gap-3 xl:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="shrink-0 lg:hidden">
                    <AdminLogo compact />
                  </div>

                  <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {visibleHeaderLinks.map((item) => {
                      const active = isActivePath(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition 2xl:px-3.5 ${
                            active
                              ? DESK_UI.sidebarActive
                              : "text-slate-600 hover:bg-[#EEF2F6] hover:text-[#0F2744]"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                  {isGrowthChrome || isMessagesWorkspace || (limitNav && !modules?.social_media) ? null : (
                    <Link
                      href={adminRoutes.growth}
                      className="hidden min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-sm lg:inline-flex"
                      style={{ background: DESK_UI.teal }}
                    >
                      <Sparkles size={16} />
                      Social Media Manager
                    </Link>
                  )}
                  <div className={`items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-0.5 shadow-sm sm:gap-2 sm:p-1 ${isMessagesWorkspace ? "hidden lg:flex" : "hidden sm:flex"}`}>
                    <SearchBar />

                    {isGrowthChrome || (limitNav && !modules?.financials) ? null : (
                    <>
                    <Link
                      href="/admin/gurus/new"
                      title="Add Guru"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent px-2.5 text-sm font-bold text-[#0F2744] transition hover:bg-[#EEF2F6] sm:px-3"
                    >
                      <UserPlus size={16} className="shrink-0" />
                      <span className="hidden 2xl:inline">Add Guru</span>
                    </Link>

                    <Link
                      href={adminRoutes.financialExports}
                      title="Export"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent px-2.5 text-sm font-bold text-[#0F2744] transition hover:bg-[#EEF2F6] sm:px-3"
                    >
                      <BarChart3 size={16} className="shrink-0" />
                      <span className="hidden 2xl:inline">Export</span>
                    </Link>
                    </>
                    )}
                  </div>

                  {/* Desk chat covers messaging on small screens — keep full Messages page on lg+. */}
                  {isGrowthChrome ? null : (
                  <Link
                    href={adminRoutes.messages}
                    className={`relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition hover:brightness-95 lg:flex ${DESK_UI.primary}`}
                    aria-label="Admin messages"
                    title="Messages"
                  >
                    <MessageCircle size={18} />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white" />
                  </Link>
                  )}

                  <NotificationBell />

                  <AdminAccountMenu />
                </div>
              </div>
            </div>
          </header>

          {isGrowthChrome || isMessagesWorkspace ? null : (
            <MobileNav
              pathname={pathname}
              growthOnly={false}
              modules={limitNav ? modules : null}
            />
          )}

          <main
            className={
              isMessagesWorkspace
                ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                : "min-w-0 flex-1 overflow-x-hidden px-3 py-3 pb-28 sm:px-5 sm:py-4 sm:pb-24 lg:px-6 lg:pb-8 xl:px-6 2xl:px-7"
            }
          >
            <div
              className={
                isMessagesWorkspace
                  ? "flex min-h-0 flex-1 flex-col"
                  : "w-full max-w-none"
              }
            >
              {children}
            </div>

            {isMessagesWorkspace || isGrowthChrome ? null : (
              <AdminFooter modules={limitNav ? modules : null} limitNav={limitNav} />
            )}
            {isGrowthChrome ? <GrowthPhoneBar pathname={pathname} /> : null}
          </main>
        </div>
      </div>

    </div>

      <WorkspaceLiveSyncMount />

      {isMessagesWorkspace ? null : <DeskChatDock mode="manager" />}

      {/* Outside overflow-x-hidden so the tip bubble isn't clipped */}
      <SafeAssistantBubble>
        <RogueFloatingAssistant />
      </SafeAssistantBubble>
    </>
  );
}