"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("otp") ||
    normalized.includes("token")
  ) {
    return "This reset link has expired or was already used. No worries — request a fresh link and we’ll get you right back in.";
  }

  if (normalized.includes("session")) {
    return "We could not confirm this reset session. Please request a fresh reset link.";
  }

  return message || "We could not verify this reset link. Please request a new one.";
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = useMemo(() => {
    return (
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword
    );
  }, [password, confirmPassword]);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      setCheckingSession(true);
      setError("");

      try {
        const { supabase } = await import("@/lib/supabase");

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
            "This page needs a fresh password reset email link. Request a new link and we’ll help you get back into SitGuru.",
          );
          return;
        }

        setHasRecoverySession(true);
      } catch {
        if (!mounted) return;

        setHasRecoverySession(false);
        setError(
          "We could not check your reset session. Please request a new reset link.",
        );
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

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
      const { supabase } = await import("@/lib/supabase");

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
    <main className="min-h-screen bg-[#f3f8f5] px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="bg-gradient-to-br from-green-950 via-emerald-800 to-emerald-600 p-8 text-white sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100">
              SitGuru Account Care
            </p>

            <h1 className="mt-8 max-w-sm text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              Let’s get you back in.
            </h1>

            <p className="mt-5 max-w-md text-base font-bold leading-7 text-white/90">
              Create a new password and continue using SitGuru with peace of
              mind.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-2xl">🐾</p>
                <p className="mt-3 text-sm font-black text-white">
                  Pet Parent friendly
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-2xl">🛡️</p>
                <p className="mt-3 text-sm font-black text-white">
                  Secure and simple
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5">
              <p className="text-sm font-black text-white">
                Your account stays protected.
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/85">
                After your password is updated, we’ll sign you out and let you
                choose the right SitGuru login.
              </p>
            </div>
          </section>

          <section className="p-8 sm:p-10 lg:p-12">
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

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Create your new password"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-black text-slate-800"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Confirm your new password"
                      required
                    />
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
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-green-800">
                      {message}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Updating password..." : "Update My Password"}
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
          </section>
        </div>
      </div>
    </main>
  );
}