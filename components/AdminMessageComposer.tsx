"use client";

import { useRouter } from "next/navigation";
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
    (option) => option.toLowerCase() === topic.toLowerCase()
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
  const [isPending, startTransition] = useTransition();

  const trimmedMessage = useMemo(() => message.trim(), [message]);

  const isDisabled =
    isPending || !trimmedMessage || !conversationId || !topic.trim();

  async function sendMessage() {
    if (isDisabled) return;

    setError("");

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
              "Admin message did not confirm as sent."
          )
        );
        return;
      }

      setMessage("");

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? cleanErrorText(err.message)
          : "Unable to send admin message because the request failed."
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  async function handleMessageKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key !== "Enter") return;

    if (event.shiftKey) return;

    event.preventDefault();
    await sendMessage();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="admin-message-topic"
          className="mb-3 block text-sm font-black uppercase tracking-[0.18em] !text-emerald-300"
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
          }}
          disabled={isPending}
          className="w-full rounded-[1.35rem] border border-white/10 bg-slate-950 px-4 py-4 text-base font-bold !text-white outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {topicOptions.map((option) => (
            <option
              key={option}
              value={option}
              className="bg-slate-950 text-white"
            >
              {option}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs font-semibold !text-slate-300">
          Choose the topic so Gurus and customers know exactly what SitGuru is
          contacting them about.
        </p>
      </div>

      <div>
        <label
          htmlFor="admin-message-body"
          className="mb-3 block text-sm font-black uppercase tracking-[0.18em] !text-emerald-300"
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
          }}
          onKeyDown={handleMessageKeyDown}
          placeholder="Write your Admin reply..."
          rows={7}
          disabled={isPending}
          className="w-full rounded-[1.35rem] border border-white/10 bg-slate-900/80 px-5 py-4 text-base font-semibold leading-7 !text-white outline-none transition placeholder:!text-slate-300 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        />

        <p className="mt-2 text-xs font-semibold !text-slate-300">
          Press Enter to send. Press Shift + Enter for a new line.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-bold leading-6 !text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-base font-black !text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}