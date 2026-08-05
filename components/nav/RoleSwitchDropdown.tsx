/**
 * Shared role-switch dropdown for dashboard header shells.
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Repeat2 } from "lucide-react";
import DashboardSwitchChevron from "@/components/nav/DashboardSwitchChevron";

export type RoleSwitchOption = {
  label: string;
  href: string;
};

type RoleSwitchDropdownProps = {
  label?: string;
  options: RoleSwitchOption[];
  className?: string;
  /** Compact chip style for mobile scroll rows */
  compact?: boolean;
};

export default function RoleSwitchDropdown({
  label = "Switch Dashboard",
  options,
  className = "",
  compact = false,
}: RoleSwitchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!options.length) return null;

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={
          compact
            ? "inline-flex h-10 w-full min-w-0 max-w-full shrink-0 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold tracking-[-0.01em] text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
            : "inline-flex h-11 w-full min-w-[12rem] max-w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold tracking-[-0.01em] text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:min-w-[13rem] sm:px-5"
        }
      >
        <Repeat2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
        <span className="whitespace-nowrap">{label}</span>
        <DashboardSwitchChevron isOpen={isOpen} className="ml-0.5 text-emerald-700" />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.55rem)] z-[80] w-[min(18rem,calc(100vw-1.5rem))] origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5"
        >
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Switch Dashboard
          </p>
          <div className="grid gap-1">
            {options.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-sm font-bold text-slate-800 transition hover:border-emerald-100 hover:bg-emerald-50"
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Repeat2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  <span className="truncate">{option.label}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
