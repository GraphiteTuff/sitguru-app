"use client";

/**
 * Floating Delilah admin assistant — ambassador / influencer social tracking.
 * Streams via Vercel AI SDK useChat → /api/admin/delilah-ai.
 * Docks bottom-left so it never collides with Rogue (bottom-right).
 */

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useChat } from "ai/react";
import { Maximize2, Minimize2, X } from "lucide-react";

const BRAND_GREEN = "#0D5C3A";
const BRAND_GREEN_DEEP = "#09462C";
const DELILAH_ACCENT = "#5C3A0D";

const HEADER_BANNER_STYLE: CSSProperties = {
  backgroundImage: `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DEEP} 55%, ${DELILAH_ACCENT} 100%)`,
  backgroundColor: BRAND_GREEN,
  color: "#ffffff",
  borderBottom: "0",
};

const HEADER_TITLE_STYLE: CSSProperties = {
  color: "#ffffff",
  WebkitTextFillColor: "#ffffff",
  opacity: 1,
  visibility: "visible",
};

const HEADER_SUB_STYLE: CSSProperties = {
  color: "rgba(255, 255, 255, 0.95)",
  WebkitTextFillColor: "rgba(255, 255, 255, 0.95)",
  opacity: 1,
  visibility: "visible",
};

const HELLO =
  "**Delilah reporting for ambassador duty.** Ask me for live influencer follower deltas, new followers today by handle, or a per-platform growth sniff.";

const TIP =
  "Delilah here — tap for live ambassador / influencer follower tracking.";

const QUICK_CHIPS = [
  {
    id: "brand_vs_note",
    label: "How I work",
    prompt:
      "Remind me how to ask you for an ambassador's new followers today, and when I should use Rogue for brand @SitGuruOfficial totals instead.",
  },
  {
    id: "example_ig",
    label: "IG by handle",
    prompt:
      "Show me how you'd fetch Instagram new followers today for an ambassador. Ask me for their handle if needed, then call fetchLiveSocialFollowers with scope ambassador.",
  },
] as const;

const CHIP_CLASS =
  "px-4 py-1.5 bg-[#0D5C3A] text-white text-xs font-medium rounded-full shadow-sm hover:bg-opacity-95 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

const VISIBLE_PATH_PREFIXES = [
  "/admin/ambassadors",
  "/admin/ambassador-leads",
  "/admin/sales-marketing",
  "/admin/partners",
  "/admin/programs",
  "/admin/referrals",
];

function shouldShowDelilah(pathname: string | null) {
  if (!pathname) return false;
  return VISIBLE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function DelilahMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-full text-sm font-semibold text-[#0D5C3A]`}
      style={{ backgroundColor: "#fff" }}
      aria-hidden
    >
      D
    </span>
  );
}

function AdminMarkdown({ text }: { text: string }) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;

  const blocks = normalized.split(/\n{2,}/);
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => /^[-*•]\s+/.test(line.trim()) || !line.trim());
        if (isList) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, li) => (
                  <li key={li}>{renderInline(line.replace(/^[-*•]\s+/, ""))}</li>
                ))}
            </ul>
          );
        }
        if (/^#{1,3}\s+/.test(block.trim())) {
          const title = block.trim().replace(/^#{1,3}\s+/, "");
          return (
            <p key={index} className="font-semibold text-slate-950">
              {renderInline(title)}
            </p>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {lines.map((line, li) => (
              <span key={li}>
                {li > 0 ? <br /> : null}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1]) {
      nodes.push(
        <strong
          key={`${match.index}-b`}
          style={{ color: "#020617", WebkitTextFillColor: "#020617" }}
        >
          {match[1]}
        </strong>,
      );
    } else if (match[2]) {
      nodes.push(
        <code
          key={`${match.index}-c`}
          className="rounded bg-slate-100 px-1 py-0.5 text-[0.8em]"
        >
          {match[2]}
        </code>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : text;
}

export default function DelilahFloatingAssistant() {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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
    api: "/api/admin/delilah-ai",
    initialMessages: [
      {
        id: "delilah-admin-hello",
        role: "assistant",
        content: HELLO,
      },
    ],
  });

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  if (!mounted || !shouldShowDelilah(pathname)) return null;

  const panelSize = expanded
    ? "sm:h-[min(780px,90dvh)] sm:w-[min(520px,96vw)]"
    : "sm:h-[560px] sm:w-[380px]";

  function openPanel() {
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    setExpanded(false);
  }

  async function runChip(chip: (typeof QUICK_CHIPS)[number]) {
    setOpen(true);
    await append({ role: "user", content: chip.prompt });
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(event);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function clearChat() {
    setMessages([
      {
        id: "delilah-admin-hello",
        role: "assistant",
        content:
          "**Fresh bowl.** Share an ambassador handle or id and I'll fetch live new-follower deltas.",
      },
    ]);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  const ui = (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-[89] flex flex-row items-center justify-start gap-3 overflow-visible md:bottom-6 md:left-6"
      data-delilah-admin-dock
    >
      <div className="homepage-chat-bubble-root !relative !inset-auto !z-auto !max-w-none">
        {!open ? (
          <button
            type="button"
            className="homepage-chat-tip"
            style={{ maxWidth: "min(260px, calc(100vw - 6.5rem))" }}
            onClick={openPanel}
            aria-label="Open Delilah ambassador assistant"
          >
            <span className="homepage-chat-tip__pulse" aria-hidden />
            <span className="homepage-chat-tip__text">{TIP}</span>
          </button>
        ) : null}

        <button
          type="button"
          className="homepage-chat-launcher"
          onClick={() => (open ? closePanel() : openPanel())}
          aria-label={
            open
              ? "Close Delilah, Ambassador AI"
              : "Open Delilah, Ambassador AI"
          }
          aria-expanded={open}
        >
          {open ? (
            <span className="homepage-chat-launcher__icon">×</span>
          ) : (
            <span className="homepage-chat-launcher__icon" aria-hidden>
              <DelilahMark className="h-full w-full overflow-hidden rounded-full flex-shrink-0" />
            </span>
          )}
        </button>
      </div>

      {open ? (
        <div
          className={`homepage-chat-panel pointer-events-auto fixed inset-0 z-[91] flex h-full w-full flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-6 sm:left-6 sm:rounded-2xl sm:shadow-2xl ${panelSize}`}
          role="dialog"
          aria-label="Delilah, Ambassador AI"
        >
          <div
            className="homepage-chat-panel__header relative shrink-0"
            role="banner"
            style={HEADER_BANNER_STYLE}
          >
            <div className="homepage-chat-panel__brand">
              <span
                className="homepage-chat-panel__avatar homepage-chat-panel__avatar--dog"
                aria-hidden
              >
                <DelilahMark className="!h-full !w-full max-h-full max-w-full rounded-full" />
              </span>
              <div className="min-w-0 flex-1 pr-14">
                <p
                  className="homepage-chat-panel__title"
                  style={HEADER_TITLE_STYLE}
                >
                  Delilah, Ambassador AI
                </p>
                <p className="homepage-chat-panel__sub" style={HEADER_SUB_STYLE}>
                  Influencer social · live follower deltas
                </p>
              </div>
            </div>
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="hidden h-9 w-9 place-items-center rounded-full bg-white/14 text-white transition hover:bg-white/22 sm:grid"
                aria-label={expanded ? "Collapse panel" : "Expand panel"}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="homepage-chat-panel__close"
                aria-label="Close Delilah assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="homepage-chat-panel__messages min-h-0 flex-1 overflow-y-auto bg-[#f8faf8] px-3 py-3"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 ${
                    message.role === "user"
                      ? "bg-[#0D5C3A] text-white"
                      : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <AdminMarkdown text={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading ? (
              <p className="px-1 text-xs text-slate-500">Delilah is sniffing…</p>
            ) : null}
            {error ? (
              <p className="px-1 text-xs text-red-600">
                {error.message || "Delilah hit a snag. Try again."}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={CHIP_CLASS}
                  disabled={isLoading}
                  onClick={() => void runChip(chip)}
                >
                  {chip.label}
                </button>
              ))}
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
                onClick={clearChat}
              >
                Clear
              </button>
            </div>
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                rows={2}
                placeholder="e.g. New IG followers today for @coolpetinfluencer"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-[#0D5C3A] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );

  return createPortal(ui, document.body);
}
