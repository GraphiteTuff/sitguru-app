"use client";

/**
 * Quick Book overlay — opens express booking checkout for a Guru + pet_id
 * without the Meet Guru intermediate profile hop.
 */

import { useEffect } from "react";
import { Loader2, X, Zap } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  bookUrl: string;
  guruName?: string;
};

export default function QuickBookOverlay({
  open,
  onClose,
  bookUrl,
  guruName,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close quick book"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:h-[88vh] sm:rounded-[1.75rem]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white">
              <Zap className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                Quick Book
              </p>
              <p className="truncate text-sm font-black text-slate-950">
                {guruName ? `Checkout with ${guruName}` : "Express checkout"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative min-h-0 flex-1 bg-slate-50">
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-sm font-bold text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading checkout…
          </div>
          <iframe
            title="Quick Book checkout"
            src={bookUrl}
            className="relative z-10 h-full w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

export function buildExpressBookUrl(bookHref: string, petId?: string | null) {
  try {
    const url = new URL(bookHref, "https://www.sitguru.com");
    url.searchParams.set("express", "1");
    if (petId) url.searchParams.set("pet_id", petId);
    return `${url.pathname}${url.search}`;
  } catch {
    const joiner = bookHref.includes("?") ? "&" : "?";
    return `${bookHref}${joiner}express=1${petId ? `&pet_id=${encodeURIComponent(petId)}` : ""}`;
  }
}
