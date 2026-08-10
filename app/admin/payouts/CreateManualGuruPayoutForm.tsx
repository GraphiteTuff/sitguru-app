"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type ManualPayoutGuruOption = {
  id: string;
  name: string;
  email: string;
  stripeAccountId: string;
};

type CreateManualGuruPayoutFormProps = {
  gurus: ManualPayoutGuruOption[];
  defaultGuruId?: string;
  defaultAmount?: number;
  defaultType?: string;
  defaultReason?: string;
};

export default function CreateManualGuruPayoutForm({
  gurus,
  defaultGuruId = "",
  defaultAmount = 25,
  defaultType = "Welcome / Thank-You Bonus",
  defaultReason = "Thank you for joining SitGuru!",
}: CreateManualGuruPayoutFormProps) {
  const router = useRouter();
  const [guruId, setGuruId] = useState(defaultGuruId || gurus[0]?.id || "");
  const [amount, setAmount] = useState(String(defaultAmount));
  const [payoutType, setPayoutType] = useState(defaultType);
  const [reason, setReason] = useState(defaultReason);
  const [status, setStatus] = useState("ready");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"slate" | "emerald" | "rose">("slate");

  const selectedGuru = useMemo(
    () => gurus.find((guru) => guru.id === guruId) || null,
    [gurus, guruId],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Creating manual Guru payout…");
    setTone("slate");

    try {
      const response = await fetch("/api/admin/payouts/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guruId,
          amount: Number(amount),
          payoutType,
          reason,
          status,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        details?: string;
        payout?: {
          id?: string;
          guruName?: string;
          amount?: number;
          payoutStatus?: string;
          warning?: string;
        };
      };

      if (!response.ok || !payload.ok) {
        setTone("rose");
        setMessage(
          payload.error ||
            payload.details ||
            "Unable to create manual Guru payout.",
        );
        return;
      }

      const created = payload.payout;
      setTone("emerald");
      setMessage(
        [
          `Created $${Number(created?.amount || amount).toFixed(2)} payout for ${
            created?.guruName || selectedGuru?.name || "Guru"
          }.`,
          `Status: ${created?.payoutStatus || status}.`,
          "Stripe transfer/reference fields left empty until Release.",
          created?.warning || "",
        ]
          .filter(Boolean)
          .join(" "),
      );
      router.refresh();
    } catch (error) {
      setTone("rose");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reach create-manual payout API.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Manual Guru payout
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Create Manual Guru Payout
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Creates a `guru_payouts` row for Dry Run / Release. Leaves
            `stripe_transfer_id` empty until Stripe Connect actually transfers
            funds. Do not Release until SitGuru Stripe available balance covers
            the amount.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Guru
          </span>
          <select
            value={guruId}
            onChange={(event) => setGuruId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
            required
          >
            <option value="" disabled>
              Select a Guru
            </option>
            {gurus.map((guru) => (
              <option key={guru.id} value={guru.id}>
                {guru.name}
                {guru.email ? ` · ${guru.email}` : ""}
                {guru.stripeAccountId ? "" : " · missing Stripe"}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Amount (USD)
          </span>
          <input
            type="number"
            min="0.5"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Type
          </span>
          <input
            type="text"
            value={payoutType}
            onChange={(event) => setPayoutType(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Status
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
          >
            <option value="ready">Ready for Release</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Reason
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
            required
          />
        </label>
      </div>

      {selectedGuru ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Stripe destination:{" "}
          <span className="font-black text-slate-950">
            {selectedGuru.stripeAccountId || "Missing connected account"}
          </span>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !guruId}
          className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create Payout"}
        </button>
        <p className="text-xs font-bold text-slate-500">
          After create: Dry Run first, then Release only if platform Stripe
          balance ≥ amount.
        </p>
      </div>

      {message ? (
        <p
          className={`mt-4 text-sm font-bold leading-6 ${
            tone === "rose"
              ? "text-rose-700"
              : tone === "emerald"
                ? "text-emerald-700"
                : "text-slate-600"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
