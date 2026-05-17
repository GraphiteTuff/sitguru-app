"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

function getResetRedirectUrl() {
  if (typeof window === "undefined") {
    return "https://www.sitguru.com/reset-password";
  }

  return `${window.location.origin}/reset-password`;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetRedirectUrl = useMemo(() => getResetRedirectUrl(), []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: resetRedirectUrl,
      },
    );

    if (resetError) {
      setError(
        resetError.message ||
          "We could not send the reset email. Please try again.",
      );
      setLoading(false);
      return;
    }

    setMessage(
      "If an account exists for that email, a password reset link has been sent. Please check your inbox, spam, junk, and promotions folders.",
    );
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold text-emerald-600">
              SitGuru Access
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Forgot password
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enter the email connected to your SitGuru account and we’ll send
              you a secure link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            This reset page works for Pet Parents, Gurus, Future Gurus,
            Ambassadors, and Admin/Super User accounts.
          </div>

          <div className="mt-5 space-y-2">
            <Link
              href="/login"
              className="block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Back to customer login
            </Link>

            <Link
              href="/guru/login"
              className="block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Back to Guru login
            </Link>

            <Link
              href="/admin/login"
              className="block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Back to Admin login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}