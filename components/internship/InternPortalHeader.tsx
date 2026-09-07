"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp, GraduationCap, Megaphone, ShieldCheck } from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";
import { INTERNSHIP_HELP_PATH } from "@/lib/internship/intern-growth";
import { INTERN_GROWTH_WORKPLACE } from "@/lib/internship/intern-tools";
import {
  INTERN_OPEN_PAGE_EVENT,
  INTERN_PAGE_HREF,
  internGhostBtnClass,
  internPrimaryBtnClass,
} from "@/lib/internship/intern-ui";
import { INTERNSHIP_ONBOARDING_PATH } from "@/lib/internship/onboarding";

export default function InternPortalHeader({
  assigned = false,
  onboarded = false,
}: {
  assigned?: boolean;
  onboarded?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/intern/onboarding/print" || pathname === "/intern/help/print") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/80 bg-[#FAF6EE]/95 shadow-sm backdrop-blur print:hidden">
      <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-3 py-2 sm:px-5 lg:px-6">
        <Link href={assigned && onboarded ? "/intern" : assigned ? INTERNSHIP_ONBOARDING_PATH : "/intern"} className="min-w-0" aria-label="Open Intern Portal">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-amber-800">
            SitGuru Internship
          </p>
          <p className="flex items-center gap-1.5 truncate text-base font-black tracking-tight text-slate-950">
            <GraduationCap size={16} className="shrink-0 text-emerald-800" />
            Student Portal
          </p>
        </Link>
        <div className="flex items-center gap-2">
          {assigned && !onboarded ? (
            <Link
              href={INTERNSHIP_ONBOARDING_PATH}
              className={`${internPrimaryBtnClass} min-h-11 px-3 text-xs sm:px-4`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Finish onboarding</span>
              <span className="sm:hidden">Start</span>
            </Link>
          ) : null}
          {assigned && onboarded ? (
            <>
              <Link
                href={INTERN_GROWTH_WORKPLACE.href}
                className={`${internPrimaryBtnClass} min-h-11 px-3 text-xs sm:px-4`}
              >
                <Megaphone size={14} />
                <span className="hidden sm:inline">{INTERN_GROWTH_WORKPLACE.label}</span>
                <span className="sm:hidden">Growth</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (pathname === "/intern" || pathname === "/intern/") {
                    window.dispatchEvent(new Event(INTERN_OPEN_PAGE_EVENT));
                    return;
                  }
                  router.push(INTERN_PAGE_HREF);
                }}
                className={`${internGhostBtnClass} min-h-11 px-3 text-xs`}
              >
                Your page
              </button>
            </>
          ) : null}
          {assigned ? (
            <Link
              href={INTERNSHIP_HELP_PATH}
              className={`${internGhostBtnClass} min-h-11 px-3 text-xs`}
            >
              <CircleHelp size={14} />
              <span className="hidden sm:inline">Help</span>
            </Link>
          ) : null}
          <SiteAccountMenu compact />
        </div>
      </div>
    </header>
  );
}
