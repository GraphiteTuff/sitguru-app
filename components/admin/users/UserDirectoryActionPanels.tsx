"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import {
  useUserModerationActions,
  type UseUserModerationActionsResult,
} from "@/hooks/useUserModerationActions";
import type { DirectoryUserContext } from "@/lib/admin/user-directory-actions";

type PanelsProps = {
  selectedUser?: DirectoryUserContext | null;
  /** Pass shared hook result from a parent provider to avoid duplicate state. */
  actions?: UseUserModerationActionsResult;
  className?: string;
};

function ActionButton({
  label,
  description,
  toneClass,
  actionKey,
  pendingKey,
  feedbackStatus,
  disabled,
  onClick,
}: {
  label: string;
  description?: string;
  toneClass: string;
  actionKey: string;
  pendingKey: string | null;
  feedbackStatus: "idle" | "pending" | "success" | "error";
  disabled?: boolean;
  onClick: () => void;
}) {
  const isActive = pendingKey === actionKey;
  const isPending = isActive && feedbackStatus === "pending";
  const isSuccess = isActive && feedbackStatus === "success";
  const displayLabel = isPending
    ? "Working…"
    : isSuccess
      ? "Opening…"
      : label;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={isPending || isSuccess}
      aria-live={isActive ? "polite" : undefined}
      className={[
        "flex w-full flex-col items-stretch rounded-2xl border px-4 py-3 text-left text-sm font-black transition duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        "active:scale-[0.985]",
        toneClass,
        isActive
          ? "ring-2 ring-offset-2 ring-emerald-400 shadow-md scale-[0.99]"
          : "",
        disabled && !isActive ? "opacity-45" : "",
        isPending ? "opacity-95" : "",
        isSuccess ? "opacity-100" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="inline-flex items-center gap-2">
        {isPending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : null}
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
        <span>{displayLabel}</span>
      </span>
      {description ? (
        <span className="mt-1 text-xs font-semibold leading-5 opacity-80">
          {isActive && (isPending || isSuccess)
            ? isPending
              ? "Updating instantly — finishing in the background…"
              : "Done — redirecting now…"
            : description}
        </span>
      ) : null}
    </button>
  );
}

function TrustReviewOverlay({
  actions,
}: {
  actions: UseUserModerationActionsResult;
}) {
  if (!actions.trustOverlayOpen) return null;

  const user = actions.selectedUser;
  const name = user?.name || user?.email || "Selected user";
  const status = actions.feedback.status;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trust-review-title"
    >
      <div className="w-full max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">
              Secure moderation
            </p>
            <h3
              id="trust-review-title"
              className="mt-2 text-2xl font-black tracking-tight text-slate-950"
            >
              Fraud / Trust Review
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Open a secure review context for{" "}
              <span className="font-black text-slate-900">{name}</span>.
              You can inspect fraud signals first, or suspend the account into
              the trust pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={actions.closeTrustOverlay}
            disabled={actions.busy && Boolean(actions.pendingKey?.startsWith("trust:"))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close trust review"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <ActionButton
            label="Open moderation context"
            description="Does not change account status. Routes into Moderation with this user attached."
            toneClass="border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 focus-visible:ring-sky-300"
            actionKey="trust:open"
            pendingKey={actions.pendingKey}
            feedbackStatus={status}
            disabled={Boolean(
              actions.pendingKey?.startsWith("trust:") &&
                actions.feedback.status === "pending",
            )}
            onClick={() => void actions.confirmTrustReview("open")}
          />
          <ActionButton
            label="Flag & suspend for trust review"
            description="Sets account_status to suspended and logs a lifecycle event, then opens Moderation."
            toneClass="border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 focus-visible:ring-rose-300"
            actionKey="trust:flag_suspend"
            pendingKey={actions.pendingKey}
            feedbackStatus={status}
            disabled={Boolean(
              actions.pendingKey?.startsWith("trust:") &&
                actions.feedback.status === "pending",
            )}
            onClick={() =>
              void actions.confirmTrustReview(
                "flag_suspend",
                "Fraud / trust review flagged from Admin User Directory.",
              )
            }
          />
          <button
            type="button"
            onClick={actions.closeTrustOverlay}
            disabled={Boolean(
              actions.pendingKey?.startsWith("trust:") &&
                actions.feedback.status === "pending",
            )}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserDirectoryActionPanels({
  selectedUser,
  actions: sharedActions,
  className = "",
}: PanelsProps) {
  const localActions = useUserModerationActions({
    selectedUser: selectedUser || null,
  });
  const actions = sharedActions || localActions;
  const status = actions.feedback.status;

  const contextLabel = actions.selectedUser
    ? `Scoped to ${actions.selectedUser.name || actions.selectedUser.email || "selected user"}`
    : "No user selected — starts admin / department threads";

  return (
    <aside className={`space-y-5 ${className}`.trim()}>
      <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
          Communication Actions
        </p>
        <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
          Directory-powered messaging.
        </h3>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
          Instantly provision an admin thread with the correct department tag,
          then open the Message Center conversation.
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          {contextLabel}
        </p>

        <div className="mt-5 space-y-3" aria-live="polite">
          <ActionButton
            label={actions.internalAction.label}
            description={actions.internalAction.description}
            toneClass={actions.internalAction.toneClass}
            actionKey="internal"
            pendingKey={actions.pendingKey}
            feedbackStatus={status}
            disabled={actions.busy}
            onClick={() => void actions.startInternalMessage()}
          />

          {actions.departmentActions.map((department) => (
            <ActionButton
              key={department.key}
              label={`Message ${department.label}`}
              description={department.description}
              toneClass={department.toneClass}
              actionKey={`department:${department.key}`}
              pendingKey={actions.pendingKey}
              feedbackStatus={status}
              disabled={actions.busy}
              onClick={() => void actions.messageDepartment(department.key)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
          Moderation
        </p>
        <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
          Account actions.
        </h3>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
          Jump into Guru approvals, the Message Center, or a secure fraud / trust
          review pipeline without duplicating handlers per layout.
        </p>

        <div className="mt-5 space-y-3" aria-live="polite">
          <ActionButton
            label="Review Guru Applications"
            description="Opens the Guru approvals queue."
            toneClass="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-300"
            actionKey="guru_approvals"
            pendingKey={actions.pendingKey}
            feedbackStatus={status}
            disabled={actions.busy}
            onClick={actions.openGuruApprovals}
          />
          <ActionButton
            label="Open Message Center"
            description="Opens the Admin Message Center inbox."
            toneClass="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 focus-visible:ring-sky-300"
            actionKey="message_center"
            pendingKey={actions.pendingKey}
            feedbackStatus={status}
            disabled={actions.busy}
            onClick={actions.openMessageCenter}
          />
          <ActionButton
            label="Fraud / Trust Review"
            description={
              actions.selectedUser?.id
                ? "Opens a secure overlay for this account."
                : "Opens the Fraud Detection workspace."
            }
            toneClass="border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 focus-visible:ring-rose-300"
            actionKey="fraud_trust_review"
            pendingKey={actions.pendingKey}
            feedbackStatus={status}
            disabled={actions.busy}
            onClick={actions.openFraudTrustReview}
          />
        </div>
      </section>

      {actions.feedback.message ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            actions.feedback.status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : actions.feedback.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {actions.feedback.status === "pending" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {actions.feedback.status === "success" ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : null}
            {actions.feedback.message}
          </span>
        </div>
      ) : null}

      <TrustReviewOverlay actions={actions} />
    </aside>
  );
}

export default UserDirectoryActionPanels;
