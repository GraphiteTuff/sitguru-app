"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import {
  syncOfficialMetaNow,
  type MetaManualSyncResult,
} from "@/lib/meta/manual-social-sync";

/** Inline control for the existing social cards; never creates a new metrics panel. */
export default function MetaSocialSyncControl() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<MetaManualSyncResult | null>(null);

  function runSync() {
    startTransition(async () => {
      try {
        const next = await syncOfficialMetaNow();
        setResult(next);
        router.refresh();
      } catch {
        setResult({
          ok: false,
          message: "The sync request failed. Check Vercel logs or try again.",
          results: [],
        });
      }
    });
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={runSync}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900 hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw size={14} aria-hidden className={pending ? "animate-spin" : ""} />
        {pending ? "Checking Meta..." : "Sync Facebook & Instagram"}
      </button>
      {result ? (
        <div role="status" aria-live="polite" className={"max-w-lg text-xs font-semibold " + (result.ok ? "text-emerald-700" : "text-amber-900")}>
          <p>{result.message}</p>
          {result.results.length > 0 ? (
            <p className="mt-1">
              {result.results.map((platform) => (
                <span key={platform.platform} className="mr-3 inline-block">
                  {platform.platform === "facebook" ? "Facebook" : "Instagram"}:{" "}
                  {platform.ok && platform.followers !== null
                    ? platform.followers.toLocaleString("en-US") + " verified followers"
                    : platform.error || "unavailable"}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
