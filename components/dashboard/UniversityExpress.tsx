"use client";

/**
 * SitGuru University Express — compact 3-step checklist.
 * Desktop/webapp: sidebar card · Mobile: dismissible banner + swipeable steps.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  PawPrint,
  Sparkles,
  X,
} from "lucide-react";

export type UniversityExpressStepId =
  | "pet_profile"
  | "guru_vibe"
  | "safe_booking";

export type UniversityExpressProps = {
  progressPercent?: number;
  petProfileDone?: boolean;
  guruVibeDone?: boolean;
  safeBookingDone?: boolean;
  petProfileHref?: string;
  guruVibeHref?: string;
  safeBookingHref?: string;
  academyHref?: string;
  /** Compact top banner on small screens; full card from md up. */
  variant?: "auto" | "sidebar" | "banner";
};

const STORAGE_KEY = "sitguru.universityExpress.dismissed";

const STEPS: Array<{
  id: UniversityExpressStepId;
  title: string;
  description: string;
  icon: typeof PawPrint;
  doneKey: "petProfileDone" | "guruVibeDone" | "safeBookingDone";
  hrefKey: "petProfileHref" | "guruVibeHref" | "safeBookingHref";
  fallbackHref: string;
}> = [
  {
    id: "pet_profile",
    title: "Complete Pet Profile",
    description: "Add basics for safer matches.",
    icon: PawPrint,
    doneKey: "petProfileDone",
    hrefKey: "petProfileHref",
    fallbackHref: "/customer/dashboard#multi-pet-center",
  },
  {
    id: "guru_vibe",
    title: "Pick Your Guru Vibe",
    description: "Browse local care personalities.",
    icon: Sparkles,
    doneKey: "guruVibeDone",
    hrefKey: "guruVibeHref",
    fallbackHref: "/search",
  },
  {
    id: "safe_booking",
    title: "Secure Safe Booking",
    description: "Lock in trusted paid care.",
    icon: CalendarCheck,
    doneKey: "safeBookingDone",
    hrefKey: "safeBookingHref",
    fallbackHref: "/search",
  },
];

export default function UniversityExpress({
  progressPercent = 0,
  petProfileDone = false,
  guruVibeDone = false,
  safeBookingDone = false,
  petProfileHref,
  guruVibeHref,
  safeBookingHref,
  academyHref = "/customer/dashboard/university",
  variant = "auto",
}: UniversityExpressProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const flags = { petProfileDone, guruVibeDone, safeBookingDone };
  const hrefs = { petProfileHref, guruVibeHref, safeBookingHref };

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  function dismissBanner() {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  const doneCount = [petProfileDone, guruVibeDone, safeBookingDone].filter(
    Boolean,
  ).length;
  const percent = Math.max(
    progressPercent,
    Math.round((doneCount / STEPS.length) * 100),
  );

  const checklist = (
    <div className="flex flex-row gap-3 overflow-x-auto pb-1 scrollbar-none md:flex-col md:overflow-visible">
      {STEPS.map((step) => {
        const Icon = step.icon;
        const done = flags[step.doneKey];
        const href = hrefs[step.hrefKey] || step.fallbackHref;
        return (
          <Link
            key={step.id}
            href={href}
            prefetch={true}
            className={`min-w-[220px] shrink-0 rounded-2xl border p-3 transition md:min-w-0 ${
              done
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  done
                    ? "bg-emerald-600 text-white"
                    : "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-950">{step.title}</p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-600">
                  {step.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  const card = (
    <aside className="rounded-[1.75rem] border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
            SitGuru University
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950">Express path</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {doneCount}/{STEPS.length} · {percent}% ready
          </p>
        </div>
        <Link
          href={academyHref}
          prefetch={true}
          className="text-[11px] font-black text-sky-700 underline-offset-2 hover:underline"
        >
          Full
        </Link>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-50">
        <div
          className="h-full rounded-full bg-sky-500 transition-[width]"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className="mt-4">{checklist}</div>
    </aside>
  );

  const banner = !dismissed ? (
    <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50/90 px-3 py-2 shadow-sm md:hidden">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 shrink-0 text-sky-700" />
        <p className="min-w-0 flex-1 truncate text-xs font-black text-slate-900">
          University Express · {doneCount}/{STEPS.length} done
        </p>
        <Link
          href={academyHref}
          prefetch={true}
          className="shrink-0 text-[11px] font-black text-sky-800"
        >
          Open
        </Link>
        <button
          type="button"
          aria-label="Dismiss university banner"
          onClick={dismissBanner}
          className="grid h-7 w-7 place-items-center rounded-full text-slate-500 hover:bg-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2">{checklist}</div>
    </div>
  ) : null;

  if (!mounted) {
    return variant === "banner" ? null : card;
  }

  if (variant === "sidebar") return card;
  if (variant === "banner") return banner;

  return (
    <>
      {banner}
      <div className="hidden md:block">{card}</div>
    </>
  );
}
