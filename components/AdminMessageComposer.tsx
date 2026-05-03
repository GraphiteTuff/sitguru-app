"use client";

import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useMemo,
  useState,
  useTransition,
} from "react";

type AdminMessageComposerProps = {
  conversationId: string;
  currentTopic?: string | null;
};

type SendAdminMessageResponse = {
  ok?: boolean;
  error?: string;
  details?: string;
  message?: unknown;
  conversationId?: string;
  topic?: string;
};

const topicOptions = [
  "Application Question",
  "Profile Help",
  "Background Check",
  "Identity Verification",
  "Stripe / Payout Setup",
  "Booking Question",
  "Customer Issue",
  "Safety Concern",
  "Payment or Refund Question",
  "Technical Issue",
  "Admin Follow-Up",
  "Approval Update",
  "Account Support",
  "Other",
];

function normalizeTopic(value?: string | null) {
  const topic = String(value || "").trim();

  if (!topic) return "Other";

  const matchedTopic = topicOptions.find(
    (option) => option.toLowerCase() === topic.toLowerCase(),
  );

  return matchedTopic || "Other";
}

function cleanErrorText(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "Unable to send admin message.";

  if (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.includes("__NEXT_DATA__")
  ) {
    return "The Admin send API route was not found or returned a webpage instead of JSON. Confirm this file exists: app/api/admin/messages/send/route.ts, then restart npm run dev.";
  }

  return trimmed;
}

export default function AdminMessageComposer({
  conversationId,
  currentTopic,
}: AdminMessageComposerProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState(normalizeTopic(currentTopic));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const trimmedMessage = useMemo(() => message.trim(), [message]);

  const isDisabled =
    isPending || !trimmedMessage || !conversationId || !topic.trim();

  async function sendMessage() {
    if (isDisabled) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          conversationId,
          body: trimmedMessage,
          topic,
        }),
      });

      const responseText = await response.text();

      let data: SendAdminMessageResponse | null = null;

      try {
        data = responseText
          ? (JSON.parse(responseText) as SendAdminMessageResponse)
          : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const apiError =
          data?.error ||
          data?.details ||
          responseText ||
          `Admin message request failed with status ${response.status}.`;

        setError(cleanErrorText(apiError));
        return;
      }

      if (!data?.ok) {
        setError(
          cleanErrorText(
            data?.error ||
              data?.details ||
              responseText ||
              "Admin message did not confirm as sent.",
          ),
        );
        return;
      }

      setMessage("");
      setSuccess("Admin message sent.");

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? cleanErrorText(err.message)
          : "Unable to send admin message because the request failed.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  async function handleMessageKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter") return;

    if (event.shiftKey) return;

    event.preventDefault();
    await sendMessage();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-[28px] border border-[#e3ece5] bg-[#fbfcf9] p-4 sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-green-800 shadow-sm">
              <Sparkles size={14} />
              SitGuru Admin Reply
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Send a clear admin response connected to this message thread.
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white px-4 py-3 text-xs font-black text-green-900 shadow-sm">
            Enter sends · Shift + Enter adds a line
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="admin-message-topic"
              className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-green-700"
            >
              Topic / Subject
            </label>

            <select
              id="admin-message-topic"
              name="topic"
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
                if (error) setError("");
                if (success) setSuccess("");
              }}
              disabled={isPending}
              className="h-14 w-full rounded-2xl border border-green-100 bg-white px-4 text-base font-black text-slate-900 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {topicOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              Choose the topic so Gurus and customers know exactly what SitGuru
              is contacting them about.
            </p>
          </div>

          <div>
            <label
              htmlFor="admin-message-body"
              className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-green-700"
            >
              Admin Message
            </label>

            <textarea
              id="admin-message-body"
              name="body"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                if (error) setError("");
                if (success) setSuccess("");
              }}
              onKeyDown={handleMessageKeyDown}
              placeholder="Write your Admin reply..."
              rows={7}
              disabled={isPending}
              className="w-full resize-y rounded-[24px] border border-green-100 bg-white px-5 py-4 text-base font-semibold leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-70"
            />

            <p className="mt-2 text-xs font-semibold text-slate-500">
              The message will be saved to the current conversation and shown in
              the thread after refresh.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-900">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-900">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Replies are sent as SitGuru Admin and use the Message Center admin
          avatar.
        </p>

        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex min-w-[165px] items-center justify-center gap-2 rounded-2xl bg-green-800 px-6 py-3 text-base font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  );
}
