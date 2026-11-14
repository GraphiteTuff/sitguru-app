"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BarChart3, ClipboardList, GraduationCap, LayoutDashboard, ShieldCheck } from "lucide-react";
import {
  INTERN_RECORD_TABS,
  internRecordTabFromHash,
  type InternRecordTab,
} from "@/lib/internship/intern-record-tabs";

const ICONS = {
  overview: LayoutDashboard,
  work: ClipboardList,
  results: BarChart3,
  academic: GraduationCap,
  onboarding: ShieldCheck,
} as const;

/**
 * A local, responsive desk-style navigation without losing any server actions,
 * unsigned form edits or the previous #profile / #approvals / #onboarding links.
 */
export default function InternDetailSections({
  sections,
}: {
  sections: Record<InternRecordTab, ReactNode>;
}) {
  const [active, setActive] = useState<InternRecordTab>("overview");

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash;
      setActive(internRecordTabFromHash(hash));
      if (hash && hash !== "#profile") {
        window.requestAnimationFrame(() => {
          document.getElementById("intern-record-sections")?.scrollIntoView({ block: "start" });
        });
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function selectTab(id: InternRecordTab, hash: string) {
    setActive(id);
    window.history.replaceState(null, "", window.location.pathname + window.location.search + "#" + hash);
    document.getElementById("intern-record-sections")?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <div id="intern-record-sections" className="min-w-0 scroll-mt-24 space-y-4">
      <nav
        role="tablist"
        aria-label="Intern record sections"
        className="w-full overflow-x-auto rounded-[1.25rem] border border-slate-200 bg-white p-2 shadow-[0_8px_24px_rgba(15,39,68,0.05)] [scrollbar-width:thin]"
      >
        <div className="flex min-w-max gap-1.5 md:min-w-0 md:grid md:grid-cols-5">
          {INTERN_RECORD_TABS.map((item) => {
            const Icon = ICONS[item.id];
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                id={"intern-record-tab-" + item.id}
                type="button"
                aria-controls={"intern-record-panel-" + item.id}
                role="tab"
                aria-selected={selected}
                onClick={() => selectTab(item.id, item.hash)}
                className={
                  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] sm:text-sm md:w-full " +
                  (selected
                    ? "bg-[#2563EB] !text-white shadow-sm"
                    : "text-[#0F2744] hover:bg-[#EEF2F6]")
                }
              >
                <Icon aria-hidden="true" size={17} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      {(() => {
        const selected = INTERN_RECORD_TABS.find((item) => item.id === active) || INTERN_RECORD_TABS[0];
        return (
          <section
            id={"intern-record-panel-" + selected.id}
            aria-labelledby={"intern-record-tab-" + selected.id}
            className="min-w-0 space-y-4"
          >
            <div className="px-1">
              <h2 className="text-xl font-black tracking-tight text-[#0F2744] sm:text-2xl">{selected.title}</h2>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-600">{selected.description}</p>
            </div>
            {sections[active]}
          </section>
        );
      })()}
    </div>
  );
}
