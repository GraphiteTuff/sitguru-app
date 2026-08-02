"use client";

/**
 * Floating Rogue admin assistant — visible across /admin routes.
 * Streams via Vercel AI SDK useChat → /api/admin/rogue-ai.
 */

import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useChat } from "ai/react";
import {
  Loader2,
  Maximize2,
  Minimize2,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";

const BRAND_GREEN = "#0D5C3A";
const ROGUE_AVATAR_SRC = "/images/rogue-avatar.png";

type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_OPTIONS: { id: ReportPeriod; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

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
                    {(header || []).map((cell, cellIndex) => (
                      <th key={`${cell}-${cellIndex}`} className="px-3 py-2">
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
            className="whitespace-pre-wrap font-semibold"
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

export function RogueFloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [panelReady, setPanelReady] = useState(false);
  const [preset, setPreset] = useState<string>("");
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [mounted, setMounted] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    messages,
    input,
    setInput,
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
        content:
          "**Rogue reporting for duty.** I'm your Chief Treat Officer — ready to sniff Operations, Growth, Financials, and Audit logs. Tap a chip or ask me anything admin-shaped.",
      },
    ],
    body: {
      preset: preset || undefined,
      period,
    },
  });

  const panelClass = useMemo(
    () =>
      expanded
        ? "h-[min(820px,92dvh)] w-[min(560px,96vw)]"
        : "h-[min(640px,78dvh)] w-[min(420px,94vw)]",
    [expanded],
  );

  useEffect(() => {
    if (!open) {
      setPanelReady(false);
      return;
    }
    const frame = window.requestAnimationFrame(() => setPanelReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setInput("");
  }

  const ui = (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
      data-sitguru-rogue-admin="true"
    >
      {open ? (
        <section
          className={`pointer-events-auto flex ${panelClass} origin-bottom-right flex-col overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-[0_24px_60px_rgba(13,92,58,0.18)] transition-all duration-300 ease-out ${
            panelReady
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.97] opacity-0"
          }`}
          aria-label="Rogue, Chief Treat Officer admin assistant"
        >
          <header className="flex items-start gap-3 border-b border-emerald-50 bg-[radial-gradient(circle_at_top_left,rgba(13,92,58,0.14),transparent_42%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_55%,#f8fafc_100%)] px-4 py-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
              <span className="absolute inset-0 bg-white" />
              <Image
                src={ROGUE_AVATAR_SRC}
                alt="Rogue"
                fill
                className="object-cover object-[center_18%] mix-blend-multiply"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                SitGuru Admin AI
              </p>
              <h2 className="truncate text-lg font-black tracking-tight text-slate-950">
                Rogue, Chief Treat Officer
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Semantic admin · live report compiler
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded-xl border border-emerald-100 bg-white p-2 text-emerald-800 transition hover:bg-emerald-50"
                aria-label={expanded ? "Collapse panel" : "Expand panel"}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-emerald-100 bg-white p-2 text-emerald-800 transition hover:bg-emerald-50"
                aria-label="Close Rogue assistant"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="flex flex-wrap gap-2 border-b border-emerald-50 bg-[#fbfefd] px-3 py-2.5">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                disabled={isLoading}
                onClick={() => void runChip(chip)}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-black text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60"
              >
                {chip.label}
              </button>
            ))}
            <button
              type="button"
              onClick={clearChat}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-600 transition hover:bg-white"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-b border-emerald-50 bg-white px-3 py-2">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Period
            </span>
            {PERIOD_OPTIONS.map((option) => {
              const active = period === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPeriod(option.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-black transition ${
                    active
                      ? "bg-[#0D5C3A] text-white shadow-sm"
                      : "border border-emerald-100 bg-[#f7fbf8] text-emerald-900 hover:bg-emerald-50"
                  }`}
                  aria-pressed={active}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div
            ref={scrollerRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7fbf8] px-3 py-3"
          >
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex transition duration-200 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-[1.35rem] px-3.5 py-3 shadow-sm ${
                      isUser
                        ? "bg-[#0D5C3A] text-white"
                        : "border border-emerald-100 bg-white text-slate-800"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                        {message.content}
                      </p>
                    ) : (
                      <SafeAssistantBubble contentHint={message.content}>
                        <AdminRogueMarkdown text={message.content} />
                      </SafeAssistantBubble>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm">
                <Loader2 size={14} className="animate-spin" />
                Rogue is sniffing the ledgers…
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
            className="border-t border-emerald-50 bg-white p-3"
          >
            <div className="flex items-center gap-2 rounded-[1.35rem] border border-emerald-100 bg-[#fbfefd] p-1.5 shadow-sm transition focus-within:border-emerald-300 focus-within:shadow-[0_0_0_3px_rgba(13,92,58,0.08)]">
              <input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask Rogue about payouts, growth, audits…"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: BRAND_GREEN }}
                aria-label="Send to Rogue"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <SendHorizontal size={16} />
                )}
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <Sparkles size={12} />
              Read-only admin snapshots · Markdown reports
            </p>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto group relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-white shadow-[0_18px_40px_rgba(13,92,58,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(13,92,58,0.34)] sm:h-[4.5rem] sm:w-[4.5rem]"
        aria-label={
          open
            ? "Close Rogue, Chief Treat Officer"
            : "Open Rogue, Chief Treat Officer"
        }
      >
        <span className="absolute inset-0 rounded-full bg-white" />
        <span
          className={`absolute inset-[-3px] rounded-full border-2 border-[#0D5C3A]/25 transition duration-500 ${
            open ? "scale-110 opacity-0" : "animate-pulse opacity-100"
          }`}
        />
        <span className="relative h-14 w-14 overflow-hidden rounded-full sm:h-16 sm:w-16">
          <Image
            src={ROGUE_AVATAR_SRC}
            alt="Rogue, Chief Treat Officer"
            fill
            className="object-cover object-[center_18%] mix-blend-multiply transition duration-300 group-hover:scale-105"
            sizes="64px"
            priority
          />
        </span>
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0D5C3A] text-[10px] font-black text-white shadow-sm">
          AI
        </span>
      </button>
    </div>
  );

  // Portal to document.body so admin layout overflow-x-hidden cannot clip
  // or retarget position:fixed (common cause of a "missing" FAB).
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}

class RogueAdminErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[rogue-admin] floating assistant crashed:", error.message, {
      componentStack: info.componentStack?.slice(0, 240),
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <RogueRecoveryFab onReset={this.handleReset} />
      );
    }
    return this.props.children;
  }
}

function RogueRecoveryFab({ onReset }: { onReset: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const ui = (
    <button
      type="button"
      onClick={onReset}
      className="fixed bottom-4 right-4 z-[9999] inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-3 text-xs font-black text-emerald-900 shadow-[0_18px_40px_rgba(13,92,58,0.28)] sm:bottom-6 sm:right-6"
      aria-label="Reload Rogue assistant"
    >
      <span className="relative h-8 w-8 overflow-hidden rounded-full bg-white">
        <Image
          src={ROGUE_AVATAR_SRC}
          alt=""
          fill
          className="object-cover object-[center_18%] mix-blend-multiply"
          sizes="32px"
        />
      </span>
      Rogue glitched — tap to reload
    </button>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}

/**
 * Layout entrypoint — keeps Rogue visible even if the chat panel crashes.
 */
export function RogueAdminAssistantHost() {
  return (
    <RogueAdminErrorBoundary>
      <RogueFloatingAssistant />
    </RogueAdminErrorBoundary>
  );
}

export default RogueFloatingAssistant;
