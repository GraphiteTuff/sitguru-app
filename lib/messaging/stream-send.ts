/**
 * Shared Claude stream for messaging / chat send routes.
 * Supports authenticated members and anonymous homepage CTO guests.
 * Edge-compatible: Web Crypto hashing + soft-fail DB side effects.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { HOMEPAGE_CTO_VOICE_RULES } from "@/lib/chat/homepage-cta";

/** Hardcoded marketing context — never depends on DB lookups. */
const CORE_SITE_CONTEXT =
  "CORE CONTEXT: A Guru is an expert pet care provider on the SitGuru platform. This includes highly verified local sitters, dog walkers, pet trainers, groomers, boarding providers, and experienced neighborhood caregivers who lead with absolute reliability, communication, and deep respect for each pet's unique daily routine and personality.";

const SIMULATION_WELCOME =
  "hey! welcome to the pack 🐾 what's your first name (or what do you like to be called) so we can kick off your journey into our sitguru pet community?";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildSimulationReply(opts: {
  clientFirstName?: string;
  lastUserText?: string;
}): string {
  const preferred = safeString(opts.clientFirstName).slice(0, 40);
  const text = safeString(opts.lastUserText).toLowerCase();

  if (!preferred) return SIMULATION_WELCOME;

  if (
    /guru|what is a guru|provider|sitter|walker|trainer|boarding|groomer/.test(
      text,
    )
  ) {
    return `hey ${preferred}! a guru is an expert pet care provider on sitguru — verified local sitters, dog walkers, trainers, groomers, boarding providers, and neighborhood caregivers who lead with reliability, communication, and respect for each pet's routine. what's the move?`;
  }

  if (/ambassador|referral|student|veteran|community/.test(text)) {
    return `hey ${preferred}! love that ambassador energy — community, student, or veteran tracks welcome. i can point you to apply + the onboarding video whenever you're ready.`;
  }

  if (/drop-?in|walk|overnight|boarding|pet care|book/.test(text)) {
    return `hey ${preferred}! we can set you up with drop-in visits, dog walks, overnight stays, or boarding with local gurus. which care type feels right?`;
  }

  return `hey ${preferred}! i got you — book care, join as a guru, or hop into ambassadors. what should we dig into first?`;
}

/** AI SDK v4 data-stream payload so useChat renders a normal assistant bubble. */
function simulationDataStreamResponse(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  });
}

function isRecoverableAiFailure(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : null;
  const lower = message.toLowerCase();
  return (
    status === 404 ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    lower.includes("404") ||
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("econnreset") ||
    lower.includes("anthropic") ||
    lower.includes("unauthorized") ||
    lower.includes("api key")
  );
}

function messageContent(message: CoreMessage | undefined): string {
  if (!message) return "";
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return String((part as { text: string }).text);
        }
        return "";
      })
      .join(" ")
      .trim();
  }
  return "";
}

async function hashInsightText(text: string): Promise<string> {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 64);
}

async function recordChatInsight(
  text: string,
  channel: "ACTIVE_WALK" | "HOMEPAGE_LEAD",
  category = "General Inquiry",
) {
  const clean = String(text || "").trim().slice(0, 2000);
  if (clean.length < 8) return;

  try {
    const hash = await hashInsightText(clean);
    await supabaseAdmin.rpc("upsert_global_chat_insight", {
      p_text_hash: hash,
      p_summary: clean,
      p_category: category,
      p_channel: channel,
      p_is_friction: false,
    });
  } catch (error) {
    console.error("[stream-send] insight soft-failed:", error);
  }
}

function formatTranscript(
  messages: CoreMessage[],
  clientFirstName?: string,
): string {
  const header = clientFirstName
    ? `Visitor: ${clientFirstName}\n`
    : "Visitor: (anonymous)\n";
  const lines = messages
    .map((m) => {
      const role = String((m as { role?: string }).role || "unknown");
      return `${role}: ${messageContent(m)}`;
    })
    .filter((line) => !line.endsWith(": "));
  return `${header}${lines.join("\n")}`.slice(0, 2000);
}

export async function handleAuthenticatedAiSend(req: Request): Promise<Response> {
  let parsedClientFirstName = "";
  let parsedLastUserText = "";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({
      data: { user: null },
    }));

    const userId = user?.id || null;

    const body = (await req.json()) as {
      messages?: CoreMessage[];
      walkId?: string;
      conversationId?: string;
      client_first_name?: string;
      channel?: string;
    };

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const walkId = safeString(body?.walkId);
    const conversationId = safeString(body?.conversationId);
    const clientFirstName = safeString(body?.client_first_name).slice(0, 40);
    parsedClientFirstName = clientFirstName;
    const insightChannel =
      walkId || safeString(body?.channel) === "ACTIVE_WALK"
        ? "ACTIVE_WALK"
        : "HOMEPAGE_LEAD";

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    const lastUserText = messageContent(lastUserMessage);
    parsedLastUserText = lastUserText;

    const simulationPayload = () =>
      simulationDataStreamResponse(
        buildSimulationReply({
          clientFirstName,
          lastUserText,
        }),
      );

    if (!String(process.env.ANTHROPIC_API_KEY || "").trim()) {
      console.warn(
        "[stream-send] ANTHROPIC_API_KEY is undefined — serving simulation fallback stream.",
      );
      return simulationPayload();
    }

    // Always persist a HOMEPAGE_LEAD / ACTIVE_WALK transcript snapshot for CRM audit
    void recordChatInsight(
      formatTranscript(messages, clientFirstName),
      insightChannel,
      clientFirstName ? `Lead:${clientFirstName}` : "Homepage Chat Transcript",
    );

    if (conversationId && userId && lastUserText) {
      void supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: lastUserText,
          body: lastUserText,
          is_ai: false,
          channel: "in_app",
          message_type: "direct_message",
          topic: walkId ? "active_walk" : "direct_message",
        })
        .then(({ error }) => {
          if (error) {
            console.error("[stream-send] user message soft-failed:", error.message);
          }
        });
    }

    if (lastUserText) {
      void recordChatInsight(lastUserText, insightChannel);
    }

    const nameDirective = clientFirstName
      ? `\nVISITOR PREFERRED NAME: ${clientFirstName}.
MANDATORY: This chat participant wants to be called "${clientFirstName}" (first name, nickname, or whatever they said they go by). Address them as ${clientFirstName} in EVERY reply (naturally, once per message). Do not rename or formalize it. Never reply without using their preferred name. Examples: "i am so stoked to guide you through this, ${clientFirstName}!", "let's get you set up in our pet community, ${clientFirstName}!", "we got you ${clientFirstName}!".\n`
      : `\nNo preferred name yet — ask what they like to be called before deeper guidance.\n`;

    let result;
    try {
      result = streamText({
        model: anthropic("claude-3-5-sonnet-latest"),
        messages,
        system: `You are Rogue, Your Chief Treat Officer 🦴 for SitGuru — a high-energy, pet-friendly, hip, lowercase-conversational pack guide helping future members join the SitGuru Pet Community.
${nameDirective}
${CORE_SITE_CONTEXT}
Always introduce yourself as Rogue, Your Chief Treat Officer when needed. Keep replies short (2–3 sentences), warm, and personalized to this chat participant.
Use hardcoded SitGuru definitions for Guru meaning, mission, PawPerks checkout redemption, and care types (Drop-in Visits, Dog Walks, Overnight stays, Boarding).
If unresolved or they ask for a human, share pack@sitguru.com.
${walkId ? `\nACTIVE WALK CONTEXT:\n- Current walk ID: ${walkId}. Prefer walk-aware guidance when relevant.\n` : ""}

${HOMEPAGE_CTO_VOICE_RULES}`,
        onFinish: async ({ text }) => {
          try {
            const assistantText = String(text || "").trim();
            const withAssistant = [
              ...messages,
              { role: "assistant" as const, content: assistantText },
            ];
            await recordChatInsight(
              formatTranscript(withAssistant, clientFirstName),
              insightChannel,
              clientFirstName
                ? `Lead:${clientFirstName}`
                : "Homepage Chat Transcript",
            );

            if (!assistantText) return;

            if (conversationId && userId) {
              const { error } = await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: userId,
                content: assistantText,
                body: assistantText,
                is_ai: true,
                channel: "ai",
                message_type: "ai_assist",
                topic: walkId ? "active_walk" : "ai_assist",
              });
              if (error) {
                console.error(
                  "[stream-send] assistant message soft-failed:",
                  error.message,
                );
              }
            }
          } catch (dbError) {
            console.error("Failed to save data asynchronously:", dbError);
          }
        },
      });
      return result.toDataStreamResponse();
    } catch (error) {
      console.warn(
        "[stream-send] Anthropic authorization/stream setup failed — simulation fallback:",
        error instanceof Error ? error.message : error,
        isRecoverableAiFailure(error) ? "(recoverable)" : "(unexpected)",
      );
      return simulationPayload();
    }
  } catch (error) {
    console.error(
      "[stream-send] handler execution failed — simulation fallback:",
      error instanceof Error ? error.message : error,
    );
    return simulationDataStreamResponse(
      buildSimulationReply({
        clientFirstName: parsedClientFirstName,
        lastUserText: parsedLastUserText,
      }),
    );
  }
}
