"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent,
  useMemo,
  useState,
  useTransition,
} from "react";

type MessageThreadComposerProps = {
  conversationId: string;
  currentUserId: string;
  currentTopic?: string | null;
};

type SendMessageResponse = {
  ok?: boolean;
  error?: string;
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

export default function MessageThreadComposer({
  conversationId,
  currentUserId,
  currentTopic,
}: MessageThreadComposerProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState(normalizeTopic(currentTopic));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const trimmedMessage = useMemo(() => message.trim(), [message]);

  const isDisabled =
    isPending || !trimmedMessage || !conversationId || !currentUserId;

  async function sendMessage() {
    if (isDisabled) return;

    setError("");

    try {
      const response = await fetch("/api/messages/send", {
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

      const data =
        (await response.json().catch(() => null)) as SendMessageResponse | null;

      if (!response.ok) {
        setError(data?.error || "Unable to send message.");
        return;
      }

      setMessage("");

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
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
          htmlFor="message-topic"
          className="mb-3 block text-sm font-black uppercase tracking-[0.18em] text-emerald-600"
        >
          Topic
        </label>

        <select
          id="message-topic"
          name="topic"
          value={topic}
          onChange={(event) => {
            setTopic(event.target.value);
            if (error) setError("");
          }}
          disabled={isPending}
          className="w-full rounded-[1.35rem] border border-emerald-100 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {topicOptions.map((option) => (
            <option
              key={option}
              value={option}
              className="bg-white text-slate-950"
            >
              {option}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs font-semibold text-slate-500">
          Choose the topic that best matches this message so SitGuru can route
          and review it faster.
        </p>
      </div>

      <div>
        <label
          htmlFor="message-body"
          className="mb-3 block text-sm font-black uppercase tracking-[0.18em] text-emerald-600"
        >
          Message
        </label>

        <textarea
          id="message-body"
          name="message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleMessageKeyDown}
          placeholder="Write a clear, friendly message..."
          rows={5}
          disabled={isPending}
          className="w-full rounded-[1.35rem] border border-emerald-100 bg-white px-5 py-4 text-base font-semibold leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        />

        <p className="mt-2 text-xs font-semibold text-slate-500">
          Press Enter to send. Press Shift + Enter for a new line.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Keep communication clear, friendly, and specific. Include dates,
          booking details, profile issues, or verification questions when
          helpful.
        </p>

        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex min-w-[140px] items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-base font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send message"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}
    </form>
  );
}