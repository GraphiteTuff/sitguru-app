"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  clearPendingDiscoveryOpen,
  readPendingDiscoveryOpen,
} from "@/lib/community/pet-parent-signup";

/**
 * After Pet Parent signup from a Google discovery banner card,
 * offer one tap to open the saved external event.
 */
export default function DiscoveryReturnOpener() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<{
    title: string;
    eventUrl: string;
  } | null>(null);

  useEffect(() => {
    const welcome = searchParams.get("welcome") === "1";
    const saved = readPendingDiscoveryOpen();
    if (!saved) return;
    if (!welcome && !saved.eventUrl) return;
    setPending({ title: saved.title, eventUrl: saved.eventUrl });
  }, [searchParams]);

  if (!pending) return null;

  function openEvent() {
    window.open(pending!.eventUrl, "_blank", "noopener,noreferrer");
    clearPendingDiscoveryOpen();
    setPending(null);
  }

  function dismiss() {
    clearPendingDiscoveryOpen();
    setPending(null);
  }

  return (
    <div className="mx-auto mb-6 max-w-3xl rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
      <p className="text-sm font-black text-emerald-950">
        You&apos;re in the pack — ready for {pending.title}?
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openEvent}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          Open event
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
