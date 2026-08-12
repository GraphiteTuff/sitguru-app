"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

type EmailUpdatesSignupProps = {
  source?: string;
  className?: string;
};

export default function EmailUpdatesSignup({
  source = "footer",
  className = "",
}: EmailUpdatesSignupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/email-updates/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        message?: string;
      } | null;

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.error || "Unable to save your email preference right now.",
        );
      }

      setDone(true);
      setMessage(
        result.message || "You’re signed up for SitGuru email updates.",
      );
      setEmail("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-3xl border border-emerald-100 bg-emerald-50/90 p-5 sm:p-6 ${className}`}
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
        <Mail className="h-3.5 w-3.5" />
        Email updates
      </div>

      <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-slate-950">
        Don’t miss out!
      </h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Sign up for our email updates to receive the latest news, exclusive
        offers, and special announcements straight to your inbox. You can manage
        your preferences or unsubscribe anytime through{" "}
        <Link
          href="/customer/dashboard/profile/notifications"
          className="font-black text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
        >
          My Account
        </Link>{" "}
        or by clicking the unsubscribe link in our emails.
      </p>

      {done ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="sr-only">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          {error ? (
            <p className="text-sm font-bold text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[#0a4a2e] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign up for email updates
          </button>
        </form>
      )}
    </div>
  );
}
