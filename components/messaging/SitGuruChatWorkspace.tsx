"use client";

/**
 * SitGuru unified client↔guru chat workspace.
 * Real-time on public.messages via room-{bookingId}; contact-data guardrails.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Loader2,
  PawPrint,
  Phone,
  SendHorizontal,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  SITGURU_CONTACT_GUARD_ALERT,
  scanMessageForOffPlatformContact,
} from "@/lib/messaging/contact-guard";
import type { ChatMessage } from "@/lib/messaging/types";

export type BookingChatContext = {
  petName?: string | null;
  petTraits?: string[];
  serviceLabel?: string | null;
  startLabel?: string | null;
  endLabel?: string | null;
  status?: string | null;
  emergencyVetName?: string | null;
  emergencyVetPhone?: string | null;
  emergencyVetUrl?: string | null;
};

export type SitGuruChatWorkspaceProps = {
  bookingId: string;
  senderId: string;
  recipientId: string;
  title?: string;
  onClose?: () => void;
  /** Optional preloaded care context for the desktop side panel */
  bookingContext?: BookingChatContext;
  className?: string;
};

function normalizeRow(row: Record<string, unknown>): ChatMessage {
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
    status: row.status ? String(row.status) : null,
  };
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SitGuruChatWorkspace({
  bookingId,
  senderId,
  recipientId,
  title = "Care chat",
  onClose,
  bookingContext: bookingContextProp,
  className = "",
}: SitGuruChatWorkspaceProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [guardAlert, setGuardAlert] = useState("");
  const [bookingContext, setBookingContext] = useState<BookingChatContext>(
    bookingContextProp || {},
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const loadMessages = useCallback(async (activeConversationId: string) => {
    const { data, error: qError } = await supabase
      .from("messages")
      .select(
        "id,conversation_id,sender_id,recipient_id,content,body,created_at,is_ai,channel,sender_name_snapshot,status",
      )
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true })
      .limit(250);

    if (qError) {
      const retry = await supabase
        .from("messages")
        .select(
          "id,conversation_id,sender_id,recipient_id,content,body,created_at,status",
        )
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true })
        .limit(250);
      if (retry.error) {
        setError(retry.error.message);
        return;
      }
      setMessages(
        (retry.data || []).map((row) =>
          normalizeRow(row as Record<string, unknown>),
        ),
      );
      return;
    }

    setMessages(
      (data || []).map((row) => normalizeRow(row as Record<string, unknown>)),
    );
  }, []);

  // Resolve booking conversation + soft context
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError("");

      try {
        const ensureRes = await fetch(
          "/api/messaging/ensure-booking-conversation",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId }),
          },
        );
        const ensureJson = (await ensureRes.json().catch(() => null)) as {
          ok?: boolean;
          conversationId?: string;
          error?: string;
        } | null;

        if (!ensureRes.ok || !ensureJson?.ok || !ensureJson.conversationId) {
          throw new Error(
            ensureJson?.error || "Could not open booking conversation.",
          );
        }

        if (cancelled) return;
        setConversationId(String(ensureJson.conversationId));
        await loadMessages(String(ensureJson.conversationId));

        if (!bookingContextProp) {
          const { data: booking } = await supabase
            .from("bookings")
            .select(
              "pet_name,service_type,service,status,start_date,end_date,start_at,end_at,notes,special_instructions,emergency_vet_name,emergency_vet_phone,vet_name,vet_phone",
            )
            .eq("id", bookingId)
            .maybeSingle();

          if (!cancelled && booking) {
            const row = booking as Record<string, unknown>;
            const traits: string[] = [];
            const notes = String(
              row.special_instructions || row.notes || "",
            ).trim();
            if (notes) traits.push(notes.slice(0, 140));

            setBookingContext({
              petName: String(row.pet_name || "Pet"),
              petTraits: traits,
              serviceLabel: String(
                row.service_type || row.service || "Pet care",
              ),
              startLabel: String(row.start_date || row.start_at || ""),
              endLabel: String(row.end_date || row.end_at || ""),
              status: String(row.status || ""),
              emergencyVetName: String(
                row.emergency_vet_name || row.vet_name || "",
              ),
              emergencyVetPhone: String(
                row.emergency_vet_phone || row.vet_phone || "",
              ),
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load chat.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [bookingId, bookingContextProp, loadMessages]);

  // Real-time: room-{bookingId} → public.messages INSERT
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`room-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = normalizeRow(payload.new as Record<string, unknown>);
          if (row.conversationId && row.conversationId !== conversationId) {
            return;
          }
          // Accept when conversation matches, or when either party is on this booking chat
          const involvesParties =
            row.senderId === senderId ||
            row.senderId === recipientId ||
            row.recipientId === senderId ||
            row.recipientId === recipientId ||
            !row.conversationId;

          if (row.conversationId === conversationId || involvesParties) {
            setMessages((prev) =>
              prev.some((message) => message.id === row.id)
                ? prev
                : [...prev, row],
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, conversationId, recipientId, senderId]);

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

  function handleDraftChange(value: string) {
    const scan = scanMessageForOffPlatformContact(value);
    if (scan.blocked) {
      setGuardAlert(scan.alert);
      setDraft("");
      return;
    }
    if (guardAlert) setGuardAlert("");
    setDraft(value);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending || !conversationId) return;

    const scan = scanMessageForOffPlatformContact(text);
    if (scan.blocked) {
      setGuardAlert(scan.alert);
      setDraft("");
      return;
    }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          recipientId,
          bookingId,
          message: text,
          topic: "booking_care",
          clientMessageKey: crypto.randomUUID(),
          source: "sitguru_chat_workspace",
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        message?: Record<string, unknown>;
      } | null;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Send failed");
      }

      if (json.message) {
        const row = normalizeRow(json.message);
        setMessages((prev) =>
          prev.some((message) => message.id === row.id)
            ? prev
            : [...prev, row],
        );
      }

      setDraft("");
      composerRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  const context = bookingContextProp || bookingContext;
  const petTraits = context.petTraits?.filter(Boolean) || [];

  const chatColumn = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-emerald-100 px-4 py-3">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 lg:hidden"
            aria-label="Close chat"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-950">{title}</p>
          <p className="truncate text-xs font-semibold text-emerald-700">
            Secure booking channel · room-{bookingId.slice(0, 8)}
          </p>
        </div>
        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800 sm:inline-flex">
          Encrypted in-app
        </span>
      </header>

      <div
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm font-semibold text-slate-400">
            Message your care partner here. Phone numbers and emails stay blocked
            for platform safety.
          </p>
        ) : (
          sorted.map((message) => {
            const mine = message.senderId === senderId && !message.isAi;
            return (
              <div
                key={message.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm font-semibold leading-5",
                    message.isAi
                      ? "border border-emerald-100 bg-emerald-50 text-emerald-950"
                      : mine
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-900",
                  ].join(" ")}
                >
                  {!mine && (message.isAi || message.senderName) ? (
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                      {message.isAi ? "SitGuru AI" : message.senderName}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p
                    className={`mt-1 text-[10px] font-bold ${
                      mine ? "text-emerald-100/80" : "text-slate-400"
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {guardAlert ? (
        <div
          role="alert"
          className="mx-3 mb-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-5 text-amber-950"
        >
          <span className="inline-flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {guardAlert}
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="px-4 pb-1 text-xs font-semibold text-rose-600">{error}</p>
      ) : null}

      <div className="shrink-0 border-t border-slate-100 bg-white px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            ref={composerRef}
            value={draft}
            onChange={(event) => handleDraftChange(event.target.value)}
            rows={1}
            placeholder="Message inside SitGuru…"
            className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            type="button"
            disabled={sending || !draft.trim() || !conversationId}
            onClick={() => void handleSend()}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white disabled:opacity-40"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] font-semibold text-slate-400">
          {SITGURU_CONTACT_GUARD_ALERT}
        </p>
      </div>
    </div>
  );

  const contextPanel = (
    <aside className="hidden h-full min-h-0 flex-col overflow-y-auto border-l border-emerald-100 bg-[linear-gradient(180deg,#f8fffb_0%,#ffffff_45%)] p-5 lg:flex">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
        Booking context
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">
        {context.petName || "Pet care"}
      </h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        {context.serviceLabel || "Active booking"}
        {context.status ? ` · ${context.status}` : ""}
      </p>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800">
          <PawPrint className="h-4 w-4" />
          <p className="text-xs font-black uppercase tracking-[0.12em]">
            Pet traits
          </p>
        </div>
        {petTraits.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {petTraits.map((trait) => (
              <li
                key={trait}
                className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-700"
              >
                {trait}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs font-semibold text-slate-400">
            No special notes on this booking yet.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          Booking items
        </p>
        <dl className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Start</dt>
            <dd className="text-right">{context.startLabel || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">End</dt>
            <dd className="text-right">{context.endLabel || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Booking</dt>
            <dd className="truncate font-mono text-xs">{bookingId}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-rose-900">
          <Stethoscope className="h-4 w-4" />
          <p className="text-xs font-black uppercase tracking-[0.12em]">
            Emergency vet
          </p>
        </div>
        <p className="mt-2 text-sm font-black text-rose-950">
          {context.emergencyVetName || "Local emergency vet"}
        </p>
        {context.emergencyVetPhone ? (
          <a
            href={`tel:${context.emergencyVetPhone.replace(/\s+/g, "")}`}
            className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-rose-800"
          >
            <Phone className="h-4 w-4" />
            {context.emergencyVetPhone}
          </a>
        ) : (
          <p className="mt-2 text-xs font-semibold text-rose-800/80">
            Add vet details on the pet profile for faster emergencies.
          </p>
        )}
        {context.emergencyVetUrl ? (
          <Link
            href={context.emergencyVetUrl}
            className="mt-3 inline-flex text-xs font-black text-rose-900 underline"
          >
            Open vet link
          </Link>
        ) : null}
      </div>
    </aside>
  );

  return (
    <div
      className={[
        // Mobile: full-bleed immersive workspace
        "fixed inset-0 z-50 flex h-screen flex-col bg-white",
        // Desktop: classic split 2-column communication workspace
        "lg:static lg:z-auto lg:mx-auto lg:h-[min(80vh,720px)] lg:max-w-5xl lg:overflow-hidden lg:rounded-[1.75rem] lg:border lg:border-emerald-100 lg:shadow-xl",
        className,
      ].join(" ")}
    >
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        {chatColumn}
        {contextPanel}
      </div>
    </div>
  );
}
