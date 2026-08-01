// app/api/chat/homepage-lead/route.ts
/**
 * Anonymous homepage lead funnel — guest UUID cookie + LEAD_FUNNEL conversation
 * bootstrap, then Claude SSE stream (claude-3-5-sonnet-20241022 via ai-engine).
 *
 * Cookie rule: resolve `cookies()` at absolute POST entry before any stream work.
 */

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClientFromCookieStore } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  isSitGuruAiConfigured,
  streamSitGuruAiReply,
  type AiChatTurn,
} from "@/lib/messaging/ai-engine";
import {
  disableAiAssist,
  insertAiMessage,
} from "@/lib/messaging/conversation-ai";
import {
  evaluateHandoffNeed,
  extractLeadContact,
} from "@/lib/messaging/handoff";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/lib/help/articles";
import { recordHomepageChatInsightAsync, recordGlobalChatInsightAsync } from "@/lib/chat/insights";
import { HOMEPAGE_CTO_VOICE_RULES } from "@/lib/chat/homepage-cta";
import {
  SIMULATION_NAME_PROMPT,
  buildHomepageSimulationReply,
} from "@/lib/chat/homepage-simulation";
import {
  isReservedPreferredName,
  sanitizePreferredName,
} from "@/lib/chat/homepage-name";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GUEST_COOKIE = "sitguru_lead_guest_id";
const LEAD_CHANNEL = "LEAD_FUNNEL";
/** Verified Anthropic production model id for homepage CTO funnel */
const HOMEPAGE_LEAD_MODEL = "claude-3-5-sonnet-20241022";
const AUDIENCE_HINT =
  "cold homepage leads, young pup parents, future Gurus, and Brand Ambassadors sniffing around the SitGuru pack";

/** Exact conversion copy when visitor wants to book / join without contact yet */
const CONTACT_PROMPT =
  "Happy to connect you with a Pack Coordinator. What is the best email or phone number to reach you?";

const PACK_PERSONA = "pack" as const;

/**
 * Bulletproof inline site context — no external formatter / array loops.
 * Claude must process this FIRST for Guru / mission questions.
 */
const SIT_GURU_SITE_CONTEXT = `
CORE CONTEXT: A Guru is an expert pet care provider on the SitGuru platform. This includes highly verified local sitters, dog walkers, pet trainers, groomers, boarding providers, and experienced neighborhood caregivers who lead with absolute reliability, communication, and deep respect for each pet's unique daily routine and personality.
CORE PLATFORM DEFINITIONS & CONTEXT:
- What is a Guru?: A Guru is an expert pet care provider on the SitGuru platform. This includes highly verified local sitters, dog walkers, pet trainers, groomers, boarding providers, and experienced neighborhood caregivers who lead with absolute reliability, communication, and deep respect for each pet's unique daily routine and personality.
- Mission: To make premium pet care feel deeply personal, safe, community-supported, and easily trackable across every neighborhood.
`.trim();

const SIMULATION_WELCOME = SIMULATION_NAME_PROMPT;

function buildSimulationReply(opts: {
  clientFirstName?: string;
  lastUserText?: string;
}): string {
  return buildHomepageSimulationReply(opts);
}

/**
 * Dual-source system injection for Rogue, Chief Treat Officer:
 * Inline site context (first) + voice rules + Help Center catalog.
 */
function buildCompleteKnowledgeInjection(clientFirstName?: string): string {
  const categories = Array.isArray(HELP_CATEGORIES) ? HELP_CATEGORIES : [];
  const articles = Array.isArray(HELP_ARTICLES) ? HELP_ARTICLES : [];

  const categoryBlock = categories
    .map(
      (c) =>
        `- ${c?.title || "Category"}: ${c?.description || ""} (${c?.hubHref || "/help"})`,
    )
    .join("\n");

  const articleBlock = articles
    .map((a) =>
      [
        `### ${a?.title || "Article"}`,
        `Category: ${a?.category || ""} | Audience: ${a?.audience || ""}`,
        `URL: ${a?.href || "/help"}`,
        `Summary: ${a?.summary || ""}`,
        `Tags: ${Array.isArray(a?.tags) ? a.tags.join(", ") : ""}`,
        `Keywords: ${Array.isArray(a?.keywords) ? a.keywords.join(", ") : ""}`,
      ].join("\n"),
    )
    .join("\n\n");

  const nameBlock = clientFirstName
    ? `\nVISITOR PREFERRED NAME: ${clientFirstName}.
MANDATORY: Address them as ${clientFirstName} in every reply. NEVER call the visitor Rogue — Rogue is your name only.
Stay interactive: greetings get "hi / how are you / i'm doing great" energy before care help.\n`
    : `\nNo visitor preferred name yet.
CRITICAL: You are Rogue. NEVER address the visitor as Rogue. "Hi Rogue" means they greeted YOU — ask how they are, say you're doing great, then ask what to call them.\n`;

  return [
    "# IDENTITY — ROGUE, CHIEF TREAT OFFICER 🦴",
    "You are Rogue, Chief Treat Officer for SitGuru. High-energy, pet-friendly, hip, lowercase slang conversational.",
    "Guide the visitor as a future member of the SitGuru Pet Community. Keep replies to 2–3 short sentences.",
    nameBlock,
    "# PRIORITY SITE CONTEXT — SCAN THIS FIRST",
    "Use these hardcoded definitions for platform questions (What is a Guru?, mission, PawPerks):",
    SIT_GURU_SITE_CONTEXT,
    "",
    HOMEPAGE_CTO_VOICE_RULES,
    "",
    "# COMPLETE SITGURU HELP CATALOG (authoritative — scan fully before answering)",
    "You are the ultimate platform expert. Use this complete catalog dataset to answer questions on:",
    "Ambassador referral payouts, dynamic calendar configurations, multi-pet tracking paths, real-time Live Map pings, and PawPerks reward point balances / checkout redemption.",
    "Never invent unpublished rates or a visitor's live PawPerks balance.",
    "Keep every answer under 2–3 short lines even when using this knowledge.",
    "",
    "## Categories",
    categoryBlock || "- (catalog unavailable — use SIT_GURU_SITE_CONTEXT)",
    "",
    "## Articles",
    articleBlock || "- (articles unavailable — use SIT_GURU_SITE_CONTEXT)",
  ].join("\n");
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatLeadTranscript(
  turns: AiChatTurn[],
  clientFirstName?: string,
): string {
  const header = clientFirstName
    ? `Visitor: ${clientFirstName}\n`
    : "Visitor: (anonymous)\n";
  const body = turns
    .map((t) => `${t.role}: ${safeString(t.content)}`)
    .filter((line) => line.length > 8)
    .join("\n");
  return `${header}${body}`.slice(0, 2000);
}

function recordLeadTranscriptAsync(
  turns: AiChatTurn[],
  clientFirstName?: string,
) {
  const transcript = formatLeadTranscript(turns, clientFirstName);
  if (transcript.length < 12) return;
  recordGlobalChatInsightAsync({
    text: transcript,
    channel: "HOMEPAGE_LEAD",
  });
}

function sseEncode(data: Record<string, unknown>) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function parseHistory(value: unknown): AiChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const role = safeString((row as { role?: unknown })?.role);
      const content = safeString((row as { content?: unknown })?.content);
      if (!content) return null;
      if (role !== "user" && role !== "assistant") return null;
      return { role, content } as AiChatTurn;
    })
    .filter(Boolean) as AiChatTurn[];
}

async function resolvePrimaryAdminId() {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1);
  return String((data?.[0] as { id?: string } | undefined)?.id || "").trim();
}

async function ensureLeadConversation(params: {
  guestId: string;
  adminUserId: string | null;
  conversationId?: string;
}) {
  if (params.conversationId) {
    const { data } = await supabaseAdmin
      .from("conversations")
      .select(
        "id,ai_assist_enabled,sms_phone_e164,subject,topic,ai_handoff_reason",
      )
      .eq("id", params.conversationId)
      .maybeSingle();
    if (data?.id) {
      return {
        conversationId: String(data.id),
        aiAssistEnabled: Boolean(
          (data as { ai_assist_enabled?: boolean }).ai_assist_enabled ?? true,
        ),
        pendingContact: String(
          (data as { ai_handoff_reason?: string | null }).ai_handoff_reason || "",
        ).startsWith("pending_contact"),
        created: false,
      };
    }
  }

  const now = new Date().toISOString();
  const base = {
    subject: `Lead Funnel · SitGuru AI · ${params.guestId.slice(0, 8)}`,
    status: "open",
    topic: LEAD_CHANNEL,
    last_message_at: now,
    last_message_preview: "Homepage lead funnel started",
    created_at: now,
    updated_at: now,
    ...(params.adminUserId ? { started_by_user_id: params.adminUserId } : {}),
  };

  const attempts: Record<string, unknown>[] = [
    {
      ...base,
      ai_assist_enabled: true,
      primary_channel: LEAD_CHANNEL,
      channel_type: LEAD_CHANNEL,
    },
    {
      ...base,
      ai_assist_enabled: true,
      primary_channel: LEAD_CHANNEL,
    },
    {
      ...base,
      ai_assist_enabled: true,
    },
    base,
  ];

  let conversationId = "";
  let lastError = "";
  for (const payload of attempts) {
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (!error && data?.id) {
      conversationId = String(data.id);
      break;
    }
    lastError = error?.message || lastError;
  }

  if (!conversationId) {
    throw new Error(lastError || "Unable to create LEAD_FUNNEL conversation.");
  }

  if (params.adminUserId) {
    await supabaseAdmin.from("conversation_participants").upsert(
      {
        conversation_id: conversationId,
        user_id: params.adminUserId,
        role: "admin",
        created_at: now,
        updated_at: now,
      },
      { onConflict: "conversation_id,user_id", ignoreDuplicates: false },
    );
  }

  // Soft-link guest session for admin inbox continuity (best-effort)
  await supabaseAdmin
    .from("homepage_messenger_sessions")
    .insert({
      conversation_id: conversationId,
      visitor_token: params.guestId,
      topic: LEAD_CHANNEL,
      source: "homepage-chat-bubble",
      created_at: now,
      updated_at: now,
      last_seen_at: now,
    })
    .then(({ error }) => {
      if (error) {
        console.warn("[homepage-lead] session insert soft-failed:", error.message);
      }
    });

  return { conversationId, aiAssistEnabled: true, pendingContact: false, created: true };
}

async function persistVisitorMessage(params: {
  conversationId: string;
  adminUserId: string | null;
  guestId: string;
  message: string;
  email: string | null;
  phone: string | null;
}) {
  const now = new Date().toISOString();
  const preview = params.message.slice(0, 240);

  const { error: msgError } = await supabaseAdmin.from("messages").insert({
    conversation_id: params.conversationId,
    sender_id: null,
    recipient_id: params.adminUserId,
    sender_role: "visitor",
    recipient_role: "admin",
    sender_name_snapshot: "Homepage Lead",
    sender_email_snapshot: params.email,
    sender_phone_snapshot: params.phone,
    sender_role_snapshot: "visitor",
    recipient_name_snapshot: "SitGuru Admin",
    recipient_role_snapshot: "admin",
    content: params.message,
    body: params.message,
    message_type: "lead_funnel",
    channel: "ai",
    created_at: now,
  });

  if (msgError) {
    console.warn("[homepage-lead] visitor message soft-failed:", msgError.message);
  }

  await supabaseAdmin
    .from("conversations")
    .update({
      last_message_at: now,
      last_message_preview: preview,
      updated_at: now,
      ...(params.phone ? { sms_phone_e164: params.phone } : {}),
    })
    .eq("id", params.conversationId);

  if (params.email || params.phone) {
    await supabaseAdmin
      .from("homepage_messenger_sessions")
      .update({
        email: params.email,
        phone: params.phone,
        updated_at: now,
        last_seen_at: now,
      })
      .eq("conversation_id", params.conversationId)
      .eq("visitor_token", params.guestId);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleHomepageLeadPost(req);
  } catch (error) {
    console.error(
      "[homepage-lead] unhandled route failure — simulation fallback:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({
      ok: true,
      reply: SIMULATION_WELCOME,
      simulated: true,
    });
  }
}

async function handleHomepageLeadPost(req: NextRequest) {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const clientFirstNameRaw = sanitizePreferredName(body.client_first_name).slice(
    0,
    40,
  );
  const clientFirstName = isReservedPreferredName(clientFirstNameRaw)
    ? ""
    : clientFirstNameRaw;
  const history = parseHistory(body.history || body.messages);
  const auditOnly = body.auditTranscript === true;

  // Persist full visitor transcript for CRM audit (close / cancel / terminate)
  if (auditOnly || history.length > 0) {
    try {
      const turns =
        history.length > 0
          ? history
          : ([
              {
                role: "user" as const,
                content: safeString(body.message) || "[session_closed]",
              },
            ] as AiChatTurn[]);
      recordLeadTranscriptAsync(turns, clientFirstName || undefined);
    } catch (error) {
      console.warn(
        "[homepage-lead] transcript audit soft-failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  if (auditOnly) {
    return NextResponse.json({ ok: true, audited: true });
  }

  const message = safeString(body.message || body.text || body.content);
  if (!message || message.length > 4000) {
    return NextResponse.json(
      { error: "Please send a message between 1 and 4000 characters." },
      { status: 400 },
    );
  }

  // Non-blocking Chat Insights tally (questions → Admin analytics)
  try {
    recordHomepageChatInsightAsync(message);
  } catch {
    // never block the chat path on analytics
  }

  const requestedConversationId = safeString(body.conversationId);
  const wantStream = body.stream !== false;

  // Authenticated user? Prefer profile id; otherwise mint guest UUID cookie.
  let userId: string | null = null;
  if (cookieStore) {
    try {
      const supabase = createClientFromCookieStore(cookieStore);
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id || null;
    } catch {
      userId = null;
    }
  }

  let guestId = userId || "";
  let setGuestCookie = false;
  if (!guestId) {
    guestId = safeString(cookieStore?.get(GUEST_COOKIE)?.value);
    if (!guestId) {
      guestId = randomUUID();
      setGuestCookie = true;
    }
  }

  let adminUserId = "";
  try {
    adminUserId = await resolvePrimaryAdminId();
  } catch {
    adminUserId = "";
  }

  let conversationId = "";
  let aiAssistEnabled = true;
  let pendingContact = false;
  try {
    const ensured = await ensureLeadConversation({
      guestId,
      adminUserId: adminUserId || null,
      conversationId: requestedConversationId || undefined,
    });
    conversationId = ensured.conversationId;
    aiAssistEnabled = ensured.aiAssistEnabled;
    pendingContact = ensured.pendingContact;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open lead conversation.",
      },
      { status: 500 },
    );
  }

  const contact = extractLeadContact(message);
  const handoff = evaluateHandoffNeed(message);

  try {
    await persistVisitorMessage({
      conversationId,
      adminUserId: adminUserId || null,
      guestId,
      message,
      email: contact.email,
      phone: contact.phone,
    });
  } catch (error) {
    console.warn(
      "[homepage-lead] persist soft-failed:",
      error instanceof Error ? error.message : error,
    );
  }

  const hasContact = Boolean(contact.email || contact.phone);
  const hardTriggers = handoff.triggers.some((t) =>
    ["safety", "manager_request", "explicit_human", "negative_sentiment"].includes(
      t,
    ),
  );

  // Elevate when: hard human/safety, OR (intent/pending + contact shared)
  const elevateNow =
    aiAssistEnabled &&
    (hardTriggers ||
      (hasContact && (handoff.shouldHandoff || pendingContact)));

  if (elevateNow) {
    await disableAiAssist({
      conversationId,
      reason:
        handoff.reason ||
        (pendingContact
          ? "Lead funnel: visitor shared contact for teammate follow-up."
          : "Lead funnel elevation"),
      preview: message,
    });
    aiAssistEnabled = false;

    const notice = hasContact
      ? `Wonderful — a human Pack Coordinator is on the way! ${
          contact.email ? `Email on file: ${contact.email}. ` : ""
        }${contact.phone ? `Phone on file: ${contact.phone}. ` : ""}We'll fetch your profile and get those tails wagging shortly.`
      : "A human Pack Coordinator has been notified and will take over this chat with tail-wagging support shortly.";

    if (adminUserId) {
      await insertAiMessage({
        conversationId,
        recipientUserId: adminUserId,
        text: notice,
      }).catch(() => null);
    }

    const response = NextResponse.json({
      ok: true,
      handedOff: true,
      conversationId,
      guestId,
      aiAssistEnabled: false,
      triggers: handoff.triggers,
      reply: notice,
      contact,
      model: HOMEPAGE_LEAD_MODEL,
    });
    if (setGuestCookie) {
      response.cookies.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  // Intent without contact — ask for email/phone before elevating
  if (aiAssistEnabled && handoff.shouldHandoff && !hasContact) {
    await supabaseAdmin
      .from("conversations")
      .update({
        ai_handoff_reason: `pending_contact:${handoff.reason || "lead_intent"}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    const reply = CONTACT_PROMPT;
    if (adminUserId) {
      await insertAiMessage({
        conversationId,
        recipientUserId: adminUserId,
        text: reply,
      }).catch(() => null);
    }
    const response = NextResponse.json({
      ok: true,
      handedOff: false,
      awaitingContact: true,
      conversationId,
      guestId,
      aiAssistEnabled: true,
      triggers: handoff.triggers,
      reply,
      model: HOMEPAGE_LEAD_MODEL,
    });
    if (setGuestCookie) {
      response.cookies.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  if (!isSitGuruAiConfigured() || !String(process.env.ANTHROPIC_API_KEY || "").trim()) {
    console.warn(
      "[homepage-lead] ANTHROPIC_API_KEY is undefined or AI is not configured — returning simulation fallback without crashing.",
    );
    const fallback = buildSimulationReply({
      clientFirstName: clientFirstName || undefined,
      lastUserText: message,
    });
    const response = NextResponse.json({
      ok: true,
      conversationId,
      guestId,
      reply: fallback,
      aiAssistEnabled,
      model: HOMEPAGE_LEAD_MODEL,
      simulated: true,
    });
    if (setGuestCookie) {
      response.cookies.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  const systemExtra = buildCompleteKnowledgeInjection(
    clientFirstName || undefined,
  );

  if (!wantStream) {
    const { completeSitGuruAiReply } = await import("@/lib/messaging/ai-engine");
    const completion = await completeSitGuruAiReply({
      userMessage: message,
      history,
      audienceHint: AUDIENCE_HINT,
      persona: PACK_PERSONA,
      model: HOMEPAGE_LEAD_MODEL,
      systemExtra,
    });
    if (completion.ok && adminUserId) {
      await insertAiMessage({
        conversationId,
        recipientUserId: adminUserId,
        text: completion.text,
      }).catch(() => null);
    }
    const response = NextResponse.json({
      ok: completion.ok,
      conversationId,
      guestId,
      reply: completion.ok ? completion.text : undefined,
      error: completion.ok ? undefined : completion.error,
      aiAssistEnabled,
      model: HOMEPAGE_LEAD_MODEL,
    });
    if (setGuestCookie) {
      response.cookies.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  const encoder = new TextEncoder();
  const streamGuestId = guestId;
  const streamSetCookie = setGuestCookie;

  const readable = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEncode(payload)));
      };

      try {
        send({
          type: "meta",
          conversationId,
          guestId: streamGuestId,
          model: HOMEPAGE_LEAD_MODEL,
          channelType: LEAD_CHANNEL,
          systemDigest: "SIT_GURU_SITE_CONTEXT + help catalog injected",
        });

        let full = "";
        for await (const event of streamSitGuruAiReply({
          userMessage: message,
          history,
          audienceHint: AUDIENCE_HINT,
          persona: PACK_PERSONA,
          model: HOMEPAGE_LEAD_MODEL,
          systemExtra,
        })) {
          if (event.type === "delta") {
            full += event.text;
            send({ type: "delta", text: event.text });
          } else if (event.type === "done") {
            full = event.text || full;
            if (adminUserId && full) {
              await insertAiMessage({
                conversationId,
                recipientUserId: adminUserId,
                text: full,
              }).catch(() => null);
            }
            recordLeadTranscriptAsync(
              [
                ...history,
                { role: "user", content: message },
                { role: "assistant", content: full },
              ],
              clientFirstName || undefined,
            );
            send({
              type: "done",
              text: full,
              model: event.model,
              conversationId,
              aiAssistEnabled,
            });
          }
        }
      } catch (error) {
        console.warn(
          "[homepage-lead] Anthropic stream failed — using simulation fallback:",
          error instanceof Error ? error.message : error,
        );
        const simulated = buildSimulationReply({
          clientFirstName: clientFirstName || undefined,
          lastUserText: message,
        });
        send({ type: "delta", text: simulated });
        send({
          type: "done",
          text: simulated,
          model: "simulation-fallback",
          conversationId,
          aiAssistEnabled,
          simulated: true,
        });
      } finally {
        controller.close();
      }
    },
  });

  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  if (streamSetCookie) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    headers.append(
      "Set-Cookie",
      `${GUEST_COOKIE}=${streamGuestId}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; HttpOnly${secure}`,
    );
  }

  return new Response(readable, { headers });
}
