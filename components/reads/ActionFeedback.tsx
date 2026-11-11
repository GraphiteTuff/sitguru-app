"use client";

import { Loader2, PawPrint } from "lucide-react";

export type ActionFeedbackState =
  | { status: "idle" }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function ActionFeedback({
  state,
  className = "",
}: {
  state: ActionFeedbackState;
  className?: string;
}) {
  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <div
        className={`mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <PawPrint className="h-4 w-4" aria-hidden />
        {state.message || "Working…"}
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div
        className={`mt-2 rounded-xl border border-slate-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ${className}`}
        role="status"
        aria-live="polite"
      >
        {state.message}
      </div>
    );
  }

  return (
    <div
      className={`mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {state.message}
    </div>
  );
}
