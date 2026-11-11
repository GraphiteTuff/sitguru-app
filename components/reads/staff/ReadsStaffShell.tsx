"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ADMIN_READS_BASE,
  INTERN_READS_BASE,
  MANAGER_READS_BASE,
} from "@/lib/reads/constants";
import type { ReadsStaffRole } from "@/lib/reads/types";

const NAV: Record<
  Exclude<ReadsStaffRole, "none">,
  Array<{ href: string; label: string; tab?: string }>
> = {
  manager: [
    { href: MANAGER_READS_BASE, label: "Overview" },
    { href: `${MANAGER_READS_BASE}?tab=content`, label: "Content", tab: "content" },
    { href: `${MANAGER_READS_BASE}?tab=books`, label: "Books", tab: "books" },
    { href: `${MANAGER_READS_BASE}?tab=magazines`, label: "Magazines", tab: "magazines" },
    { href: `${MANAGER_READS_BASE}?tab=podcasts`, label: "Podcasts", tab: "podcasts" },
    { href: `${MANAGER_READS_BASE}?tab=videos`, label: "Videos", tab: "videos" },
    { href: `${MANAGER_READS_BASE}?tab=authors`, label: "Authors", tab: "authors" },
    { href: `${MANAGER_READS_BASE}?tab=team-picks`, label: "Team Picks", tab: "team-picks" },
    { href: `${MANAGER_READS_BASE}?tab=partnerships`, label: "Partnerships", tab: "partnerships" },
    { href: `${MANAGER_READS_BASE}?tab=submissions`, label: "Submissions", tab: "submissions" },
    { href: `${MANAGER_READS_BASE}?tab=calendar`, label: "Calendar", tab: "calendar" },
    { href: `${MANAGER_READS_BASE}?tab=analytics`, label: "Analytics", tab: "analytics" },
  ],
  intern: [
    { href: INTERN_READS_BASE, label: "My Assignments" },
    { href: `${INTERN_READS_BASE}?tab=drafts`, label: "My Drafts", tab: "drafts" },
    { href: `${INTERN_READS_BASE}?tab=books`, label: "Books", tab: "books" },
    { href: `${INTERN_READS_BASE}?tab=magazines`, label: "Magazines", tab: "magazines" },
    { href: `${INTERN_READS_BASE}?tab=podcasts`, label: "Podcasts", tab: "podcasts" },
    { href: `${INTERN_READS_BASE}?tab=videos`, label: "Videos", tab: "videos" },
    { href: `${INTERN_READS_BASE}?tab=authors`, label: "Authors", tab: "authors" },
    { href: `${INTERN_READS_BASE}?tab=team-picks`, label: "Team Picks", tab: "team-picks" },
    { href: `${INTERN_READS_BASE}?tab=submitted`, label: "Submitted", tab: "submitted" },
    { href: `${INTERN_READS_BASE}?tab=changes`, label: "Changes Requested", tab: "changes" },
    { href: `${INTERN_READS_BASE}?tab=published`, label: "Published Work", tab: "published" },
  ],
  admin: [
    { href: ADMIN_READS_BASE, label: "Overview" },
    { href: `${ADMIN_READS_BASE}?tab=all`, label: "All Content", tab: "all" },
    { href: `${ADMIN_READS_BASE}?tab=books`, label: "Books", tab: "books" },
    { href: `${ADMIN_READS_BASE}?tab=magazines`, label: "Magazines", tab: "magazines" },
    { href: `${ADMIN_READS_BASE}?tab=podcasts`, label: "Podcasts", tab: "podcasts" },
    { href: `${ADMIN_READS_BASE}?tab=videos`, label: "Videos", tab: "videos" },
    { href: `${ADMIN_READS_BASE}?tab=authors`, label: "Authors", tab: "authors" },
    { href: `${ADMIN_READS_BASE}?tab=team-picks`, label: "Team Picks", tab: "team-picks" },
    { href: `${ADMIN_READS_BASE}?tab=partnerships`, label: "Partnerships", tab: "partnerships" },
    { href: `${ADMIN_READS_BASE}?tab=oversight`, label: "Manager Oversight", tab: "oversight" },
    { href: `${ADMIN_READS_BASE}?tab=escalations`, label: "Escalations", tab: "escalations" },
    { href: `${ADMIN_READS_BASE}?tab=taxonomy`, label: "Taxonomy", tab: "taxonomy" },
    { href: `${ADMIN_READS_BASE}?tab=analytics`, label: "Analytics", tab: "analytics" },
    { href: `${ADMIN_READS_BASE}?tab=settings`, label: "Settings", tab: "settings" },
  ],
};

export default function ReadsStaffShell({
  role,
  title,
  subtitle,
  children,
}: {
  role: Exclude<ReadsStaffRole, "none">;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const items = NAV[role];

  return (
    <div className="min-h-screen bg-[#f7fbf8] text-slate-950">
      <header className="border-b border-emerald-900/10 bg-[#0D5C3A] text-white public-dark-section" data-brand-green>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] !text-emerald-100">
              Reads &amp; Media
            </p>
            <h1 className="text-2xl font-black !text-white">{title}</h1>
            <p className="mt-1 text-sm font-semibold text-emerald-50">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/reads"
              className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold !text-white"
            >
              Public Reads
            </Link>
            <Link
              href="/admin/sales-marketing/content"
              className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold !text-white"
            >
              Content Studio
            </Link>
            {role !== "admin" ? (
              <Link
                href="/admin"
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold !text-white"
              >
                Admin HQ
              </Link>
            ) : null}
          </div>
        </div>
        <nav
          aria-label="Reads staff sections"
          className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8"
        >
          {items.map((item) => {
            const active = pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                  active
                    ? "bg-white text-[#0D5C3A]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
