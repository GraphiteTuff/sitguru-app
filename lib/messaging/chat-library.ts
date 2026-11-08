/**
 * Pure rules for companion FAQs, live-agent handoff, and Help Center drafts.
 * No database access — safe to unit test.
 */

import {
  isFounderPersonalMarketplaceEmail,
  isHardcodedSuperUserEmail,
} from "@/lib/admin/super-users";

export const LIVE_AGENT_REPLY =
  "I don't have a SitGuru answer for that yet. I sent it to a live teammate, and they'll pick it up in chat.";

export type HelpAudience = "parent" | "guru" | "ambassador" | "all";

export type FaqArticle = {
  title: string;
  summary: string;
  body?: string | null;
  keywords?: string[] | null;
};

export function normalizeChatText(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[?!.,'"’]+/g, "")
    .replace(/\s+/g, " ");
}

export function questionKey(value: string) {
  return normalizeChatText(value).slice(0, 240);
}

export function isGreetingOnly(value: string) {
  const text = normalizeChatText(value);
  if (!text) return true;
  return /^(hi|hey|hello|yo|sup|thanks|thank you|ok|okay|good morning|good afternoon|good evening|bye)( there| rogue| scout| taco| delilah)?$/.test(
    text,
  );
}

/** A real question or problem, not a hello or a one-word name. */
export function isSubstantiveQuestion(value: string) {
  const raw = String(value || "").trim();
  const text = normalizeChatText(raw);
  if (!text || isGreetingOnly(raw)) return false;
  if (text.split(" ").length === 1 && !raw.includes("?")) return false;
  if (text.length < 12 && !raw.includes("?")) return false;
  return true;
}

/** Care matching stays with the companion instead of a live-agent alert. */
export function shouldHoldForCompanion(value: string) {
  const text = normalizeChatText(value);
  if (!text) return false;
  return (
    /\b\d{5}\b/.test(text) ||
    /\b(zip|zip code|near me|walker|sitter|boarding|drop in|drop-in|daycare|find a guru|guru near|in my area)\b/.test(
      text,
    )
  );
}

export function looksLikeHandoff(value: string) {
  const text = normalizeChatText(value);
  return (
    text.includes("sent it to a live teammate") ||
    text.includes("live teammate") ||
    text.includes("hit a snag")
  );
}

export function decideCompanionAssist(input: {
  question: string;
  faqAnswer?: string | null;
}) {
  const faq = String(input.faqAnswer || "").trim();
  if (faq) return { kind: "faq" as const, reply: faq };
  if (!isSubstantiveQuestion(input.question) || shouldHoldForCompanion(input.question)) {
    return { kind: "continue" as const, reply: "" };
  }
  return { kind: "agent" as const, reply: LIVE_AGENT_REPLY };
}

function tokens(value: string) {
  return normalizeChatText(value)
    .split(" ")
    .filter((word) => word.length > 2);
}

/** Approved Help Center copy only. Pending drafts never match. */
export function matchApprovedFaq(question: string, articles: FaqArticle[]) {
  const needle = normalizeChatText(question);
  const needleTokens = new Set(tokens(question));
  if (!needle || needleTokens.size === 0) return null;

  let best: { score: number; answer: string } | null = null;
  for (const article of articles) {
    const title = normalizeChatText(article.title);
    const titleTokens = tokens(article.title);
    if (!title || titleTokens.length === 0) continue;
    const exact = needle === title;
    const overlap = titleTokens.filter((word) => needleTokens.has(word)).length;
    const score = exact ? 1 : overlap / titleTokens.length;
    const keywordHit = (article.keywords || []).some((keyword) => {
      const key = normalizeChatText(keyword);
      return key.length > 6 && needle.includes(key);
    });
    if (!exact && score < 0.6 && !keywordHit) continue;
    if (!exact && overlap < 2 && !keywordHit) continue;
    const answer = String(article.body || article.summary || "").trim();
    if (!answer) continue;
    if (!best || score > best.score) best = { score, answer };
  }
  return best?.answer || null;
}

export function helpAudienceForCompanion(companion: string): HelpAudience {
  const key = String(companion || "").toLowerCase();
  if (key === "rogue") return "parent";
  if (key === "scout") return "guru";
  if (key === "taco") return "ambassador";
  return "all";
}

export function helpCategoryForQuestion(question: string) {
  const text = normalizeChatText(question);
  if (/\b(refund|payment|payout|stripe|charged|billing|invoice)\b/.test(text)) {
    return "Billing & Refunds";
  }
  if (/\b(cancel|booking|reschedule|no show)\b/.test(text)) {
    return "Booking & Cancellations";
  }
  if (/\b(login|password|profile|account|photo|avatar)\b/.test(text)) {
    return "Account & Profiles";
  }
  if (/\b(safe|safety|bite|injured|background|trust)\b/.test(text)) {
    return "Trust & Safety";
  }
  if (/\b(guru|payout|pawreport|calendar|rate)\b/.test(text)) {
    return "Guru Success & Training Hub";
  }
  if (/\b(intern|career|job|resume)\b/.test(text)) {
    return "Careers & Internships";
  }
  return "Pet Parent Support";
}

export function faqTitleFromQuestion(question: string) {
  const clean = String(question || "").trim().replace(/\s+/g, " ");
  if (!clean) return "SitGuru question";
  const sentence = clean.endsWith("?") ? clean : `${clean.replace(/[.]+$/, "")}?`;
  return sentence.slice(0, 140);
}

export function slugifyFaqTitle(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isLiveAgentSeat(input: {
  email?: string | null;
  role?: string | null;
  accountType?: string | null;
}) {
  if (isFounderPersonalMarketplaceEmail(input.email)) return false;
  if (isHardcodedSuperUserEmail(input.email)) return true;
  const role = `${input.role || ""} ${input.accountType || ""}`.toLowerCase();
  return /\b(admin|founder|owner|super_admin|superuser)\b/.test(role);
}

/** Admin and founder logins are not Interns in the chat directory. */
export function hideFromInternDirectory(input: {
  email?: string | null;
  role?: string | null;
  accountType?: string | null;
  userId?: string | null;
  actorUserId?: string | null;
}) {
  if (input.userId && input.actorUserId && input.userId === input.actorUserId) return true;
  if (isHardcodedSuperUserEmail(input.email)) return true;
  if (isFounderPersonalMarketplaceEmail(input.email)) return true;
  return isLiveAgentSeat(input);
}
