"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import type { EventConversationPreview } from "@/lib/messaging/event-conversation-queries";

type EventConversationPanelProps = {
  eventId: string;
  eventTitle: string;
  mode: "admin" | "partner";
  preview?: EventConversationPreview | null;
};

function formatWhen(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AvatarBubble({
  name,
  avatar,
  isAdmin,
}: {
  name: string;
  avatar: string;
  isAdmin?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${
        isAdmin ? "ring-2 ring-emerald-200" : "bg-slate-100"
      }`}
    >
      {avatar ? (
        <Image src={avatar} alt={name} fill className="object-cover" sizes="36px" />
      ) : (
        <span className="text-xs font-black text-slate-600">{initials || "?"}</span>
      )}
    </div>
  );
}

export default function EventConversationPanel({
  eventId,
  eventTitle,
  mode,
  preview,
}: EventConversationPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function openThread() {
    startTransition(async () => {
      setError("");
      const response = await fetch("/api/messaging/ensure-event-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          opener:
            mode === "admin"
              ? `Admin opened coordination for ${eventTitle}.`
              : `Partner opened coordination for ${eventTitle}.`,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error || "Unable to open messages.");
        return;
      }

      router.push(mode === "admin" ? payload.hrefAdmin : payload.hrefPartner);
    });
  }

  const threadHref =
    preview &&
    (mode === "admin"
      ? `/admin/messages/${encodeURIComponent(preview.conversationId)}`
      : `/messages/${encodeURIComponent(preview.conversationId)}`);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-700" />
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Event Messages
            </p>
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            {mode === "admin" ? "Partner coordination" : "Message SitGuru"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {mode === "admin"
              ? "View and reply to partner messages about this event — avatars, history, and notifications stay in SitGuru Messages."
              : "Ask questions, share updates, and coordinate publishing without leaving SitGuru."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {preview && preview.unreadCount > 0 ? (
            <span className="inline-flex min-h-10 items-center rounded-full bg-amber-50 px-4 text-xs font-black text-amber-900">
              {preview.unreadCount} unread
            </span>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={openThread}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {preview ? "Open thread" : "Start messages"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm font-black text-red-700">{error}</p> : null}

      {preview?.messages.length ? (
        <div className="mt-5 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-800">{preview.subject}</p>
            {preview.lastMessageAt ? (
              <p className="text-xs font-semibold text-slate-500">
                {formatWhen(preview.lastMessageAt)}
              </p>
            ) : null}
          </div>
          {preview.messages.slice(-4).map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <AvatarBubble
                name={message.senderName}
                avatar={message.senderAvatar}
                isAdmin={message.isAdmin}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-700">
                  {message.senderName}
                  <span className="ml-2 font-semibold capitalize text-slate-400">
                    {message.senderRole || "member"}
                  </span>
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-700">
                  {message.body}
                </p>
              </div>
            </div>
          ))}
          {threadHref ? (
            <Link
              href={threadHref}
              className="inline-flex text-sm font-black text-emerald-800 hover:underline"
            >
              View full thread →
            </Link>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">
          No messages yet. Start a thread to coordinate event details with SitGuru.
        </p>
      )}
    </section>
  );
}
