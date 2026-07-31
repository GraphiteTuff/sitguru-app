"use client";

/**
 * Pack-themed homepage floating SitGuru AI chat bubble.
 * Streams via Vercel AI SDK useChat → /api/chat/send.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useChat, type Message } from "ai/react";
import {
  parseHomepageChatContent,
  type HomepageCtaDef,
} from "@/lib/chat/homepage-cta";

const BRAND_GREEN = "#0D5C3A";
const STORAGE_KEY = "sitguru-homepage-lead-chat";
const SITGURU_AVATAR_SRC = "/images/sitguru-message-avatar.jpg";

const FRIENDLY_STATIC_ERROR =
  "details got a little twisted! let's shake it off and try that again, or bark at us directly at pack@sitguru.com";

const CARE_INTENT_CHIPS = [
  {
    label: "🪟 Drop-in Visits",
    content: "Looking for Drop-in Visits",
  },
  {
    label: "🦮 Dog Walks",
    content: "Looking for Dog Walks",
  },
  {
    label: "🌙 Overnight",
    content: "Looking for Overnight Stays",
  },
] as const;

const JOIN_PACK_CHIPS = [
  {
    label: "🏡 Sitter",
    content: "Want to register as a Sitter",
  },
  {
    label: "🏃‍♂️ Dog Walker",
    content: "Want to register as a Dog Walker",
  },
  {
    label: "🎓 Trainer",
    content: "Want to register as a Trainer",
  },
] as const;

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I'm the Chief Treat Officer. I can help with pet care bookings, becoming a Guru, or Ambassadors and PawPerks. What can I help with today?",
};

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

export default function HomepageChatBubble() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [showTip, setShowTip] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const restoredRef = useRef(false);

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
  } = useChat({
    api: "/api/chat/send",
    initialMessages: [WELCOME],
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: FRIENDLY_STATIC_ERROR,
        },
      ]);
    },
  });

  useEffect(() => {
    setMounted(true);

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { messages?: Message[] };
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        setMessages(parsed.messages);
        setHasUnread(false);
        setShowTip(false);
        restoredRef.current = true;
      }
    } catch {
      // ignore corrupt session
    }
  }, [setMessages]);

  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages }));
    } catch {
      // ignore quota
    }
  }, [mounted, messages]);

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

  function openPanel() {
    setOpen(true);
    setHasUnread(false);
    setShowTip(false);
    if (messages.length === 0) {
      setMessages([WELCOME]);
    }
  }

  function handleCloseChat() {
    const confirmClose = window.confirm(
      "Are you sure you want to close this conversation? Your chat history will be cleared.",
    );

    if (!confirmClose) return;

    // 1. Wipe current messages
    setMessages([]);

    // 2. Clear persisted conversation cache
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("sitguru_chat_history");
    } catch {
      // ignore storage access errors
    }

    // 3. Close the visual UI window
    setOpen(false);
  }

  async function sendChip(content: string) {
    if (!content.trim() || isLoading) return;
    await append({ role: "user", content });
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
            Need help? Chat with the Chief Treat Officer
          </span>
        </button>
      ) : null}

      {open ? (
        <div
          className="homepage-chat-panel"
          role="dialog"
          aria-label="SitGuru AI Concierge chat"
        >
          <header className="homepage-chat-panel__header">
            <div className="homepage-chat-panel__brand">
              <span
                className="homepage-chat-panel__avatar homepage-chat-panel__avatar--dog"
                aria-hidden
              >
                <SitGuruAvatar className="h-full w-full rounded-full overflow-hidden flex-shrink-0" />
              </span>
              <div className="min-w-0">
                <p className="homepage-chat-panel__title">
                  The Chief Treat Officer • Active
                </p>
                <p className="homepage-chat-panel__sub">
                  {streaming
                    ? "Finding a helpful answer…"
                    : "Professional, brief, warm support"}
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

          <div className="homepage-chat-panel__messages" ref={listRef}>
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

              if (!m.content && streaming) {
                return null;
              }

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

          <div className="flex flex-col gap-2 border-b border-t border-gray-100 bg-gray-50 p-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Book Pet Care
              </span>
              <div className="flex flex-wrap gap-1">
                {CARE_INTENT_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={streaming}
                    onClick={() => void sendChip(chip.content)}
                    className="rounded-full border border-green-600 bg-white px-2.5 py-1 text-xs text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Join as a Provider
              </span>
              <div className="flex flex-wrap gap-1">
                {JOIN_PACK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={streaming}
                    onClick={() => void sendChip(chip.content)}
                    className="rounded-full border border-blue-600 bg-white px-2.5 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form
            className="homepage-chat-panel__composer"
            onSubmit={handleSubmit}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              disabled={streaming}
              placeholder="Ask about care, Gurus, or joining the pack…"
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) {
                    form.requestSubmit();
                  }
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
