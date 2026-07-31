// components/ambassador/AmbassadorSelfServicePortal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, Wallet } from "lucide-react";

type WeeklyPoint = { label: string; signups: number; earnings: number };

type MePayload = {
  ok?: boolean;
  error?: string;
  referralLink?: string;
  clicksTotal?: number;
  referralsTotal?: number;
  pendingCommissions?: number;
  lifetimePaid?: number;
  weekly?: WeeklyPoint[];
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

  const maxSignups = useMemo(() => {
    const weeks = data?.weekly || [];
    return Math.max(1, ...weeks.map((w) => w.signups));
  }, [data?.weekly]);

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

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-950">
        {error ||
          "Ambassador ledger profile not ready yet. Ask SitGuru Admin to sync your referral code."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-950 to-emerald-800 p-5 text-white shadow-lg">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
          Your referral link
        </p>
        <p className="mt-2 break-all font-mono text-sm font-bold text-emerald-50">
          {displayLink}
        </p>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-emerald-950"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy Link"}
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <SummaryCard label="Clicks" value={String(data.clicksTotal || 0)} />
        <SummaryCard
          label="Signups"
          value={String(data.referralsTotal || 0)}
        />
        <SummaryCard
          label="Pending $"
          value={money(data.pendingCommissions || 0)}
        />
        <SummaryCard
          label="Paid lifetime"
          value={money(data.lifetimePaid || 0)}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
          Weekly signup volume
        </h2>
        <div className="mt-4 flex h-36 items-end gap-1.5">
          {(data.weekly || []).map((week) => (
            <div key={week.label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-emerald-600/90"
                style={{
                  height: `${Math.max(8, (week.signups / maxSignups) * 100)}%`,
                }}
                title={`${week.signups} signups`}
              />
              <span className="text-[9px] font-bold text-slate-400">
                {week.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-700" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
            Bank payout receipts
          </h2>
        </div>
        {(data.payoutReceipts || []).length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-500">
            No paid batches yet. Approved commissions show above as pending.
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
