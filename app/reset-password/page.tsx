"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setError(
          "Password reset session missing or expired. Request a new reset link."
        );
      }

      setCheckingSession(false);
    }

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

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

    const { error } = await supabase.auth.updateUser({
      password: cleanPassword,
    });

    if (error) {
      setError(error.message || "Could not update password.");
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully. Redirecting to customer login...");
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_26%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold text-emerald-300">
              SitGuru Access
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Enter your new password below.
            </p>
          </div>

          {checkingSession ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Checking your reset session...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  New password
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Confirm new password
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || checkingSession}
                className="w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {loading ? "Updating password..." : "Update password"}
              </button>
            </form>
          )}

          <div className="mt-6 space-y-2">
            <Link
              href="/forgot-password"
              className="block text-sm font-semibold text-emerald-300 hover:underline"
            >
              Request a new reset link
            </Link>

            <Link
              href="/login"
              className="block text-sm font-semibold text-emerald-300 hover:underline"
            >
              Back to customer login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}