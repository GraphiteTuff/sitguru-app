"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function safeValue(value: string | null, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function NewMessagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const conversationId = safeValue(searchParams.get("conversationId"));
  const recipientId = safeValue(searchParams.get("recipientId"));
  const recipientName = safeValue(searchParams.get("recipientName"), "Recipient");
  const subjectParam = safeValue(searchParams.get("subject"));
  const bookingId = safeValue(searchParams.get("bookingId"));
  const guruId = safeValue(searchParams.get("guruId"));
  const customerId = safeValue(searchParams.get("customerId"));
  const adminMode = safeValue(searchParams.get("admin")) === "true";

  const [subject, setSubject] = useState(subjectParam);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pageTitle = useMemo(() => {
    if (adminMode) return "Start Admin Message";
    if (conversationId) return "Reply to Conversation";
    return "Start New Message";
  }, [adminMode, conversationId]);

  const pageDescription = useMemo(() => {
    if (adminMode) {
      return "Send a private message directly to Admin. Customers are not included in this thread.";
    }

    if (conversationId) {
      return "Continue this conversation and send your next message.";
    }

    return "Create a direct message thread and send your first message.";
  }, [adminMode, conversationId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a message.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          recipientId: recipientId || undefined,
          recipientName: recipientName || undefined,
          subject: trimmedSubject || undefined,
          body: trimmedMessage,
          bookingId: bookingId || undefined,
          guruId: guruId || undefined,
          customerId: customerId || undefined,
          adminMode,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to send message.");
      }

      setSuccess("Message sent successfully.");
      setMessage("");

      const nextConversationId =
        data?.conversationId || conversationId || "";

      if (nextConversationId) {
        router.push(`/messages/${nextConversationId}`);
        return;
      }

      router.push("/messages");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_20%),linear-gradient(180deg,#020617_0%,#0b1220_46%,#020617_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94),rgba(15,23,42,0.96))] shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
              Message Center
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {pageTitle}
            </h1>

            <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
              {pageDescription}
            </p>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    To
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {recipientName || "Recipient"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Conversation
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {conversationId ? "Existing thread" : "New thread"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Enter a subject"
                  className="w-full rounded-[20px] border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write your message here..."
                  rows={8}
                  className="w-full rounded-[20px] border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40"
                />
              </div>

              {error ? (
                <div className="rounded-[20px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">
                  {success}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>

                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Back to Messages
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_20%),linear-gradient(180deg,#020617_0%,#0b1220_46%,#020617_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94),rgba(15,23,42,0.96))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:p-8 lg:p-10">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 rounded bg-white/10" />
            <div className="h-10 w-64 rounded bg-white/10" />
            <div className="h-24 rounded bg-white/10" />
            <div className="h-14 rounded bg-white/10" />
            <div className="h-40 rounded bg-white/10" />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function NewMessagePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewMessagePageContent />
    </Suspense>
  );
}