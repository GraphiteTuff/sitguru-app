"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type RealtimeMessagePayload = {
  id?: string | null;
  conversation_id?: string | null;
  sender_id?: string | null;
  sender_role?: string | null;
  sender_role_snapshot?: string | null;
  sender_name_snapshot?: string | null;
  sender_email_snapshot?: string | null;
  content?: string | null;
  body?: string | null;
  message_type?: string | null;
  topic?: string | null;
  created_at?: string | null;
};

type AdminMessageRealtimeNotifierProps = {
  currentUserId: string;
  latestMessageId?: string | null;
  initialUnreadCount?: number;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeRole(value?: string | null) {
  const clean = normalizeText(value).toLowerCase();

  if (!clean) return "";
  if (clean === "pet_parent" || clean === "pet parent" || clean === "client") {
    return "customer";
  }
  if (clean.includes("admin") || clean === "founder" || clean === "owner") {
    return "admin";
  }
  if (clean.includes("visitor") || clean.includes("homepage")) return "visitor";

  return clean;
}

function getSenderLabel(message: RealtimeMessagePayload) {
  const role = normalizeRole(message.sender_role || message.sender_role_snapshot);
  const snapshotName = normalizeText(message.sender_name_snapshot);
  const emailName = normalizeText(message.sender_email_snapshot).split("@")[0];

  if (role === "visitor") return snapshotName || emailName || "Homepage Visitor";
  if (role === "ambassador") return snapshotName || emailName || "Ambassador";
  if (role === "guru") return snapshotName || emailName || "Guru";
  if (role === "customer") return snapshotName || emailName || "Pet Parent";
  if (role === "admin") return snapshotName || emailName || "SitGuru Admin";

  return snapshotName || emailName || "SitGuru Message";
}

function getMessageText(message: RealtimeMessagePayload) {
  return normalizeText(message.content) || normalizeText(message.body) || "New SitGuru message";
}

function isHomepageMessenger(message: RealtimeMessagePayload) {
  const search = [message.message_type, message.topic]
    .map((item) => normalizeText(item).toLowerCase())
    .join(" ");

  return search.includes("homepage_messenger") || search.includes("homepage");
}

export default function AdminMessageRealtimeNotifier({
  currentUserId,
  latestMessageId,
  initialUnreadCount = 0,
}: AdminMessageRealtimeNotifierProps) {
  const router = useRouter();
  const [alertMessage, setAlertMessage] = useState<RealtimeMessagePayload | null>(null);
  const [unreadPulseCount, setUnreadPulseCount] = useState(initialUnreadCount);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const seenMessageIdsRef = useRef(new Set<string>(latestMessageId ? [latestMessageId] : []));
  const lastRefreshRef = useRef(0);

  const alertHref = useMemo(() => {
    const conversationId = normalizeText(alertMessage?.conversation_id);
    return conversationId ? `/admin/messages/${encodeURIComponent(conversationId)}` : "/admin/messages";
  }, [alertMessage]);

  function playSoftAlert() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 740;
      gain.gain.value = 0.04;

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.16);
    } catch {
      // Browser audio can be blocked until a user gesture. The visual alert still works.
    }
  }

  function sendBrowserNotification(message: RealtimeMessagePayload) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const conversationId = normalizeText(message.conversation_id);

    const notification = new Notification("New SitGuru Message", {
      body: `${getSenderLabel(message)}: ${getMessageText(message).slice(0, 110)}`,
      tag: conversationId || normalizeText(message.id) || "sitguru-message",
      icon: "/images/sitguru-message-avatar.jpg",
    });

    notification.onclick = () => {
      window.focus();
      if (conversationId) {
        window.location.href = `/admin/messages/${encodeURIComponent(conversationId)}`;
      }
    };
  }

  function refreshAdminInboxSoon() {
    const now = Date.now();

    if (now - lastRefreshRef.current < 2500) return;

    lastRefreshRef.current = now;
    window.setTimeout(() => {
      router.refresh();
    }, 450);
  }

  async function enableBrowserNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  }

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("sitguru-admin-message-center-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const nextMessage = payload.new as RealtimeMessagePayload;
          const messageId = normalizeText(nextMessage.id);
          const senderId = normalizeText(nextMessage.sender_id);
          const senderRole = normalizeRole(nextMessage.sender_role || nextMessage.sender_role_snapshot);

          if (!messageId || seenMessageIdsRef.current.has(messageId)) return;

          seenMessageIdsRef.current.add(messageId);

          if (senderId && senderId === currentUserId) {
            refreshAdminInboxSoon();
            return;
          }

          if (senderRole === "admin") {
            refreshAdminInboxSoon();
            return;
          }

          setAlertMessage(nextMessage);
          setUnreadPulseCount((count) => count + 1);
          playSoftAlert();
          sendBrowserNotification(nextMessage);
          refreshAdminInboxSoon();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return (
    <div className="fixed bottom-5 right-5 z-[95] flex w-[min(390px,calc(100vw-2rem))] flex-col items-end gap-3">
      <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white/95 px-3 py-2 text-xs font-black text-emerald-900 shadow-lg shadow-slate-900/10 backdrop-blur">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
        </span>
        Live Admin Message Alerts
        {unreadPulseCount > 0 ? (
          <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] text-white">
            {unreadPulseCount}
          </span>
        ) : null}
      </div>

      {!notificationsEnabled ? (
        <button
          type="button"
          onClick={enableBrowserNotifications}
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 shadow-sm transition hover:bg-amber-100"
        >
          <Bell size={14} />
          Enable browser alerts
        </button>
      ) : null}

      {alertMessage ? (
        <section className="w-full overflow-hidden rounded-[26px] border border-emerald-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-sky-600 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-50">
                    {isHomepageMessenger(alertMessage) ? "Homepage Visitor" : "New Message"}
                  </p>
                  <h2 className="text-lg font-black leading-tight text-white">
                    {getSenderLabel(alertMessage)}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAlertMessage(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                aria-label="Dismiss message alert"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-4">
            <p className="line-clamp-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold leading-6 text-slate-700">
              {getMessageText(alertMessage)}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href={alertHref}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                Open Chat
              </Link>

              <button
                type="button"
                onClick={() => {
                  setAlertMessage(null);
                  router.refresh();
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                Mark Seen
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
