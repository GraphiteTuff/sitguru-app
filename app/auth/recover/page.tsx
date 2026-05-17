"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

function RecoverLoadingCard() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f4] text-slate-950">
      <div className="absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-sky-100/70 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" aria-label="Back to SitGuru homepage">
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={320}
            height={132}
            priority
            className="h-auto w-[140px]"
          />
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl place-items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-xl rounded-[2.25rem] border border-emerald-100 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.13)] sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-green-800">
            <ShieldCheck className="h-4 w-4" />
            SitGuru Account Security
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Checking reset link
          </h1>

          <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-green-800">
            Loading secure recovery page...
          </div>
        </div>
      </section>
    </main>
  );
}

function RecoverPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tokenHash = searchParams.get("token_hash") || "";
  const type = searchParams.get("type") || "recovery";

  const hasRequiredLinkParts = Boolean(tokenHash) && type === "recovery";

  async function handleContinue() {
    if (loading) return;

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
    <main className="min-h-screen overflow-hidden bg-[#f7f8f4] text-slate-950">
      <div className="absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-sky-100/70 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-2xl transition hover:opacity-90"
          aria-label="Back to SitGuru homepage"
        >
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={320}
            height={132}
            priority
            className="h-auto w-[140px]"
          />
        </Link>

        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          New Reset Link
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl place-items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-xl rounded-[2.25rem] border border-emerald-100 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.13)] sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-green-800">
            <ShieldCheck className="h-4 w-4" />
            SitGuru Account Security
          </span>

          <div className="mt-7 flex h-16 w-16 items-center justify-center rounded-3xl bg-green-800 text-white shadow-[0_14px_30px_rgba(22,101,52,0.22)]">
            <LockKeyhole className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Continue password reset
          </h1>

          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            For your security, click the button below to verify this reset link
            and continue to create a new SitGuru password.
          </p>

          <div className="mt-7 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-800" />
              <p className="m-0 text-sm font-bold leading-6 text-green-900">
                This extra step helps protect your account from email preview
                scanners and keeps password resets safer for Pet Parents, Gurus,
                Ambassadors, and Admin/Super User accounts.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-bold leading-6 text-red-700">
              {error}

              <div className="mt-4">
                <Link
                  href="/forgot-password"
                  className="inline-flex rounded-full bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Request a new reset link
                </Link>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading || !hasRequiredLinkParts}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-[0_12px_30px_rgba(22,101,52,0.22)] transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Sparkles className="h-5 w-5 animate-pulse" />
                Verifying reset link...
              </>
            ) : (
              "Continue to Reset Password"
            )}
          </button>

          {!hasRequiredLinkParts ? (
            <p className="mt-4 text-center text-xs font-bold leading-5 text-red-600">
              This link is missing required reset details. Please request a new
              reset link.
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 text-sm font-bold text-slate-500 sm:grid-cols-2">
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
      </section>
    </main>
  );
}

export default function RecoverPasswordPage() {
  return (
    <Suspense fallback={<RecoverLoadingCard />}>
      <RecoverPasswordContent />
    </Suspense>
  );
}