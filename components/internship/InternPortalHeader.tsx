"use client";

import Link from "next/link";
import { GraduationCap, Megaphone, ShieldCheck } from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";
import { INTERN_GROWTH_WORKPLACE } from "@/lib/internship/intern-tools";
import { INTERNSHIP_ONBOARDING_PATH } from "@/lib/internship/onboarding";

export default function InternPortalHeader({
  assigned = false,
  onboarded = false,
}: {
  assigned?: boolean;
  onboarded?: boolean;
}) {
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
              className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-[#0D5C3A] px-3 text-xs font-black !text-white sm:px-4"
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Onboarding</span>
              <span className="sm:hidden">Start</span>
            </Link>
          ) : null}
          {assigned && onboarded ? (
            <>
              <Link
                href={INTERN_GROWTH_WORKPLACE.href}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-[#0D5C3A] px-3 text-xs font-black !text-white sm:px-4"
              >
                <Megaphone size={14} />
                <span className="hidden sm:inline">{INTERN_GROWTH_WORKPLACE.label}</span>
                <span className="sm:hidden">Growth</span>
              </Link>
              <Link
                href="/intern#profile"
                className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-900"
              >
                Profile
              </Link>
            </>
          ) : null}
          <SiteAccountMenu compact />
        </div>
      </div>
    </header>
  );
}
