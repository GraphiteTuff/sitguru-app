"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export default function InitialBrandApprovalControl({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState("");
  if (!pendingCount && !done) return null;

  async function approve() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/brand-kit/approve-existing", { method: "POST", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || "Approval could not be completed.");
      setDone(Number(data.approved || 0));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-[#FFF7ED] p-4" aria-label="One-time existing asset approval">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black text-[#0F2744]">
            <ShieldCheck size={17} aria-hidden="true" /> Founder's one-time library approval
          </p>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-700">
            {done ? `${done} existing files approved and audit-logged.` : `${pendingCount} verified existing draft/review files awaiting the initial approval. Archived and future intern submissions are excluded.`}
          </p>
        </div>
        {done ? <span className="inline-flex items-center gap-2 text-sm font-black text-[#166534]"><CheckCircle2 size={17} aria-hidden="true" /> Complete</span> : (
          <button type="button" onClick={() => void approve()} disabled={busy || pendingCount === 0} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white disabled:opacity-60">
            {busy ? "Approving existing assets…" : `Approve ${pendingCount} existing assets`}
          </button>
        )}
      </div>
      {error ? <p role="alert" className="mt-3 text-xs font-bold text-rose-700">{error}</p> : null}
    </section>
  );
}
