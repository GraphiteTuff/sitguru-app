"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  LockKeyhole,
  LogIn,
  MessageCircle,
  PawPrint,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const topicOptions = [
  "Booking Question",
  "Pet Care Details",
  "Schedule / Availability",
  "Meet and Greet",
  "Safety Concern",
  "Payment or Refund Question",
  "Technical Issue",
  "Application Question",
  "Profile Help",
  "Background Check",
  "Identity Verification",
  "Stripe / Payout Setup",
  "Customer Issue",
  "Other",
];

function safeValue(value: string | null, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeTopic(value?: string | null) {
  const topic = String(value || "").trim();

  if (!topic) return "Pet Care Details";

  const matchedTopic = topicOptions.find(
    (option) => option.toLowerCase() === topic.toLowerCase(),
  );

  return matchedTopic || "Other";
}

function titleFromSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function NewMessagePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const conversationId = safeValue(searchParams.get("conversationId"));
  const recipientId = safeValue(searchParams.get("recipientId"));
  const guruSlug = safeValue(searchParams.get("guru"));
  const guruId = safeValue(searchParams.get("guruId"));
  const customerId = safeValue(searchParams.get("customerId"));
  const bookingId = safeValue(searchParams.get("bookingId"));
  const subjectParam = safeValue(searchParams.get("subject"));
  const topicParam = safeValue(searchParams.get("topic")) || subjectParam;
  const adminMode = safeValue(searchParams.get("admin")) === "true";

  const derivedGuruName = guruSlug ? titleFromSlug(guruSlug) : "";
  const recipientName = safeValue(
    searchParams.get("recipientName"),
    adminMode ? "SitGuru Admin" : derivedGuruName || "Selected recipient",
  );

  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [topic, setTopic] = useState(normalizeTopic(topicParam));
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const returnTo = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const encodedReturnTo = encodeURIComponent(returnTo);

  const customerLoginHref = `/customer/login?next=${encodedReturnTo}`;
  const signupHref = `/signup?next=${encodedReturnTo}`;

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      setAuthLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setIsLoggedIn(Boolean(user));
      setAuthLoading(false);
    }

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsLoggedIn(Boolean(session?.user));
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const pageTitle = useMemo(() => {
    if (adminMode) return "Message SitGuru Admin";
    if (conversationId) return "Reply to conversation";
    if (guruSlug || guruId) return `Message ${recipientName}`;
    return "Start a new message";
  }, [adminMode, conversationId, guruId, guruSlug, recipientName]);

  const pageDescription = useMemo(() => {
    if (!isLoggedIn && !authLoading) {
      if (guruSlug || guruId) {
        return `Log in or create a free customer account so ${recipientName} can reply to you inside SitGuru.`;
      }

      return "Log in or create a free customer account so your message thread has a private inbox.";
    }

    if (adminMode) {
      return "Send a private message to SitGuru support about bookings, account help, safety, or platform questions.";
    }

    if (conversationId) {
      return "Continue the conversation and keep care details organized in one place.";
    }

    if (guruSlug || guruId) {
      return "Ask a question before booking, share care details, or confirm availability with this Guru.";
    }

    return "Create a message thread and send your first message.";
  }, [
    adminMode,
    authLoading,
    conversationId,
    guruId,
    guruSlug,
    isLoggedIn,
    recipientName,
  ]);

  const backHref = guruSlug ? `/guru/${guruSlug}` : "/messages";
  const backLabel = guruSlug ? "Back to Guru Profile" : "Back to Messages";

  const isDisabled = isSubmitting || !message.trim();

  async function sendMessage() {
    setError("");
    setSuccess("");

    const trimmedMessage = message.trim();

    if (!isLoggedIn) {
      setError("Please log in or create a free customer account to send this message.");
      return;
    }

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
          subject: topic,
          topic,
          body: trimmedMessage,
          bookingId: bookingId || undefined,
          guruId: guruId || undefined,
          guruSlug: guruSlug || undefined,
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

      const nextConversationId = data?.conversationId || conversationId || "";

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  async function handleMessageKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter") return;

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    await sendMessage();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#ecfdf5_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/messages"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Messages
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
            >
              Find a Guru
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 shadow-sm ring-1 ring-white/70">
                <MessageCircle className="h-4 w-4" />
                SitGuru Message Center
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-6xl">
                {pageTitle}
              </h1>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-700 md:text-lg">
                {pageDescription}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-5 py-3 text-sm font-black text-slate-900 shadow-sm ring-1 ring-white/80">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Private message
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-5 py-3 text-sm font-black text-slate-900 shadow-sm ring-1 ring-white/80">
                  <PawPrint className="h-4 w-4 text-emerald-600" />
                  Pet care friendly
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-3xl">
                  💬
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                    Recipient
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {recipientName}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-600">
                    {conversationId ? "Existing conversation" : "New message"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  Ask about availability, services, or care expectations.
                </div>

                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  Share pet routines, allergies, behavior notes, or access info.
                </div>

                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  Keep all messages organized in SitGuru.
                </div>
              </div>
            </div>
          </div>
        </section>

        {authLoading ? (
          <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-44 rounded bg-emerald-100" />
              <div className="h-10 w-80 max-w-full rounded bg-slate-100" />
              <div className="h-24 rounded bg-slate-100" />
              <div className="h-14 rounded bg-slate-100" />
            </div>
          </section>
        ) : !isLoggedIn ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-emerald-600" />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Login required
                  </p>
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  Why do customers need to log in?
                </h2>

                <div className="mt-5 grid gap-3">
                  {[
                    "Brad needs to know which customer sent the message.",
                    "Replies need to appear in your private customer inbox.",
                    "SitGuru keeps conversations connected to bookings and pet care details.",
                    "This helps prevent spam and keeps the platform safer.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-base font-black text-slate-950">
                      Your message is private
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                      After you log in, SitGuru can create a secure conversation
                      between your customer account and {recipientName}.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Sign in to continue
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    Log in to message {recipientName}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    To make sure {recipientName} can reply, your message must be
                    connected to a customer account.
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 ring-1 ring-emerald-100">
                  Customer account needed
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-emerald-100">
                    💬
                  </div>

                  <div>
                    <p className="text-lg font-black text-slate-950">
                      Message draft starts after login
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                      You’ll return to this same message page after logging in or
                      signing up, then you can send your message to{" "}
                      {recipientName}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={customerLoginHref}
                  className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  <LogIn className="h-4 w-4" />
                  Customer Login
                </Link>

                <Link
                  href={signupHref}
                  className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up Free
                </Link>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={backHref}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-50"
                >
                  {backLabel}
                </Link>

                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-50"
                >
                  Back to Find a Guru
                </Link>
              </div>
            </section>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Helpful starters
                  </p>
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  Not sure what to say?
                </h2>

                <div className="mt-5 grid gap-3">
                  {[
                    "Hi! Are you available for the date I’m considering?",
                    "Can you tell me more about your experience with my pet’s needs?",
                    "My pet has a specific routine. Can I share the care notes here?",
                    "Do you offer meet-and-greet options before booking?",
                  ].map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => {
                        setMessage((current) =>
                          current.trim()
                            ? `${current.trim()}\n\n${starter}`
                            : starter,
                        );
                        if (error) setError("");
                      }}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-bold leading-6 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-base font-black text-slate-950">
                      Messaging tip
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                      Include your pet’s name, requested date, service type, and
                      any care notes that help the Guru understand what you need.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Message details
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    Send your message
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    This starts a private SitGuru thread.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                  {conversationId ? "Existing thread" : "New thread"}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      To
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {recipientName}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      Conversation
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {conversationId ? "Existing thread" : "New thread"}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="topic"
                    className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-emerald-700"
                  >
                    Topic
                  </label>

                  <select
                    id="topic"
                    value={topic}
                    onChange={(event) => {
                      setTopic(event.target.value);
                      if (error) setError("");
                    }}
                    disabled={isSubmitting}
                    className="min-h-[56px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {topicOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Choose the topic that best matches your message so SitGuru
                    can route it faster.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-emerald-700"
                  >
                    Message
                  </label>

                  <textarea
                    id="message"
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      if (error) setError("");
                    }}
                    onKeyDown={handleMessageKeyDown}
                    placeholder="Write your message here..."
                    rows={9}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Press Enter to send. Press Shift + Enter for a new line.
                  </p>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    {success}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isDisabled}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>

                  <Link
                    href="/messages"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-50"
                  >
                    Back to Messages
                  </Link>
                </div>
              </form>
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#ecfdf5_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-36 rounded bg-emerald-100" />
            <div className="h-12 w-72 rounded bg-slate-100" />
            <div className="h-24 rounded bg-slate-100" />
            <div className="h-14 rounded bg-slate-100" />
            <div className="h-44 rounded bg-slate-100" />
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