/**
 * Persist chats, compile FAQ drafts, publish approved answers, and alert a live agent.
 * Service role only. Missing tables fail soft so chat still sends.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  faqTitleFromQuestion,
  helpAudienceForCompanion,
  helpCategoryForQuestion,
  isLiveAgentSeat,
  looksLikeHandoff,
  matchApprovedFaq,
  questionKey,
  slugifyFaqTitle,
  type FaqArticle,
} from "@/lib/messaging/chat-library";

function text(value: unknown) {
  return String(value ?? "").trim();
}

export async function loadApprovedFaqArticles(): Promise<FaqArticle[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("help_center_articles")
      .select("title,summary,body,keywords,is_published")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((row) => ({
      title: text(row.title),
      summary: text(row.summary),
      body: text(row.body),
      keywords: Array.isArray(row.keywords) ? row.keywords.map((item) => text(item)) : [],
    }));
  } catch {
    return [];
  }
}

export async function rememberChat(input: {
  source: "companion" | "staff" | "live_agent";
  companion?: string;
  conversationId?: string;
  actorUserId?: string | null;
  actorName?: string;
  actorRole?: string;
  question: string;
  answer?: string;
  pagePath?: string;
  compilable?: boolean;
  preferAnswer?: boolean;
}) {
  const question = text(input.question).slice(0, 2000);
  const answer = text(input.answer).slice(0, 8000);
  if (!question && !answer) return { ok: false as const };
  const key = questionKey(question);
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_transcripts")
      .insert({
        source: input.source,
        companion: text(input.companion),
        conversation_id: text(input.conversationId),
        actor_user_id: input.actorUserId || null,
        actor_name: text(input.actorName).slice(0, 80),
        actor_role: text(input.actorRole).slice(0, 40),
        question,
        answer,
        page_path: text(input.pagePath).slice(0, 180),
        question_key: key,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      console.warn("[chat-archive] transcript skipped:", error.message);
      return { ok: false as const };
    }
    if (input.compilable && question && answer && !looksLikeHandoff(answer)) {
      await compileFaqDraft({
        transcriptId: text(data?.id),
        question,
        answer,
        companion: input.companion,
        preferAnswer: input.preferAnswer,
      });
    }
    return { ok: true as const, id: text(data?.id) };
  } catch (error) {
    console.warn("[chat-archive] transcript failed:", error instanceof Error ? error.message : error);
    return { ok: false as const };
  }
}

async function compileFaqDraft(input: {
  transcriptId?: string;
  question: string;
  answer: string;
  companion?: string;
  preferAnswer?: boolean;
}) {
  const key = questionKey(input.question);
  if (!key) return;
  const { data: approved } = await supabaseAdmin
    .from("chat_faq_drafts")
    .select("id")
    .eq("question_key", key)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  if (approved?.id) return;

  const { data: pending } = await supabaseAdmin
    .from("chat_faq_drafts")
    .select("id,frequency,answer")
    .eq("question_key", key)
    .eq("status", "pending")
    .maybeSingle();
  if (pending?.id) {
    const nextAnswer = input.preferAnswer || !text(pending.answer) ? input.answer : text(pending.answer);
    await supabaseAdmin
      .from("chat_faq_drafts")
      .update({
        frequency: Number(pending.frequency || 1) + 1,
        answer: nextAnswer,
      })
      .eq("id", pending.id);
    return;
  }

  await supabaseAdmin.from("chat_faq_drafts").insert({
    transcript_id: input.transcriptId || null,
    question: input.question,
    answer: input.answer,
    audience: helpAudienceForCompanion(input.companion || ""),
    category: helpCategoryForQuestion(input.question),
    companion: text(input.companion),
    status: "pending",
    question_key: key,
    frequency: 1,
  });
}

export async function listLiveAgentIds() {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id,email,role,account_type,first_name,full_name,avatar_url,profile_photo_url")
      .limit(200);
    if (error || !data) return [];
    return (data as Record<string, unknown>[])
      .filter((row) =>
        isLiveAgentSeat({
          email: text(row.email),
          role: text(row.role),
          accountType: text(row.account_type),
        }),
      )
      .map((row) => ({
        id: text(row.id),
        name: text(row.first_name) || text(row.full_name).split(/\s+/)[0] || "Admin",
        avatarUrl: text(row.avatar_url || row.profile_photo_url),
      }))
      .filter((row) => row.id);
  } catch {
    return [];
  }
}

export async function alertLiveAgent(input: {
  question: string;
  companion?: string;
  pagePath?: string;
  actorUserId?: string | null;
  actorName?: string;
  actorRole?: string;
}) {
  const question = text(input.question).slice(0, 2000);
  if (!question) return { ok: false as const };
  const agents = await listLiveAgentIds();
  const primary = agents[0];
  await rememberChat({
    source: "live_agent",
    companion: input.companion,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    question,
    answer: "",
    pagePath: input.pagePath,
    compilable: false,
  });
  if (!primary) return { ok: false as const, error: "No admin is available for live chat." };

  const key = questionKey(question);
  const now = new Date().toISOString();
  try {
    const { data: existing } = await supabaseAdmin
      .from("conversations")
      .select("id,subject")
      .eq("conversation_type", "live_agent")
      .eq("workflow_status", "open")
      .eq("assigned_user_id", primary.id)
      .order("updated_at", { ascending: false })
      .limit(12);
    const match = ((existing || []) as { id?: string; subject?: string }[]).find(
      (row) => questionKey(text(row.subject)) === key,
    );
    let conversationId = text(match?.id);
    if (!conversationId) {
      const { data, error } = await supabaseAdmin
        .from("conversations")
        .insert({
          subject: question.slice(0, 140),
          conversation_type: "live_agent",
          workflow_status: "open",
          started_by_user_id: input.actorUserId || primary.id,
          assigned_user_id: primary.id,
          last_message_preview: question.slice(0, 140),
          last_message_at: now,
          escalation_reason: `${text(input.companion) || "companion"} could not answer`,
          retention_class: "standard_internal",
        })
        .select("id")
        .single();
      if (error || !data?.id) {
        console.warn("[chat-archive] live agent conversation skipped:", error?.message);
        return { ok: false as const };
      }
      conversationId = text(data.id);
      const seen = new Set<string>();
      const participants = [
        ...(input.actorUserId
          ? [{ conversation_id: conversationId, user_id: input.actorUserId, role: text(input.actorRole) || "guest" }]
          : []),
        ...agents.slice(0, 6).map((agent) => ({
          conversation_id: conversationId,
          user_id: agent.id,
          role: "admin",
        })),
      ].filter((row) => {
        if (!row.user_id || seen.has(row.user_id)) return false;
        seen.add(row.user_id);
        return true;
      });
      if (participants.length) {
        await supabaseAdmin.from("conversation_participants").insert(participants);
      }
    }

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: input.actorUserId || null,
      recipient_id: primary.id,
      content: question,
      body: question,
      visibility: "participant",
      sender_name_snapshot: text(input.actorName) || "SitGuru guest",
      sender_role_snapshot: text(input.actorRole) || text(input.companion) || "guest",
      status: "unread",
      created_at: now,
    });
    await supabaseAdmin
      .from("conversations")
      .update({
        last_message_preview: question.slice(0, 140),
        last_message_at: now,
        updated_at: now,
        workflow_status: "open",
      })
      .eq("id", conversationId);
    return { ok: true as const, conversationId };
  } catch (error) {
    console.warn("[chat-archive] live agent alert failed:", error instanceof Error ? error.message : error);
    return { ok: false as const };
  }
}

export async function settleCompanionTurn(input: {
  question: string;
  staticFaq?: string | null;
  companion: string;
  pagePath?: string;
  actorUserId?: string | null;
  actorName?: string;
  actorRole?: string;
  holdForCompanion?: boolean;
}) {
  const question = text(input.question);
  const staticFaq = text(input.staticFaq);
  let faq = staticFaq;
  if (!faq && question) {
    const articles = await loadApprovedFaqArticles();
    faq = matchApprovedFaq(question, articles) || "";
  }
  if (faq) {
    void rememberChat({
      source: "companion",
      companion: input.companion,
      actorUserId: input.actorUserId,
      actorName: input.actorName,
      actorRole: input.actorRole,
      question,
      answer: faq,
      pagePath: input.pagePath,
      compilable: true,
      preferAnswer: false,
    });
    // Static catalog answers are still voiced by the companion.
    // Approved Help Center articles are sent as written.
    const takeOver = staticFaq.length === 0;
    return { takeOver, reply: faq };
  }
  if (input.holdForCompanion || !question) {
    if (question) {
      void rememberChat({
        source: "companion",
        companion: input.companion,
        actorUserId: input.actorUserId,
        actorName: input.actorName,
        actorRole: input.actorRole,
        question,
        pagePath: input.pagePath,
        compilable: false,
      });
    }
    return { takeOver: false as const, reply: "" };
  }
  // No FAQ hit: do NOT invent a live-teammate handoff. Continue to the model
  // with retrieval. alertLiveAgent stays available for real safety handoffs only.
  void rememberChat({
    source: "companion",
    companion: input.companion,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    question,
    pagePath: input.pagePath,
    compilable: false,
  });
  return { takeOver: false as const, reply: "" };
}

export async function rememberModelAnswer(input: {
  question: string;
  answer: string;
  companion?: string;
  pagePath?: string;
  actorUserId?: string | null;
  actorName?: string;
  conversationId?: string;
}) {
  const answer = text(input.answer);
  if (!text(input.question) || !answer || looksLikeHandoff(answer)) return;
  await rememberChat({
    source: "companion",
    companion: input.companion,
    conversationId: input.conversationId,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    question: input.question,
    answer,
    pagePath: input.pagePath,
    compilable: true,
    preferAnswer: false,
  });
}

export type FaqDraftRow = {
  id: string;
  question: string;
  answer: string;
  audience: string;
  category: string;
  companion: string;
  status: string;
  frequency: number;
  articleSlug: string;
  createdAt: string;
};

export async function listFaqDrafts(status: "pending" | "approved" | "rejected" = "pending") {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_faq_drafts")
      .select("id,question,answer,audience,category,companion,status,frequency,article_slug,created_at")
      .eq("status", status)
      .order("frequency", { ascending: false })
      .limit(40);
    if (error || !data) return [] as FaqDraftRow[];
    return (data as Record<string, unknown>[]).map((row) => ({
      id: text(row.id),
      question: text(row.question),
      answer: text(row.answer),
      audience: text(row.audience) || "all",
      category: text(row.category),
      companion: text(row.companion),
      status: text(row.status),
      frequency: Number(row.frequency || 1),
      articleSlug: text(row.article_slug),
      createdAt: text(row.created_at),
    }));
  } catch {
    return [] as FaqDraftRow[];
  }
}

export async function countStoredChats() {
  try {
    const { count, error } = await supabaseAdmin
      .from("chat_transcripts")
      .select("id", { count: "exact", head: true });
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function reviewFaqDraft(input: {
  id: string;
  action: "approve" | "reject";
  reviewerId: string;
}) {
  const { data: draft, error } = await supabaseAdmin
    .from("chat_faq_drafts")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();
  if (error || !draft) return { ok: false as const, error: "That FAQ draft is not in the queue." };
  const row = draft as Record<string, unknown>;
  if (text(row.status) !== "pending") return { ok: false as const, error: "That FAQ was already reviewed." };
  const now = new Date().toISOString();
  if (input.action === "reject") {
    await supabaseAdmin
      .from("chat_faq_drafts")
      .update({ status: "rejected", reviewed_at: now, reviewed_by: input.reviewerId })
      .eq("id", input.id);
    return { ok: true as const, slug: "" };
  }

  const title = faqTitleFromQuestion(text(row.question));
  const base = slugifyFaqTitle(title) || `chat-faq-${input.id.slice(0, 8)}`;
  let slug = base;
  for (let i = 0; i < 5; i += 1) {
    const { data: clash } = await supabaseAdmin
      .from("help_center_articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${base}-${i + 2}`;
  }
  const summary = text(row.answer).slice(0, 280);
  const { error: articleError } = await supabaseAdmin.from("help_center_articles").insert({
    slug,
    href: `/help/insights/${slug}`,
    title,
    summary,
    body: text(row.answer),
    audience: text(row.audience) || "all",
    category: text(row.category) || "Pet Parent Support",
    tags: ["chat-faq", text(row.companion) || "chat"].filter(Boolean),
    keywords: [text(row.question).slice(0, 80), text(row.companion)].filter(Boolean),
    published_by: input.reviewerId,
    is_published: true,
    created_at: now,
    updated_at: now,
  });
  if (articleError) return { ok: false as const, error: articleError.message };
  await supabaseAdmin
    .from("chat_faq_drafts")
    .update({
      status: "approved",
      article_slug: slug,
      reviewed_at: now,
      reviewed_by: input.reviewerId,
    })
    .eq("id", input.id);
  return { ok: true as const, slug };
}
