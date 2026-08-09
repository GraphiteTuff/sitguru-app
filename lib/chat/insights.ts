// lib/chat/insights.ts
/**
 * Omnichannel chat intelligence — categorize + upsert frequency tallies.
 * Covers homepage leads, active walk threads, and admin support channels.
 */

import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  bumpHitMap,
  defaultCompanionForChannel,
  defaultPageForChannel,
  normalizeCompanionKey,
  normalizePagePath,
  parseHitMap,
  type CompanionHitMap,
  type PageHitMap,
} from "@/lib/chat/insight-provenance";

export type ChatChannelSource =
  | "HOMEPAGE_LEAD"
  | "ACTIVE_WALK"
  | "ADMIN_SUPPORT";

export type ChatInsightRow = {
  insight_id: string;
  raw_question_text: string;
  question_key?: string;
  clean_ai_topic_category: string;
  frequency_tally_count: number;
  is_converted_to_help_article: boolean;
  last_asked_at: string;
  created_at?: string;
  converted_article_slug?: string | null;
};

export type GlobalChatInsightRow = {
  insight_id: string;
  text_string_hash: string;
  core_question_summary: string;
  ai_assigned_category: string;
  channel_source_enum: ChatChannelSource;
  frequency_tally_count: number;
  is_converted_to_article: boolean;
  is_friction_flag?: boolean;
  updated_at: string;
  created_at?: string;
  converted_article_slug?: string | null;
  companion_hits?: CompanionHitMap | null;
  page_hits?: PageHitMap | null;
  last_companion_key?: string | null;
  last_source_page_path?: string | null;
};

const QUESTION_HINT =
  /(\?|^(what|who|where|when|why|how|can|do|does|is|are|will|should|could|would)\b)/i;

const FRICTION_HINT =
  /\b(refund|cancel|charged twice|payment failed|stripe|dispute|broken|not working|bug|error|unsafe|leash|bite|injured|lost dog|no show|late|missing payout|can't login|cant login|frustrated|help me|support)\b/i;

/** Heuristic: treat as insight-worthy question / inquiry / friction */
export function looksLikeInsightQuestion(text: string): boolean {
  const clean = String(text || "").trim();
  if (clean.length < 8 || clean.length > 2000) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return false;
  if (/^\+?\d[\d\s().-]{7,}$/.test(clean)) return false;
  return (
    QUESTION_HINT.test(clean) ||
    FRICTION_HINT.test(clean) ||
    clean.split(/\s+/).length >= 4
  );
}

export function isFrictionMessage(text: string): boolean {
  return FRICTION_HINT.test(String(text || ""));
}

/** Map free-text into a clean Admin-facing topic category */
export function categorizeChatInsight(text: string): string {
  const t = String(text || "").toLowerCase();

  if (/\b(leash|collar|harness|pulling|yank)\b/.test(t)) {
    return "Leash Safety";
  }
  if (
    /\b(stripe|payment failed|card declined|billing|charged|invoice|payout stuck)\b/.test(
      t,
    )
  ) {
    return "Stripe Billing Friction";
  }
  if (/\b(what is a guru|what'?s a guru|define guru|guru mean)\b/.test(t)) {
    return "Guru Definition";
  }
  if (/\b(price|pricing|cost|how much|rate|fee|charge)\b/.test(t)) {
    return "Pricing Queries";
  }
  if (/\b(pawperk|loyalty|points|redeem)\b/.test(t)) {
    return "PawPerks Loyalty";
  }
  if (/\b(map|track|gps|pawreport|live walk|polyline|potty)\b/.test(t)) {
    return "Live Map Tracking";
  }
  if (/\b(ambassador|commission|referral|payout)\b/.test(t)) {
    return "Ambassador Rewards";
  }
  if (/\b(join the pack|sign ?up|become a guru|handler|register)\b/.test(t)) {
    return "Join the Pack / Signup";
  }
  if (/\b(book|schedule|sit|walk|boarding|drop[- ]?in)\b/.test(t)) {
    return "Booking Intent";
  }
  if (/\b(sms|twilio|text|notify|notification|alert)\b/.test(t)) {
    return "Notifications & SMS";
  }
  if (/\b(mission|about|where.*(operate|serve)|every state)\b/.test(t)) {
    return "About / Mission";
  }
  if (/\b(safe|safety|trust|background|insurance|bite|injured)\b/.test(t)) {
    return "Trust & Safety";
  }
  if (/\b(cancel|refund|dispute|complaint)\b/.test(t)) {
    return "Support / Dispute Friction";
  }
  return "General Inquiry";
}

export function hashInsightText(text: string): string {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
  return createHash("sha256").update(normalized).digest("hex").slice(0, 64);
}

function resolveProvenance(
  channel: ChatChannelSource,
  companion?: string | null,
  pagePath?: string | null,
) {
  const companionKey =
    normalizeCompanionKey(companion) === "unknown"
      ? defaultCompanionForChannel(channel)
      : normalizeCompanionKey(companion);
  const sourcePage =
    normalizePagePath(pagePath) || defaultPageForChannel(channel);
  return { companionKey, sourcePage };
}

/**
 * Upsert into the global omnichannel ledger.
 */
export async function recordGlobalChatInsight(params: {
  text: string;
  channel: ChatChannelSource;
  companion?: string | null;
  pagePath?: string | null;
}): Promise<GlobalChatInsightRow | null> {
  const text = String(params.text || "").trim().slice(0, 2000);
  if (!looksLikeInsightQuestion(text)) return null;

  const category = categorizeChatInsight(text);
  const friction = isFrictionMessage(text);
  const hash = hashInsightText(text);
  const { companionKey, sourcePage } = resolveProvenance(
    params.channel,
    params.companion,
    params.pagePath,
  );

  try {
    const { data, error } = await supabaseAdmin.rpc(
      "upsert_global_chat_insight",
      {
        p_text_hash: hash,
        p_summary: text,
        p_category: category,
        p_channel: params.channel,
        p_is_friction: friction,
        p_companion: companionKey,
        p_page_path: sourcePage,
      },
    );

    if (!error && data) {
      return (Array.isArray(data) ? data[0] : data) as GlobalChatInsightRow;
    }

    // Fallback without RPC (or older RPC without provenance args)
    const existing = await supabaseAdmin
      .from("global_chat_insights")
      .select("*")
      .eq("text_string_hash", hash)
      .eq("channel_source_enum", params.channel)
      .maybeSingle();

    if (existing.data?.insight_id) {
      const row = existing.data as GlobalChatInsightRow & Record<string, unknown>;
      const nextCount = Number(row.frequency_tally_count || 1) + 1;
      const companionHits = bumpHitMap(
        parseHitMap(row.companion_hits),
        companionKey,
      );
      const pageHits = bumpHitMap(parseHitMap(row.page_hits), sourcePage);
      const { data: updated } = await supabaseAdmin
        .from("global_chat_insights")
        .update({
          frequency_tally_count: nextCount,
          updated_at: new Date().toISOString(),
          is_friction_flag: Boolean(row.is_friction_flag) || friction,
          last_companion_key: companionKey,
          last_source_page_path: sourcePage,
          companion_hits: companionHits,
          page_hits: pageHits,
        })
        .eq("insight_id", row.insight_id)
        .select("*")
        .maybeSingle();
      return (updated as GlobalChatInsightRow) || null;
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("global_chat_insights")
      .insert({
        text_string_hash: hash,
        core_question_summary: text,
        ai_assigned_category: category,
        channel_source_enum: params.channel,
        frequency_tally_count: 1,
        is_friction_flag: friction,
        last_companion_key: companionKey,
        last_source_page_path: sourcePage,
        companion_hits: { [companionKey]: 1 },
        page_hits: { [sourcePage]: 1 },
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();

    if (insertError) {
      console.warn(
        "[global-chat-insights] upsert soft-failed:",
        insertError.message,
      );
      return null;
    }
    return (inserted as GlobalChatInsightRow) || null;
  } catch (error) {
    console.warn(
      "[global-chat-insights] record failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export function recordGlobalChatInsightAsync(params: {
  text: string;
  channel: ChatChannelSource;
  companion?: string | null;
  pagePath?: string | null;
}): void {
  void recordGlobalChatInsight(params);
}

/**
 * Legacy homepage table + global ledger (HOMEPAGE_LEAD).
 */
export async function recordHomepageChatInsight(
  rawQuestion: string,
  meta?: { companion?: string | null; pagePath?: string | null },
): Promise<ChatInsightRow | null> {
  const text = String(rawQuestion || "").trim().slice(0, 2000);
  if (!looksLikeInsightQuestion(text)) return null;

  const topic = categorizeChatInsight(text);

  // Always fan-out to global ledger
  void recordGlobalChatInsight({
    text,
    channel: "HOMEPAGE_LEAD",
    companion: meta?.companion || "rogue",
    pagePath: meta?.pagePath || "/",
  });

  try {
    const { data, error } = await supabaseAdmin.rpc(
      "upsert_homepage_chat_insight",
      {
        p_raw_question: text,
        p_topic: topic,
      },
    );

    if (!error && data) {
      const row = (Array.isArray(data) ? data[0] : data) as ChatInsightRow;
      return row;
    }

    const key = text.toLowerCase().replace(/\s+/g, " ").trim();
    const existing = await supabaseAdmin
      .from("homepage_chat_insights")
      .select("*")
      .eq("question_key", key)
      .maybeSingle();

    if (existing.data?.insight_id) {
      const nextCount =
        Number(
          (existing.data as { frequency_tally_count?: number })
            .frequency_tally_count || 1,
        ) + 1;
      const { data: updated } = await supabaseAdmin
        .from("homepage_chat_insights")
        .update({
          frequency_tally_count: nextCount,
          last_asked_at: new Date().toISOString(),
        })
        .eq("insight_id", existing.data.insight_id)
        .select("*")
        .maybeSingle();
      return (updated as ChatInsightRow) || null;
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("homepage_chat_insights")
      .insert({
        raw_question_text: text,
        clean_ai_topic_category: topic,
        frequency_tally_count: 1,
        last_asked_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();

    if (insertError) {
      console.warn("[chat-insights] upsert soft-failed:", insertError.message);
      return null;
    }
    return (inserted as ChatInsightRow) || null;
  } catch (error) {
    console.warn(
      "[chat-insights] record failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export function recordHomepageChatInsightAsync(
  rawQuestion: string,
  meta?: { companion?: string | null; pagePath?: string | null },
): void {
  void recordHomepageChatInsight(rawQuestion, meta);
}
