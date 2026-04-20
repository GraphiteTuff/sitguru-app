"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

type MessageThreadComposerProps = {
  conversationId: string;
  currentUserId: string;
};

type SendMessageResponse = {
  ok?: boolean;
  error?: string;
};

export default function MessageThreadComposer({
  conversationId,
  currentUserId,
}: MessageThreadComposerProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const isDisabled =
    isPending || !trimmedMessage || !conversationId || !currentUserId;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isDisabled) return;

    setError("");

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          senderId: currentUserId,
          body: trimmedMessage,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="message-body"
          className="mb-3 block text-sm font-semibold text-white"
        >
          Send message
        </label>

        <textarea
          id="message-body"
          name="message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (error) setError("");
          }}
          placeholder="Write a clear, friendly message..."
          rows={4}
          disabled={isPending}
          className="w-full rounded-[1.35rem] border border-white/10 bg-[rgba(4,14,38,0.92)] px-4 py-4 text-base text-white outline-none transition placeholder:text-slate-400 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm font-medium text-slate-200">
          Keep communication clear, friendly, and specific.
        </p>

        <button
          type="submit"
          disabled={isDisabled}
          className="inline-flex min-w-[122px] items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send message"}
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-rose-300">{error}</p>
      ) : null}
    </form>
  );
}