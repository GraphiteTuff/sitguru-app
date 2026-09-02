"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, PawPrint, Search, X } from "lucide-react";

const STORAGE_KEY = "sitguru_pet_parent_coach_dismissed_v1";

type FirstVisitCoachProps = {
  hasPet?: boolean;
  hasZip?: boolean;
  profileHref?: string;
  petsHref?: string;
  findCareHref?: string;
};

export default function FirstVisitCoach({
  hasPet = false,
  hasZip = false,
  profileHref = "/customer/dashboard/profile/service-location",
  petsHref = "#new-pet-passport",
  findCareHref = "/search",
}: FirstVisitCoachProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const forced = searchParams?.get("coach") === "1";
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
      if (forced || !dismissed) {
        setOpen(true);
      }
    } catch {
      setOpen(searchParams?.get("coach") === "1");
    }
  }, [searchParams]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function dismissAndClearQuery() {
    dismiss();
    if (searchParams?.get("coach") === "1") {
      router.replace("/customer/dashboard");
    }
  }

  if (!open) return null;

  const steps = [
    !hasZip
      ? {
          done: false,
          title: "Add your care ZIP",
          body: "So we can show Gurus who serve your neighborhood.",
          href: profileHref,
          icon: MapPin,
          cta: "Add ZIP",
        }
      : null,
    {
      done: hasPet,
      title: "Create a Pet Passport",
      body: "Name is enough to start — add details anytime.",
      href: petsHref,
      icon: PawPrint,
      cta: hasPet ? "Manage pets" : "Add pet",
    },
    {
      done: false,
      title: "Find trusted care",
      body: "Browse nearby Pet Gurus and request your first visit.",
      href: findCareHref,
      icon: Search,
      cta: "Find Care",
    },
  ].filter((step): step is NonNullable<typeof step> => Boolean(step));

  const coachTitle = hasZip
    ? hasPet
      ? "Find trusted care near you"
      : "Add a pet and find care"
    : "Book your first visit in 3 taps";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center">
      <div
        role="dialog"
        aria-label="Get booking ready"
        className="w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 bg-[#0D5C3A] px-5 py-4 public-dark-section" data-brand-green>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
              Welcome to SitGuru
            </p>
            <h2 className="mt-1 text-2xl font-black !text-white">
              {coachTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismissAndClearQuery}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.title}
                href={step.href}
                onClick={dismiss}
                className="flex min-h-[72px] items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    step.done
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-white text-emerald-700 ring-1 ring-emerald-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black text-slate-950">
                    {step.done ? "✓ " : ""}
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-slate-600">
                    {step.body}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-black text-emerald-700">
                  {step.cta}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={dismissAndClearQuery}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
