"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("otp") ||
    normalized.includes("token")
  ) {
    return "This password reset link is expired, invalid, or was already used. Please request a new reset link.";
  }

  if (normalized.includes("session")) {
    return "Your password reset session could not be verified. Please request a new reset link.";
  }

  return message || "Unable to verify your password reset link.";
}

function ResetPasswordLoadingCard() {
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
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl place-items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-xl rounded-[2.25rem] border border-emerald-100 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.13)] sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-green-800">
            <ShieldCheck className="h-4 w-4" />
            Secure Password Reset
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Reset password
          </h1>

          <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-green-800">
            Loading your reset session...
          </div>
        </div>
      </section>
    </main>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      setCheckingSession(true);
      setError("");

      try {
        const code = searchParams.get("code");
        const errorDescription =
          searchParams.get("error_description") ||
          searchParams.get("error") ||
          searchParams.get("error_code");

        if (errorDescription) {
          if (!mounted) return;

          setHasRecoverySession(false);
          setError(getFriendlyAuthError(errorDescription));
          return;
        }

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            if (!mounted) return;

            setHasRecoverySession(false);
            setError(getFriendlyAuthError(exchangeError.message));
            return;
          }

          if (mounted) {
            setHasRecoverySession(true);
          }

          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          setHasRecoverySession(false);
          setError(getFriendlyAuthError(sessionError.message));
          return;
        }

        if (!session) {
          setHasRecoverySession(false);
          setError(
            "Password reset session missing or expired. Please request a new reset link.",
          );
          return;
        }

        setHasRecoverySession(true);
      } catch {
        if (mounted) {
          setHasRecoverySession(false);
          setError("Unable to verify your password reset session.");
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, [searchParams, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!hasRecoverySession) {
      setError(
        "Password reset session missing or expired. Please request a new reset link.",
      );
      return;
    }

    if (!cleanPassword || !cleanConfirmPassword) {
      setError("Please fill out both password fields.");
      return;
    }

    if (cleanPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        setError(updateError.message || "Could not update password.");
        return;
      }

      await supabase.auth.signOut();

      setMessage("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        router.push("/login?status=password-updated");
        router.refresh();
      }, 1200);
    } catch {
      setError("Something went wrong while updating your password.");
    } finally {
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
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl place-items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-xl rounded-[2.25rem] border border-emerald-100 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.13)] sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-green-800">
            <ShieldCheck className="h-4 w-4" />
            Secure Password Reset
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Reset password
          </h1>

          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Enter a new password for your SitGuru account. This works for Pet
            Parents, Gurus, Ambassadors, and Admin/Super User accounts.
          </p>

          {checkingSession ? (
            <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-green-800">
              Checking your reset session...
            </div>
          ) : (
            <>
              {error && !hasRecoverySession ? (
                <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-bold leading-6 text-red-700">
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
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-black text-slate-800"
                    >
                      New Password
                    </label>

                    <div className="flex items-center rounded-2xl border border-emerald-100 bg-[#eef6ff] px-4 py-3 shadow-sm focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100">
                      <Lock className="h-5 w-5 shrink-0 text-slate-400" />

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                        placeholder="Enter new password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="ml-3 rounded-full p-1 text-slate-500 transition hover:bg-white hover:text-green-800"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-black text-slate-800"
                    >
                      Confirm Password
                    </label>

                    <div className="flex items-center rounded-2xl border border-emerald-100 bg-[#eef6ff] px-4 py-3 shadow-sm focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100">
                      <Lock className="h-5 w-5 shrink-0 text-slate-400" />

                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                        placeholder="Confirm new password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        className="ml-3 rounded-full p-1 text-slate-500 transition hover:bg-white hover:text-green-800"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                      {error}
                    </div>
                  ) : null}

                  {message ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-green-800">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      {message}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || checkingSession || !hasRecoverySession}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-[0_12px_30px_rgba(22,101,52,0.22)] transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        Updating password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>
              )}
            </>
          )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoadingCard />}>
      <ResetPasswordContent />
    </Suspense>
  );
}