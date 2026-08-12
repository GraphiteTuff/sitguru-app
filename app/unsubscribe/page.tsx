"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailX } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    token
      ? "Updating your SitGuru email preferences…"
      : "This unsubscribe link is missing a valid token.",
  );

  useEffect(() => {
    if (!token) return;

    let active = true;

    async function run() {
      try {
        const response = await fetch("/api/email-updates/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const result = (await response.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          message?: string;
        } | null;

        if (!active) return;

        if (!response.ok || !result?.ok) {
          setStatus("error");
          setMessage(
            result?.error || "We couldn’t update your preference right now.",
          );
          return;
        }

        setStatus("success");
        setMessage(
          result.message ||
            "You’ve been unsubscribed from SitGuru email updates.",
        );
      } catch {
        if (!active) return;
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#effaf3_56%,#ffffff_100%)] px-4 py-16 text-slate-950">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          {status === "loading" ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : status === "success" ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <MailX className="h-6 w-6" />
          )}
        </div>

        <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950">
          Email updates
        </h1>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {message}
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            href="/customer/dashboard/profile/notifications"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 py-3 text-sm font-black !text-white transition hover:bg-[#0a4a2e]"
          >
            Manage in My Account
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
          >
            Back to SitGuru
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#effaf3_56%,#ffffff_100%)] px-4 py-16">
          <div className="mx-auto max-w-lg rounded-[2rem] border border-emerald-100 bg-white p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-700" />
          </div>
        </main>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
