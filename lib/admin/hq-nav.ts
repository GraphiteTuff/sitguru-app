/**
 * Super Admin HQ navigation taxonomy.
 * Maps existing /admin routes — no duplicate systems.
 */

export type HqNavIcon =
  | "home"
  | "inbox"
  | "clipboard"
  | "messages"
  | "audit"
  | "radio"
  | "users"
  | "paw"
  | "userPlus"
  | "heart"
  | "briefcase"
  | "grad"
  | "shield"
  | "lifeBuoy"
  | "calendar"
  | "reviews"
  | "disputes"
  | "payments"
  | "payouts"
  | "megaphone"
  | "book"
  | "link"
  | "programs"
  | "partners"
  | "map"
  | "mail"
  | "gauge"
  | "insights"
  | "finance"
  | "bank"
  | "card"
  | "chart"
  | "sheet"
  | "wallet"
  | "clock"
  | "settings"
  | "website"
  | "fraud"
  | "security";

export type HqNavItem = {
  label: string;
  href: string;
  icon: HqNavIcon;
};

export type HqNavSection = {
  title: string;
  items: HqNavItem[];
};

export const HQ_NAV_SECTIONS: HqNavSection[] = [
  {
    title: "Overview & Work",
    items: [
      { label: "Overview", href: "/admin", icon: "home" },
      { label: "Action Center", href: "/admin/action-center", icon: "inbox" },
      { label: "Guru Approvals", href: "/admin/guru-approvals", icon: "clipboard" },
      { label: "Messages", href: "/admin/messages", icon: "messages" },
      { label: "Live Walks", href: "/admin/dashboard/live-walks", icon: "radio" },
      { label: "Audit Trail", href: "/admin/audit-trail", icon: "audit" },
    ],
  },
  {
    title: "People & Access",
    items: [
      { label: "Pet Parents", href: "/admin/petparents", icon: "users" },
      { label: "Gurus", href: "/admin/gurus", icon: "paw" },
      { label: "Ambassadors", href: "/admin/ambassadors", icon: "userPlus" },
      { label: "User Directory", href: "/admin/users", icon: "users" },
      { label: "Manager Oversight", href: "/admin/managers", icon: "briefcase" },
      { label: "HR Hub", href: "/admin/hr", icon: "heart" },
      { label: "Team Members", href: "/admin/hr/people", icon: "users" },
      { label: "Internship", href: "/admin/internship", icon: "grad" },
      { label: "University", href: "/admin/ambassador-training", icon: "grad" },
      { label: "Support", href: "/admin/support", icon: "lifeBuoy" },
      { label: "Account Lifecycle", href: "/admin/account-lifecycle", icon: "users" },
    ],
  },
  {
    title: "Marketplace & Care",
    items: [
      { label: "Bookings", href: "/admin/bookings", icon: "calendar" },
      { label: "Reviews", href: "/admin/reviews", icon: "reviews" },
      { label: "Disputes", href: "/admin/disputes", icon: "disputes" },
      { label: "Payments", href: "/admin/payments", icon: "payments" },
      { label: "Guru Payouts", href: "/admin/payouts", icon: "payouts" },
      { label: "Guru Success", href: "/admin/guru-success-center", icon: "paw" },
    ],
  },
  {
    title: "Community & Growth",
    items: [
      { label: "Manager Portal", href: "/manager", icon: "briefcase" },
      { label: "Growth Workplace", href: "/admin/growth", icon: "megaphone" },
      { label: "Admin Toolkit", href: "/admin/toolkit", icon: "book" },
      { label: "Shared Brand Kit", href: "/admin/toolkit/brand", icon: "website" },
      { label: "Team Resources", href: "/admin/resources", icon: "book" },
      { label: "Sales & Marketing", href: "/admin/sales-marketing", icon: "megaphone" },
      { label: "Reads & Media", href: "/admin/growth/reads", icon: "book" },
      { label: "Referrals", href: "/admin/referrals", icon: "link" },
      { label: "Programs", href: "/admin/programs", icon: "programs" },
      { label: "Partners", href: "/admin/partners", icon: "partners" },
      { label: "Pet Events", href: "/admin/community/events", icon: "calendar" },
      { label: "Market Growth", href: "/admin/market-growth", icon: "map" },
      { label: "Email Updates", href: "/admin/email-updates", icon: "mail" },
      { label: "Analytics", href: "/admin/analytics", icon: "gauge" },
      { label: "Insights", href: "/admin/insights", icon: "insights" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Financial Overview", href: "/admin/financials", icon: "finance" },
      {
        label: "Contractor Hours",
        href: "/admin/financials/contractor-hours",
        icon: "clock",
      },
      {
        label: "Contractor Payments",
        href: "/admin/financials/contractor-payments",
        icon: "wallet",
      },
      { label: "Team Payments (HR)", href: "/admin/hr/people/payments", icon: "wallet" },
      { label: "Banking", href: "/admin/financials/plaid", icon: "bank" },
      { label: "Payment Gateway", href: "/admin/financials/payment-gateway", icon: "card" },
      { label: "Profit & Loss", href: "/admin/financials/profit-loss", icon: "chart" },
      { label: "Balance Sheet", href: "/admin/financials/balance-sheet", icon: "sheet" },
      { label: "Cash Flow", href: "/admin/financials/cash-flow", icon: "card" },
      { label: "Tax Center", href: "/admin/financials/tax-reports", icon: "sheet" },
      { label: "Commissions", href: "/admin/commissions", icon: "wallet" },
      { label: "Exports", href: "/admin/financials/exports", icon: "sheet" },
    ],
  },
  {
    title: "Trust & Security",
    items: [
      { label: "Trust & Safety", href: "/admin/background-checks", icon: "shield" },
      { label: "Security", href: "/admin/security", icon: "security" },
      { label: "Fraud", href: "/admin/fraud", icon: "fraud" },
      { label: "Support", href: "/admin/support", icon: "lifeBuoy" },
      { label: "Audit Trail", href: "/admin/audit-trail", icon: "audit" },
    ],
  },
  {
    title: "Platform & Settings",
    items: [
      { label: "Settings", href: "/admin/settings", icon: "settings" },
      { label: "Website", href: "/admin/website", icon: "website" },
      { label: "Reports & Exports", href: "/admin/exports", icon: "chart" },
    ],
  },
];

export const HQ_HEADER_LINKS = [
  { label: "Overview", href: "/admin" },
  { label: "Action Center", href: "/admin/action-center" },
  { label: "Managers", href: "/admin/managers" },
  { label: "Contractor Hours", href: "/admin/financials/contractor-hours" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Manager Portal", href: "/manager" },
  { label: "Financials", href: "/admin/financials" },
  { label: "Settings", href: "/admin/settings" },
];

export function isActiveAdminPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Flat list of every HQ href for inventory / regression checks. */
export function allHqNavHrefs(): string[] {
  return [...new Set(HQ_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href)))];
}
