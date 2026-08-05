"use client";

/**
 * Floating Delilah companion for public Ambassador onboarding conversion.
 * Streams via /api/ai/officer-stream (taco public surface) with Delilah branding.
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useChat } from "ai/react";
import {
  COMPANION_DOCK_CLASS,
  COMPANION_FAB_CLASS,
  DELILAH_AVATAR,
} from "@/lib/companions/avatar-assets";

const DELILAH_BRAND = "#0D5C3A";
const DELILAH_BRAND_DEEP = "#09462C";

const DELILAH_GREETING =
  "Hey there! Ready to lead your local community? I am Delilah, your personal Ambassador Advocate. Sign up today and I will fetch your personalized referral link, show you how to easily claim your $10 to $20 PetPerks rewards, and track your metrics right from your custom workspace dashboard!";

const CONVERSION_CHIPS = [
  {
    id: "join_pack",
    label: "Join the Pack",
    prompt:
      "I want to become a SitGuru Ambassador. What are the first steps to apply and get my referral tools?",
  },
  {
    id: "petperks_rewards",
    label: "$10–$20 PetPerks",
    prompt:
      "Tell me about the $10 to $20 PetPerks rewards Ambassadors can claim and how to earn them.",
  },
  {
    id: "referral_link",
    label: "Referral Link",
    prompt:
      "How do I get my personalized referral link and QR code after I sign up?",
  },
  {
    id: "track_metrics",
    label: "Track Metrics",
    prompt:
      "What metrics can I track from my Ambassador workspace dashboard once I'm in?",
  },
  {
    id: "what_ambassadors_do",
    label: "What you do",
    prompt: "What do Ambassadors do?",
  },
] as const;

const REWARD_CALLOUTS = [
  "Personalized referral link + QR tools",
  "$10–$20 PetPerks reward opportunities",
  "Live outreach & impact metrics",
  "Campus, community & pet-pro lanes",
] as const;

export default function AIDelilahCompanion() {
  const [isOpen, setIsOpen] = useState(true);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const requestBody = {
    officer: "taco" as const,
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
  } = useChat({
    api: "/api/ai/officer-stream",
    initialMessages: [
      {
        id: "delilah-hello",
        role: "assistant",
        content: DELILAH_GREETING,
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

  async function runChip(chip: (typeof CONVERSION_CHIPS)[number]) {
    setIsOpen(true);
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
    <div
      className={COMPANION_DOCK_CLASS}
      data-ai-delilah-companion
    >
      {isOpen ? (
        <div
          className="absolute bottom-[4.75rem] right-0 flex h-[min(30rem,72dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white text-slate-900 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="Delilah AI Companion"
        >
          <div
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${DELILAH_BRAND} 0%, ${DELILAH_BRAND_DEEP} 100%)`,
              backgroundColor: DELILAH_BRAND,
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-sm">
                <Image
                  src={DELILAH_AVATAR.src}
                  alt={DELILAH_AVATAR.alt}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  style={{
                    backgroundColor: "#fff",
                    objectPosition: DELILAH_AVATAR.objectPosition,
                  }}
                  priority
                />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black tracking-tight text-white">
                  Delilah · Ambassador Advocate
                </h3>
                <p className="truncate text-[11px] font-semibold text-white/90">
                  Your growth & rewards guide
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
            className="flex-1 space-y-3 overflow-y-auto bg-[#f7fbf8] px-4 py-3 text-sm text-slate-700"
          >
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              return (
                <div
                  key={message.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                      isAssistant
                        ? "border border-emerald-100 bg-white text-slate-700"
                        : "bg-[#0D5C3A] text-white"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}

            {/* Always-visible benefit nudges for conversion */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Ambassador advantages
              </p>
              <ul className="mt-2 space-y-1.5">
                {REWARD_CALLOUTS.map((item) => (
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
            </div>

            {isLoading ? (
              <p className="text-xs font-semibold text-emerald-700">
                Delilah is fetching your next growth move…
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
              href="/programs/ambassadors/apply?type=community&source=delilah_companion"
              className="mb-2 flex min-h-10 items-center justify-center rounded-xl bg-[#0D5C3A] px-3 text-xs font-black text-white transition hover:bg-[#09462C]"
            >
              Sign Up & Claim Your Tools
            </Link>
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {CONVERSION_CHIPS.map((chip) => (
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
                placeholder="Ask Delilah about rewards, referrals…"
                className="min-h-[40px] flex-1 resize-none rounded-xl border border-emerald-100 bg-[#f7fbf8] px-3 py-2 text-sm text-slate-800 outline-none ring-emerald-600/30 placeholder:text-slate-400 focus:ring-2"
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

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          isOpen ? "Close Delilah AI Companion" : "Open Delilah AI Companion"
        }
        aria-expanded={isOpen}
        className={`${COMPANION_FAB_CLASS} flex items-center justify-center bg-[#0D5C3A] hover:bg-[#09462C]`}
      >
        {isOpen ? (
          <span className="text-2xl font-light leading-none text-white">×</span>
        ) : (
          <Image
            src={DELILAH_AVATAR.src}
            alt={DELILAH_AVATAR.alt}
            width={56}
            height={56}
            className="h-full w-full object-cover"
            style={{
              backgroundColor: "#fff",
              objectPosition: DELILAH_AVATAR.objectPosition,
            }}
            priority
          />
        )}
      </button>
    </div>
  );
}
