/**
 * Multi-step Account Visibility Controls wizard — pause + deletion retention.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  EyeOff,
  Loader2,
  ShieldAlert,
  Snowflake,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics/track";
import {
  DELETION_REASONS,
  PAUSE_DURATIONS,
  PAUSE_REASONS,
  type PauseDurationDays,
  type PauseReasonId,
  type ProfileRole,
  formatResumeDate,
} from "@/components/profile/profile-types";

type WizardTrack = "menu" | "pause" | "delete" | "pause_success";

type AccountVisibilityWizardProps = {
  open: boolean;
  onClose: () => void;
  role: ProfileRole;
};

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) {
    throw new Error("Please log in again before managing your account.");
  }
  return session.access_token;
}

export default function AccountVisibilityWizard({
  open,
  onClose,
  role,
}: AccountVisibilityWizardProps) {
  const [track, setTrack] = useState<WizardTrack>("menu");
  const [pauseStep, setPauseStep] = useState(1);
  const [deleteStep, setDeleteStep] = useState(1);
  const [pauseReason, setPauseReason] = useState<PauseReasonId | "">("");
  const [durationDays, setDurationDays] = useState<PauseDurationDays | null>(
    null,
  );
  const [improvement, setImprovement] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteOther, setDeleteOther] = useState("");
  const [leaveFeedback, setLeaveFeedback] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resumeAtLabel, setResumeAtLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setTrack("menu");
    setPauseStep(1);
    setDeleteStep(1);
    setPauseReason("");
    setDurationDays(null);
    setImprovement("");
    setDeleteReason("");
    setDeleteOther("");
    setLeaveFeedback("");
    setConfirmDelete("");
    setBusy(false);
    setError("");
    setResumeAtLabel("");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose, open]);

  const finalDeleteReason = useMemo(() => {
    if (deleteReason === "Other" || deleteReason === "other") {
      return deleteOther.trim();
    }
    return deleteReason.trim();
  }, [deleteOther, deleteReason]);

  const canPauseImprove = improvement.trim().length >= 10;
  const canDeleteFeedback = leaveFeedback.trim().length >= 15;
  const canHardDelete =
    confirmDelete.trim() === "DELETE" &&
    finalDeleteReason.length > 0 &&
    canDeleteFeedback;

  async function submitPause() {
    if (!pauseReason || !durationDays || !canPauseImprove) return;
    setBusy(true);
    setError("");
    try {
      const accessToken = await getAccessToken();
      const reasonLabel =
        PAUSE_REASONS.find((item) => item.id === pauseReason)?.label ||
        pauseReason;

      const response = await fetch("/api/account/pause", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reasonLabel,
          durationDays,
          improvementFeedback: improvement.trim(),
          role,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        resumeAt?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Unable to pause your account.");
      }

      await trackEvent({
        eventName: "account_pause_submitted",
        eventType: "churn_retention",
        role,
        source: "account_visibility_wizard",
        metadata: {
          reason: reasonLabel,
          durationDays,
          improvementLength: improvement.trim().length,
          resumeAt: result.resumeAt || null,
        },
      });

      setResumeAtLabel(
        result.resumeAt
          ? new Intl.DateTimeFormat("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(result.resumeAt))
          : formatResumeDate(durationDays),
      );
      setTrack("pause_success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to pause account.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDelete() {
    if (!canHardDelete) return;
    setBusy(true);
    setError("");
    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: finalDeleteReason,
          feedback: leaveFeedback.trim(),
          confirmationText: "DELETE",
          understandsPermanent: true,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to delete your account.");
      }

      await trackEvent({
        eventName: "account_delete_submitted",
        eventType: "churn_retention",
        role,
        source: "account_visibility_wizard",
        metadata: {
          reason: finalDeleteReason,
          feedbackLength: leaveFeedback.trim().length,
        },
      });

      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete your account.",
      );
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close account visibility overlay"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition will-change-[backdrop-filter,opacity]"
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-visibility-title"
        className="relative z-[121] flex max-h-[min(92svh,44rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-white shadow-2xl sm:rounded-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Account Visibility Controls
            </p>
            <h2
              id="account-visibility-title"
              className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950"
            >
              {track === "pause_success"
                ? "You’re paused — see you soon"
                : track === "pause"
                  ? "Pause your account"
                  : track === "delete"
                    ? "Permanent deletion"
                    : "How would you like to step away?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!busy) onClose();
            }}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
              {error}
            </div>
          ) : null}

          {track === "menu" ? (
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setTrack("pause");
                  setPauseStep(1);
                  setError("");
                }}
                className="group rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0D5C3A] text-white shadow-sm">
                    <Snowflake className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950">
                      Pause account
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                      Freeze public visibility for 30–90 days. Your data stays
                      safe and you can return automatically.
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-emerald-700 transition group-hover:translate-x-0.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTrack("delete");
                  setDeleteStep(1);
                  setError("");
                }}
                className="rounded-2xl border border-transparent px-2 py-3 text-left text-sm font-semibold text-slate-400 transition hover:text-slate-600"
              >
                Prefer permanent deletion instead? Continue to exit survey
                <span className="ml-1 underline decoration-slate-300 underline-offset-2">
                  here
                </span>
                .
              </button>
            </div>
          ) : null}

          {track === "pause" ? (
            <PauseTrack
              step={pauseStep}
              pauseReason={pauseReason}
              durationDays={durationDays}
              improvement={improvement}
              canPauseImprove={canPauseImprove}
              busy={busy}
              onReason={setPauseReason}
              onDuration={setDurationDays}
              onImprovement={setImprovement}
              onBack={() => {
                if (pauseStep === 1) setTrack("menu");
                else setPauseStep((value) => Math.max(1, value - 1));
              }}
              onNext={() => setPauseStep((value) => Math.min(4, value + 1))}
              onSubmit={() => void submitPause()}
            />
          ) : null}

          {track === "pause_success" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-[#0D5C3A]">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <p className="mt-4 text-lg font-black text-slate-950">
                Visibility paused successfully
              </p>
              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
                Your public profile is frozen through{" "}
                <span className="font-black text-emerald-800">
                  {resumeAtLabel || "your selected resume date"}
                </span>
                . We’ll keep your feedback to improve SitGuru before you return.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0D5C3A] px-5 text-sm font-black text-white transition hover:bg-[#09462C]"
              >
                Done
              </button>
            </div>
          ) : null}

          {track === "delete" ? (
            <DeleteTrack
              step={deleteStep}
              deleteReason={deleteReason}
              deleteOther={deleteOther}
              leaveFeedback={leaveFeedback}
              confirmDelete={confirmDelete}
              finalDeleteReason={finalDeleteReason}
              canDeleteFeedback={canDeleteFeedback}
              canHardDelete={canHardDelete}
              busy={busy}
              onReason={setDeleteReason}
              onOther={setDeleteOther}
              onFeedback={setLeaveFeedback}
              onConfirm={setConfirmDelete}
              onBack={() => {
                if (deleteStep === 1) setTrack("menu");
                else setDeleteStep((value) => Math.max(1, value - 1));
              }}
              onNext={() => setDeleteStep((value) => Math.min(3, value + 1))}
              onSubmit={() => void submitDelete()}
              onPreferPause={() => {
                setTrack("pause");
                setPauseStep(1);
                setError("");
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PauseTrack({
  step,
  pauseReason,
  durationDays,
  improvement,
  canPauseImprove,
  busy,
  onReason,
  onDuration,
  onImprovement,
  onBack,
  onNext,
  onSubmit,
}: {
  step: number;
  pauseReason: PauseReasonId | "";
  durationDays: PauseDurationDays | null;
  improvement: string;
  canPauseImprove: boolean;
  busy: boolean;
  onReason: (value: PauseReasonId) => void;
  onDuration: (value: PauseDurationDays) => void;
  onImprovement: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-5">
      <StepMeter current={step} total={3} />

      {step === 1 ? (
        <>
          <p className="text-sm font-semibold text-slate-600">
            Why are you pausing? Pick the closest reason.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PAUSE_REASONS.map((item) => {
              const active = pauseReason === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onReason(item.id)}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    active
                      ? "border-[#0D5C3A] bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-200"
                  }`}
                >
                  <p className="text-sm font-black text-slate-950">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.helper}
                  </p>
                </button>
              );
            })}
          </div>
          <WizardNav
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!pauseReason}
            nextLabel="Continue"
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <p className="text-sm font-semibold text-slate-600">
            How long should public visibility stay frozen?
          </p>
          <div className="grid gap-3">
            {PAUSE_DURATIONS.map((item) => {
              const active = durationDays === item.days;
              return (
                <button
                  key={item.days}
                  type="button"
                  onClick={() => onDuration(item.days)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-[#0D5C3A] bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#0D5C3A] shadow-sm">
                      <Clock3 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        Freezes today · resumes {formatResumeDate(item.days)}
                      </p>
                    </div>
                  </div>
                  <EyeOff
                    className={`h-4 w-4 ${active ? "text-emerald-700" : "text-slate-300"}`}
                  />
                </button>
              );
            })}
          </div>
          <WizardNav
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!durationDays}
            nextLabel="Continue"
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <label className="block">
            <span className="text-sm font-black text-slate-950">
              What can we improve when you return?
            </span>
            <textarea
              value={improvement}
              onChange={(event) => onImprovement(event.target.value)}
              rows={5}
              placeholder="Tell us what would make coming back feel effortless…"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            />
            <span className="mt-1.5 block text-xs font-semibold text-slate-400">
              {improvement.trim().length}/10 characters minimum
            </span>
          </label>
          <WizardNav
            onBack={onBack}
            onNext={onSubmit}
            nextDisabled={!canPauseImprove || busy}
            nextLabel={busy ? "Saving…" : "Confirm pause"}
            nextIcon={
              busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )
            }
          />
        </>
      ) : null}
    </div>
  );
}

function DeleteTrack({
  step,
  deleteReason,
  deleteOther,
  leaveFeedback,
  confirmDelete,
  finalDeleteReason,
  canDeleteFeedback,
  canHardDelete,
  busy,
  onReason,
  onOther,
  onFeedback,
  onConfirm,
  onBack,
  onNext,
  onSubmit,
  onPreferPause,
}: {
  step: number;
  deleteReason: string;
  deleteOther: string;
  leaveFeedback: string;
  confirmDelete: string;
  finalDeleteReason: string;
  canDeleteFeedback: boolean;
  canHardDelete: boolean;
  busy: boolean;
  onReason: (value: string) => void;
  onOther: (value: string) => void;
  onFeedback: (value: string) => void;
  onConfirm: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onPreferPause: () => void;
}) {
  return (
    <div className="space-y-5">
      <StepMeter current={step} total={3} tone="danger" />

      {step === 1 ? (
        <>
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-sm font-semibold text-amber-950 backdrop-blur-sm">
            Consider pausing instead — you can always resume later without
            losing your history.
            <button
              type="button"
              onClick={onPreferPause}
              className="ml-1 font-black text-[#0D5C3A] underline underline-offset-2"
            >
              Switch to pause
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Why are you leaving SitGuru?
          </p>
          <div className="grid gap-2">
            {DELETION_REASONS.map((item) => {
              const active =
                deleteReason === item.label || deleteReason === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onReason(item.label)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                    active
                      ? "border-rose-300 bg-rose-50 text-rose-950"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {deleteReason === "Other" ? (
            <input
              value={deleteOther}
              onChange={(event) => onOther(event.target.value)}
              placeholder="Tell us more"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50"
            />
          ) : null}
          <WizardNav
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!finalDeleteReason}
            nextLabel="Continue"
            danger
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <label className="block">
            <span className="text-sm font-black text-slate-950">
              Please tell us why you are leaving and what improvements SitGuru
              needs to make to win you back.
            </span>
            <textarea
              value={leaveFeedback}
              onChange={(event) => onFeedback(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-50"
            />
            <span className="mt-1.5 block text-xs font-semibold text-slate-400">
              {leaveFeedback.trim().length}/15 characters minimum
            </span>
          </label>
          <WizardNav
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!canDeleteFeedback}
            nextLabel="Continue"
            danger
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
              <div>
                <p className="text-sm font-black text-rose-950">
                  Permanent data wipe
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-rose-800">
                  This destroys account access and associated personal profile
                  records. Bookings history, messages, referral progress, and
                  payout context tied to this login cannot be restored.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                "Profile & contact details",
                "Saved preferences & alerts",
                "Role dashboards & access",
                "Referral / earnings context",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-bold text-rose-900"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-black text-slate-950">
              Type <span className="font-mono text-rose-700">DELETE</span> to
              confirm
            </span>
            <input
              value={confirmDelete}
              onChange={(event) => onConfirm(event.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm font-black tracking-widest outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50"
            />
          </label>

          <WizardNav
            onBack={onBack}
            onNext={onSubmit}
            nextDisabled={!canHardDelete || busy}
            nextLabel={busy ? "Deleting…" : "Permanently delete"}
            nextIcon={
              busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )
            }
            danger
          />
        </>
      ) : null}
    </div>
  );
}

function StepMeter({
  current,
  total,
  tone = "brand",
}: {
  current: number;
  total: number;
  tone?: "brand" | "danger";
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => {
        const active = index + 1 <= current;
        return (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition ${
              active
                ? tone === "danger"
                  ? "bg-rose-500"
                  : "bg-[#0D5C3A]"
                : "bg-slate-200"
            }`}
          />
        );
      })}
    </div>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  nextIcon,
  danger = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
  nextIcon?: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
          danger
            ? "bg-rose-600 hover:bg-rose-700"
            : "bg-[#0D5C3A] hover:bg-[#09462C]"
        }`}
      >
        {nextLabel}
        {nextIcon || <ArrowRight className="h-4 w-4" />}
      </button>
    </div>
  );
}
