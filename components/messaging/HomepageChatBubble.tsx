"use client";

/**
 * Pack-themed homepage floating SitGuru AI chat bubble.
 * Streams via Vercel AI SDK useChat → /api/chat/send.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useChat, type Message } from "ai/react";
import { RogueMarkdownText } from "@/components/messaging/RogueMarkdownText";
import { GuruProfileSnapshotCard } from "@/components/messaging/GuruProfileSnapshotCard";
import { SocialFollowPack } from "@/components/messaging/SocialFollowPack";
import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";
import {
  parseHomepageChatContent,
  type HomepageCtaDef,
} from "@/lib/chat/homepage-cta";
import {
  SIMULATION_NAME_PROMPT,
  buildHomepageSimulationReply,
} from "@/lib/chat/homepage-simulation";
import {
  extractVisitorPreferredName,
  formatDisplayName,
  isConversationalGreeting,
  isReservedPreferredName,
  isWellbeingReply,
  sanitizePreferredName,
} from "@/lib/chat/homepage-name";
import {
  clearRogueOpeningGreetingSession,
  isRogueOpeningGreeting,
  pickRogueOpeningGreeting,
  pickRogueReturningGreeting,
  ROGUE_GREETING_PLACEHOLDER,
} from "@/lib/chat/rogue-greetings";
import {
  inferRogueUserTypeFromIntent,
  normalizeRogueUserType,
  persistRogueUserType,
  readStoredRogueUserType,
  type RogueUserTypeLabel,
} from "@/lib/chat/rogue-user-type";
import { supabase } from "@/lib/supabase";
import {
  COMPANION_BENEFITS_USER_PROMPT,
  getCompanionBenefitsChip,
} from "@/lib/companions/companion-benefits";

const BRAND_GREEN = "#0D5C3A";
const STORAGE_KEY = "sitguru-homepage-lead-chat";
const NAME_STORAGE_KEY = "sitguru_client_first_name";
const LEGACY_HISTORY_KEY = "sitguru_chat_history";
const ROGUE_AVATAR_SRC = "/images/rogue-avatar.png";
const ACTIVE_COMPANION = "rogue" as const;
const ROGUE_BENEFITS_CHIP = getCompanionBenefitsChip(ACTIVE_COMPANION);

/** Clean Title Case chip labels for the compact horizontal rail. */
const CARE_INTENT_CHIPS = [
  {
    label: "Drop-in Visits",
    content: "Looking for Drop-in Visits",
  },
  {
    label: "Dog Walks",
    content: "Looking for Dog Walks",
  },
  {
    label: "Overnight",
    content: "Looking for Overnight Stays",
  },
  {
    label: "Boarding",
    content: "Looking for Boarding",
  },
  {
    label: ROGUE_BENEFITS_CHIP.label,
    content: ROGUE_BENEFITS_CHIP.prompt,
  },
] as const;

const JOIN_PACK_CHIPS = [
  {
    label: "Sitter",
    content: "Want to register as a Sitter",
  },
  {
    label: "Dog Walker",
    content: "Want to register as a Dog Walker",
  },
  {
    label: "Trainer",
    content: "Want to register as a Trainer",
  },
] as const;

const AMBASSADOR_CHIPS = [
  {
    label: "Community",
    content: "Want to join as a Community Ambassador",
  },
  {
    label: "Student",
    content: "Want to join as a Student Ambassador",
  },
  {
    label: "Veteran",
    content: "Want to join as a Veteran Ambassador",
  },
] as const;

type IntentChipTone = "care" | "provider" | "ambassador";

const ALL_INTENT_CHIPS: ReadonlyArray<{
  label: string;
  content: string;
  tone: IntentChipTone;
}> = [
  ...CARE_INTENT_CHIPS.map((chip) => ({ ...chip, tone: "care" as const })),
  ...JOIN_PACK_CHIPS.map((chip) => ({ ...chip, tone: "provider" as const })),
  ...AMBASSADOR_CHIPS.map((chip) => ({
    ...chip,
    tone: "ambassador" as const,
  })),
];

const INTENT_CHIP_CLASS =
  "px-4 py-1.5 bg-[#0D5C3A] text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-95 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

function sanitizeFirstName(raw: string): string {
  const extracted = extractVisitorPreferredName(raw);
  if (extracted) return formatDisplayName(extracted);
  const clean = sanitizePreferredName(raw);
  if (!clean || isReservedPreferredName(clean)) return "";
  return formatDisplayName(clean);
}

function readStoredFirstName(): string {
  try {
    const fromLocal = sanitizeFirstName(
      localStorage.getItem(NAME_STORAGE_KEY) || "",
    );
    if (fromLocal && !isReservedPreferredName(fromLocal)) return fromLocal;
    const fromSession = sanitizeFirstName(
      sessionStorage.getItem(NAME_STORAGE_KEY) || "",
    );
    if (fromSession && !isReservedPreferredName(fromSession)) return fromSession;
    // Clear bad persisted values like "Rogue"
    localStorage.removeItem(NAME_STORAGE_KEY);
    sessionStorage.removeItem(NAME_STORAGE_KEY);
    return "";
  } catch {
    return "";
  }
}

function persistFirstName(name: string) {
  const clean = sanitizeFirstName(name);
  if (!clean) return;
  try {
    localStorage.setItem(NAME_STORAGE_KEY, clean);
    sessionStorage.setItem(NAME_STORAGE_KEY, clean);
  } catch {
    // ignore quota
  }
}

function buildWelcome(name: string, opts?: { forceNewGreeting?: boolean }): Message {
  const safe = name && !isReservedPreferredName(name) ? formatDisplayName(name) : "";
  // Named session → skip name collection; open with a fresh returning vibe.
  if (!safe) {
    return {
      id: "welcome-name",
      role: "assistant",
      // Random matrix is selected only after client mount (see useEffect).
      content:
        typeof window === "undefined"
          ? ROGUE_GREETING_PLACEHOLDER
          : pickRogueOpeningGreeting(Boolean(opts?.forceNewGreeting)),
    };
  }
  return {
    id: "welcome",
    role: "assistant",
    content:
      typeof window === "undefined"
        ? ROGUE_GREETING_PLACEHOLDER
        : pickRogueReturningGreeting(safe),
  };
}

/** Pre-mount / SSR-safe first thread message — randomized greeting injected in useEffect. */
function buildGreetingPlaceholder(): Message {
  return {
    id: "welcome-pending",
    role: "assistant",
    content: ROGUE_GREETING_PLACEHOLDER,
  };
}

function SitGuruAvatar({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ROGUE_AVATAR_SRC}
      alt="Rogue"
      width={64}
      height={64}
      className={`rounded-full overflow-hidden flex-shrink-0 object-cover ${className}`}
      style={{ objectPosition: "50% 28%" }}
      aria-hidden="true"
    />
  );
}

function CtaActionButton({ cta }: { cta: HomepageCtaDef }) {
  if (cta.socialPack) {
    return <SocialFollowPack source="rogue_homepage_chat" />;
  }
  const external = /^https?:\/\//i.test(cta.href);
  if (external) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-2 text-center text-sm font-medium text-white transition-all hover:bg-opacity-90"
      >
        {cta.label}
      </a>
    );
  }
  return (
    <Link
      href={cta.href}
      className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-2 text-center text-sm font-medium text-white transition-all hover:bg-opacity-90"
    >
      {cta.label}
    </Link>
  );
}

function AssistantBubbleBody({ content }: { content: string }) {
  let text = "";
  let ctas: HomepageCtaDef[] = [];
  let guruCards: ReturnType<typeof parseHomepageChatContent>["guruCards"] = [];

  try {
    const parsed = parseHomepageChatContent(content);
    text = parsed.text;
    ctas = parsed.ctas;
    guruCards = parsed.guruCards;
  } catch {
    // Last-resort strip so a parser failure never paints raw tokens.
    text = String(content || "")
      .replace(/\[\[\s*guru_card\s*:[\s\S]*?\]\]/gi, " ")
      .replace(/\[\[\s*guru_card\s*:[^\[]*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    <div className="space-y-1">
      {text ? (
        <SafeAssistantBubble contentHint={content}>
          <RogueMarkdownText text={text} />
        </SafeAssistantBubble>
      ) : null}
      {guruCards.length > 0 ? (
        <div className="flex flex-col gap-2 pt-1">
          {guruCards.map((guru) => (
            <SafeAssistantBubble key={guru.slug} contentHint={guru.slug}>
              <GuruProfileSnapshotCard guru={guru} />
            </SafeAssistantBubble>
          ))}
        </div>
      ) : null}
      {ctas.length > 0 ? (
        <div className="flex flex-col gap-1.5 pt-1">
          {ctas.map((cta) => (
            <SafeAssistantBubble key={cta.id} contentHint={cta.id}>
              <CtaActionButton cta={cta} />
            </SafeAssistantBubble>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AssistantRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end gap-2 ${className}`.trim()}>
      <SitGuruAvatar className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

async function auditTranscriptToBackend(params: {
  messages: Message[];
  clientFirstName: string;
}) {
  try {
    await fetch("/api/chat/homepage-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auditTranscript: true,
        client_first_name: params.clientFirstName || undefined,
        history: params.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        message: "[session_closed]",
      }),
      keepalive: true,
    });
  } catch {
    // never block UI close on audit
  }
}

export default function HomepageChatBubble() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [clientFirstName, setClientFirstName] = useState("");
  const [awaitingName, setAwaitingName] = useState(false);
  const [userType, setUserType] = useState<RogueUserTypeLabel>("Guest Pet Parent");
  const [activeCompanion] = useState<typeof ACTIVE_COMPANION>(ACTIVE_COMPANION);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const clientFirstNameRef = useRef("");
  const userTypeRef = useRef<RogueUserTypeLabel>("Guest Pet Parent");
  const benefitsChip = getCompanionBenefitsChip(activeCompanion);

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
  } = useChat({
    api: "/api/chat/send",
    // Stable placeholder — real randomized matrix greeting is injected after mount.
    initialMessages: [buildGreetingPlaceholder()],
    body: {
      channel: "HOMEPAGE_LEAD",
    },
    onError: () => {
      // Never re-ask for a name when session already has one; prefer chip-aware sim.
      setMessages((prev) => {
        const lastUser = [...prev].reverse().find((m) => m.role === "user");
        const name = clientFirstNameRef.current || readStoredFirstName();
        const content = buildHomepageSimulationReply({
          clientFirstName: name || undefined,
          lastUserText: lastUser?.content || undefined,
        });
        // Guard: named visitors must never see the name-collection fallback string.
        const safeContent =
          name &&
          (content === SIMULATION_NAME_PROMPT || isRogueOpeningGreeting(content))
            ? pickRogueReturningGreeting(name)
            : content;
        return [
          ...prev,
          {
            id: `sim-${Date.now()}`,
            role: "assistant" as const,
            content: safeContent,
          },
        ];
      });
    },
  });

  useEffect(() => {
    clientFirstNameRef.current = clientFirstName;
  }, [clientFirstName]);

  useEffect(() => {
    userTypeRef.current = userType;
    persistRogueUserType(userType);
  }, [userType]);

  function setRogueUserType(next: RogueUserTypeLabel) {
    userTypeRef.current = next;
    setUserType(next);
  }

  /** Always send the latest preferred name + audience type so Rogue can adapt. */
  function chatRequestOptions() {
    const name = clientFirstNameRef.current || clientFirstName;
    const role = userTypeRef.current || userType || "Guest Pet Parent";
    return {
      body: {
        channel: "HOMEPAGE_LEAD",
        client_first_name: name || undefined,
        user_role: role,
        user_type: role,
        userRole: role,
      },
    };
  }

  useEffect(() => {
    setMounted(true);

    const storedName = readStoredFirstName();
    if (storedName) {
      setClientFirstName(storedName);
      setAwaitingName(false);
    } else {
      setAwaitingName(true);
    }

    const storedType = readStoredRogueUserType();
    setRogueUserType(storedType);

    // Resolve logged-in SitGuru role when available (Guest Pet Parent otherwise).
    void (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .limit(5);
        const primary =
          roles?.map((r) => String(r.role || "")).find(Boolean) || "";
        if (primary) {
          setRogueUserType(normalizeRogueUserType(primary));
        }
      } catch {
        // stay on guest / stored type
      }
    })();

    // Client-only: inject randomized Rogue greeting as the first assistant message.
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setMessages([buildWelcome(storedName)]);
        return;
      }
      const parsed = JSON.parse(raw) as {
        messages?: Message[];
        client_first_name?: string;
      };
      const restoredName =
        sanitizeFirstName(parsed.client_first_name || "") || storedName;
      if (restoredName) {
        setClientFirstName(restoredName);
        setAwaitingName(false);
      }
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        const onlyPlaceholder =
          parsed.messages.length === 1 &&
          parsed.messages[0]?.role === "assistant" &&
          (parsed.messages[0]?.content === ROGUE_GREETING_PLACEHOLDER ||
            !String(parsed.messages[0]?.content || "").trim());
        if (onlyPlaceholder) {
          setMessages([buildWelcome(restoredName)]);
        } else {
          setMessages(parsed.messages);
          setHasUnread(false);
        }
      } else {
        setMessages([buildWelcome(restoredName)]);
      }
    } catch {
      setMessages([buildWelcome(storedName)]);
    }
  }, [setMessages]);

  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          messages,
          client_first_name: clientFirstName || undefined,
        }),
      );
    } catch {
      // ignore quota
    }
  }, [mounted, messages, clientFirstName]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open]);

  /** Keep the composer focused so visitors can type the next message without re-clicking. */
  function focusComposer(delayMs = 0) {
    if (!open) return;
    window.setTimeout(() => {
      const el = inputRef.current;
      if (!el || el.disabled) return;
      el.focus({ preventScroll: true });
    }, delayMs);
  }

  // After Rogue finishes streaming (or any load ends), restore caret to the input.
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (!open) {
      wasLoadingRef.current = false;
      return;
    }
    if (wasLoadingRef.current && !isLoading) {
      focusComposer(30);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, open]);

  const showIntentChips = useMemo(
    () => Boolean(clientFirstName) && !awaitingName && !isLoading,
    [clientFirstName, awaitingName, isLoading],
  );

  function openPanel() {
    setOpen(true);
    setHasUnread(false);
    const onlyPlaceholder =
      messages.length === 0 ||
      (messages.length === 1 &&
        messages[0]?.role === "assistant" &&
        (messages[0]?.content === ROGUE_GREETING_PLACEHOLDER ||
          !String(messages[0]?.content || "").trim()));
    if (onlyPlaceholder) {
      const name = clientFirstName || readStoredFirstName();
      setMessages([buildWelcome(name, { forceNewGreeting: true })]);
      setAwaitingName(!name);
    }
  }

  function handleCloseChat() {
    const confirmClose = window.confirm(
      "Are you sure you want to close this conversation? Your chat history will be cleared.",
    );

    if (!confirmClose) return;

    void auditTranscriptToBackend({
      messages,
      clientFirstName: clientFirstNameRef.current,
    });

    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_HISTORY_KEY);
      clearRogueOpeningGreetingSession();
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function captureFirstName(raw: string) {
    const name = sanitizeFirstName(raw);
    if (!name) return false;
    persistFirstName(name);
    clientFirstNameRef.current = name;
    setClientFirstName(name);
    setAwaitingName(false);
    setMessages((prev) => [
      ...prev,
      { id: `user-name-${Date.now()}`, role: "user", content: raw.trim() },
      {
        id: `assistant-name-${Date.now()}`,
        role: "assistant",
        content: `so nice to meet you, ${name}! 🐾 i'm Rogue — your adorable assistant — and i'm doing great. how are you today? whenever you're ready we can book care, meet a Pet Guru, or explore joining the pack.`,
      },
    ]);
    setInput("");
    focusComposer(40);
    return true;
  }

  function replyWhileAwaitingName(raw: string) {
    const text = raw.trim();
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: text },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: buildHomepageSimulationReply({
          clientFirstName: undefined,
          lastUserText: text,
        }),
      },
    ]);
    setInput("");
    focusComposer(40);
  }

  async function sendChip(content: string) {
    if (!content.trim() || isLoading || awaitingName) return;

    if (
      content === benefitsChip.prompt ||
      content === COMPANION_BENEFITS_USER_PROMPT.rogue
    ) {
      const stamp = Date.now();
      setMessages((previous) => [
        ...previous,
        {
          id: `rogue-benefits-user-${stamp}`,
          role: "user",
          content: benefitsChip.prompt,
        },
        {
          id: `rogue-benefits-assistant-${stamp}`,
          role: "assistant",
          content: benefitsChip.response,
        },
      ]);
      focusComposer(40);
      return;
    }

    const inferred = inferRogueUserTypeFromIntent(content);
    if (inferred) setRogueUserType(inferred);
    await append({ role: "user", content }, chatRequestOptions());
    focusComposer(40);
  }

  function onComposerSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    if (awaitingName || !clientFirstName) {
      // Never treat "Hi Rogue" / greetings / reserved names as their name.
      if (
        isConversationalGreeting(text) ||
        isWellbeingReply(text) ||
        isReservedPreferredName(text)
      ) {
        replyWhileAwaitingName(text);
        return;
      }

      const extracted = extractVisitorPreferredName(text);
      if (extracted) {
        captureFirstName(extracted);
        return;
      }

      // Stay interactive, but keep collecting a real preferred name.
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", content: text },
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: buildHomepageSimulationReply({
            clientFirstName: undefined,
            lastUserText: text,
          }),
        },
      ]);
      setInput("");
      focusComposer(40);
      return;
    }

    const inferred = inferRogueUserTypeFromIntent(text);
    if (inferred) setRogueUserType(inferred);
    handleSubmit(e, chatRequestOptions());
    // Input is disabled while streaming; refocus as soon as Rogue finishes (effect below).
    focusComposer(40);
  }

  if (!mounted) return null;

  const streaming = isLoading;

  return (
    <div
      className="homepage-chat-bubble-root"
      style={{ ["--hcb-green" as string]: BRAND_GREEN }}
    >
      {!open ? (
        <button
          type="button"
          className="homepage-chat-tip"
          onClick={openPanel}
          aria-label="Open chat with Rogue, Your Chief Treat Officer"
        >
          <span className="homepage-chat-tip__pulse" aria-hidden />
          <span className="homepage-chat-tip__text">
            Hi! I&apos;m Rogue 🦴 Tap to chat — I&apos;m your adorable assistant
            for the SitGuru journey!
          </span>
        </button>
      ) : null}

      {open ? (
        <div
          className="homepage-chat-panel fixed inset-0 z-50 flex h-full w-full flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] sm:rounded-2xl sm:shadow-2xl"
          role="dialog"
          aria-label="Rogue, Your Chief Treat Officer chat"
        >
          <header className="homepage-chat-panel__header relative shrink-0">
            <div className="homepage-chat-panel__brand">
              <span
                className="homepage-chat-panel__avatar homepage-chat-panel__avatar--dog"
                aria-hidden
              >
                <SitGuruAvatar className="!h-full !w-full max-h-full max-w-full rounded-full" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="homepage-chat-panel__title">
                  Rogue, Your Chief Treat Officer 🦴
                </p>
                <p className="homepage-chat-panel__sub">
                  I&apos;m your adorable assistant here during your SitGuru
                  journey 🐾
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseChat}
              className="homepage-chat-panel__close absolute top-2 right-2 z-10"
              aria-label="Close chat and clear history"
              title="Close conversation"
            >
              <X className="h-5 w-5 text-white" aria-hidden="true" />
            </button>
          </header>

          <div
            className="homepage-chat-panel__messages min-h-0 flex-1"
            ref={listRef}
          >
            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div
                    key={m.id}
                    className="homepage-chat-bubble homepage-chat-bubble--user"
                  >
                    {m.content}
                  </div>
                );
              }

              if (m.role !== "assistant") return null;
              if (!m.content && streaming) return null;

              return (
                <AssistantRow key={m.id}>
                  <div className="homepage-chat-bubble homepage-chat-bubble--ai">
                    <SafeAssistantBubble contentHint={m.content}>
                      <AssistantBubbleBody content={m.content} />
                    </SafeAssistantBubble>
                  </div>
                </AssistantRow>
              );
            })}

            {streaming ? (
              <AssistantRow>
                <div
                  className="homepage-chat-bubble homepage-chat-bubble--ai homepage-chat-typing"
                  aria-live="polite"
                >
                  <span />
                  <span />
                  <span />
                </div>
              </AssistantRow>
            ) : null}
          </div>

          {showIntentChips ? (
            <div
              className="flex shrink-0 flex-row items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-gray-100 bg-gray-50 p-2 scrollbar-none"
              role="toolbar"
              aria-label="Quick intents"
            >
              {ALL_INTENT_CHIPS.map((chip) => (
                <button
                  key={`${chip.tone}-${chip.label}`}
                  type="button"
                  disabled={streaming}
                  onClick={() => void sendChip(chip.content)}
                  className={INTENT_CHIP_CLASS}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="homepage-chat-panel__composer shrink-0"
            onSubmit={onComposerSubmit}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              placeholder={
                awaitingName
                  ? "Type the name you go by…"
                  : "Ask about care, Gurus, or joining the pack…"
              }
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (streaming) return;
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="homepage-chat-launcher"
        onClick={() => (open ? handleCloseChat() : openPanel())}
        aria-label={
          open ? "Close SitGuru AI Concierge" : "Open SitGuru AI Pack Leader"
        }
        aria-expanded={open}
      >
        {hasUnread && !open ? (
          <span className="homepage-chat-launcher__badge" aria-hidden />
        ) : null}
        {open ? (
          <span className="homepage-chat-launcher__icon">×</span>
        ) : (
          <span className="homepage-chat-launcher__icon" aria-hidden>
            <SitGuruAvatar className="h-full w-full rounded-full overflow-hidden flex-shrink-0" />
          </span>
        )}
      </button>
    </div>
  );
}
