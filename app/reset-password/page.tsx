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
    return "This password reset link is expired, invalid, or was already used. Please request a new reset link.";
  }

  if (normalized.includes("session")) {
    return "Your password reset session could not be verified. Please request a new reset link.";
  }

  return message || "Unable to verify your password reset link.";
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
    return password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
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
            "Password reset session missing or expired. Please request a new reset link.",
          );
          return;
        }

        setHasRecoverySession(true);
      } catch {
        if (!mounted) return;

        setHasRecoverySession(false);
        setError("Unable to verify your password reset session.");
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
      const { supabase } = await import("@/lib/supabase");

      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        setError(updateError.message || "Could not update password.");
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();

      setMessage("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        router.replace("/login?status=password-updated");
        router.refresh();
      }, 1200);
    } catch {
      setError("Something went wrong while updating your password.");
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
              Reset password
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Create a new password for your SitGuru account.
            </p>
          </div>

          {checkingSession ? (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="m-0 text-sm font-bold leading-6 text-green-900">
                Checking your secure reset session...
              </p>
            </div>
          ) : null}

          {!checkingSession && error && !hasRecoverySession ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-bold leading-6 text-red-700">
              {error}

              <div className="mt-4">
                <Link
                  href="/forgot-password"
                  className="inline-flex rounded-full bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : null}

          {!checkingSession && hasRecoverySession ? (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Enter new password"
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
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              {password && confirmPassword && !passwordsMatch ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  Passwords do not match yet.
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
                {loading ? "Updating password..." : "Update Password"}
              </button>
            </form>
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