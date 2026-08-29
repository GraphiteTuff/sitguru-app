"use client";

/**
 * Floating Delilah — Pet Event Coordinator companion.
 * Mounts on /events (and legacy /community) public surfaces.
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
import {
  COMPANION_DOCK_CLASS,
  DELILAH_AVATAR,
} from "@/lib/companions/avatar-assets";
import {
  COMPANION_BENEFITS_CHIP_ID,
  getCompanionBenefitsChip,
} from "@/lib/companions/companion-benefits";
import {
  OPEN_COMPANION_CHAT_EVENT,
  type OpenCompanionChatDetail,
} from "@/lib/companions/open-companion-chat";
import { COMMUNITY_EVENT_FAQ_CHIPS } from "@/lib/ai/community-events-faqs";
import { RogueMarkdownText } from "@/components/messaging/RogueMarkdownText";

const DELILAH_BRAND = "#0D5C3A";
const DELILAH_BRAND_DEEP = "#09462C";
const ACTIVE_COMPANION = "delilah" as const;
const DELILAH_BENEFITS_CHIP = getCompanionBenefitsChip(ACTIVE_COMPANION);

const GREETING =
  "Hey there! I'm Delilah, your Pet Event Coordinator. I help planners, hosts, and pet parents with SitGuru listings — publishing Partner Events, RSVPs, sharing, and what's happening near you. Tap a chip or ask me anything!";

const CHIPS = [
  {
    id: "host_events",
    label: "Host events",
    prompt:
      "How do Pet Event Planners and Managers publish Partner Events on SitGuru?",
  },
  {
    id: DELILAH_BENEFITS_CHIP.id,
    label: DELILAH_BENEFITS_CHIP.label,
    prompt: DELILAH_BENEFITS_CHIP.prompt,
  },
  ...COMMUNITY_EVENT_FAQ_CHIPS.map((chip) => ({
    id: chip.label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    label: chip.label,
    prompt: chip.question,
  })),
] as const;

const HOST_CALLOUTS = [
  "Publish Partner Events that stay first in the feed",
  "Track Yes / Maybe / No attendance on each listing",
  "Share branded SitGuru graphics from every card",
  "Help pet parents find local pack gathers near them",
] as const;

function isEventsPath(pathname: string | null) {
  if (!pathname) return false;
  return (
    pathname === "/events" ||
    pathname.startsWith("/events/") ||
    pathname === "/community" ||
    pathname.startsWith("/community/")
  );
}

export default function AIDelilahCompanion() {
  const pathname = usePathname();
  const routeEnabled = isEventsPath(pathname);

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const benefitsChip = getCompanionBenefitsChip(ACTIVE_COMPANION);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const chat = params.get("chat")?.trim().toLowerCase();
      if (chat !== "delilah") return;
      setIsOpen(true);
      params.delete("chat");
      const next = `${window.location.pathname}${
        params.toString() ? `?${params}` : ""
      }${window.location.hash || ""}`;
      window.history.replaceState({}, "", next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    function onOpenCompanionChat(event: Event) {
      const detail = (event as CustomEvent<OpenCompanionChatDetail>).detail;
      if (detail?.companion !== "delilah") return;
      setIsOpen(true);
    }
    window.addEventListener(OPEN_COMPANION_CHAT_EVENT, onOpenCompanionChat);
    return () => {
      window.removeEventListener(OPEN_COMPANION_CHAT_EVENT, onOpenCompanionChat);
    };
  }, []);

  const requestBody = {
    officer: "delilah" as const,
    companion: "delilah" as const,
    pagePath: pathname || "/events",
    surface: "public" as const,
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
        id: "delilah-hello",
        role: "assistant",
        content: GREETING,
      },
    ],
    body: requestBody,
  });

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

  async function runChip(chip: (typeof CHIPS)[number]) {
    setIsOpen(true);

    if (chip.id === COMPANION_BENEFITS_CHIP_ID) {
      const stamp = Date.now();
      setMessages((previous) => [
        ...previous,
        {
          id: `delilah-benefits-user-${stamp}`,
          role: "user",
          content: chip.prompt,
        },
        {
          id: `delilah-benefits-assistant-${stamp}`,
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
      data-ai-delilah-companion
      data-delilah-mode="public"
    >
      {isOpen ? (
        <div
          className="absolute bottom-[4.75rem] right-0 flex h-[min(30rem,72dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white text-slate-900 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="Delilah AI Companion"
        >
          <div
            data-companion-header
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${DELILAH_BRAND} 0%, ${DELILAH_BRAND_DEEP} 100%)`,
              backgroundColor: DELILAH_BRAND,
              color: "#ffffff",
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={DELILAH_AVATAR.src}
                  alt={DELILAH_AVATAR.alt}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  style={{
                    backgroundColor: "#fff",
                    objectPosition: DELILAH_AVATAR.objectPosition,
                  }}
                />
              </span>
              <div className="min-w-0">
                <p
                  className="companion-header-title truncate text-sm font-black tracking-tight !text-white"
                  style={{ color: "#ffffff" }}
                >
                  Delilah · Pet Event Coordinator
                </p>
                <p
                  className="truncate text-[11px] font-semibold !text-white/90"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  Planners, hosts & pack gathers
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg leading-none text-white transition hover:bg-white/25"
              aria-label="Close Delilah AI Companion"
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

            <details className="rounded-2xl border border-emerald-100 bg-white shadow-sm open:pb-0">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  Hosting advantages
                  <span className="text-[10px] font-bold normal-case tracking-normal text-emerald-600/80">
                    tap to expand
                  </span>
                </span>
              </summary>
              <ul className="space-y-1.5 border-t border-emerald-50 px-3 pb-3 pt-2">
                {HOST_CALLOUTS.map((item) => (
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

            {isLoading ? (
              <p className="text-xs font-semibold text-emerald-700">
                Delilah is fetching your next event move…
              </p>
            ) : null}
            {error ? (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                Delilah hit a snag. Try again in a moment.
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-emerald-50 bg-white px-3 py-2">
            <Link
              href="/events/host"
              className="mb-2 flex min-h-10 items-center justify-center rounded-xl bg-[#0D5C3A] px-3 text-xs font-black text-white transition hover:bg-[#09462C]"
            >
              Host / manage events
            </Link>
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {CHIPS.map((chip) => (
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
                placeholder="Ask Delilah about pet events, RSVPs, hosting…"
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
          aria-label="Open chat with Delilah, Pet Event Coordinator"
        >
          <span className="homepage-chat-tip__pulse" aria-hidden />
          <span className="homepage-chat-tip__text">
            Hey! I&apos;m Delilah — tap to chat about pet events & hosting!
          </span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          isOpen ? "Close Delilah AI Companion" : "Open Delilah AI Companion"
        }
        aria-expanded={isOpen}
        className="homepage-chat-launcher"
      >
        {isOpen ? (
          <span className="homepage-chat-launcher__icon">×</span>
        ) : (
          <span className="homepage-chat-launcher__icon" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DELILAH_AVATAR.src}
              alt={DELILAH_AVATAR.alt}
              width={64}
              height={64}
              className="h-full w-full rounded-full overflow-hidden flex-shrink-0 object-cover"
              style={{
                backgroundColor: "#fff",
                objectPosition: DELILAH_AVATAR.objectPosition,
              }}
            />
          </span>
        )}
      </button>
    </div>,
    document.body,
  );
}
