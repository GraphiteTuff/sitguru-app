"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function getFriendlyRecoveryError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("token") ||
    normalized.includes("otp")
  ) {
    return "This password reset link is expired, invalid, or was already used. Please request a new reset link.";
  }

  return message || "Unable to verify your password reset link.";
}

export default function RecoverPasswordPage() {
  const router = useRouter();
  const hasStartedRef = useRef(false);

  const [tokenHash, setTokenHash] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasRequiredLinkParts = useMemo(() => {
    return Boolean(tokenHash) && type === "recovery";
  }, [tokenHash, type]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setTokenHash(params.get("token_hash") || "");
    setType(params.get("type") || "");
  }, []);

  useEffect(() => {
    async function verifyAndContinue() {
      if (hasStartedRef.current) return;

      if (!tokenHash && !type) return;

      hasStartedRef.current = true;
      setLoading(true);
      setError("");

      if (!hasRequiredLinkParts) {
        setError(
          "This password reset link is missing required security details. Please request a new reset link.",
        );
        setLoading(false);
        return;
      }

      try {
        const { supabase } = await import("@/lib/supabase");

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (verifyError) {
          setError(getFriendlyRecoveryError(verifyError.message));
          setLoading(false);
          return;
        }

        router.replace("/reset-password");
        router.refresh();
      } catch {
        setError("Unable to verify your password reset link.");
        setLoading(false);
      }
    }

    verifyAndContinue();
  }, [hasRequiredLinkParts, router, tokenHash, type]);

  async function handleTryAgain() {
    hasStartedRef.current = false;
    setError("");
    setLoading(true);

    try {
      const { supabase } = await import("@/lib/supabase");

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (verifyError) {
        setError(getFriendlyRecoveryError(verifyError.message));
        setLoading(false);
        return;
      }

      router.replace("/reset-password");
      router.refresh();
    } catch {
      setError("Unable to verify your password reset link.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
              SitGuru Account Security
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Opening secure reset page
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              We’re verifying your SitGuru password reset link and taking you to
              the page where you can create a new password.
            </p>
          </div>

          {loading && !error ? (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="m-0 text-sm font-bold leading-6 text-green-900">
                Please wait a moment. Your secure password reset page is opening.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-bold leading-6 text-red-700">
              {error}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {hasRequiredLinkParts ? (
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="inline-flex justify-center rounded-full bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                  >
                    Try Again
                  </button>
                ) : null}

                <Link
                  href="/forgot-password"
                  className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-green-800 transition hover:bg-emerald-50"
                >
                  Request New Link
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 text-sm font-bold sm:grid-cols-2">
            <Link
              href="/login"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-green-800 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              Customer Login
            </Link>

            <Link
              href="/guru/login"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-green-800 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              Guru Login
            </Link>

            <Link
              href="/admin/login"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-green-800 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              Admin Login
            </Link>

            <Link
              href="/forgot-password"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-green-800"
            >
              New Reset Link
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}