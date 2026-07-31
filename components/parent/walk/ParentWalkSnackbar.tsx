// components/parent/walk/ParentWalkSnackbar.tsx
"use client";

import { useEffect } from "react";
import type { LiveWalkSnackbar } from "@/hooks/useLiveWalkStream";
import type { PawReportLiveEvent } from "@/lib/pawreport/walk-events";

type ParentWalkSnackbarProps = {
  snackbar: LiveWalkSnackbar | null;
  lastEvent: PawReportLiveEvent | null;
  petName: string;
  onDismiss: () => void;
};

function resolveCopy(
  snackbar: LiveWalkSnackbar,
  lastEvent: PawReportLiveEvent | null,
  petName: string,
) {
  const type = lastEvent?.eventType;
  if (type === "POTTY_PEE" || type === "POTTY_POOP") {
    return {
      tone: "potty" as const,
      title: "Potty break",
      body: `🎉 ${petName} just went potty!`,
    };
  }
  if (type === "BREAK_START") {
    return {
      tone: "break" as const,
      title: "Water break",
      body: `🌳 ${petName} is pausing for a quick water break.`,
    };
  }
  if (type === "WALK_END") {
    return {
      tone: "success" as const,
      title: "Home safe",
      body: `🏡 ${petName} is back home safe and sound!`,
    };
  }
  return {
    tone: snackbar.tone,
    title: snackbar.title,
    body: snackbar.body,
  };
}

function toneClasses(tone: string) {
  if (tone === "potty") return "border-amber-200 bg-amber-50 text-amber-950";
  if (tone === "break") return "border-sky-200 bg-sky-50 text-sky-950";
  if (tone === "success")
    return "border-emerald-200 bg-emerald-50 text-emerald-950";
  return "border-slate-200 bg-white text-slate-900";
}

export default function ParentWalkSnackbar({
  snackbar,
  lastEvent,
  petName,
  onDismiss,
}: ParentWalkSnackbarProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("sg-parent-snack-styles")) return;
    const style = document.createElement("style");
    style.id = "sg-parent-snack-styles";
    style.textContent = `
      @keyframes parentSnackIn {
        from { opacity: 0; transform: translateY(-18px) scale(0.94); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .sg-parent-snack-in {
        animation: parentSnackIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (!snackbar) return null;
  const copy = resolveCopy(snackbar, lastEvent, petName);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.75rem))] z-50 flex justify-center px-3">
      <div
        role="status"
        className={`sg-parent-snack-in pointer-events-auto w-full max-w-md origin-top rounded-2xl border px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)] ${toneClasses(copy.tone)}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
              {copy.title}
            </p>
            <p className="mt-1 text-sm font-bold leading-5">{copy.body}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-full px-2 text-lg font-black opacity-60"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
