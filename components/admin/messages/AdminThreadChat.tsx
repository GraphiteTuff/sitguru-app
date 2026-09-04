"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import AdminQueueCardActions from "@/components/admin/AdminQueueCardActions";
import { useVisualViewportInset } from "@/lib/hooks/use-visual-viewport-inset";
import type { AdminChatMessage, AdminSelectedThread } from "./types";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SG"
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        src={src}
        className="h-10 w-10 shrink-0 rounded-full border border-green-100 bg-white object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0D5C3A] text-[11px] font-black text-white">
      {initials(name)}
    </div>
  );
}

function formatStamp(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminThreadChat({
  thread,
  inboxHref,
}: {
  thread: AdminSelectedThread;
  inboxHref: string;
}) {
  const router = useRouter();
  const keyboardInset = useVisualViewportInset();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<AdminChatMessage[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = [
    ...thread.messages,
    ...optimistic.filter(
      (item) => !thread.messages.some((existing) => existing.id === item.id),
    ),
  ];

  useEffect(() => {
    setOptimistic([]);
  }, [thread.id]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, thread.id, keyboardInset]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (body.length < 2 || pending) return;

    setPending(true);
    setError("");

    const optimisticId = `local-${Date.now()}`;
    setOptimistic((current) => [
      ...current,
      {
        id: optimisticId,
        body,
        createdAt: new Date().toISOString(),
        isAdmin: true,
        senderName: "SitGuru Admin",
        senderAvatar: "/images/sitguru-message-avatar.jpg",
        senderRole: "admin",
      },
    ]);
    setDraft("");

    try {
      const response = await fetch("/api/admin/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          conversationId: thread.id,
          body,
          topic: thread.topic || "direct_message",
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        setOptimistic((current) => current.filter((item) => item.id !== optimisticId));
        setDraft(body);
        setError(payload?.error || "Message could not be sent.");
        return;
      }

      router.refresh();
    } catch {
      setOptimistic((current) => current.filter((item) => item.id !== optimisticId));
      setDraft(body);
      setError("Message could not be sent.");
    } finally {
      setPending(false);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <section
      className="flex min-h-0 flex-1 flex-col bg-white"
      style={{ paddingBottom: keyboardInset }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-[#e5ebe2] px-2 py-2 sm:gap-3 sm:px-4">
        <a
          href={inboxHref}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-green-800 lg:hidden"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={22} />
        </a>
        <Avatar name={thread.title} src={thread.avatar} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-black text-slate-950">
            {thread.title}
          </h2>
          <p className="truncate text-xs font-semibold text-slate-500">
            {thread.subtitle}
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">
          <AdminQueueCardActions
            compact
            conversationId={thread.id}
            threadSubject={thread.title}
          />
        </div>
        <details className="relative shrink-0 sm:hidden">
          <summary className="flex h-12 w-12 list-none items-center justify-center rounded-2xl text-lg font-black text-slate-500 [&::-webkit-details-marker]:hidden">
            ···
          </summary>
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-2xl border border-[#e5ebe2] bg-white p-2 shadow-lg">
            <AdminQueueCardActions
              compact
              conversationId={thread.id}
              threadSubject={thread.title}
            />
          </div>
        </details>
      </header>

      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
            No messages yet. Send the first reply.
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${message.isAdmin ? "justify-end" : "justify-start"}`}
              >
                {message.isAdmin ? null : (
                  <Avatar name={message.senderName} src={message.senderAvatar} />
                )}
                <div
                  className={`max-w-[min(88%,28rem)] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    message.isAdmin
                      ? "rounded-br-md bg-[#0D5C3A] text-white"
                      : "rounded-bl-md border border-[#e5ebe2] bg-[#f7faf6] text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-[15px] font-semibold leading-6">
                    {message.body}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-bold ${
                      message.isAdmin ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {message.senderName} · {formatStamp(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-[#e5ebe2] bg-[#fbfcf9] px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        {error ? (
          <p className="mb-2 text-xs font-bold text-rose-700">{error}</p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                if (window.matchMedia("(pointer: coarse)").matches) return;
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            enterKeyHint="send"
            placeholder={`Message ${thread.title}`}
            className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-[#d7e4da] bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
          />
          <button
            type="submit"
            disabled={pending || draft.trim().length < 2}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D5C3A] text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
