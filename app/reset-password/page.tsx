"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  HeartHandshake,
  Lock,
  PawPrint,
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
    return "This reset link has expired or was already used. No worries — request a new link and we’ll get you right back in.";
  }

  if (normalized.includes("session")) {
    return "We could not confirm this reset session. Please request a fresh reset link.";
  }

  return message || "We could not verify this reset link. Please request a new one.";
}

export default function ResetPasswordPage() {
  const router = useRouter();
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

  const passwordsMatch = useMemo(() => {
    return (
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword
    );
  }, [password, confirmPassword]);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      setCheckingSession(true);
      setError("");

      try {
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
            "This password reset page needs a fresh email link. Request a new reset link and we’ll help you get back into SitGuru.",
          );
          return;
        }

        setHasRecoverySession(true);
      } catch {
        if (mounted) {
          setHasRecoverySession(false);
          setError(
            "We could not check your reset session. Please request a new reset link.",
          );
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
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!hasRecoverySession) {
      setError(
        "This reset session is missing or expired. Please request a new reset link.",
      );
      return;
    }

    if (!cleanPassword || !cleanConfirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (cleanPassword.length < 8) {
      setError("Please use at least 8 characters for your new password.");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setError("The passwords do not match yet.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        setError(
          updateError.message ||
            "We could not update your password. Please try again.",
        );
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();

      setMessage(
        "You’re all set. Your password was updated successfully. Sending you back to login...",
      );

      setTimeout(() => {
        router.replace("/login?status=password-updated");
        router.refresh();
      }, 1400);
    } catch {
      setError("Something went wrong while updating your password.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f8f5] text-slate-950">
      <div className="absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-emerald-100/80 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-sky-100/70 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-center px-5 py-6 sm:px-8">
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
            className="h-auto w-[145px]"
          />
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl place-items-center px-5 py-10 sm:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.13)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(187,247,208,0.22),_transparent_34%),linear-gradient(135deg,#064e3b_0%,#047857_58%,#059669_100%)] p-8 text-white sm:p-10">
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                SitGuru Account Care
              </span>

              <h1 className="mt-8 max-w-sm text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
                Let’s get you back in.
              </h1>

              <p className="mt-5 max-w-md text-base font-bold leading-7 text-white/90">
                Create a new password and continue using SitGuru with peace of
                mind.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <PawPrint className="h-6 w-6 text-emerald-100" />
                  <p className="mt-3 text-sm font-black text-white">
                    Pet Parent friendly
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <HeartHandshake className="h-6 w-6 text-emerald-100" />
                  <p className="mt-3 text-sm font-black text-white">
                    Guru ready
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-black text-white">
                  Your account stays protected.
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/85">
                  After your password is updated, we’ll sign you out and let you
                  choose the right SitGuru login.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                SitGuru Account Security
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Reset password
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Pick a new password for your SitGuru account. Keep it private,
                memorable, and at least 8 characters.
              </p>

              {checkingSession ? (
                <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-green-800">
                  Checking your secure reset session...
                </div>
              ) : null}

              {!checkingSession && error && !hasRecoverySession ? (
                <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-bold leading-6 text-amber-800">
                  {error}

                  <div className="mt-4">
                    <Link
                      href="/forgot-password"
                      className="inline-flex rounded-full bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                    >
                      Send Me a Fresh Link
                    </Link>
                  </div>
                </div>
              ) : null}

              {!checkingSession && hasRecoverySession ? (
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
                        placeholder="Create your new password"
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
                        placeholder="Confirm your new password"
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

                  {password && confirmPassword && !passwordsMatch ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                      Almost there — the passwords do not match yet.
                    </div>
                  ) : null}

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
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-[0_12px_30px_rgba(22,101,52,0.22)] transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        Updating password...
                      </>
                    ) : (
                      "Update My Password"
                    )}
                  </button>
                </form>
              ) : null}

              <div className="mt-6 grid gap-3 text-sm font-bold sm:grid-cols-2">
                <Link
                  href="/login"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-green-800 transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  Pet Parent Login
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

              <p className="mt-6 text-center text-xs font-bold leading-5 text-slate-400">
                SitGuru keeps password resets simple, secure, and friendly for
                Pet Parents, Gurus, and Admin/Super User accounts.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}