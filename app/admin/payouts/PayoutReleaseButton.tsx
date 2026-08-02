"use client";

import { useState } from "react";

type PayoutReleaseButtonProps = {
  payoutId: string;
  amountLabel: string;
};

export default function PayoutReleaseButton({
  payoutId,
  amountLabel,
}: PayoutReleaseButtonProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"slate" | "emerald" | "rose">("slate");

  async function runRelease(dryRun: boolean) {
    setBusy(true);
    setMessage(dryRun ? "Running dry-run…" : "Releasing…");
    setTone("slate");

    try {
      const response = await fetch("/api/admin/payouts/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, dryRun }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        results?: Array<{ status?: string; message?: string }>;
      };

      const result = payload.results?.[0];
      const status = result?.status || (payload.ok ? "released" : "failed");
      const detail =
        result?.message ||
        payload.error ||
        (payload.ok ? "Release completed." : "Release failed.");

      setMessage(`${status.replaceAll("_", " ")} · ${detail}`);
      setTone(status === "failed" ? "rose" : "emerald");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to reach release API.",
      );
      setTone("rose");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-[160px] flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => runRelease(true)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Dry run
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => runRelease(false)}
          className="rounded-xl bg-emerald-700 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          Release {amountLabel}
        </button>
      </div>
      {message ? (
        <p
          className={`text-[11px] font-bold leading-4 ${
            tone === "rose"
              ? "text-rose-700"
              : tone === "emerald"
                ? "text-emerald-700"
                : "text-slate-500"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
