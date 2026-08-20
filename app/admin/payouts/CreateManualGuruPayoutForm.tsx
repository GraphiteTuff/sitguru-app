"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export const MANUAL_PAYOUT_TYPES = [
  { value: "guru", label: "Guru" },
  { value: "ambassador", label: "Ambassador" },
  { value: "partner", label: "Partner" },
  { value: "pet_parent", label: "Pet Parent" },
  { value: "pawperks", label: "PawPerks" },
  { value: "referral", label: "Referrals" },
] as const;

export type ManualPayoutType = (typeof MANUAL_PAYOUT_TYPES)[number]["value"];

export type ManualPayoutRecipientOption = {
  id: string;
  name: string;
  email: string;
  stripeAccountId?: string;
  userId?: string;
  type: ManualPayoutType;
};

/** @deprecated Prefer ManualPayoutRecipientOption */
export type ManualPayoutGuruOption = ManualPayoutRecipientOption;

type CreateManualGuruPayoutFormProps = {
  recipients: ManualPayoutRecipientOption[];
  /** @deprecated Use recipients */
  gurus?: ManualPayoutRecipientOption[];
  defaultRecipientId?: string;
  defaultGuruId?: string;
  defaultAmount?: number;
  defaultPayoutType?: ManualPayoutType;
  defaultType?: string;
  defaultReason?: string;
};

export default function CreateManualGuruPayoutForm({
  recipients,
  gurus = [],
  defaultRecipientId = "",
  defaultGuruId = "",
  defaultAmount = 25,
  defaultPayoutType = "guru",
  defaultReason = "SitGuru Welcome Bonus — Thank you for joining SitGuru",
}: CreateManualGuruPayoutFormProps) {
  const router = useRouter();
  const allRecipients = recipients.length > 0 ? recipients : gurus;
  const [payoutType, setPayoutType] = useState<ManualPayoutType>(defaultPayoutType);
  const [recipientId, setRecipientId] = useState(
    defaultRecipientId || defaultGuruId || "",
  );
  const [amount, setAmount] = useState(String(defaultAmount));
  const [reason, setReason] = useState(defaultReason);
  const [status, setStatus] = useState("ready");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"slate" | "emerald" | "rose">("slate");

  const recipientsForType = useMemo(
    () =>
      allRecipients
        .filter((recipient) => recipient.type === payoutType)
        .sort((a, b) => {
          if (payoutType === "guru") {
            const aReady = a.stripeAccountId ? 1 : 0;
            const bReady = b.stripeAccountId ? 1 : 0;
            if (bReady !== aReady) return bReady - aReady;
          }
          return a.name.localeCompare(b.name);
        }),
    [allRecipients, payoutType],
  );

  const selectedRecipient = useMemo(
    () => recipientsForType.find((recipient) => recipient.id === recipientId) || null,
    [recipientsForType, recipientId],
  );

  useEffect(() => {
    if (recipientsForType.some((recipient) => recipient.id === recipientId)) {
      return;
    }

    const preferred =
      (payoutType === "guru" &&
        recipientsForType.find((recipient) => recipient.id === defaultGuruId)) ||
      recipientsForType[0] ||
      null;

    setRecipientId(preferred?.id || "");
  }, [payoutType, recipientsForType, recipientId, defaultGuruId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Creating manual payout…");
    setTone("slate");

    try {
      const response = await fetch("/api/admin/payouts/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutType,
          recipientId,
          guruId: payoutType === "guru" ? recipientId : undefined,
          amount: Number(amount),
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
          recipientName?: string;
          guruName?: string;
          amount?: number;
          payoutStatus?: string;
          payoutType?: string;
          warning?: string;
          canRelease?: boolean;
        };
      };

      if (!response.ok || !payload.ok) {
        setTone("rose");
        setMessage(
          payload.error ||
            payload.details ||
            "Unable to create manual payout.",
        );
        return;
      }

      const created = payload.payout;
      const typeLabel =
        MANUAL_PAYOUT_TYPES.find((entry) => entry.value === payoutType)?.label ||
        payoutType;

      setTone("emerald");
      setMessage(
        [
          `Created $${Number(created?.amount || amount).toFixed(2)} ${typeLabel} payout for ${
            created?.recipientName ||
            created?.guruName ||
            selectedRecipient?.name ||
            "recipient"
          }.`,
          `Status: ${created?.payoutStatus || status}.`,
          created?.canRelease
            ? "Stripe transfer/reference fields left empty until Release."
            : "Queued for review. Stripe Release is available for Guru payouts only.",
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

  const recipientLabel =
    MANUAL_PAYOUT_TYPES.find((entry) => entry.value === payoutType)?.label ||
    "Recipient";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:p-8"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Manual payout
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Create Manual Payout
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Choose Guru, Ambassador, Partner, Pet Parent, PawPerks, or Referrals,
            then pick the recipient. Guru rows can Dry Run / Release through
            Stripe Connect when balance covers the amount. Pet Parents are queued
            as SitGuru account credit (no Stripe connected account required).
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Payout Type
          </span>
          <select
            value={payoutType}
            onChange={(event) =>
              setPayoutType(event.target.value as ManualPayoutType)
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
            required
          >
            {MANUAL_PAYOUT_TYPES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {recipientLabel}
          </span>
          <select
            value={recipientId}
            onChange={(event) => setRecipientId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
            required
          >
            <option value="" disabled>
              Select a {recipientLabel}
            </option>
            {recipientsForType.map((recipient) => (
              <option key={`${recipient.type}-${recipient.id}`} value={recipient.id}>
                {recipient.name}
                {recipient.email ? ` · ${recipient.email}` : ""}
                {payoutType === "guru"
                  ? recipient.stripeAccountId
                    ? " · Stripe ready"
                    : " · missing Stripe"
                  : ""}
              </option>
            ))}
          </select>
          {recipientsForType.length === 0 ? (
            <span className="text-xs font-bold text-rose-700">
              No {recipientLabel.toLowerCase()} recipients found.
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-500">
              {payoutType === "guru"
                ? `${recipientsForType.filter((r) => r.stripeAccountId).length} of ${recipientsForType.length} Gurus have a Stripe connected account.`
                : `${recipientsForType.length} ${recipientLabel.toLowerCase()} recipients available.`}
            </span>
          )}
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

      {selectedRecipient && payoutType === "guru" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Stripe destination:{" "}
          <span className="font-black text-slate-950">
            {selectedRecipient.stripeAccountId || "Missing connected account"}
          </span>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !recipientId || recipientsForType.length === 0}
          className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create Payout"}
        </button>
        <p className="text-xs font-bold text-slate-500">
          {payoutType === "guru"
            ? "After create: Dry Run first, then Release only if platform Stripe balance ≥ amount."
            : payoutType === "pet_parent"
              ? "Pet Parent payouts create SitGuru account credit / welcome-bonus liability (not Stripe Release)."
              : "Non-Guru payouts are queued for admin review (not Stripe Release)."}
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
