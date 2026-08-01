"use client";

/**
 * Pack-themed homepage floating SitGuru AI chat bubble.
 * Streams via Vercel AI SDK useChat → /api/chat/send.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useChat, type Message } from "ai/react";
import {
  parseHomepageChatContent,
  type HomepageCtaDef,
} from "@/lib/chat/homepage-cta";
import {
  SIMULATION_NAME_PROMPT,
  buildActiveAssistanceGreeting,
  buildHomepageSimulationReply,
} from "@/lib/chat/homepage-simulation";

const BRAND_GREEN = "#0D5C3A";
const STORAGE_KEY = "sitguru-homepage-lead-chat";
const NAME_STORAGE_KEY = "sitguru_client_first_name";
const LEGACY_HISTORY_KEY = "sitguru_chat_history";
const SITGURU_AVATAR_SRC = "/images/sitguru-message-avatar.jpg";

const NAME_PROMPT =
  "hey! welcome to the pack 🐾 i'm rogue, your chief treat officer — what should i call you? first name, nickname, whatever you go by works.";

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
  return String(raw || "")
    .replace(/[^a-zA-Z0-9\s'.\-]/g, "")
    .trim()
    .slice(0, 40);
}

function readStoredFirstName(): string {
  try {
    const fromLocal = sanitizeFirstName(
      localStorage.getItem(NAME_STORAGE_KEY) || "",
    );
    if (fromLocal) return fromLocal;
    const fromSession = sanitizeFirstName(
      sessionStorage.getItem(NAME_STORAGE_KEY) || "",
    );
    return fromSession;
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

function buildWelcome(name: string): Message {
  // Named session → skip name collection entirely; open in active assistance.
  if (!name) {
    return {
      id: "welcome-name",
      role: "assistant",
      content: NAME_PROMPT,
    };
  }
  return {
    id: "welcome",
    role: "assistant",
    content: buildActiveAssistanceGreeting(name),
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
      src={SITGURU_AVATAR_SRC}
      alt=""
      width={32}
      height={32}
      className={`rounded-full overflow-hidden flex-shrink-0 object-cover ${className}`}
      aria-hidden="true"
    />
  );
}

function CtaActionButton({ cta }: { cta: HomepageCtaDef }) {
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
  const { text, ctas } = parseHomepageChatContent(content);

  return (
    <div className="space-y-1">
      {text ? <p className="m-0 whitespace-pre-wrap">{text}</p> : null}
      {ctas.length > 0 ? (
        <div className="flex flex-col gap-1.5 pt-1">
          {ctas.map((cta) => (
            <CtaActionButton key={cta.id} cta={cta} />
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
  const [showTip, setShowTip] = useState(true);
  const [clientFirstName, setClientFirstName] = useState("");
  const [awaitingName, setAwaitingName] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const clientFirstNameRef = useRef("");

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
    initialMessages: [buildWelcome("")],
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
          name && content === SIMULATION_NAME_PROMPT
            ? buildActiveAssistanceGreeting(name)
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

  /** Always send the latest preferred name so Rogue can address this participant. */
  function chatRequestOptions() {
    const name = clientFirstNameRef.current || clientFirstName;
    return {
      body: {
        channel: "HOMEPAGE_LEAD",
        client_first_name: name || undefined,
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
        setMessages(parsed.messages);
        setHasUnread(false);
        setShowTip(false);
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

  const showIntentChips = useMemo(
    () => Boolean(clientFirstName) && !awaitingName && !isLoading,
    [clientFirstName, awaitingName, isLoading],
  );

  function openPanel() {
    setOpen(true);
    setHasUnread(false);
    setShowTip(false);
    if (messages.length === 0) {
      const name = clientFirstName || readStoredFirstName();
      setMessages([buildWelcome(name)]);
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
      { id: `user-name-${Date.now()}`, role: "user", content: name },
      {
        id: `assistant-name-${Date.now()}`,
        role: "assistant",
        content: `i am so stoked to guide you through this, ${name}! 🐾 let's get you set up in our pet community — book care or join as a guru whenever you're ready.`,
      },
    ]);
    setInput("");
    return true;
  }

  async function sendChip(content: string) {
    if (!content.trim() || isLoading || awaitingName) return;
    await append({ role: "user", content }, chatRequestOptions());
  }

  function onComposerSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    if (awaitingName || !clientFirstName) {
      captureFirstName(text);
      return;
    }

    handleSubmit(e, chatRequestOptions());
  }

  if (!mounted) return null;

  const streaming = isLoading;

  return (
    <div
      className="homepage-chat-bubble-root"
      style={{ ["--hcb-green" as string]: BRAND_GREEN }}
    >
      {!open && showTip ? (
        <button
          type="button"
          className="homepage-chat-tip"
          onClick={openPanel}
          aria-label="Open SitGuru AI Pack Leader chat"
        >
          <span className="homepage-chat-tip__pulse" aria-hidden />
          <span className="homepage-chat-tip__text">
            Need help? Chat with Rogue, Chief Treat Officer
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
                <SitGuruAvatar className="h-full w-full rounded-full overflow-hidden flex-shrink-0" />
              </span>
              <div className="min-w-0 pr-10">
                <p className="homepage-chat-panel__title">
                  Rogue, Your Chief Treat Officer 🦴
                </p>
                <p className="homepage-chat-panel__sub">
                  Your personalized instant AI Assistant for your SitGuru Pet
                  Community journey.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseChat}
              className="homepage-chat-panel__close absolute top-2 right-2"
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
                    <AssistantBubbleBody content={m.content} />
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
              disabled={streaming}
              placeholder={
                awaitingName
                  ? "Type the name you go by…"
                  : "Ask about care, Gurus, or joining the pack…"
              }
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
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
            <SitGuruAvatar className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0" />
          </span>
        )}
      </button>
    </div>
  );
}
