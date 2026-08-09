"use client";

/**
 * Route-aware AI companion host.
 * - `/become-a-guru` (and Guru workspace) → Scout
 * - `/ambassadors` (and Ambassador workspace) → Taco
 * Public surfaces never call useGuruAuth / never wait on a session.
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "ai/react";
import { useGuruAuth, type GuruAuthUser } from "@/hooks/useGuruAuth";
import AITacoCompanion from "@/components/officers/AITacoCompanion";
import HomepageChatBubble from "@/components/messaging/HomepageChatBubble";
import { RogueMarkdownText } from "@/components/messaging/RogueMarkdownText";
import {
  COMPANION_DOCK_CLASS,
  SCOUT_AVATAR,
} from "@/lib/companions/avatar-assets";
import {
  getBotConfig,
  resolvePublicFormVariant,
  type CompanionLayoutMode,
} from "@/lib/companions/bot-config";
import {
  COMPANION_BENEFITS_CHIP_ID,
  getCompanionBenefitsChip,
} from "@/lib/companions/companion-benefits";

const SCOUT_BRAND = "#047857";
const SCOUT_BRAND_DEEP = "#065f46";
const ACTIVE_COMPANION = "scout" as const;
const SCOUT_BENEFITS_CHIP = getCompanionBenefitsChip(ACTIVE_COMPANION);

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

const PUBLIC_CHIPS = [
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
    id: SCOUT_BENEFITS_CHIP.id,
    label: SCOUT_BENEFITS_CHIP.label,
    prompt: SCOUT_BENEFITS_CHIP.prompt,
  },
  {
    id: "payments_work",
    label: "Payments",
    prompt: "How do payments work?",
  },
] as const;

const PUBLIC_GREETING =
  "Hi! I'm Scout, your Guru Matching Officer. Don't worry about onboarding—I'm right here to guide you through our profile steps, handle background check questions, and unlock your local pet care earnings window!";

export type ScoutCompanionMode = CompanionLayoutMode;

export type AIScoutCompanionProps = {
  mode?: CompanionLayoutMode;
  /** Optional path override (Layout passes this; falls back to usePathname / window). */
  currentPath?: string | null;
};

function buildWorkspaceGreeting(firstName: string) {
  return `Hi ${firstName}! I'm your Scout AI Companion. How can I assist you with your dashboard schedule today?`;
}

type ScoutShellProps = {
  isPublic: boolean;
  user: GuruAuthUser | null;
  loading: boolean;
};

function ScoutCompanionShell({ isPublic, user, loading }: ScoutShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCompanion] = useState<typeof ACTIVE_COMPANION>(ACTIVE_COMPANION);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const firstName = user?.firstName || "Guru";
  const greeting = isPublic
    ? PUBLIC_GREETING
    : buildWorkspaceGreeting(firstName);
  const benefitsChip = getCompanionBenefitsChip(activeCompanion);
  const chips = isPublic ? PUBLIC_CHIPS : WORKSPACE_CHIPS;
  const tipText = isPublic
    ? "Hi! I'm Scout — tap to chat. I'll guide your Guru setup, checks, and earnings path!"
    : `Hi ${firstName}! I'm Scout — tap to chat about your schedule, trails, and payouts.`;

  const requestBody = {
    officer: "scout" as const,
    companion: "scout" as const,
    pagePath: pathname || (isPublic ? "/become-a-guru" : "/guru/dashboard"),
    surface: isPublic ? ("public" as const) : ("dashboard" as const),
    ...(!isPublic && user?.accessToken
      ? { accessToken: user.accessToken }
      : {}),
    ...(!isPublic && user?.guruId ? { providerId: user.guruId } : {}),
    ...(!isPublic && user?.name ? { guruName: user.name } : {}),
    ...(!isPublic && user?.email ? { guruEmail: user.email } : {}),
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
    if (isPublic) {
      setMessages([
        {
          id: "scout-public-hello",
          role: "assistant",
          content: PUBLIC_GREETING,
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
  }, [isPublic, user?.id, user?.guruId, user?.firstName, setMessages]);

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

  async function runChip(chip: (typeof chips)[number]) {
    setIsOpen(true);

    if (chip.id === COMPANION_BENEFITS_CHIP_ID) {
      const stamp = Date.now();
      setMessages((previous) => [
        ...previous,
        {
          id: `scout-benefits-user-${stamp}`,
          role: "user",
          content: chip.prompt,
        },
        {
          id: `scout-benefits-assistant-${stamp}`,
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

  return (
    <>
      {isOpen ? (
        <div
          className="absolute bottom-[4.75rem] right-0 flex h-[min(28rem,70dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white text-slate-900 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="Scout AI Companion"
          data-scout-public={isPublic ? "true" : "false"}
        >
          <div
            data-companion-header
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${SCOUT_BRAND} 0%, ${SCOUT_BRAND_DEEP} 100%)`,
              backgroundColor: SCOUT_BRAND,
              color: "#ffffff",
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SCOUT_AVATAR.src}
                  alt={SCOUT_AVATAR.alt}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  style={{
                    backgroundColor: "#fff",
                    objectPosition: SCOUT_AVATAR.objectPosition,
                  }}
                />
              </span>
              <div className="min-w-0">
                <p
                  className="companion-header-title truncate text-sm font-black tracking-tight !text-white"
                  style={{ color: "#ffffff" }}
                >
                  {isPublic
                    ? "Scout · Guru Matching Officer"
                    : "Scout AI Companion"}
                </p>
                <p
                  className="truncate text-[11px] font-semibold !text-white/90"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  {isPublic
                    ? "Here to get you set up & earning"
                    : loading
                      ? "Connecting to your Guru workspace…"
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
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#f7fffb] px-4 py-3 text-sm text-slate-700"
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
                        : "whitespace-pre-wrap bg-emerald-700 text-white"
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
            {isLoading ? (
              <p className="text-xs font-semibold text-emerald-700">
                {isPublic
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
            {isPublic ? (
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
                  isPublic
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

      {!isOpen ? (
        <button
          type="button"
          className="homepage-chat-tip"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat with Scout, Guru Matching Officer"
        >
          <span className="homepage-chat-tip__pulse" aria-hidden />
          <span className="homepage-chat-tip__text">{tipText}</span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          isOpen ? "Close Scout AI Companion" : "Open Scout AI Companion"
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
              src={SCOUT_AVATAR.src}
              alt={SCOUT_AVATAR.alt}
              width={64}
              height={64}
              className="h-full w-full rounded-full overflow-hidden flex-shrink-0 object-cover"
              style={{
                backgroundColor: "#fff",
                objectPosition: SCOUT_AVATAR.objectPosition,
              }}
            />
          </span>
        )}
      </button>
    </>
  );
}

/** Public Become a Guru widget — no useGuruAuth / session gate. */
function PublicScoutCompanionWidget() {
  return <ScoutCompanionShell isPublic user={null} loading={false} />;
}

/** Authenticated Guru dashboard widget — personalizes after session loads. */
function WorkspaceScoutCompanionWidget() {
  const { user, loading } = useGuruAuth();
  return <ScoutCompanionShell isPublic={false} user={user} loading={loading} />;
}

/**
 * Explicit public form-route entry map (contact + onboarding shells):
 * - public-guru → scout
 * - public-ambassador → taco
 * - public-parent → rogue
 * (implemented via resolvePublicFormVariant in bot-config)
 */

/** Standard main-branch dock: fixed bottom-right, high z-index, body portal. */
function portalCompanionDock(
  children: ReactNode,
  attrs: Record<string, string>,
) {
  return createPortal(
    <div className={COMPANION_DOCK_CLASS} {...attrs}>
      {children}
    </div>,
    document.body,
  );
}

function AIScoutCompanion({
  mode = "auto",
  currentPath,
}: AIScoutCompanionProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const resolvedPath =
    currentPath ||
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "");

  // Prefer explicit public form modes, then path/workspace auto-detect.
  const publicVariant = resolvePublicFormVariant(mode);
  const bot = getBotConfig({ mode, currentPath: resolvedPath });
  const variant = publicVariant ?? bot.variant;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !variant) return null;
  if (!publicVariant && !bot.shouldRender) return null;

  // public-ambassador → Taco (companion already portals with COMPANION_DOCK_CLASS).
  if (variant === "taco") {
    return (
      <AITacoCompanion
        mode={
          bot.surface === "workspace" || mode === "ambassador-workspace"
            ? "workspace"
            : "onboarding"
        }
      />
    );
  }

  // public-parent → Rogue at the standard bottom-right body portal.
  if (variant === "rogue") {
    return portalCompanionDock(<HomepageChatBubble />, {
      "data-ai-rogue-companion": "true",
      "data-bot-variant": "rogue",
      "data-companion-mode": mode || "public-parent",
      "data-companion-path": resolvedPath,
    });
  }

  // public-guru → Scout at the standard bottom-right body portal.
  const isPublic =
    mode === "public-guru" || bot.surface === "public-guru";

  return portalCompanionDock(
    isPublic ? (
      <PublicScoutCompanionWidget />
    ) : (
      <WorkspaceScoutCompanionWidget />
    ),
    {
      "data-ai-scout-companion": "true",
      "data-scout-mode": isPublic
        ? "public-guru"
        : (bot.surface ?? "workspace"),
      "data-scout-public": isPublic ? "true" : "false",
      "data-bot-variant": "scout",
      "data-companion-path": resolvedPath,
    },
  );
}

export { AIScoutCompanion };
export default AIScoutCompanion;
