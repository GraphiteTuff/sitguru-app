// components/messaging/ChatWindow.tsx
"use client";

/**
 * Mobile-first dual-mode chat:
 * - panel: side-by-side desktop admin / dashboard
 * - sheet: slides over maps on /parent/walk and /guru/walk
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Paperclip,
  SendHorizontal,
  Sparkles,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import MediaAttachmentDrawer from "@/components/messaging/MediaAttachmentDrawer";
import {
  scanMessageForOffPlatformContact,
} from "@/lib/messaging/contact-guard";
import type {
  ChatLayoutMode,
  ChatMediaItem,
  ChatMessage,
} from "@/lib/messaging/types";

export type ChatWindowProps = {
  conversationId: string;
  currentUserId: string;
  title?: string;
  subtitle?: string;
  mode?: ChatLayoutMode;
  aiAssistEnabled?: boolean;
  className?: string;
  onAiAssistChange?: (enabled: boolean) => void;
};

function normalizeRow(row: Record<string, unknown>): ChatMessage {
  const mediaUrls = Array.isArray(row.media_urls)
    ? (row.media_urls as string[])
    : [];
  const mediaMimes = Array.isArray(row.media_mime_types)
    ? (row.media_mime_types as string[])
    : [];

  return {
    id: String(row.id),
    conversationId: String(row.conversation_id || ""),
    senderId: row.sender_id ? String(row.sender_id) : null,
    recipientId: row.recipient_id ? String(row.recipient_id) : null,
    body: String(row.content || row.body || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
    isAi: Boolean(row.is_ai),
    channel: (row.channel as ChatMessage["channel"]) || "in_app",
    senderName: row.sender_name_snapshot
      ? String(row.sender_name_snapshot)
      : row.is_ai
        ? "SitGuru AI"
        : null,
    media: mediaUrls.map((url, i) => ({
      url,
      mimeType: mediaMimes[i] || "application/octet-stream",
    })),
    status: row.status ? String(row.status) : null,
  };
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  title = "Messages",
  subtitle,
  mode = "panel",
  aiAssistEnabled = false,
  className = "",
  onAiAssistChange,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingMedia, setPendingMedia] = useState<ChatMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(aiAssistEnabled);
  const [guardAlert, setGuardAlert] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const isSheet = mode === "sheet";

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: qError } = await supabase
      .from("messages")
      .select(
        "id,conversation_id,sender_id,recipient_id,content,body,created_at,is_ai,channel,media_urls,media_mime_types,sender_name_snapshot,status",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (qError) {
      // Schema-tolerant select
      const retry = await supabase
        .from("messages")
        .select(
          "id,conversation_id,sender_id,recipient_id,content,body,created_at,status",
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (retry.error) {
        setError(retry.error.message);
        setLoading(false);
        return;
      }
      setMessages((retry.data || []).map((r) => normalizeRow(r as Record<string, unknown>)));
    } else {
      setMessages((data || []).map((r) => normalizeRow(r as Record<string, unknown>)));
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    setAiEnabled(aiAssistEnabled);
  }, [aiAssistEnabled]);

  // Presence heartbeat
  useEffect(() => {
    const beat = () => {
      void fetch("/api/messaging/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: true, deviceLabel: isSheet ? "walk-sheet" : "panel" }),
      });
    };
    beat();
    const id = window.setInterval(beat, 45_000);
    return () => window.clearInterval(id);
  }, [isSheet]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = normalizeRow(payload.new as Record<string, unknown>);
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  async function handleSend() {
    const text = draft.trim();
    if ((!text && pendingMedia.length === 0) || sending) return;

    if (text) {
      const scan = scanMessageForOffPlatformContact(text);
      if (scan.blocked) {
        setGuardAlert(scan.alert);
        setDraft("");
        return;
      }
    }

    setSending(true);
    setError("");
    setGuardAlert("");
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          media: pendingMedia,
          clientMessageKey: crypto.randomUUID(),
          source: "chat_window",
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        message?: Record<string, unknown>;
        ai?: { handedOff?: boolean; reply?: string };
      } | null;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Send failed");
      }

      if (json.message) {
        const row = normalizeRow(json.message);
        setMessages((prev) =>
          prev.some((m) => m.id === row.id) ? prev : [...prev, row],
        );
      }

      if (json.ai?.handedOff) {
        setAiEnabled(false);
        onAiAssistChange?.(false);
      }

      setDraft("");
      setPendingMedia([]);
      setDrawerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={[
        "relative flex h-full min-h-0 flex-col bg-white",
        isSheet
          ? "rounded-t-3xl border border-emerald-100 shadow-2xl"
          : "rounded-2xl border border-slate-200 shadow-sm",
        className,
      ].join(" ")}
    >
      {/* Header — thumb-friendly */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{title}</p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {subtitle ||
              (aiEnabled
                ? "SitGuru AI · Claude concierge active"
                : "Secure SitGuru messaging")}
          </p>
        </div>
        {aiEnabled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
            <Sparkles className="h-3 w-3" />
            Claude
          </span>
        ) : null}
      </header>

      {/* Message list */}
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm font-semibold text-slate-400">
            Start the conversation — SitGuru keeps care chats organized.
          </p>
        ) : (
          sorted.map((msg) => {
            const mine =
              msg.senderId === currentUserId && !msg.isAi;
            return (
              <div
                key={msg.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm font-semibold leading-5",
                    msg.isAi
                      ? "border border-emerald-100 bg-emerald-50 text-emerald-950"
                      : mine
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-900",
                  ].join(" ")}
                >
                  {msg.isAi || (!mine && msg.senderName) ? (
                    <p
                      className={`mb-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        mine ? "text-emerald-100" : "text-emerald-700"
                      }`}
                    >
                      {msg.isAi ? "SitGuru AI" : msg.senderName}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  {msg.media && msg.media.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.media.map((m) =>
                        m.mimeType.startsWith("video/") ? (
                          <video
                            key={m.url}
                            src={m.url}
                            controls
                            className="max-h-40 max-w-full rounded-xl"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={m.url}
                            src={m.url}
                            alt=""
                            className="max-h-40 max-w-full rounded-xl object-cover"
                          />
                        ),
                      )}
                    </div>
                  ) : null}
                  {msg.channel === "sms" ? (
                    <p className="mt-1 text-[10px] font-bold opacity-70">via SMS</p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="px-4 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      {guardAlert ? (
        <p
          role="alert"
          className="mx-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-950"
        >
          {guardAlert}
        </p>
      ) : null}

      {pendingMedia.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto border-t border-slate-50 px-3 py-2">
          {pendingMedia.map((m) => (
            <div
              key={m.url}
              className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100"
            >
              {m.mimeType.startsWith("video/") ? (
                <video src={m.url} className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Composer — large thumb targets */}
      <div className="relative shrink-0 border-t border-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
            aria-label="Attach media"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => {
              const next = e.target.value;
              const scan = scanMessageForOffPlatformContact(next);
              if (scan.blocked) {
                setGuardAlert(scan.alert);
                setDraft("");
                return;
              }
              if (guardAlert) setGuardAlert("");
              setDraft(next);
            }}
            rows={1}
            placeholder="Message…"
            className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            type="button"
            disabled={sending || (!draft.trim() && pendingMedia.length === 0)}
            onClick={() => void handleSend()}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white disabled:opacity-40"
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </button>
        </div>

        <MediaAttachmentDrawer
          conversationId={conversationId}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onAttached={(items) =>
            setPendingMedia((prev) => [...prev, ...items])
          }
        />
      </div>
    </div>
  );
}
