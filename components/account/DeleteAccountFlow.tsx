"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const deletionReasons = [
  "I no longer need SitGuru",
  "I found another service",
  "I had a bad experience",
  "I’m concerned about privacy",
  "I’m receiving too many emails",
  "I’m having trouble with my account",
  "I’m a Guru and no longer want to offer services",
  "Other",
];

type DeleteAccountFlowProps = {
  isGuru?: boolean;
};

export default function DeleteAccountFlow({
  isGuru = false,
}: DeleteAccountFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [understandsPermanent, setUnderstandsPermanent] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const finalReason = useMemo(() => {
    if (reason === "Other") return otherReason.trim();
    return reason;
  }, [reason, otherReason]);

  const canContinueToStepTwo = finalReason.length > 0;
  const canContinueToStepThree = understandsPermanent;
  const canDelete = confirmationText === "DELETE" && finalReason.length > 0;

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

  async function handleDeactivate() {
    setErrorMessage("");
    setStatusMessage("");
    setIsDeactivating(true);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/account/deactivate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to deactivate your account.");
      }

      setStatusMessage(
        "Your account has been deactivated. You can contact SitGuru support if you want to return.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to deactivate your account.",
      );
    } finally {
      setIsDeactivating(false);
    }
  }

  async function handleDelete() {
    setErrorMessage("");
    setStatusMessage("");
    setIsDeleting(true);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: finalReason,
          feedback: feedback.trim(),
          confirmationText,
          understandsPermanent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete your account.");
      }

      await supabase.auth.signOut();

      setStatusMessage(
        "Your account deletion request has been completed. You have been signed out.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete your account.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          Advanced account options
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
          Manage deactivation or deletion
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          We’re sorry to see you go. Before permanent deletion, SitGuru gives
          you safer options like pausing Guru services or deactivating your
          account temporarily.
        </p>
      </div>

      {statusMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {isGuru ? (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
            <h2 className="text-lg font-black text-emerald-900">
              Pause Guru services
            </h2>
            <p className="mt-2 text-sm leading-6 text-emerald-800">
              Hide your Guru profile from new requests while keeping your
              SitGuru account active.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              Pause services
            </button>
          </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-black text-slate-950">
            Deactivate account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Temporarily disable your SitGuru account without permanently
            deleting it.
          </p>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={isDeactivating}
            className="mt-4 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeactivating ? "Deactivating..." : "Deactivate instead"}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-slate-950">
            Permanent deletion
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Continue only if you want to permanently delete your account.
          </p>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-4 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            Continue to deletion options
          </button>
        </div>
      </div>

      {step >= 2 ? (
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
            Help us understand why you’re leaving
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {deletionReasons.map((item) => (
              <label
                key={item}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  reason === item
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-emerald-200"
                }`}
              >
                <input
                  type="radio"
                  name="deletionReason"
                  value={item}
                  checked={reason === item}
                  onChange={() => setReason(item)}
                  className="mt-1"
                />
                <span className="text-sm font-semibold leading-5 text-slate-700">
                  {item}
                </span>
              </label>
            ))}
          </div>

          {reason === "Other" ? (
            <div className="mt-4">
              <label
                htmlFor="otherReason"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Please tell us why
              </label>
              <input
                id="otherReason"
                value={otherReason}
                onChange={(event) => setOtherReason(event.target.value)}
                className="input w-full"
                placeholder="Reason for leaving"
              />
            </div>
          ) : null}

          <div className="mt-4">
            <label
              htmlFor="feedback"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Anything else you’d like us to know?{" "}
              <span className="font-medium text-slate-400">optional</span>
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className="input min-h-28 w-full resize-y"
              placeholder="Share feedback so we can improve SitGuru."
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={!canContinueToStepTwo}
            className="mt-5 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      ) : null}

      {step >= 3 ? (
        <div className="mt-8 rounded-[2rem] border border-rose-200 bg-rose-50 p-5">
          <h2 className="text-xl font-black tracking-[-0.03em] text-rose-950">
            Final deletion confirmation
          </h2>

          <p className="mt-3 text-sm leading-6 text-rose-800">
            Deleting your account is permanent. You will lose access to your
            SitGuru account. Some records may be preserved when required for
            safety, booking history, disputes, tax, or legal reasons.
          </p>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-white p-4">
            <input
              type="checkbox"
              checked={understandsPermanent}
              onChange={(event) =>
                setUnderstandsPermanent(event.target.checked)
              }
              className="mt-1"
            />
            <span className="text-sm font-semibold leading-5 text-rose-900">
              I understand that deleting my account is permanent.
            </span>
          </label>

          {canContinueToStepThree ? (
            <div className="mt-5">
              <label
                htmlFor="deleteConfirmation"
                className="mb-2 block text-sm font-black text-rose-950"
              >
                Type DELETE to permanently delete your account
              </label>
              <input
                id="deleteConfirmation"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                className="input w-full border-rose-200"
                placeholder="DELETE"
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="mt-5 rounded-full bg-rose-600 px-6 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Deleting account..." : "Permanently delete account"}
          </button>
        </div>
      ) : null}
    </section>
  );
}