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

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  try {
    if (!String(process.env.ANTHROPIC_API_KEY || "").trim()) {
      console.warn(
        "[stream-send] ANTHROPIC_API_KEY is undefined — cannot stream Claude replies.",
      );
      return new Response(
        JSON.stringify({
          error:
            "🐾 can you bark that at me one more time? my ears hit a little static, or you can drop a note to our pack leaders at pack@sitguru.com",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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
        system: `You are Rogue, Chief Treat Officer 🦴 for SitGuru — a high-energy, pet-friendly, hip, lowercase-conversational pack guide helping future members join the SitGuru Pet Community.
${nameDirective}
Always introduce yourself as Rogue, Chief Treat Officer when needed. Keep replies short (2–3 sentences), warm, and personalized to this chat participant.
Use hardcoded SitGuru definitions for Guru meaning, mission, PawPerks checkout redemption, and care types (Drop-in Visits, Dog Walks, Overnight stays).
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
    } catch (error) {
      console.warn(
        "[stream-send] Anthropic authorization/stream setup failed:",
        error instanceof Error ? error.message : error,
      );
      return new Response(
        JSON.stringify({
          error:
            "🐾 can you bark that at me one more time? my ears hit a little static, or you can drop a note to our pack leaders at pack@sitguru.com",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(
      "[stream-send] handler execution failed:",
      error instanceof Error ? error.message : error,
    );
    return new Response(
      JSON.stringify({ error: "Handler execution failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
