/**
 * Universal role dashboard hero — Guru split layout (meta left / quick actions right)
 * shared by Guru, Pet Parent, and Ambassador workspaces.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Compass,
  CreditCard,
  DollarSign,
  Home,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  MousePointerClick,
  PawPrint,
  Search,
  Share2,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type UniversalDashboardRole = "guru" | "parent" | "ambassador";

export type UniversalQuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type UniversalRoleDashboardProps = {
  role: UniversalDashboardRole;
  userName: string;
  avatarUrl?: string | null;
  avatarFallback?: string;
  tags?: string[];
  /** Optional left-column block under tags (e.g. ambassador code, location). */
  metaExtra?: ReactNode;
  /** Optional right-column footer (photo uploader, sign out, switcher). */
  actionsFooter?: ReactNode;
  /** Override default quick actions for the role. */
  actions?: UniversalQuickAction[];
  className?: string;
};

const HERO_COPY: Record<
  UniversalDashboardRole,
  { eyebrow: string; titlePrefix: string; subText: string; defaultTags: string[] }
> = {
  guru: {
    eyebrow: "SitGuru Guru Dashboard",
    titlePrefix: "Hey,",
    subText:
      "Bookings, PawReports, messages, pricing, availability, and earnings — all in one easy dashboard.",
    defaultTags: ["Certified Guru", "Bookable", "PayPal + Stripe ready"],
  },
  parent: {
    eyebrow: "SitGuru Pet Parent Dashboard",
    titlePrefix: "Welcome back,",
    subText:
      "Manage your pets, schedule active care stays, view live PawReports, and message your local Gurus.",
    defaultTags: ["Premium Pet Parent", "Verified Profile", "Care ready"],
  },
  ambassador: {
    eyebrow: "SitGuru Ambassador Dashboard",
    titlePrefix: "Let's grow,",
    subText:
      "Track referral codes, calculate metrics, and monitor your PetPerks and commission balance.",
    defaultTags: ["Growth Ambassador", "Rewards Active", "Circuit ready"],
  },
};

const DEFAULT_ACTIONS: Record<UniversalDashboardRole, UniversalQuickAction[]> = {
  guru: [
    { label: "Bookings", href: "/guru/dashboard/bookings", icon: CalendarDays },
    { label: "PawReports", href: "/guru/dashboard/bookings", icon: PawPrint },
    { label: "Messages", href: "/guru/dashboard/messages", icon: MessageCircle },
    { label: "Earnings", href: "/guru/dashboard/earnings", icon: DollarSign },
    {
      label: "Availability",
      href: "/guru/dashboard/availability",
      icon: ClipboardList,
    },
    { label: "Pricing", href: "/guru/dashboard/pricing", icon: Wallet },
  ],
  parent: [
    { label: "My Pets", href: "/customer/dashboard/pets", icon: PawPrint },
    { label: "Find a Guru", href: "/search", icon: Search },
    {
      label: "Active Care",
      href: "/customer/dashboard/bookings",
      icon: Home,
    },
    {
      label: "PawReports",
      href: "/customer/dashboard/bookings",
      icon: ClipboardList,
    },
    {
      label: "Messages",
      href: "/customer/dashboard/messages",
      icon: MessageCircle,
    },
    {
      label: "Payments",
      href: "/customer/dashboard/pawperks",
      icon: CreditCard,
    },
  ],
  ambassador: [
    {
      label: "Command Center",
      href: "/ambassador/dashboard/command-center",
      icon: Compass,
    },
    {
      label: "Referral Code",
      href: "/ambassador/dashboard/referrals",
      icon: KeyRound,
    },
    {
      label: "Link Clicks",
      href: "/ambassador/dashboard/referrals/analytics",
      icon: MousePointerClick,
    },
    {
      label: "Referrals",
      href: "/ambassador/dashboard/referrals",
      icon: Users,
    },
    {
      label: "Commissions",
      href: "/ambassador/dashboard/commissions",
      icon: DollarSign,
    },
    { label: "PetPerks", href: "/petperks", icon: Trophy },
  ],
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function UniversalRoleDashboard({
  role,
  userName,
  avatarUrl,
  avatarFallback,
  tags,
  metaExtra,
  actionsFooter,
  actions,
  className = "",
}: UniversalRoleDashboardProps) {
  const copy = HERO_COPY[role];
  const quickActions = actions || DEFAULT_ACTIONS[role];
  const displayTags = tags && tags.length > 0 ? tags : copy.defaultTags;
  const profileHref =
    role === "guru"
      ? "/guru/dashboard/profile"
      : role === "ambassador"
        ? "/ambassador/dashboard/profile"
        : "/customer/dashboard/profile";

  return (
    <section
      className={`w-full overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm ${className}`}
    >
      <div className="grid w-full grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        {/* LEFT — profile meta */}
        <div className="bg-[radial-gradient(circle_at_95%_10%,rgba(16,185,129,0.18),transparent_28%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-5 sm:p-6">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-emerald-100 text-xl font-black text-emerald-900 shadow-sm ring-1 ring-emerald-200">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover object-center"
                  style={{ backgroundColor: "#fff" }}
                />
              ) : (
                avatarFallback || initialsFromName(userName)
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] !text-emerald-700 sm:text-xs">
                {copy.eyebrow}
              </p>
              <h1 className="text-3xl font-black tracking-tight !text-emerald-950 sm:text-4xl">
                {copy.titlePrefix} {userName}
              </h1>
              <p className="mx-auto max-w-xl text-sm font-semibold leading-6 !text-slate-600 sm:mx-0">
                {copy.subText}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 sm:justify-start">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {metaExtra ? <div className="pt-2 text-left">{metaExtra}</div> : null}
            </div>
          </div>
        </div>

        {/* RIGHT — quick actions */}
        <div className="border-t border-emerald-100 bg-white p-5 lg:border-l lg:border-t-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] !text-emerald-700">
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
            Quick actions
          </p>

          <div className="mt-3 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={`${action.label}-${action.href}`}
                  href={action.href}
                  className="flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-left text-xs font-black !text-emerald-950 transition hover:border-emerald-200 hover:bg-emerald-100"
                >
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-emerald-800 shadow-sm">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="truncate">{action.label}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700/70" />
                </Link>
              );
            })}
          </div>

          {actionsFooter ? (
            <div className="mt-3 w-full">{actionsFooter}</div>
          ) : (
            <Link
              href={profileHref}
              className="mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50"
            >
              Update profile details
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export { DEFAULT_ACTIONS as UNIVERSAL_ROLE_QUICK_ACTIONS, HERO_COPY as UNIVERSAL_ROLE_HERO_COPY };
