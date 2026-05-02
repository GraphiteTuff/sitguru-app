// components/NotificationBell.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type NotificationRow = {
  id: string;
  user_id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  href?: string | null;
  link?: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11 5 6 9H3v6h3l5 4V5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18.5 5.5a9 9 0 0 1 0 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VoiceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v3m-4 0h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatNotificationTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getNotificationRoute(notification: NotificationRow) {
  return notification.href || notification.link || "/customer/dashboard";
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function createTone({
  audioContext,
  destination,
  startTime,
  frequency,
  endFrequency,
  peakGain,
  duration,
  type = "sine",
}: {
  audioContext: AudioContext;
  destination: AudioNode;
  startTime: number;
  frequency: number;
  endFrequency?: number;
  peakGain: number;
  duration: number;
  type?: OscillatorType;
}) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      startTime + duration * 0.55,
    );
  }

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

async function playSoftBellSound() {
  if (typeof window === "undefined") return;

  const AudioContextConstructor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) return;

  const audioContext = new AudioContextConstructor();

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {
      return;
    }
  }

  const now = audioContext.currentTime;

  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.26, now + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.55);
  masterGain.connect(audioContext.destination);

  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(5200, now);
  filter.Q.setValueAtTime(0.7, now);
  filter.connect(masterGain);

  const pulseStarts = [
    now,
    now + 0.48,
    now + 0.96,
    now + 1.44,
    now + 1.92,
    now + 2.4,
    now + 2.88,
    now + 3.36,
  ];

  pulseStarts.forEach((startTime, index) => {
    const fade = Math.max(0.32, 1 - index * 0.09);

    createTone({
      audioContext,
      destination: filter,
      startTime,
      frequency: 1174.7,
      endFrequency: 1318.5,
      peakGain: 0.22 * fade,
      duration: 0.13,
      type: "sine",
    });

    createTone({
      audioContext,
      destination: filter,
      startTime: startTime + 0.12,
      frequency: 1568,
      endFrequency: 1760,
      peakGain: 0.2 * fade,
      duration: 0.15,
      type: "sine",
    });

    createTone({
      audioContext,
      destination: filter,
      startTime: startTime + 0.02,
      frequency: 784,
      endFrequency: 880,
      peakGain: 0.065 * fade,
      duration: 0.22,
      type: "triangle",
    });
  });

  window.setTimeout(() => {
    audioContext.close().catch(() => {
      // Keep notification sound safe if browser rejects close.
    });
  }, 5000);
}

function stopSpeaking() {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
}

function speakNewMessage() {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance("You have a new message.");

  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find(
      (voice) => voice.lang.startsWith("en") && voice.name.includes("Google"),
    ) ||
    voices.find((voice) => voice.lang.startsWith("en")) ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}

function createNotificationChannelName(userId: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `notifications:${userId}:${randomPart}`;
}

export default function NotificationBell() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const previousUnreadCountRef = useRef<number | null>(null);
  const audioUnlockedRef = useRef(false);
  const initializedRef = useRef(false);
  const playedOpenUnreadSoundRef = useRef(false);
  const voiceTimeoutRef = useRef<number | null>(null);
  const voiceEnabledRef = useRef(true);
  const soundEnabledRef = useRef(true);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.is_read).length;
  }, [notifications]);

  const hasUnreadNotifications = unreadCount > 0;

  const clearVoiceTimeout = useCallback(() => {
    if (voiceTimeoutRef.current !== null) {
      window.clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
  }, []);

  const scheduleVoice = useCallback(
    (delayMs = 4550) => {
      clearVoiceTimeout();

      if (!voiceEnabledRef.current) {
        stopSpeaking();
        return;
      }

      voiceTimeoutRef.current = window.setTimeout(() => {
        voiceTimeoutRef.current = null;

        if (!voiceEnabledRef.current) {
          stopSpeaking();
          return;
        }

        speakNewMessage();
      }, delayMs);
    },
    [clearVoiceTimeout],
  );

  const loadNotifications = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setUserId(null);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, title, body, type, href, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications((data as NotificationRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;

    if (!voiceEnabled) {
      clearVoiceTimeout();
      stopSpeaking();
    }
  }, [clearVoiceTimeout, voiceEnabled]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    function unlockAudio() {
      audioUnlockedRef.current = true;

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
      }
    }

    window.addEventListener("click", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      previousUnreadCountRef.current = unreadCount;
      return;
    }

    const previousUnreadCount = previousUnreadCountRef.current ?? 0;
    const unreadCountIncreased = unreadCount > previousUnreadCount;

    previousUnreadCountRef.current = unreadCount;

    if (unreadCount === 0) {
      playedOpenUnreadSoundRef.current = false;
      clearVoiceTimeout();
      stopSpeaking();
    }

    if (unreadCountIncreased && audioUnlockedRef.current && !document.hidden) {
      playedOpenUnreadSoundRef.current = false;

      if (soundEnabledRef.current) {
        playSoftBellSound();
      }

      if (voiceEnabledRef.current) {
        scheduleVoice(4550);
      } else {
        clearVoiceTimeout();
        stopSpeaking();
      }
    }
  }, [clearVoiceTimeout, scheduleVoice, unreadCount]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(createNotificationChannelName(userId));

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        loadNotifications();
      },
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        loadNotifications();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearVoiceTimeout();
      stopSpeaking();
    };
  }, [clearVoiceTimeout]);

  async function markNotificationRead(notificationId: string) {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification,
      ),
    );

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  }

  async function markAllRead() {
    if (!userId || unreadCount === 0) return;

    playedOpenUnreadSoundRef.current = false;
    clearVoiceTimeout();
    stopSpeaking();

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    );

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  }

  async function handleNotificationClick(notification: NotificationRow) {
    clearVoiceTimeout();
    stopSpeaking();

    await markNotificationRead(notification.id);

    setOpen(false);
    router.push(getNotificationRoute(notification));
  }

  function playUnreadOpenSoundOnce() {
    if (!hasUnreadNotifications) return;
    if (!soundEnabledRef.current) return;
    if (playedOpenUnreadSoundRef.current) return;

    audioUnlockedRef.current = true;
    playedOpenUnreadSoundRef.current = true;
    playSoftBellSound();

    if (voiceEnabledRef.current) {
      scheduleVoice(4550);
    } else {
      clearVoiceTimeout();
      stopSpeaking();
    }
  }

  function handleTestSound() {
    audioUnlockedRef.current = true;
    playSoftBellSound();
  }

  function handleTestVoice() {
    audioUnlockedRef.current = true;

    if (!voiceEnabledRef.current) {
      stopSpeaking();
      return;
    }

    speakNewMessage();
  }

  function toggleSound() {
    setSoundEnabled((current) => !current);
  }

  function toggleVoice() {
    setVoiceEnabled((current) => {
      const nextValue = !current;
      voiceEnabledRef.current = nextValue;

      if (!nextValue) {
        clearVoiceTimeout();
        stopSpeaking();
      }

      return nextValue;
    });
  }

  return (
    <div
      ref={dropdownRef}
      className="relative isolate"
      style={{ color: "#020617" }}
    >
      <button
        type="button"
        onClick={() => {
          audioUnlockedRef.current = true;

          setOpen((current) => {
            const nextOpen = !current;

            if (nextOpen) {
              window.setTimeout(playUnreadOpenSoundOnce, 0);
            }

            return nextOpen;
          });
        }}
        aria-label={
          hasUnreadNotifications
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          hasUnreadNotifications
            ? "border-emerald-200 text-emerald-600"
            : "border-slate-200 text-slate-700 hover:text-emerald-600"
        }`}
      >
        {hasUnreadNotifications ? (
          <>
            <span className="absolute inset-0 animate-ping rounded-full border border-emerald-300/60" />
            <span className="absolute -inset-1 animate-pulse rounded-full border border-emerald-200/70" />
          </>
        ) : null}

        <BellIcon className="relative z-10 h-5 w-5" />

        {hasUnreadNotifications ? (
          <span className="absolute right-2.5 top-2.5 z-20 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        ) : null}

        {unreadCount > 1 ? (
          <span className="absolute -right-1 -top-1 z-30 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-black leading-none text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-[9999] mt-3 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border border-emerald-100 shadow-[0_24px_90px_rgba(15,23,42,0.30)] ring-1 ring-slate-900/10"
          style={{
            backgroundColor: "#ffffff",
            color: "#020617",
            textShadow: "none",
          }}
        >
          <div
            className="border-b border-slate-200 px-4 py-4"
            style={{
              backgroundColor: "#ffffff",
              color: "#020617",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className="text-sm font-black leading-5"
                  style={{
                    color: "#020617",
                    opacity: 1,
                  }}
                >
                  Notifications
                </p>

                <p
                  className="mt-0.5 text-xs font-bold"
                  style={{
                    color: "#475569",
                    opacity: 1,
                  }}
                >
                  {hasUnreadNotifications
                    ? `${unreadCount} unread update${
                        unreadCount === 1 ? "" : "s"
                      }`
                    : "You are all caught up"}
                </p>
              </div>

              {hasUnreadNotifications ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                  style={{
                    color: "#047857",
                    opacity: 1,
                  }}
                >
                  <CheckIcon />
                  Mark all read
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleSound}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 text-xs font-black ring-1 ring-slate-200 transition hover:bg-slate-100"
                style={{
                  color: soundEnabled ? "#047857" : "#64748b",
                  opacity: 1,
                }}
                title={soundEnabled ? "Sound on" : "Sound off"}
              >
                <SoundIcon />
                {soundEnabled ? "Sound on" : "Muted"}
              </button>

              <button
                type="button"
                onClick={toggleVoice}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 text-xs font-black ring-1 ring-slate-200 transition hover:bg-slate-100"
                style={{
                  color: voiceEnabled ? "#047857" : "#64748b",
                  opacity: 1,
                }}
                title={voiceEnabled ? "Voice on" : "Voice off"}
              >
                <VoiceIcon />
                {voiceEnabled ? "Voice on" : "Voice off"}
              </button>
            </div>
          </div>

          <div
            className="max-h-[390px] overflow-y-auto"
            style={{
              backgroundColor: "#ffffff",
              color: "#020617",
            }}
          >
            {loading ? (
              <div className="px-4 py-8 text-center">
                <p
                  className="text-sm font-bold"
                  style={{
                    color: "#334155",
                    opacity: 1,
                  }}
                >
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <BellIcon className="h-6 w-6" />
                </div>

                <p
                  className="mt-4 text-sm font-black"
                  style={{
                    color: "#020617",
                    opacity: 1,
                  }}
                >
                  No notifications yet
                </p>

                <p
                  className="mt-1 text-sm font-semibold leading-6"
                  style={{
                    color: "#475569",
                    opacity: 1,
                  }}
                >
                  Booking updates, messages, reminders, and PawPerks alerts will
                  show here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {notifications.map((notification) => {
                  const isUnread = !notification.is_read;
                  const title = cleanText(notification.title) || "Notification";
                  const body = cleanText(notification.body);
                  const typeLabel =
                    cleanText(notification.type).toUpperCase() || "UPDATE";

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className="block w-full px-4 py-4 text-left transition hover:bg-emerald-50"
                      style={{
                        backgroundColor: isUnread ? "#ecfdf5" : "#ffffff",
                        color: "#020617",
                        opacity: 1,
                      }}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            isUnread ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p
                              className="text-sm font-black leading-5"
                              style={{
                                color: "#020617",
                                opacity: 1,
                              }}
                            >
                              {title}
                            </p>

                            <span
                              className="shrink-0 text-xs font-black"
                              style={{
                                color: "#475569",
                                opacity: 1,
                              }}
                            >
                              {formatNotificationTime(notification.created_at)}
                            </span>
                          </div>

                          {body ? (
                            <p
                              className="mt-1 line-clamp-2 text-sm font-bold leading-5"
                              style={{
                                color: "#334155",
                                opacity: 1,
                              }}
                            >
                              {body}
                            </p>
                          ) : null}

                          <p
                            className="mt-2 text-xs font-black uppercase tracking-[0.16em]"
                            style={{
                              color: "#047857",
                              opacity: 1,
                            }}
                          >
                            {typeLabel}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="border-t border-slate-200 px-4 py-3"
            style={{
              backgroundColor: "#f8fafc",
              color: "#475569",
              opacity: 1,
            }}
          >
            <div className="flex flex-col gap-2">
              <p
                className="text-xs font-bold leading-5"
                style={{
                  color: "#475569",
                  opacity: 1,
                }}
              >
                New booking alerts, messages, PawPerks rewards, and care updates
                will appear here automatically.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="w-fit rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
                >
                  Test sound
                </button>

                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="w-fit rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
                >
                  Test voice
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}