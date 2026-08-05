"use client";

/**
 * Personalized floating AI Scout companion.
 * - workspace: signed-in Guru dashboards (schedule/logistics)
 * - onboarding: public Become a Guru conversion surface
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "ai/react";
import { useGuruAuth } from "@/hooks/useGuruAuth";
import {
  COMPANION_DOCK_CLASS,
  COMPANION_FAB_CLASS,
  SCOUT_AVATAR,
} from "@/lib/companions/avatar-assets";

const SCOUT_BRAND = "#047857";
const SCOUT_BRAND_DEEP = "#065f46";

const WORKSPACE_ROUTE_PREFIXES = [
  "/guru/dashboard",
  "/guru/bookings",
  "/guru/referrals",
  "/guru/messages",
  "/guru/profile",
  "/guru/availability",
  "/guru/earnings",
  "/guru/success-center",
] as const;

const ONBOARDING_ROUTE_PREFIXES = [
  "/become-a-guru",
  "/guru/signup",
  "/guru/application",
] as const;

const WORKSPACE_CHIPS = [
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

const ONBOARDING_CHIPS = [
  {
    id: "start_profile",
    label: "Start Free Profile",
    prompt:
      "I want to start my free Guru profile. Walk me through the first setup steps so I can get bookable.",
  },
  {
    id: "free_to_apply",
    label: "Free to apply?",
    prompt: "Is it free to apply?",
  },
  {
    id: "background_check",
    label: "Background Check",
    prompt:
      "What should I know about background checks and trust steps before I become bookable?",
  },
  {
    id: "payments_work",
    label: "Payments",
    prompt: "How do payments work?",
  },
] as const;

const ONBOARDING_GREETING =
  "Hi! I'm Scout, your Guru Matching Officer. Don't worry about onboarding—I'm right here to guide you through our profile steps, handle background check questions, and unlock your local pet care earnings window!";

export type AIScoutCompanionProps = {
  /** `onboarding` = public Become a Guru conversion; default auto-detects from path. */
  mode?: "workspace" | "onboarding" | "auto";
};

function matchesPrefix(
  pathname: string | null,
  prefixes: readonly string[],
) {
  if (!pathname) return false;
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildWorkspaceGreeting(firstName: string) {
  return `Hi ${firstName}! I'm your Scout AI Companion. How can I assist you with your dashboard schedule today?`;
}

export default function AIScoutCompanion({
  mode = "auto",
}: AIScoutCompanionProps) {
  const pathname = usePathname();
  const resolvedMode =
    mode === "auto"
      ? matchesPrefix(pathname, ONBOARDING_ROUTE_PREFIXES)
        ? "onboarding"
        : "workspace"
      : mode;

  const isOnboarding = resolvedMode === "onboarding";
  const routeEnabled = isOnboarding
    ? matchesPrefix(pathname, ONBOARDING_ROUTE_PREFIXES) || mode === "onboarding"
    : matchesPrefix(pathname, WORKSPACE_ROUTE_PREFIXES);

  const { user, loading } = useGuruAuth();
  const [isOpen, setIsOpen] = useState(isOnboarding);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const firstName = user?.firstName || "Guru";
  const greeting = isOnboarding
    ? ONBOARDING_GREETING
    : buildWorkspaceGreeting(firstName);
  const chips = isOnboarding ? ONBOARDING_CHIPS : WORKSPACE_CHIPS;

  const requestBody = {
    officer: "scout" as const,
    surface: isOnboarding ? ("public" as const) : ("dashboard" as const),
    ...(!isOnboarding && user?.accessToken
      ? { accessToken: user.accessToken }
      : {}),
    ...(!isOnboarding && user?.guruId ? { providerId: user.guruId } : {}),
    ...(!isOnboarding && user?.name ? { guruName: user.name } : {}),
    ...(!isOnboarding && user?.email ? { guruEmail: user.email } : {}),
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

  useEffect(() => {
    if (isOnboarding) {
      setMessages([
        {
          id: "scout-onboarding-hello",
          role: "assistant",
          content: ONBOARDING_GREETING,
        },
      ]);
      return;
    }
    if (!user?.id) return;
    setMessages([
      {
        id: `scout-hello-${user.guruId || user.id}`,
        role: "assistant",
        content: buildWorkspaceGreeting(user.firstName),
      },
    ]);
  }, [
    isOnboarding,
    user?.id,
    user?.guruId,
    user?.firstName,
    setMessages,
  ]);

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

  if (!routeEnabled) return null;
  if (!isOnboarding && (loading || !user)) return null;

  async function runChip(chip: (typeof chips)[number]) {
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
    handleSubmit(event, { body: { ...requestBody } });
    window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      40,
    );
  }

  return (
    <div
      className={COMPANION_DOCK_CLASS}
      data-ai-scout-companion
      data-scout-mode={resolvedMode}
      data-guru-id={user?.guruId || user?.id || "guest"}
    >
      {isOpen ? (
        <div
          className="absolute bottom-[4.75rem] right-0 flex h-[min(28rem,70dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white text-slate-900 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
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
                  src={SCOUT_AVATAR.src}
                  alt={SCOUT_AVATAR.alt}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  style={{
                    backgroundColor: "#fff",
                    objectPosition: SCOUT_AVATAR.objectPosition,
                  }}
                  priority
                />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black tracking-tight text-white">
                  {isOnboarding
                    ? "Scout · Guru Matching Officer"
                    : "Scout AI Companion"}
                </h3>
                <p className="truncate text-[11px] font-semibold text-white/90">
                  {isOnboarding
                    ? "Here to get you set up & earning"
                    : `Helping ${firstName} · your routes only`}
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
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
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
                {isOnboarding
                  ? "Scout is lining up your next onboarding step…"
                  : "Scout is sniffing your schedule…"}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                Scout hit a snag. Try again in a moment.
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-emerald-50 bg-white px-3 py-2">
            {isOnboarding ? (
              <Link
                href="/signup?role=guru&next=/guru/dashboard"
                className="mb-2 flex min-h-10 items-center justify-center rounded-xl bg-emerald-800 px-3 text-xs font-black text-white transition hover:bg-emerald-900"
              >
                Start Free Guru Profile
              </Link>
            ) : null}
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {chips.map((chip) => (
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
                placeholder={
                  isOnboarding
                    ? "Ask Scout about applying, checks, payouts…"
                    : "Ask Scout about your schedule…"
                }
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

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          isOpen ? "Close Scout AI Companion" : "Open Scout AI Companion"
        }
        aria-expanded={isOpen}
        className={`${COMPANION_FAB_CLASS} flex items-center justify-center bg-emerald-600 hover:bg-emerald-700`}
      >
        {isOpen ? (
          <span className="text-2xl font-light leading-none text-white">×</span>
        ) : (
          <Image
            src={SCOUT_AVATAR.src}
            alt={SCOUT_AVATAR.alt}
            width={56}
            height={56}
            className="h-full w-full object-cover"
            style={{
              backgroundColor: "#fff",
              objectPosition: SCOUT_AVATAR.objectPosition,
            }}
            priority
          />
        )}
      </button>
    </div>
  );
}
