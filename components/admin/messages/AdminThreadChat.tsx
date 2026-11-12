"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
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
        className="h-9 w-9 shrink-0 rounded-full border border-slate-200 bg-white object-cover sm:h-10 sm:w-10"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D5C3A] text-[11px] font-black text-white sm:h-10 sm:w-10">
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
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [pendingBulkDelete, startBulkDelete] = useTransition();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = [
    ...thread.messages,
    ...optimistic.filter(
      (item) => !thread.messages.some((existing) => existing.id === item.id),
    ),
  ].filter((item) => !hiddenMessageIds.has(item.id));

  const deletableIds = useMemo(
    () => messages.map((item) => item.id).filter((id) => !id.startsWith("local-")),
    [messages],
  );
  const selectedCount = selectedMessageIds.size;
  const allMessagesSelected =
    deletableIds.length > 0 && selectedCount === deletableIds.length;
  const someMessagesSelected = selectedCount > 0 && !allMessagesSelected;

  useEffect(() => {
    setOptimistic([]);
    setHiddenMessageIds(new Set());
    setSelectedMessageIds(new Set());
  }, [thread.id]);

  function toggleMessage(id: string) {
    setSelectedMessageIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllMessages() {
    setSelectedMessageIds((current) => {
      if (current.size === deletableIds.length) return new Set();
      return new Set(deletableIds);
    });
  }

  function deleteSelectedMessages() {
    if (!canDelete || selectedCount === 0 || pendingBulkDelete) return;
    const confirmed = window.confirm(
      `Delete ${selectedCount} message${selectedCount === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;
    const ids = [...selectedMessageIds];
    setError("");
    startBulkDelete(async () => {
      const failed: string[] = [];
      for (const messageId of ids) {
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
            failed.push(messageId);
            continue;
          }
          setHiddenMessageIds((current) => new Set(current).add(messageId));
        } catch {
          failed.push(messageId);
        }
      }
      setSelectedMessageIds(new Set(failed));
      if (failed.length) {
        setError(`${failed.length} message${failed.length === 1 ? "" : "s"} could not be deleted.`);
      }
      router.refresh();
    });
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
    const attached = [...media];
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
        attachments: attached,
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
          media: attached,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        setOptimistic((current) => current.filter((item) => item.id !== optimisticId));
        setDraft(body);
        setMedia(attached);
        setFileName(attached[0]?.name || "");
        setError(payload?.error || "Message could not be sent.");
        return;
      }

      router.refresh();
    } catch {
      setOptimistic((current) => current.filter((item) => item.id !== optimisticId));
      setDraft(body);
      setMedia(attached);
      setFileName(attached[0]?.name || "");
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
      <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white/95 px-2 py-2 backdrop-blur sm:gap-3 sm:px-4">
        <a
          href={inboxHref}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-800 md:hidden"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={22} />
        </a>
        <Avatar name={thread.title} src={thread.avatar} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-black text-slate-950 sm:text-[17px]">
            {thread.title}
          </h2>
          <p className="truncate text-xs font-semibold text-slate-500">
            {thread.subtitle}
            {thread.contactEmail ? ` · ${thread.contactEmail}` : ""}
          </p>
        </div>
        {canDelete ? (
          <div className="shrink-0">
            <div className="md:hidden">
              <AdminQueueCardActions
                iconOnly
                conversationId={thread.id}
                threadSubject={thread.title}
              />
            </div>
            <div className="hidden md:block">
              <AdminQueueCardActions
                compact
                conversationId={thread.id}
                threadSubject={thread.title}
              />
            </div>
          </div>
        ) : null}
      </header>

      {canDelete && deletableIds.length > 0 ? (
        <div
          className={`flex shrink-0 items-center gap-2 border-b px-3 py-2 sm:px-4 ${
            selectedCount > 0 ? "border-rose-100 bg-rose-50" : "border-slate-100 bg-[#F8FAFC]"
          }`}
        >
          <label className="inline-flex min-h-9 items-center gap-2">
            <input
              type="checkbox"
              checked={allMessagesSelected}
              ref={(el) => {
                if (el) el.indeterminate = someMessagesSelected;
              }}
              onChange={toggleSelectAllMessages}
              className="h-4 w-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-emerald-500"
              aria-label="Select all messages"
            />
            <span className="text-xs font-black text-slate-600">
              {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
            </span>
          </label>
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={deleteSelectedMessages}
              disabled={pendingBulkDelete}
              className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-rose-700 px-3 text-xs font-black text-white disabled:opacity-50"
            >
              {pendingBulkDelete ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Delete
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] sm:px-5 md:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
            No messages yet. Send the first reply.
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {messages.map((message) => {
              const canSelectThis =
                canDelete && !message.id.startsWith("local-");
              const checked = selectedMessageIds.has(message.id);
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 rounded-xl px-1 py-1.5 ${
                    checked ? "bg-rose-50/80" : "hover:bg-slate-50"
                  }`}
                >
                  {canSelectThis ? (
                    <label className="inline-flex h-10 w-7 shrink-0 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMessage(message.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-emerald-500"
                        aria-label={`Select message from ${message.senderName}`}
                      />
                    </label>
                  ) : (
                    <span className="w-7 shrink-0" aria-hidden />
                  )}
                  <Avatar name={message.senderName} src={message.senderAvatar} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <p className="truncate text-sm font-black text-slate-900">
                        {message.senderName}
                        {message.isAdmin ? (
                          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Admin
                          </span>
                        ) : null}
                      </p>
                      <p className="shrink-0 text-[10px] font-bold text-slate-400">
                        {formatStamp(message.createdAt)}
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 shadow-sm ${
                        message.isAdmin
                          ? "rounded-tl-md bg-[#0D5C3A] text-white"
                          : "rounded-tl-md border border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-6">
                        {message.body}
                      </p>
                      {message.attachments?.map((file) => (
                        <a
                          key={file.url}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-2 block truncate text-xs font-black underline ${
                            message.isAdmin ? "text-white" : "text-emerald-800"
                          }`}
                        >
                          {file.name || "Open attachment"}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-slate-200 bg-white px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        <div className="mx-auto w-full max-w-3xl">
          {error ? (
            <p className="mb-2 text-xs font-bold text-rose-700">{error}</p>
          ) : null}
          {fileName ? (
            <p className="mb-2 truncate text-xs font-bold text-emerald-800">
              Attached {fileName}
            </p>
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
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-900 sm:h-12 sm:w-12"
              aria-label="Attach a file"
            >
              <Paperclip size={18} />
            </button>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  if (window.matchMedia("(pointer: coarse)").matches) return;
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              enterKeyHint="send"
              placeholder={`Message ${thread.title}`}
              className="max-h-36 min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-base font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:min-h-12"
            />
            <button
              type="submit"
              disabled={pending || (draft.trim().length < 1 && media.length === 0)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0D5C3A] text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45 sm:h-12 sm:w-12"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
