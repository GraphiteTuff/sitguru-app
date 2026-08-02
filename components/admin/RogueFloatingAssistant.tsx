"use client";

/**
 * Floating Rogue admin assistant — homepage tip bubble + panel (no AI badge).
 * Streams via Vercel AI SDK useChat → /api/admin/rogue-ai.
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

const BRAND_GREEN = "#0D5C3A";
const ROGUE_AVATAR_SRC = "/images/rogue-avatar.png";

const REPORTING_STATEMENT =
  "**Rogue reporting for duty.** I'm your Chief Treat Officer — ready to sniff Operations, Growth, Financials, and Audit logs. Tap a chip or ask me anything admin-shaped.";

/** Admin tip bubble — reporting-for-duty statement. */
const TIP_STATEMENT =
  "Rogue reporting for duty. I'm your Chief Treat Officer — ready to sniff Operations, Growth, Financials, and Audit logs. Tap a chip or ask me anything admin-shaped!";

const QUICK_CHIPS = [
  {
    id: "daily_sync",
    label: "Daily Sync",
    period: "daily" as const,
    prompt:
      "Run a Daily Sync across operations, financials, messages, payouts, trust & safety, and audit alerts. Give me an executive pack report with exceptions and next hops.",
  },
  {
    id: "weekly_financials",
    label: "Weekly Financials",
    period: "weekly" as const,
    prompt:
      "Compile Weekly Financials: GMV, take-rate, banking/liquidity, Stripe fees/disputes, P&L, cash flow, commissions, payouts, reconciliation mismatches, and tax signals.",
  },
  {
    id: "growth_analytics",
    label: "Growth Analytics",
    period: "monthly" as const,
    prompt:
      "Produce Growth Analytics: campaigns/CAC signals, referrals, programs (including Veterans & Military Families), partners, analytics MoM KPIs, and chat insight friction.",
  },
  {
    id: "system_audit",
    label: "System Audit",
    period: "weekly" as const,
    prompt:
      "Run a System Audit: admin audit trail, trust & safety escalations, settings/config, webhook/integration health, export queues, and support load.",
  },
] as const;

const CHIP_CLASS =
  "w-full justify-center px-3 py-2 bg-[#0D5C3A] text-white text-xs font-semibold rounded-full shadow-sm hover:bg-opacity-95 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-center leading-tight";

function RogueAvatar({ className = "h-8 w-8" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ROGUE_AVATAR_SRC}
      alt=""
      className={`${className} rounded-full object-cover object-[center_18%]`}
      style={{ backgroundColor: "#fff" }}
    />
  );
}

function AdminRogueMarkdown({ text }: { text: string }) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;

  const blocks = normalized.split(/\n{2,}/);

  return (
    <div className="space-y-3 text-sm leading-6 text-slate-700">
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
              className="overflow-x-auto rounded-2xl border border-emerald-100"
            >
              <table className="min-w-full text-left text-xs">
                <thead className="bg-emerald-50 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
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
                      className="border-t border-emerald-50 bg-white"
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
              className="text-sm font-black text-slate-950"
            >
              {renderInline(first.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (first.startsWith("## ")) {
          return (
            <h3
              key={`h2-${blockIndex}`}
              className="text-base font-black text-slate-950"
            >
              {renderInline(first.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (first.startsWith("# ")) {
          return (
            <h2
              key={`h1-${blockIndex}`}
              className="text-lg font-black text-slate-950"
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
                  <li key={idx} className="font-semibold">
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
      <strong key={`b-${part++}`} className="font-black text-slate-950">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : text;
}

export default function RogueFloatingAssistant() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [preset, setPreset] = useState<string>("");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    "daily",
  );
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
    api: "/api/admin/rogue-ai",
    initialMessages: [
      {
        id: "rogue-admin-hello",
        role: "assistant",
        content: REPORTING_STATEMENT,
      },
    ],
    body: {
      preset: preset || undefined,
      period,
    },
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

  async function runChip(chip: (typeof QUICK_CHIPS)[number]) {
    setPreset(chip.id);
    setPeriod(chip.period);
    setOpen(true);
    await append(
      {
        role: "user",
        content: chip.prompt,
      },
      {
        body: {
          preset: chip.id,
          period: chip.period,
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
        preset: preset || undefined,
        period,
      },
    });
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function clearChat() {
    setMessages([
      {
        id: "rogue-admin-hello",
        role: "assistant",
        content:
          "**Fresh bowl.** Ask me for a Daily Sync, Weekly Financials, Growth Analytics, or System Audit — or type a precise question.",
      },
    ]);
    setPreset("");
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  if (!mounted) return null;

  const panelSize = expanded
    ? "sm:h-[min(820px,92dvh)] sm:w-[min(560px,96vw)]"
    : "sm:h-[600px] sm:w-[400px]";

  const ui = (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-row items-center justify-end gap-3 overflow-visible md:bottom-6 md:right-6"
      data-rogue-admin-dock
      style={
        {
          ["--hcb-green"]: BRAND_GREEN,
          ["--hcb-green-deep"]: "#09462c",
          ["--hcb-cream"]: "#f4faf6",
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
            aria-label="Open Rogue reporting terminal"
          >
            <span className="homepage-chat-tip__pulse" aria-hidden />
            <span className="homepage-chat-tip__text">{TIP_STATEMENT}</span>
          </button>
        ) : null}

        <button
          type="button"
          className="homepage-chat-launcher"
          onClick={() => (open ? closePanel() : openPanel())}
          aria-label={
            open
              ? "Close Rogue, Chief Treat Officer"
              : "Open Rogue, Chief Treat Officer"
          }
          aria-expanded={open}
        >
          {open ? (
            <span className="homepage-chat-launcher__icon">×</span>
          ) : (
            <span className="homepage-chat-launcher__icon" aria-hidden>
              <RogueAvatar className="h-full w-full overflow-hidden rounded-full flex-shrink-0" />
            </span>
          )}
        </button>
      </div>

      {open ? (
        <div
          className={`homepage-chat-panel pointer-events-auto fixed inset-0 z-[91] flex h-full w-full flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:rounded-2xl sm:shadow-2xl ${panelSize}`}
          role="dialog"
          aria-label="Rogue, Chief Treat Officer admin assistant"
        >
          <div
            className="homepage-chat-panel__header relative shrink-0"
            role="banner"
            data-rogue-admin-header="true"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #0D5C3A 0%, #09462C 100%)",
              backgroundColor: "#0D5C3A",
              color: "#ffffff",
              borderBottom: "0",
            }}
          >
            <div className="homepage-chat-panel__brand">
              <span
                className="homepage-chat-panel__avatar homepage-chat-panel__avatar--dog"
                aria-hidden
              >
                <RogueAvatar className="!h-full !w-full max-h-full max-w-full rounded-full" />
              </span>
              <div className="min-w-0 flex-1 pr-14">
                <p
                  className="homepage-chat-panel__title"
                  style={{
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                    opacity: 1,
                    visibility: "visible",
                  }}
                >
                  Rogue, Chief Treat Officer 🦴
                </p>
                <p
                  className="homepage-chat-panel__sub"
                  style={{
                    color: "rgba(255, 255, 255, 0.95)",
                    WebkitTextFillColor: "rgba(255, 255, 255, 0.95)",
                    opacity: 1,
                    visibility: "visible",
                  }}
                >
                  Semantic admin · live report compiler
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
                aria-label="Close Rogue assistant"
                title="Close"
              >
                <X className="h-5 w-5 text-white" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            className="grid shrink-0 grid-cols-2 gap-2 border-b border-gray-100 bg-gray-50 p-2"
            role="toolbar"
            aria-label="Quick admin reports"
          >
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                disabled={isLoading}
                onClick={() => void runChip(chip)}
                className={CHIP_CLASS}
              >
                {chip.label}
              </button>
            ))}
            <button
              type="button"
              onClick={clearChat}
              className="col-span-2 w-full cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
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
                    className="mt-1 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-emerald-100"
                    aria-hidden
                  >
                    <RogueAvatar className="h-full w-full" />
                  </span>
                  <div className="homepage-chat-bubble homepage-chat-bubble--ai min-w-0 flex-1">
                    <AdminRogueMarkdown text={message.content} />
                  </div>
                </div>
              );
            })}

            {isLoading ? (
              <div className="flex items-start gap-2">
                <span
                  className="mt-1 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-emerald-100"
                  aria-hidden
                >
                  <RogueAvatar className="h-full w-full" />
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
              placeholder="Ask Rogue about payouts, growth, audits…"
              disabled={isLoading}
              aria-label="Message Rogue"
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
              aria-label="Send to Rogue"
            >
              {isLoading ? "…" : "Send"}
            </button>
          </form>

          <p className="flex items-center gap-1.5 border-t border-gray-100 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            <Sparkles size={12} />
            Read-only admin snapshots · Markdown reports
          </p>
        </div>
      ) : null}
    </div>
  );

  return createPortal(ui, document.body);
}
