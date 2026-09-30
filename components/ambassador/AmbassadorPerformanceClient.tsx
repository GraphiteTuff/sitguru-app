/**
 * Performance route client shell — wires portal + Dev Mock Toggle.
 */

"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import AmbassadorSelfServicePortal from "@/components/ambassador/AmbassadorSelfServicePortal";

export default function AmbassadorPerformanceClient() {
  const [isMockActive, setIsMockActive] = useState(false);

  return (
    <div className="relative w-full">
      <AmbassadorSelfServicePortal isMockActive={isMockActive} />

      <button
        type="button"
        onClick={() => setIsMockActive((value) => !value)}
        aria-pressed={isMockActive}
        title="Toggle mock active metrics for chart QA"
        className={`fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.08em] shadow-lg backdrop-blur-md transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:bottom-6 sm:right-6 ${
          isMockActive
            ? "border-emerald-300/70 bg-[#0D5C3A] text-white shadow-emerald-900/25"
            : "border-slate-200/80 bg-white/85 text-slate-700 shadow-slate-900/10"
        }`}
      >
        <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>Dev Mock {isMockActive ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
