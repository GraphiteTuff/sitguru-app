"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Mobile-first collapsible module. On md+ screens the body stays open;
 * below md the section can collapse to shorten the Growth Workspace scroll.
 */
export default function GrowthCollapsibleSection({
  title,
  eyebrow,
  children,
  defaultOpen = true,
  className = "",
  action,
  forceOpen = false,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  action?: ReactNode;
  /** When true, never collapse (e.g. primary overview). */
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const expanded = forceOpen || open;

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-start gap-2 p-4 sm:p-5">
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl text-left md:pointer-events-none md:cursor-default"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => {
            if (forceOpen) return;
            setOpen((value) => !value);
          }}
        >
          <span className="min-w-0 flex-1">
            {eyebrow ? (
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                {eyebrow}
              </span>
            ) : null}
            <span className="block text-lg font-black text-slate-950">{title}</span>
          </span>
          {forceOpen ? null : (
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-900 transition md:hidden ${
                expanded ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              <ChevronDown size={20} />
            </span>
          )}
        </button>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
      <div
        id={panelId}
        className={`border-t border-emerald-50 px-4 pb-4 sm:px-5 sm:pb-5 ${
          expanded ? "block" : "hidden md:block"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
