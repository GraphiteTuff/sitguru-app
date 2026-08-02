"use client";

/**
 * Shared floating Pet Officer overlay — cloned from the Rogue admin template
 * and themed per guest officer (Delilah / Scout). Streams via
 * /api/ai/officer-stream (Rogue admin route remains untouched).
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useChat } from "ai/react";
import { Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import type { GuestOfficerId } from "@/lib/ai/officer-prompts";

export type OfficerTheme = {
  brand: string;
  brandDeep: string;
  cream: string;
  chipClass: string;
  ringClass: string;
  tableHeadClass: string;
  tableBorderClass: string;
};

export type OfficerQuickChip = {
  id: string;
  label: string;
  prompt: string;
};

export type OfficerFloatingAssistantProps = {
  officerId: GuestOfficerId;
  displayName: string;
  title: string;
  avatarSrc: string;
  greetingMarkdown: string;
  tipStatement: string;
  composerPlaceholder: string;
  footerLabel: string;
  subtitle: string;
  theme: OfficerTheme;
  chips: readonly OfficerQuickChip[];
  /** Optional access token forwarded to the stream endpoint. */
  accessToken?: string | null;
  /** Optional Guru provider id (Scout only). */
  providerId?: string | null;
  /** Match Rogue's face-forward circular crop. */
  avatarObjectPosition?: string;
};

function OfficerAvatar({
  src,
  className = "h-8 w-8",
  objectPosition = "center 18%",
}: {
  src: string;
  className?: string;
  objectPosition?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`${className} rounded-full object-cover`}
      style={{ backgroundColor: "#fff", objectPosition }}
    />
  );
}

function OfficerMarkdown({
  text,
  theme,
}: {
  text: string;
  theme: OfficerTheme;
}) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;

  const blocks = normalized.split(/\n{2,}/);

  return (
    <div
      className="officer-md space-y-3 text-sm leading-6"
      style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}
    >
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        const isTable =
          lines.length >= 2 &&
          lines[0].includes("|") &&
          /^\s*\|?\s*-+/.test(lines[1] || "");

        if (isTable) {
          const rows = lines
            .filter((line) => line.includes("|") && !/^\s*\|?\s*-+/.test(line))
            .map((line) =>
              line
                .trim()
                .replace(/^\|/, "")
                .replace(/\|$/, "")
                .split("|")
                .map((cell) => cell.trim()),
            );
          if (!rows.length) return null;
          const [header, ...body] = rows;
          return (
            <div
              key={`t-${blockIndex}`}
              className={`overflow-x-auto rounded-2xl border ${theme.tableBorderClass}`}
            >
              <table className="min-w-full text-left text-xs">
                <thead className={theme.tableHeadClass}>
                  <tr>
                    {header.map((cell) => (
                      <th key={cell} className="px-3 py-2">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rowIndex) => (
                    <tr
                      key={`r-${rowIndex}`}
                      className={`border-t ${theme.tableBorderClass} bg-white`}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${rowIndex}-${cellIndex}`}
                          className="px-3 py-2 font-semibold"
                        >
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const first = lines[0] || "";
        if (first.startsWith("### ")) {
          return (
            <h4
              key={`h3-${blockIndex}`}
              className="text-sm font-black"
              style={{ color: "#020617", WebkitTextFillColor: "#020617" }}
            >
              {renderInline(first.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (first.startsWith("## ")) {
          return (
            <h3
              key={`h2-${blockIndex}`}
              className="text-base font-black"
              style={{ color: "#020617", WebkitTextFillColor: "#020617" }}
            >
              {renderInline(first.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (first.startsWith("# ")) {
          return (
            <h2
              key={`h1-${blockIndex}`}
              className="text-lg font-black"
              style={{ color: "#020617", WebkitTextFillColor: "#020617" }}
            >
              {renderInline(first.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        if (lines.every((line) => /^\s*[-*]\s+/.test(line) || !line.trim())) {
          return (
            <ul key={`ul-${blockIndex}`} className="list-disc space-y-1 pl-5">
              {lines
                .filter((line) => line.trim())
                .map((line, idx) => (
                  <li
                    key={idx}
                    className="font-semibold"
                    style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}
                  >
                    {renderInline(line.replace(/^\s*[-*]\s+/, ""))}
                  </li>
                ))}
            </ul>
          );
        }

        return (
          <p
            key={`p-${blockIndex}`}
            className="font-semibold whitespace-pre-wrap"
            style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}
          >
            {lines.map((line, idx) => (
              <span key={idx}>
                {renderInline(line)}
                {idx < lines.length - 1 ? <br /> : null}
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
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let part = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <strong
        key={`b-${part++}`}
        className="font-black"
        style={{ color: "#020617", WebkitTextFillColor: "#020617" }}
      >
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : text;
}

export default function OfficerFloatingAssistant({
  officerId,
  displayName,
  title,
  avatarSrc,
  greetingMarkdown,
  tipStatement,
  composerPlaceholder,
  footerLabel,
  subtitle,
  theme,
  chips,
  accessToken = null,
  providerId = null,
  avatarObjectPosition = "center 18%",
}: OfficerFloatingAssistantProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [preset, setPreset] = useState<string>("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const headerBannerStyle: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${theme.brand} 0%, ${theme.brandDeep} 100%)`,
    backgroundColor: theme.brand,
    color: "#ffffff",
    borderBottom: "0",
  };

  const headerTitleStyle: CSSProperties = {
    color: "#ffffff",
    WebkitTextFillColor: "#ffffff",
    opacity: 1,
    visibility: "visible",
  };

  const headerSubStyle: CSSProperties = {
    color: "rgba(255, 255, 255, 0.95)",
    WebkitTextFillColor: "rgba(255, 255, 255, 0.95)",
    opacity: 1,
    visibility: "visible",
  };

  const requestBody = {
    officer: officerId,
    preset: preset || undefined,
    accessToken: accessToken || undefined,
    providerId: providerId || undefined,
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
        id: `${officerId}-hello`,
        role: "assistant",
        content: greetingMarkdown,
      },
    ],
    body: requestBody,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function openPanel() {
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    setExpanded(false);
  }

  async function runChip(chip: OfficerQuickChip) {
    setPreset(chip.id);
    setOpen(true);
    await append(
      {
        role: "user",
        content: chip.prompt,
      },
      {
        body: {
          ...requestBody,
          preset: chip.id,
        },
      },
    );
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(event, {
      body: {
        ...requestBody,
        preset: preset || undefined,
      },
    });
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function clearChat() {
    setMessages([
      {
        id: `${officerId}-hello`,
        role: "assistant",
        content: `**Fresh bowl.** ${greetingMarkdown.replace(/^\*\*[^*]+\*\*\s*/, "")}`,
      },
    ]);
    setPreset("");
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  if (!mounted) return null;

  const panelSize = expanded
    ? "sm:h-[min(820px,92dvh)] sm:w-[min(560px,96vw)]"
    : "sm:h-[600px] sm:w-[400px]";

  const fullTitle = `${displayName}, ${title}`;

  const ui = (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-row items-center justify-end gap-3 overflow-visible md:bottom-6 md:right-6"
      data-officer-dock={officerId}
      style={
        {
          ["--officer-brand"]: theme.brand,
          ["--officer-brand-deep"]: theme.brandDeep,
          ["--officer-cream"]: theme.cream,
        } as CSSProperties
      }
    >
      <div className="homepage-chat-bubble-root !relative !inset-auto !z-auto !max-w-none">
        {!open ? (
          <button
            type="button"
            className="homepage-chat-tip"
            style={{ maxWidth: "min(280px, calc(100vw - 6.5rem))" }}
            onClick={openPanel}
            aria-label={`Open ${displayName} assistant`}
          >
            <span className="homepage-chat-tip__pulse" aria-hidden />
            <span className="homepage-chat-tip__text">{tipStatement}</span>
          </button>
        ) : null}

        <button
          type="button"
          className="homepage-chat-launcher"
          onClick={() => (open ? closePanel() : openPanel())}
          aria-label={open ? `Close ${fullTitle}` : `Open ${fullTitle}`}
          aria-expanded={open}
        >
          {open ? (
            <span className="homepage-chat-launcher__icon">×</span>
          ) : (
            <span className="homepage-chat-launcher__icon" aria-hidden>
              <OfficerAvatar
                src={avatarSrc}
                className="h-full w-full overflow-hidden rounded-full flex-shrink-0"
                objectPosition={avatarObjectPosition}
              />
            </span>
          )}
        </button>
      </div>

      {open ? (
        <div
          className={`homepage-chat-panel pointer-events-auto fixed inset-0 z-[91] flex h-full w-full flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:rounded-2xl sm:shadow-2xl ${panelSize}`}
          role="dialog"
          aria-label={`${fullTitle} assistant`}
        >
          <div
            className="homepage-chat-panel__header relative shrink-0"
            role="banner"
            data-officer-header={officerId}
            style={headerBannerStyle}
          >
            <div className="homepage-chat-panel__brand">
              <span
                className="homepage-chat-panel__avatar homepage-chat-panel__avatar--dog"
                aria-hidden
              >
                <OfficerAvatar
                  src={avatarSrc}
                  className="!h-full !w-full max-h-full max-w-full rounded-full"
                  objectPosition={avatarObjectPosition}
                />
              </span>
              <div className="min-w-0 flex-1 pr-14">
                <p
                  className="homepage-chat-panel__title"
                  style={headerTitleStyle}
                >
                  {fullTitle}
                </p>
                <p
                  className="homepage-chat-panel__sub"
                  style={headerSubStyle}
                >
                  {subtitle}
                </p>
              </div>
            </div>
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="hidden h-9 w-9 place-items-center rounded-full bg-white/14 text-white transition hover:bg-white/22 sm:grid"
                aria-label={expanded ? "Collapse panel" : "Expand panel"}
                title={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="homepage-chat-panel__close"
                aria-label={`Close ${displayName} assistant`}
                title="Close"
              >
                <X className="h-5 w-5 text-white" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 p-2"
            role="toolbar"
            aria-label={`${displayName} quick prompts`}
          >
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                disabled={isLoading}
                onClick={() => void runChip(chip)}
                className={theme.chipClass}
              >
                {chip.label}
              </button>
            ))}
            <button
              type="button"
              onClick={clearChat}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              Clear
            </button>
          </div>

          <div
            ref={scrollerRef}
            className="homepage-chat-panel__messages min-h-0 flex-1"
          >
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div
                    key={message.id}
                    className="homepage-chat-bubble homepage-chat-bubble--user"
                  >
                    {message.content}
                  </div>
                );
              }

              if (message.role !== "assistant") return null;

              return (
                <div key={message.id} className="flex items-start gap-2">
                  <span
                    className={`mt-1 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ${theme.ringClass}`}
                    aria-hidden
                  >
                    <OfficerAvatar
                      src={avatarSrc}
                      className="h-full w-full"
                      objectPosition={avatarObjectPosition}
                    />
                  </span>
                  <div
                    className="homepage-chat-bubble homepage-chat-bubble--ai min-w-0 flex-1"
                    style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}
                  >
                    <OfficerMarkdown text={message.content} theme={theme} />
                  </div>
                </div>
              );
            })}

            {isLoading ? (
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ${theme.ringClass}`}
                  aria-hidden
                >
                  <OfficerAvatar
                    src={avatarSrc}
                    className="h-full w-full"
                    objectPosition={avatarObjectPosition}
                  />
                </span>
                <div
                  className="homepage-chat-bubble homepage-chat-bubble--ai homepage-chat-typing"
                  aria-live="polite"
                >
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                Connection wobble: {error.message || "Try again in a moment."}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={onSubmit}
            className="homepage-chat-panel__composer shrink-0"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              placeholder={composerPlaceholder}
              disabled={isLoading}
              aria-label={`Message ${displayName}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (isLoading) return;
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label={`Send to ${displayName}`}
            >
              {isLoading ? "…" : "Send"}
            </button>
          </form>

          <p className="flex items-center gap-1.5 border-t border-gray-100 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            <Sparkles size={12} />
            {footerLabel}
          </p>
        </div>
      ) : null}
    </div>
  );

  return createPortal(ui, document.body);
}
