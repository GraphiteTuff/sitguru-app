"use client";

/**
 * Pack-themed homepage floating SitGuru AI chat bubble.
 * Lead funnel capture with Claude SSE via /api/chat/homepage-lead.
 */

import {
  useEffect,
  useRef,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  parseHomepageChatContent,
  type HomepageCtaDef,
} from "@/lib/chat/homepage-cta";

type ChatRole = "user" | "assistant" | "system";

type BubbleMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const BRAND_GREEN = "#0D5C3A";
const STORAGE_KEY = "sitguru-homepage-lead-chat";
const SITGURU_AVATAR_SRC = "/images/sitguru-message-avatar.jpg";

/** Single user-facing fallback — never surface raw API / 404 / JSON traces */
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

const WELCOME: BubbleMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I'm the Chief Treat Officer. I can help with pet care bookings, becoming a Guru, or Ambassadors and PawPerks. What can I help with today?",
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function looksLikeDevTrace(text: string): boolean {
  const t = String(text || "").trim();
  if (!t) return true;
  return (
    /\b(404|401|403|500|502|503)\b/i.test(t) ||
    /not found|unauthorized|invalid.?key|api.?key|json|stack|fetch failed|chat failed|stream error|anthropic|claude|connection_issue/i.test(
      t,
    ) ||
    t.startsWith("{") ||
    t.startsWith("[")
  );
}

function toFriendlyChatError(_raw?: unknown): string {
  return FRIENDLY_STATIC_ERROR;
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

export default function HomepageChatBubble() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BubbleMessage[]>([WELCOME]);
  const [conversationId, setConversationId] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [showTip, setShowTip] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMounted(true);

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        conversationId?: string;
        messages?: BubbleMessage[];
      };
      if (parsed.conversationId) setConversationId(parsed.conversationId);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        setMessages(parsed.messages);
        setHasUnread(false);
        setShowTip(false);
      }
    } catch {
      // ignore corrupt session
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ conversationId, messages }),
      );
    } catch {
      // ignore quota
    }
  }, [mounted, conversationId, messages]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open]);

  function openPanel() {
    setOpen(true);
    setHasUnread(false);
    setShowTip(false);
  }

  function closePanel() {
    setOpen(false);
  }

  /** Put friendly copy ONLY in the assistant bubble — never a second red alert. */
  function paintFriendlyFailure(assistantId: string) {
    const failText = toFriendlyChatError();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId ? { ...m, content: failText } : m,
      ),
    );
  }

  async function sendMessage(overrideText?: string) {
    const text = String(overrideText ?? input).trim();
    if (!text || streaming) return;

    setInput("");
    const userMsg: BubbleMessage = {
      id: uid(),
      role: "user",
      content: text,
    };
    const historyForApi = [...messages, userMsg]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const assistantId = uid();
    startTransition(() => {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setStreaming(true);
      setTyping(true);
    });

    try {
      const res = await fetch("/api/chat/homepage-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
          history: historyForApi.slice(0, -1),
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        paintFriendlyFailure(assistantId);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";
      let sawDelta = false;
      let sawStreamError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;

          let data: Record<string, unknown>;
          try {
            data = JSON.parse(payload) as Record<string, unknown>;
          } catch {
            continue;
          }

          const type = String(data.type || "");
          if (type === "meta" && typeof data.conversationId === "string") {
            setConversationId(data.conversationId);
            continue;
          }
          if (type === "delta" && typeof data.text === "string") {
            sawDelta = true;
            setTyping(false);
            assembled += data.text;
            const snapshot = assembled;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: snapshot } : m,
              ),
            );
            continue;
          }
          if (type === "error") {
            sawStreamError = true;
            paintFriendlyFailure(assistantId);
          }
        }
      }

      if (sawStreamError) {
        // already painted once — do not re-append
      } else if (!sawDelta && !assembled.trim()) {
        paintFriendlyFailure(assistantId);
      } else if (assembled && looksLikeDevTrace(assembled)) {
        paintFriendlyFailure(assistantId);
      }
    } catch {
      paintFriendlyFailure(assistantId);
    } finally {
      setStreaming(false);
      setTyping(false);
    }
  }

  if (!mounted) return null;

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
                  {streaming || typing
                    ? "Finding a helpful answer…"
                    : "Professional, brief, warm support"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="homepage-chat-panel__close"
              onClick={closePanel}
              aria-label="Close chat"
            >
              ×
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

            {typing ? (
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
            {/* Row 1: Care Inquiries */}
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
                    onClick={() => void sendMessage(chip.content)}
                    className="rounded-full border border-green-600 bg-white px-2.5 py-1 text-xs text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Service Provider Inquiries */}
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
                    onClick={() => void sendMessage(chip.content)}
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
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              disabled={streaming}
              placeholder="Ask about care, Gurus, or joining the pack…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
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
        onClick={() => (open ? closePanel() : openPanel())}
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
