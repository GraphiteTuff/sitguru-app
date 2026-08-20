"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type DismissibleFixedChatProps = {
  label: string;
  children: ReactNode;
  className?: string;
  /** Optional storage key so dismiss persists for this browser tab/session. */
  storageKey?: string;
  /** Where to pin the close control. Defaults to top-left. */
  closePosition?: "left" | "right";
};

export default function DismissibleFixedChat({
  label,
  children,
  className = "fixed bottom-4 right-4 z-40 w-[min(430px,calc(100vw-2rem))]",
  storageKey,
  closePosition = "left",
}: DismissibleFixedChatProps) {
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(!storageKey);

  useEffect(() => {
    if (!storageKey) {
      setReady(true);
      return;
    }
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") {
        setOpen(false);
      }
    } catch {
      // ignore storage failures
    }
    setReady(true);
  }, [storageKey]);

  if (!ready || !open) return null;

  const closePositionClass =
    closePosition === "right" ? "right-3 top-3" : "left-3 top-3";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          if (storageKey) {
            try {
              window.sessionStorage.setItem(storageKey, "1");
            } catch {
              // ignore storage failures
            }
          }
        }}
        aria-label={`Close ${label}`}
        title="Close"
        className={`absolute ${closePositionClass} z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800`}
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
      {children}
    </div>
  );
}
