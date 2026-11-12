"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Paperclip, Send, Trash2 } from "lucide-react";
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
  canDelete = false,
}: {
  thread: AdminSelectedThread;
  inboxHref: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const keyboardInset = useVisualViewportInset();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState("");
  const [media, setMedia] = useState<{ url: string; mimeType: string; name: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [optimistic, setOptimistic] = useState<AdminChatMessage[]>([]);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = [
    ...thread.messages,
    ...optimistic.filter(
      (item) => !thread.messages.some((existing) => existing.id === item.id),
    ),
  ].filter((item) => !hiddenMessageIds.has(item.id));

  useEffect(() => {
    setOptimistic([]);
    setHiddenMessageIds(new Set());
    setDeletingMessageId(null);
  }, [thread.id]);

  async function deleteMessage(messageId: string) {
    if (!canDelete || !messageId || messageId.startsWith("local-") || deletingMessageId) {
      return;
    }
    const confirmed = window.confirm("Permanently delete this message?");
    if (!confirmed) return;
    setDeletingMessageId(messageId);
    setError("");
    try {
      const response = await fetch("/api/admin/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Delete failed (${response.status}).`);
      }
      setHiddenMessageIds((current) => new Set(current).add(messageId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message delete failed.");
    } finally {
      setDeletingMessageId(null);
    }
  }

  useEffect(() => {
    const conversationId = thread.id.trim();
    if (!conversationId || conversationId.startsWith("direct-message-")) return;

    let cancelled = false;

    void fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ conversationId }),
    })
      .then((response) => {
        if (!response.ok || cancelled) return;
        window.dispatchEvent(new Event("sitguru:messages-refresh"));
        router.refresh();
      })
      .catch(() => {
        // Opening the thread should still work if the read receipt fails.
      });

    return () => {
      cancelled = true;
    };
  }, [thread.id, router]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, thread.id, keyboardInset]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if ((body.length < 1 && media.length === 0) || pending) return;

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
        senderName: "You",
        senderAvatar: "/images/sitguru-message-avatar.jpg",
        senderRole: "admin",
        attachments: media,
      },
    ]);
      setDraft("");
      setMedia([]);
      setFileName("");

    try {
      const response = await fetch("/api/admin/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          conversationId: thread.id,
          body,
          topic: thread.topic || "direct_message",
          media,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        setOptimistic((current) => current.filter((item) => item.id !== optimisticId));
        setDraft(body);
        setMedia(media);
        setFileName(media[0]?.name || "");
        setError(payload?.error || "Message could not be sent.");
        return;
      }

      router.refresh();
    } catch {
      setOptimistic((current) => current.filter((item) => item.id !== optimisticId));
      setDraft(body);
      setMedia(media);
      setFileName(media[0]?.name || "");
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
        {canDelete ? (
          <div className="shrink-0">
            <AdminQueueCardActions
              compact
              conversationId={thread.id}
              threadSubject={thread.title}
            />
          </div>
        ) : null}
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
                className={`group flex items-end gap-2 ${message.isAdmin ? "justify-end" : "justify-start"}`}
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
                  {message.attachments?.map((file) => (
                    <a
                      key={file.url}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-2 block truncate text-xs font-black underline ${message.isAdmin ? "text-white" : "text-emerald-800"}`}
                    >
                      {file.name || "Open attachment"}
                    </a>
                  ))}
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p
                      className={`text-[10px] font-bold ${
                        message.isAdmin ? "text-white/70" : "text-slate-400"
                      }`}
                    >
                      {message.senderName} · {formatStamp(message.createdAt)}
                    </p>
                    {canDelete && !message.id.startsWith("local-") ? (
                      <button
                        type="button"
                        onClick={() => deleteMessage(message.id)}
                        disabled={deletingMessageId === message.id}
                        title="Delete this message"
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                          message.isAdmin
                            ? "bg-white/15 text-white hover:bg-white/25"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        }`}
                      >
                        {deletingMessageId === message.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Trash2 size={10} />
                        )}
                        Delete
                      </button>
                    ) : null}
                  </div>
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
        {fileName ? (
          <p className="mb-2 truncate text-xs font-bold text-emerald-800">Attached {fileName}</p>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,.pdf,.txt,.csv"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setPending(true);
              setError("");
              const form = new FormData();
              form.set("file", file);
              form.set("conversationId", thread.id);
              try {
                const response = await fetch("/api/messaging/upload", {
                  method: "POST",
                  body: form,
                  credentials: "same-origin",
                });
                const payload = (await response.json()) as {
                  ok?: boolean;
                  error?: string;
                  media?: { url: string; mimeType: string; name: string };
                };
                if (!response.ok || !payload.media?.url) {
                  setError(payload.error || "That file could not be attached.");
                  return;
                }
                setMedia((current) => [...current, payload.media!]);
                setFileName(payload.media.name || file.name);
              } catch {
                setError("That file could not be attached.");
              } finally {
                setPending(false);
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d7e4da] bg-white text-emerald-900"
            aria-label="Attach a file"
          >
            <Paperclip size={18} />
          </button>
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
            disabled={pending || (draft.trim().length < 1 && media.length === 0)}
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
