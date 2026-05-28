"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Volume2, X } from "lucide-react";

type MessageAlert = {
  id: string;
  conversationId: string;
  senderName: string;
  senderRole: string;
  preview: string;
  createdAt: string;
  href: string;
};

type AlertResponse = {
  alerts?: MessageAlert[];
  unreadCount?: number;
};

const POLL_INTERVAL_MS = 12000;
const STORAGE_KEY = "sitguru-last-message-alert-id";
const CHANNEL_NAME = "sitguru-message-alerts";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSafeRoleLabel(role: string) {
  const normalized = role.trim().toLowerCase();

  if (normalized === "admin" || normalized === "super_admin") {
    return "SitGuru Admin";
  }

  if (normalized === "guru") return "Guru";
  if (normalized === "customer") return "Pet Parent";
  if (normalized === "pet_parent") return "Pet Parent";
  if (normalized === "ambassador") return "Ambassador";

  return "SitGuru User";
}

function playSoftAlert() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(540, audioContext.currentTime + 0.13);

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.38);
  } catch {
    // Audio should never block the message alert.
  }
}

export default function GlobalMessageNotifier() {
  const [activeAlert, setActiveAlert] = useState<MessageAlert | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const originalTitleRef = useRef<string>("");
  const lastAlertIdRef = useRef<string>("");
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  const visibleAlert = activeAlert && !isHidden ? activeAlert : null;

  const titlePrefix = useMemo(() => {
    if (unreadCount <= 0) return "";
    return `(${unreadCount}) `;
  }, [unreadCount]);

  const publishAlertAcrossTabs = useCallback((alert: MessageAlert) => {
    try {
      broadcastRef.current?.postMessage({
        type: "sitguru-new-message-alert",
        alert,
      });
    } catch {
      // Cross-tab sync should never block the local notification.
    }
  }, []);

  const showAlert = useCallback(
    (alert: MessageAlert, options?: { fromBroadcast?: boolean }) => {
      if (!alert?.id) return;
      if (lastAlertIdRef.current === alert.id) return;

      lastAlertIdRef.current = alert.id;
      window.localStorage.setItem(STORAGE_KEY, alert.id);

      setActiveAlert(alert);
      setIsHidden(false);

      if (soundEnabled && !options?.fromBroadcast) {
        playSoftAlert();
      }

      if (!options?.fromBroadcast) {
        publishAlertAcrossTabs(alert);
      }

      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("New SitGuru Message", {
            body: `${alert.senderName}: ${alert.preview}`,
            icon: "/images/sitguru-message-avatar.jpg",
          });
        } catch {
          // Native browser notifications are optional.
        }
      }
    },
    [publishAlertAcrossTabs, soundEnabled],
  );

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/unread-alerts", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as AlertResponse;
      const nextUnreadCount = Number(data.unreadCount || 0);

      setUnreadCount(Number.isFinite(nextUnreadCount) ? nextUnreadCount : 0);

      const alerts = Array.isArray(data.alerts) ? data.alerts : [];
      const newestAlert = alerts[0];

      if (!newestAlert?.id) return;

      const storedLastAlertId = cleanText(window.localStorage.getItem(STORAGE_KEY));

      if (newestAlert.id !== storedLastAlertId) {
        showAlert(newestAlert);
      }
    } catch {
      // Silent fail so the app never crashes if the API is unavailable.
    }
  }, [showAlert]);

  useEffect(() => {
    originalTitleRef.current = document.title;

    const storedLastAlertId = cleanText(window.localStorage.getItem(STORAGE_KEY));
    lastAlertIdRef.current = storedLastAlertId;

    fetchAlerts();

    const interval = window.setInterval(fetchAlerts, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchAlerts]);

  useEffect(() => {
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title;
    }

    if (titlePrefix) {
      document.title = `${titlePrefix}${originalTitleRef.current.replace(
        /^\(\d+\)\s+/,
        "",
      )}`;
    } else {
      document.title = originalTitleRef.current.replace(/^\(\d+\)\s+/, "");
    }
  }, [titlePrefix]);

  useEffect(() => {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        const payload = event.data as {
          type?: string;
          alert?: MessageAlert;
        };

        if (payload?.type === "sitguru-new-message-alert" && payload.alert) {
          showAlert(payload.alert, { fromBroadcast: true });
        }
      };

      return () => {
        channel.close();
        broadcastRef.current = null;
      };
    } catch {
      return undefined;
    }
  }, [showAlert]);

  async function requestBrowserNotifications() {
    if (!("Notification" in window)) return;

    try {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch {
      // Browser notification permission is optional.
    }
  }

  if (!visibleAlert) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 z-[9999] mx-auto max-w-md sm:bottom-5 sm:left-auto sm:right-5">
      <div className="overflow-hidden rounded-[26px] border border-emerald-200 bg-white shadow-2xl shadow-emerald-950/20">
        <div className="flex items-start gap-3 bg-emerald-50 px-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
            <MessageCircle size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              New SitGuru Message
            </p>

            <h3 className="mt-1 truncate text-base font-black text-slate-950">
              {visibleAlert.senderName || "SitGuru Message"}
            </h3>

            <p className="mt-1 text-xs font-bold text-slate-500">
              {getSafeRoleLabel(visibleAlert.senderRole)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsHidden(true)}
            className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
            aria-label="Dismiss message alert"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4">
          <p className="line-clamp-3 text-sm font-semibold leading-6 text-slate-700">
            {visibleAlert.preview || "You have a new SitGuru message."}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Link
              href={visibleAlert.href || `/messages/${visibleAlert.conversationId}`}
              onClick={() => setIsHidden(true)}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
            >
              Open Message
            </Link>

            <button
              type="button"
              onClick={() => {
                setSoundEnabled((current) => !current);
                requestBrowserNotifications();
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
            >
              <Volume2 size={16} />
              {soundEnabled ? "Sound On" : "Sound Off"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}