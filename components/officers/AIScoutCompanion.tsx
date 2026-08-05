"use client";

/**
 * Personalized floating AI Scout companion for Guru workspace views.
 * Uses Supabase session (via useGuruAuth) so each logged-in Guru gets their
 * own greeting, provider id, and Scout chat context.
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useChat } from "ai/react";
import { useGuruAuth } from "@/hooks/useGuruAuth";

const SCOUT_AVATAR_SRC = "/images/scout-avatar.png";
const SCOUT_BRAND = "#047857";
const SCOUT_BRAND_DEEP = "#065f46";

const SCOUT_ROUTE_PREFIXES = [
  "/guru/dashboard",
  "/guru/bookings",
  "/guru/referrals",
  "/guru/messages",
  "/guru/profile",
  "/guru/availability",
  "/guru/earnings",
  "/guru/success-center",
] as const;

const QUICK_CHIPS = [
  {
    id: "schedule",
    label: "My Schedule",
    prompt:
      "Help me review my dashboard schedule for today — what visits or walks need attention?",
  },
  {
    id: "trail_check",
    label: "Trail Check",
    prompt:
      "Run a Trail Check: summarize my assigned walks and what needs attention for tracking the trail today.",
  },
  {
    id: "payout_cache",
    label: "Payout Ready",
    prompt:
      "Check my provider payout cache — is Stripe/PayPal ready, and are any recent visit payouts still pending?",
  },
] as const;

function isGuruScoutRoute(pathname: string | null) {
  if (!pathname) return false;
  return SCOUT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildGreeting(firstName: string) {
  return `Hi ${firstName}! I'm your Scout AI Companion. How can I assist you with your dashboard schedule today?`;
}

export default function AIScoutCompanion() {
  const pathname = usePathname();
  const enabled = isGuruScoutRoute(pathname);
  const { user, loading } = useGuruAuth();
  const [isOpen, setIsOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const firstName = user?.firstName || "Guru";
  const greeting = buildGreeting(firstName);

  const requestBody = {
    officer: "scout" as const,
    surface: "dashboard" as const,
    ...(user?.accessToken ? { accessToken: user.accessToken } : {}),
    ...(user?.guruId ? { providerId: user.guruId } : {}),
    ...(user?.name ? { guruName: user.name } : {}),
    ...(user?.email ? { guruEmail: user.email } : {}),
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/ai/officer-stream",
    initialMessages: [
      {
        id: "scout-hello",
        role: "assistant",
        content: greeting,
      },
    ],
    body: requestBody,
  });

  // Refresh greeting when Guru identity resolves / changes.
  useEffect(() => {
    if (!user?.id) return;
    setMessages([
      {
        id: `scout-hello-${user.guruId || user.id}`,
        role: "assistant",
        content: buildGreeting(user.firstName),
      },
    ]);
  }, [user?.id, user?.guruId, user?.firstName, setMessages]);

  useEffect(() => {
    if (!isOpen) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      160,
    );
    return () => window.clearTimeout(t);
  }, [isOpen]);

  if (!enabled || loading || !user) {
    return null;
  }

  async function runChip(chip: (typeof QUICK_CHIPS)[number]) {
    setIsOpen(true);
    await append(
      { role: "user", content: chip.prompt },
      { body: { ...requestBody, preset: chip.id } },
    );
    window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      40,
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(event, {
      body: { ...requestBody },
    });
    window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      40,
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 font-sans"
      data-ai-scout-companion
      data-guru-id={user.guruId || user.id}
    >
      {isOpen ? (
        <div
          className="absolute bottom-[4.75rem] right-0 flex h-[min(28rem,70dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="Scout AI Companion"
        >
          <div
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${SCOUT_BRAND} 0%, ${SCOUT_BRAND_DEEP} 100%)`,
              backgroundColor: SCOUT_BRAND,
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-sm">
                <Image
                  src={SCOUT_AVATAR_SRC}
                  alt="Scout AI"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover object-[center_22%]"
                  style={{ backgroundColor: "#fff" }}
                  priority
                />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black tracking-tight text-white">
                  Scout AI Companion
                </h3>
                <p className="truncate text-[11px] font-semibold text-white/90">
                  Helping {firstName} · your routes only
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg leading-none text-white transition hover:bg-white/25"
              aria-label="Close Scout AI Companion"
            >
              ×
            </button>
          </div>

          <div
            ref={scrollerRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#f7fffb] px-4 py-3 text-sm text-slate-700"
          >
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              return (
                <div
                  key={message.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                      isAssistant
                        ? "border border-emerald-100 bg-white text-slate-700"
                        : "bg-emerald-700 text-white"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            {isLoading ? (
              <p className="text-xs font-semibold text-emerald-700">
                Scout is sniffing your schedule…
              </p>
            ) : null}
            {error ? (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                Scout hit a snag. Try again in a moment.
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-emerald-50 bg-white px-3 py-2">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => void runChip(chip)}
                  className="shrink-0 rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                rows={1}
                placeholder="Ask Scout about your schedule…"
                className="min-h-[40px] flex-1 resize-none rounded-xl border border-emerald-100 bg-[#f7fffb] px-3 py-2 text-sm text-slate-800 outline-none ring-emerald-600/30 placeholder:text-slate-400 focus:ring-2"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!isLoading && input.trim()) {
                      event.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-3 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Floating Action Button — Scout custom avatar */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          isOpen ? "Close Scout AI Companion" : "Open Scout AI Companion"
        }
        aria-expanded={isOpen}
        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-600 shadow-xl transition-all hover:scale-105 hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {isOpen ? (
          <span className="text-2xl font-light leading-none text-white">×</span>
        ) : (
          <Image
            src={SCOUT_AVATAR_SRC}
            alt="Scout AI"
            width={56}
            height={56}
            className="h-full w-full object-cover object-[center_22%]"
            style={{ backgroundColor: "#fff" }}
            priority
          />
        )}
      </button>
    </div>
  );
}
