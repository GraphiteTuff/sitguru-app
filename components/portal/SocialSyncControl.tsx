"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RefreshCw } from "lucide-react";
import {
  syncConnectedSocialNow,
  type UnifiedSocialSyncResult,
} from "@/lib/social/unified-manual-sync";

const LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
};

/** One shared control, no duplicate platform cards, no automatic X charges. */
export default function SocialSyncControl() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<UnifiedSocialSyncResult | null>(null);

  function sync() {
    startTransition(async () => {
      try {
        const response = await syncConnectedSocialNow();
        setResult(response);
        router.refresh();
      } catch {
        setResult({
          ok: false,
          message: "The social refresh could not complete. Existing snapshots were preserved.",
          checkedAt: new Date().toISOString(),
          results: [],
        });
      }
    });
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white shadow-sm hover:bg-[#1D4ED8] disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw size={16} aria-hidden className={pending ? "animate-spin" : ""} />
        {pending ? "Syncing connected socials..." : "Sync all connected socials"}
      </button>
      <p className="text-left text-[11px] font-medium text-slate-500 sm:text-right">
        Auto-updating cards · X followers refresh separately with approval
      </p>
      {result && (
        <div
          role="status"
          aria-live="polite"
          className={"w-full max-w-xl rounded-xl border px-3 py-2 text-left text-xs font-semibold " +
            (result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900")}
        >
          <div className="flex gap-2">
            {result.ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden /> : null}
            <p>{result.message}</p>
          </div>
          {result.results.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer font-bold underline underline-offset-2">
                View platform details
              </summary>
              <ul className="mt-1 space-y-1">
                {result.results.map((item) => (
                  <li key={item.platform}>
                    <strong>{LABEL[item.platform] || item.platform}:</strong>{" "}
                    {item.followers !== null ? item.followers.toLocaleString("en-US") + " followers · " : ""}
                    {item.detail}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
