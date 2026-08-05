"use client";

/**
 * Floating Taco — Ambassador Advocate companion.
 * - onboarding: public /ambassadors signup conversion
 * - workspace: signed-in /ambassador/dashboard surfaces
 *
 * Scout remains the Guru companion. Taco is Ambassador-only.
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "ai/react";
import { supabase } from "@/lib/supabase";
import {
  COMPANION_DOCK_CLASS,
  TACO_AVATAR,
} from "@/lib/companions/avatar-assets";
import {
  COMPANION_BENEFITS_CHIP_ID,
  getCompanionBenefitsChip,
} from "@/lib/companions/companion-benefits";
import { RogueMarkdownText } from "@/components/messaging/RogueMarkdownText";

const TACO_BRAND = "#0D5C3A";
const TACO_BRAND_DEEP = "#09462C";
const ACTIVE_COMPANION = "taco" as const;
const TACO_BENEFITS_CHIP = getCompanionBenefitsChip(ACTIVE_COMPANION);

const WORKSPACE_ROUTE_PREFIXES = [
  "/ambassador/dashboard",
  "/ambassador/training",
] as const;

const ONBOARDING_ROUTE_PREFIXES = [
  "/ambassadors",
  "/programs/ambassadors",
] as const;

const ONBOARDING_GREETING =
  "Hey there! Ready to lead your local community? I am Taco, your personal Ambassador Advocate. Sign up today and I will fetch your personalized referral link, show you how to easily claim your $10 to $20 PetPerks rewards, and track your metrics right from your custom workspace dashboard!";

const WORKSPACE_GREETING =
  "Hey! Taco here — your Ambassador Advocate. Let's grow the pack: referrals, link clicks, PetPerks rewards, and your dashboard metrics. Tap a chip or ask me anything!";

const ONBOARDING_CHIPS = [
  {
    id: "join_pack",
    label: "Join the Pack",
    prompt:
      "I want to become a SitGuru Ambassador. What are the first steps to apply and get my referral tools?",
  },
  {
    id: TACO_BENEFITS_CHIP.id,
    label: TACO_BENEFITS_CHIP.label,
    prompt: TACO_BENEFITS_CHIP.prompt,
  },
  {
    id: "petperks_rewards",
    label: "$10–$20 PetPerks",
    prompt:
      "Tell me about the $10 to $20 PetPerks rewards Ambassadors can claim and how to earn them.",
  },
  {
    id: "referral_link",
    label: "Referral Link",
    prompt:
      "How do I get my personalized referral link and QR code after I sign up?",
  },
  {
    id: "track_metrics",
    label: "Track Metrics",
    prompt:
      "What metrics can I track from my Ambassador workspace dashboard once I'm in?",
  },
  {
    id: "what_ambassadors_do",
    label: "What you do",
    prompt: "What do Ambassadors do?",
  },
] as const;

const WORKSPACE_CHIPS = [
  {
    id: "referrals",
    label: "My Referrals",
    prompt:
      "Summarize my referral activity and what I should focus on to grow the pack this week.",
  },
  {
    id: TACO_BENEFITS_CHIP.id,
    label: TACO_BENEFITS_CHIP.label,
    prompt: TACO_BENEFITS_CHIP.prompt,
  },
  {
    id: "petperks_rewards",
    label: "PetPerks",
    prompt:
      "How am I doing on PetPerks rewards, and how do I claim $10 to $20 rewards?",
  },
  {
    id: "link_clicks",
    label: "Link Clicks",
    prompt:
      "Check my referral link performance and give me one tip to get more clicks.",
  },
  {
    id: "what_ambassadors_do",
    label: "Role refresh",
    prompt: "What do Ambassadors do?",
  },
] as const;

const REWARD_CALLOUTS = [
  "Personalized referral link + QR tools",
  "$10–$20 PetPerks reward opportunities",
  "Live outreach & impact metrics",
  "Campus, community & pet-pro lanes",
] as const;

export type AITacoCompanionProps = {
  mode?: "workspace" | "onboarding" | "auto";
};

function matchesPrefix(pathname: string | null, prefixes: readonly string[]) {
  if (!pathname) return false;
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function asTrimmed(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function AITacoCompanion({
  mode = "auto",
}: AITacoCompanionProps) {
  const pathname = usePathname();
  const resolvedMode =
    mode === "auto"
      ? matchesPrefix(pathname, WORKSPACE_ROUTE_PREFIXES)
        ? "workspace"
        : "onboarding"
      : mode;

  const isOnboarding = resolvedMode === "onboarding";
  const routeEnabled = isOnboarding
    ? matchesPrefix(pathname, ONBOARDING_ROUTE_PREFIXES) ||
      mode === "onboarding"
    : matchesPrefix(pathname, WORKSPACE_ROUTE_PREFIXES) ||
      mode === "workspace";

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCompanion] = useState<typeof ACTIVE_COMPANION>(ACTIVE_COMPANION);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ambassadorName, setAmbassadorName] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const benefitsChip = getCompanionBenefitsChip(activeCompanion);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOnboarding) return;
    let cancelled = false;

    async function loadSession() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session ?? null;
        const user = session?.user ?? null;
        if (!user?.id) return;

        const [{ data: ambassador }, { data: profile }] = await Promise.all([
          supabase
            .from("ambassadors")
            .select("full_name,email")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("full_name,email")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        const name =
          asTrimmed((ambassador as { full_name?: string } | null)?.full_name) ||
          asTrimmed((profile as { full_name?: string } | null)?.full_name) ||
          asTrimmed(user.user_metadata?.full_name) ||
          asTrimmed(user.email?.split("@")[0]) ||
          "Ambassador";

        if (!cancelled) {
          setAccessToken(asTrimmed(session?.access_token));
          setAmbassadorName(name);
        }
      } catch (error) {
        console.error("Taco session load failed:", error);
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [isOnboarding]);

  const greeting = isOnboarding
    ? ONBOARDING_GREETING
    : ambassadorName
      ? `Hey ${ambassadorName.split(/\s+/)[0]}! Taco here — your Ambassador Advocate. Let's grow the pack: referrals, link clicks, PetPerks rewards, and your dashboard metrics.`
      : WORKSPACE_GREETING;
  const chips = isOnboarding ? ONBOARDING_CHIPS : WORKSPACE_CHIPS;
  const tipText = isOnboarding
    ? "Hey! I'm Taco — tap to chat. I'll help you claim PetPerks and grow your pack!"
    : ambassadorName
      ? `Hey ${ambassadorName.split(/\s+/)[0]}! I'm Taco — tap to chat about referrals and rewards.`
      : "Hey! I'm Taco — tap to chat about referrals, PetPerks, and your dashboard.";

  const requestBody = {
    officer: "taco" as const,
    surface: isOnboarding ? ("public" as const) : ("dashboard" as const),
    ...(!isOnboarding && accessToken ? { accessToken } : {}),
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
        id: "taco-hello",
        role: "assistant",
        content: greeting,
      },
    ],
    body: requestBody,
  });

  useEffect(() => {
    setMessages([
      {
        id: `taco-hello-${resolvedMode}-${ambassadorName || "guest"}`,
        role: "assistant",
        content: greeting,
      },
    ]);
  }, [resolvedMode, ambassadorName, greeting, setMessages]);

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

  if (!routeEnabled || !mounted) return null;

  async function runChip(chip: (typeof chips)[number]) {
    setIsOpen(true);

    if (chip.id === COMPANION_BENEFITS_CHIP_ID) {
      const stamp = Date.now();
      setMessages((previous) => [
        ...previous,
        {
          id: `taco-benefits-user-${stamp}`,
          role: "user",
          content: chip.prompt,
        },
        {
          id: `taco-benefits-assistant-${stamp}`,
          role: "assistant",
          content: benefitsChip.response,
        },
      ]);
      window.setTimeout(
        () => inputRef.current?.focus({ preventScroll: true }),
        40,
      );
      return;
    }

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

  return createPortal(
    <div
      className={COMPANION_DOCK_CLASS}
      data-ai-taco-companion
      data-taco-mode={resolvedMode}
    >
      {isOpen ? (
        <div
          className="absolute bottom-[4.75rem] right-0 flex h-[min(30rem,72dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white text-slate-900 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="Taco AI Companion"
        >
          <div
            data-companion-header
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${TACO_BRAND} 0%, ${TACO_BRAND_DEEP} 100%)`,
              backgroundColor: TACO_BRAND,
              color: "#ffffff",
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={TACO_AVATAR.src}
                  alt={TACO_AVATAR.alt}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  style={{
                    backgroundColor: "#fff",
                    objectPosition: TACO_AVATAR.objectPosition,
                  }}
                />
              </span>
              <div className="min-w-0">
                <p
                  className="companion-header-title truncate text-sm font-black tracking-tight !text-white"
                  style={{ color: "#ffffff" }}
                >
                  Taco · Ambassador Advocate
                </p>
                <p
                  className="truncate text-[11px] font-semibold !text-white/90"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  {isOnboarding
                    ? "Your growth & rewards guide"
                    : ambassadorName
                      ? `Helping ${ambassadorName.split(/\s+/)[0]} · your pack only`
                      : "Your growth & rewards guide"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg leading-none text-white transition hover:bg-white/25"
              aria-label="Close Taco AI Companion"
            >
              ×
            </button>
          </div>

          <div
            ref={scrollerRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#f7fbf8] px-4 py-3 text-sm text-slate-700"
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
                        : "whitespace-pre-wrap bg-[#0D5C3A] text-white"
                    }`}
                  >
                    {isAssistant ? (
                      <RogueMarkdownText text={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              );
            })}

            {isOnboarding ? (
              <details className="rounded-2xl border border-emerald-100 bg-white shadow-sm open:pb-0">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    Ambassador advantages
                    <span className="text-[10px] font-bold normal-case tracking-normal text-emerald-600/80">
                      tap to expand
                    </span>
                  </span>
                </summary>
                <ul className="space-y-1.5 border-t border-emerald-50 px-3 pb-3 pt-2">
                  {REWARD_CALLOUTS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs font-semibold text-slate-700"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {isLoading ? (
              <p className="text-xs font-semibold text-emerald-700">
                Taco is fetching your next growth move…
              </p>
            ) : null}
            {error ? (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                Taco hit a snag. Try again in a moment.
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-emerald-50 bg-white px-3 py-2">
            {isOnboarding ? (
              <Link
                href="/programs/ambassadors/apply?type=community&source=taco_companion"
                className="mb-2 flex min-h-10 items-center justify-center rounded-xl bg-[#0D5C3A] px-3 text-xs font-black text-white transition hover:bg-[#09462C]"
              >
                Sign Up & Claim Your Tools
              </Link>
            ) : null}
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => void runChip(chip)}
                  className="shrink-0 rounded-full bg-[#0D5C3A] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#09462C] disabled:cursor-not-allowed disabled:opacity-50"
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
                    ? "Ask Taco about rewards, referrals…"
                    : "Ask Taco about your pack growth…"
                }
                className="max-h-24 min-h-10 flex-1 resize-none overflow-y-auto rounded-xl border border-emerald-100 bg-[#f7fbf8] px-3 py-2 text-sm text-slate-800 outline-none ring-emerald-600/30 placeholder:text-slate-400 focus:ring-2"
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
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#0D5C3A] px-3 text-xs font-black text-white transition hover:bg-[#09462C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          className="homepage-chat-tip"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat with Taco, Ambassador Advocate"
        >
          <span className="homepage-chat-tip__pulse" aria-hidden />
          <span className="homepage-chat-tip__text">{tipText}</span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          isOpen ? "Close Taco AI Companion" : "Open Taco AI Companion"
        }
        aria-expanded={isOpen}
        className="homepage-chat-launcher"
      >
        {isOpen ? (
          <span className="homepage-chat-launcher__icon">×</span>
        ) : (
          <span className="homepage-chat-launcher__icon" aria-hidden>
            {/* Match Rogue SitGuruAvatar: plain img + object-cover fill. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TACO_AVATAR.src}
              alt={TACO_AVATAR.alt}
              width={64}
              height={64}
              className="h-full w-full rounded-full overflow-hidden flex-shrink-0 object-cover"
              style={{
                backgroundColor: "#fff",
                objectPosition: TACO_AVATAR.objectPosition,
              }}
            />
          </span>
        )}
      </button>
    </div>,
    document.body,
  );
}
