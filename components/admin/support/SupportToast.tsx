"use client";

import { useCallback, useEffect, useState } from "react";

export type SupportToastTone = "success" | "error" | "info";

export type SupportToastItem = {
  id: string;
  tone: SupportToastTone;
  message: string;
};

export function useSupportToasts() {
  const [toasts, setToasts] = useState<SupportToastItem[]>([]);

  const pushToast = useCallback((message: string, tone: SupportToastTone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}

export function SupportToastStack({
  toasts,
  onDismiss,
}: {
  toasts: SupportToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex w-[min(100vw-2rem,24rem)] flex-col gap-3">
      {toasts.map((toast) => {
        const toneClass =
          toast.tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : toast.tone === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-sky-200 bg-sky-50 text-sky-950";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl ${toneClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p>{toast.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-xs font-black uppercase tracking-[0.14em] opacity-70 hover:opacity-100"
              >
                Close
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onEscape();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onEscape]);
}
