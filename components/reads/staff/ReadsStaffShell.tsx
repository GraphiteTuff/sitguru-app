"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ADMIN_READS_BASE,
  INTERN_READS_BASE,
  MANAGER_READS_BASE,
  READS_UI,
} from "@/lib/reads/constants";
import type { ReadsStaffRole } from "@/lib/reads/types";
import { DESK_LOGO } from "@/lib/portal/desk-ui";

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
    <div className={`min-h-screen ${READS_UI.page}`}>
      <header className={READS_UI.headerBar}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-start gap-3">
            <Image
              src={DESK_LOGO}
              alt="SitGuru"
              width={140}
              height={44}
              className="mt-0.5 h-9 w-auto object-contain object-left mix-blend-multiply"
              priority
            />
            <div className="min-w-0 border-l border-slate-200 pl-3">
              <p className={READS_UI.eyebrow}>Reads &amp; Media</p>
              <h1 className={`text-2xl ${READS_UI.title}`}>{title}</h1>
              <p className={`mt-1 text-sm ${READS_UI.body}`}>{subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/reads" className={READS_UI.secondaryBtn}>
              Public Reads
            </Link>
            <Link
              href="/admin/sales-marketing/content"
              className={READS_UI.secondaryBtn}
            >
              Content Studio
            </Link>
            {role !== "admin" ? (
              <Link href="/manager" className={READS_UI.primaryBtn}>
                Manager Portal
              </Link>
            ) : (
              <Link href="/admin" className={READS_UI.primaryBtn}>
                Admin HQ
              </Link>
            )}
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
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  active ? READS_UI.navActive : READS_UI.navIdle
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
