"use client";

/**
 * Shared assistant bubble body for all web companions (Rogue / Scout / Taco / Delilah).
 * Parses [[cta:*]] + guru cards the same way Rogue does so look & CTAs stay consistent.
 */

import Link from "next/link";
import { SocialFollowPack } from "@/components/messaging/SocialFollowPack";
import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";
import { RogueMarkdownText } from "@/components/messaging/RogueMarkdownText";
import { GuruProfileSnapshotCard } from "@/components/messaging/GuruProfileSnapshotCard";
import {
  parseHomepageChatContent,
  type HomepageCtaContext,
  type HomepageCtaDef,
} from "@/lib/chat/homepage-cta";

function CtaActionButton({
  cta,
  socialSource,
}: {
  cta: HomepageCtaDef;
  socialSource: string;
}) {
  if (cta.socialPack) {
    return <SocialFollowPack source={socialSource} />;
  }
  const external = /^https?:\/\//i.test(cta.href);
  if (external) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-3 text-center text-base font-medium text-white transition-all hover:bg-opacity-90"
      >
        {cta.label}
      </a>
    );
  }
  return (
    <Link
      href={cta.href}
      className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-3 text-center text-base font-medium text-white transition-all hover:bg-opacity-90"
    >
      {cta.label}
    </Link>
  );
}

export function CompanionAssistantBubbleBody({
  content,
  ctaContext,
  socialSource = "companion_chat",
}: {
  content: string;
  ctaContext?: HomepageCtaContext;
  socialSource?: string;
}) {
  let text = "";
  let ctas: HomepageCtaDef[] = [];
  let guruCards: ReturnType<typeof parseHomepageChatContent>["guruCards"] = [];

  try {
    const parsed = parseHomepageChatContent(content, ctaContext);
    text = parsed.text;
    ctas = parsed.ctas;
    guruCards = parsed.guruCards;
  } catch {
    text = String(content || "")
      .replace(/\[\[\s*guru_card\s*:[\s\S]*?\]\]/gi, " ")
      .replace(/\[\[\s*guru_card\s*:[^\[]*/gi, " ")
      .replace(/\[\[\s*cta:[^\]]+\]\]/gi, " ")
      .replace(/\[\[\s*ambassador_video_card\s*\]\]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Also strip unused ambassador video marker until card is rendered elsewhere.
  text = text.replace(/\[\[\s*ambassador_video_card\s*\]\]/gi, " ").trim();

  return (
    <div className="space-y-1">
      {text ? (
        <SafeAssistantBubble contentHint={content}>
          <RogueMarkdownText text={text} />
        </SafeAssistantBubble>
      ) : null}
      {guruCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 pt-1.5">
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
              <CtaActionButton cta={cta} socialSource={socialSource} />
            </SafeAssistantBubble>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Rogue-sized floating panel chrome shared across companions. */
export const COMPANION_ROGUE_PANEL_CLASS =
  "homepage-chat-panel fixed inset-0 z-[10000] flex h-full w-full flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100vh-3rem))] sm:w-[min(440px,calc(100vw-2rem))] sm:rounded-2xl sm:shadow-2xl";
