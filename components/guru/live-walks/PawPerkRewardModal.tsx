"use client";

/**
 * Thumb-optimized PawPerks award overlay for Guru live walks.
 */

import { FormEvent, useMemo, useState } from "react";
import { X } from "lucide-react";
import { GURU_REWARD_TEMPLATES } from "@/lib/pawperks/constants";

type PawPerkRewardModalProps = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  petName?: string;
  onAwarded?: (result: {
    pointsAwarded: number;
    memo: string;
  }) => void;
};

type AwardResponse = {
  ok: boolean;
  error?: string;
  pointsAwarded?: number;
  memo?: string;
};

export default function PawPerkRewardModal({
  open,
  onClose,
  bookingId,
  petName = "Scout",
  onAwarded,
}: PawPerkRewardModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    "great_potty",
  );
  const [customPoints, setCustomPoints] = useState("40");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mode = selectedTemplate === "custom" ? "custom" : "template";

  const previewPoints = useMemo(() => {
    if (mode === "custom") {
      return Math.max(0, Math.floor(Number(customPoints) || 0));
    }
    return (
      GURU_REWARD_TEMPLATES.find((t) => t.id === selectedTemplate)?.points || 0
    );
  }, [mode, customPoints, selectedTemplate]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload =
        mode === "custom"
          ? {
              bookingId,
              points: previewPoints,
              memo: memo.trim() || undefined,
            }
          : {
              bookingId,
              templateId: selectedTemplate,
              memo: memo.trim() || undefined,
            };

      const response = await fetch("/api/guru/perks/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AwardResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to award PawPerks.");
      }

      const points = data.pointsAwarded || previewPoints;
      const message =
        data.memo ||
        `${petName} earned ${points} PawPerks — parent notified.`;
      setSuccess(message);
      onAwarded?.({ pointsAwarded: points, memo: message });

      window.setTimeout(() => {
        onClose();
        setSuccess(null);
        setMemo("");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Award failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pawperk-reward-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] border border-emerald-100 bg-white shadow-2xl sm:max-w-md sm:rounded-[1.75rem]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-emerald-50 bg-gradient-to-br from-emerald-50 to-white px-5 pb-4 pt-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              PawPerks reward
            </p>
            <h2
              id="pawperk-reward-title"
              className="mt-1 text-xl font-black tracking-tight text-slate-900"
            >
              Celebrate {petName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Thumb-tap a template — the Pet Parent gets a push instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-1 gap-3">
            {GURU_REWARD_TEMPLATES.map((template) => {
              const active = selectedTemplate === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={[
                    "flex min-h-[72px] items-center justify-between gap-3 rounded-3xl border-2 px-4 text-left transition active:scale-[0.99]",
                    active
                      ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-900/10"
                      : "border-emerald-100 bg-white",
                  ].join(" ")}
                >
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      +{template.points} · {template.label}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      {template.memo}
                    </p>
                  </div>
                  <span className="text-2xl" aria-hidden>
                    ✨
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedTemplate("custom")}
              className={[
                "flex min-h-[72px] flex-col items-start justify-center rounded-3xl border-2 px-4 text-left transition",
                selectedTemplate === "custom"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-dashed border-emerald-200 bg-slate-50",
              ].join(" ")}
            >
              <p className="text-sm font-black text-slate-900">Custom amount</p>
              <p className="text-xs font-medium text-slate-500">
                Between 5 and 200 points
              </p>
            </button>
          </div>

          {selectedTemplate === "custom" ? (
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                Custom points
              </span>
              <input
                inputMode="numeric"
                value={customPoints}
                onChange={(event) => setCustomPoints(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
              Optional memo
            </span>
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              rows={2}
              placeholder={`Awarded by Guru for excellent leash walking!`}
              className="mt-1.5 w-full resize-none rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          {error ? (
            <p className="text-sm font-semibold text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm font-semibold text-emerald-700">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || previewPoints < 5}
            className="flex min-h-[64px] w-full items-center justify-center rounded-3xl bg-[#065f46] px-4 text-base font-black text-white shadow-lg shadow-emerald-900/25 disabled:opacity-50"
          >
            {submitting
              ? "Sending reward…"
              : `✨ Reward ${previewPoints} PawPerks`}
          </button>
        </div>
      </form>
    </div>
  );
}
