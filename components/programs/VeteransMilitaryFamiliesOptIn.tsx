"use client";

import Link from "next/link";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

type VeteransMilitaryFamiliesOptInProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  showProgramLink?: boolean;
  className?: string;
};

export function VeteransMilitaryFamiliesOptIn({
  checked,
  onChange,
  disabled = false,
  id = "join-veterans-military-families",
  showProgramLink = true,
  className = "",
}: VeteransMilitaryFamiliesOptInProps) {
  return (
    <div
      className={`rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 ${className}`.trim()}
    >
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
        />
        <span className="min-w-0">
          <span className="block text-sm font-black text-slate-950">
            {VETERANS_MILITARY_FAMILIES_PROGRAM.optInLabel}
          </span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
            {VETERANS_MILITARY_FAMILIES_PROGRAM.optInHelper}
          </span>
          {showProgramLink ? (
            <Link
              href={VETERANS_MILITARY_FAMILIES_PROGRAM.programsAnchorHref}
              className="mt-2 inline-flex text-xs font-black text-emerald-700 underline-offset-2 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Learn about {VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}
            </Link>
          ) : null}
        </span>
      </label>
    </div>
  );
}
