// components/ambassador/AmbassadorSelfServicePortal.tsx
"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Wallet } from "lucide-react";
import AmbassadorMetricsCircuit from "@/components/ambassador/metrics/AmbassadorMetricsCircuit";

type MePayload = {
  ok?: boolean;
  error?: string;
  referralLink?: string;
  clicksTotal?: number;
  referralsTotal?: number;
  pendingCommissions?: number;
  lifetimePaid?: number;
  payoutReceipts?: Array<{ amount: number; paidAt: string; batchId: string }>;
  profile?: {
    referral_code_slug?: string;
    display_name?: string;
    region?: string;
  };
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function hasReferralCode(payload: MePayload | null) {
  const code = payload?.profile?.referral_code_slug;
  return typeof code === "string" && code.trim().length > 0;
}

export default function AmbassadorSelfServicePortal() {
  const [data, setData] = useState<MePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/ambassador/ledger/me");
        const json = (await res.json()) as MePayload;
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Unable to load ledger.");
        }
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const frozen = !hasReferralCode(data);
  const displayLink = (
    data?.referralLink || "https://sitguru.com/r/YOUR_CODE"
  ).replace(/^https?:\/\//, "://");

  async function copyLink() {
    const full =
      data?.referralLink ||
      `https://sitguru.com/r/${data?.profile?.referral_code_slug || ""}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard permission denied.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center rounded-3xl border border-emerald-100 bg-white py-12 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <AmbassadorMetricsCircuit initHref="/ambassador/dashboard/referrals" />

      <section
        data-brand-green={frozen ? undefined : true}
        className={`rounded-3xl border p-5 shadow-lg ${
          frozen
            ? "border-amber-200 bg-amber-50 text-amber-950"
            : "public-dark-section border-emerald-100 bg-gradient-to-br from-emerald-950 to-emerald-800 text-white"
        }`}
      >
        <p
          className={`text-[10px] font-black uppercase tracking-[0.16em] ${
            frozen ? "text-amber-800" : "text-emerald-200"
          }`}
        >
          Your referral link
        </p>
        <p
          className={`mt-2 break-all font-mono text-sm font-bold ${
            frozen ? "text-amber-950" : "text-emerald-50"
          }`}
        >
          {frozen
            ? "Circuit offline — initialize tracking to unlock link"
            : displayLink}
        </p>
        <button
          type="button"
          onClick={() => void copyLink()}
          disabled={frozen}
          className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${
            frozen
              ? "bg-amber-200 text-amber-950"
              : "bg-white text-emerald-950"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : frozen ? "Tracking required" : "Copy Link"}
        </button>
      </section>

      {error || !data ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-950">
          {error ||
            "Ambassador ledger profile not ready yet. Ask SitGuru Admin to sync your referral code."}
        </div>
      ) : (
        <>
          <section className="grid w-full grid-cols-2 gap-3">
            <SummaryCard
              label="Clicks"
              value={String(frozen ? 0 : data.clicksTotal || 0)}
            />
            <SummaryCard
              label="Signups"
              value={String(frozen ? 0 : data.referralsTotal || 0)}
            />
            <SummaryCard
              label="Pending $"
              value={money(frozen ? 0 : data.pendingCommissions || 0)}
            />
            <SummaryCard
              label="Paid lifetime"
              value={money(frozen ? 0 : data.lifetimePaid || 0)}
            />
          </section>

          <section className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-700" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                Bank payout receipts
              </h2>
            </div>
            {(data.payoutReceipts || []).length === 0 || frozen ? (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {frozen
                  ? "Payout history frozen until referralCode is connected."
                  : "No paid batches yet. Approved commissions show above as pending."}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(data.payoutReceipts || []).slice(0, 8).map((receipt, idx) => (
                  <li
                    key={`${receipt.batchId}-${idx}`}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 text-sm"
                  >
                    <span className="font-black text-emerald-900">
                      {money(receipt.amount)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {receipt.paidAt
                        ? new Date(receipt.paidAt).toLocaleDateString()
                        : "Paid"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
        {label}
      </p>
      <p className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">
        {value}
      </p>
    </div>
  );
}
