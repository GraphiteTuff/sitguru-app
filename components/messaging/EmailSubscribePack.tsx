"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";

type EmailSubscribePackProps = {
  /** Where the pack was shown — defaults to companion chat. */
  source?: string;
};

/**
 * Compact email subscribe form for Pet AI chat bubbles.
 * Posts to the same `/api/email-updates/subscribe` endpoint as the footer signup.
 */
export function EmailSubscribePack({
  source = "companion_chat",
}: EmailSubscribePackProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const impressed = useRef(false);

  useEffect(() => {
    if (impressed.current) return;
    impressed.current = true;
    void trackEvent({
      eventName: "companion_email_subscribe_pack_impression",
      eventType: "engagement",
      role: "visitor",
      source,
      metadata: {
        conversion_surface: "companion_email_subscribe_pack",
        funnel: "email_updates_subscribe",
      },
    });
  }, [source]);

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
      void trackEvent({
        eventName: "companion_email_subscribe_success",
        eventType: "conversion",
        role: "visitor",
        source,
        metadata: {
          conversion_surface: "companion_email_subscribe_pack",
          funnel: "email_updates_subscribe",
        },
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="mt-2 overflow-hidden rounded-2xl border border-[#0D5C3A]/20 bg-white shadow-sm"
      data-analytics-surface="companion_email_subscribe_pack"
    >
      <div className="flex items-center gap-1.5 px-3 pt-2.5">
        <Mail className="h-3.5 w-3.5 text-[#0D5C3A]" aria-hidden />
        <p className="m-0 text-xs font-semibold text-slate-900">
          Email updates
        </p>
      </div>
      <p className="m-0 px-3 pt-0.5 text-[11px] leading-snug text-slate-600">
        News, offers, events, and pack announcements — unsubscribe anytime.
      </p>

      {done ? (
        <div className="mx-3 mb-2.5 mt-2 flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#E8F3EC] px-3 py-2 text-[11px] font-semibold text-[#0D5C3A]">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-1.5 px-3 py-2.5">
          <label className="block">
            <span className="sr-only">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="w-full rounded-full border border-[#0D5C3A]/25 bg-white px-3 py-2 text-[12px] font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/15"
            />
          </label>
          {error ? (
            <p className="text-[11px] font-semibold text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full bg-[#0D5C3A] px-3 py-2 text-[12px] font-semibold !text-white transition hover:bg-[#0a4a2e] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Subscribe with email
          </button>
        </form>
      )}
    </div>
  );
}
