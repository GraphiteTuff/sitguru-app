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
) {
  const clean = String(text || "").trim().slice(0, 2000);
  if (clean.length < 8) return;

  try {
    const hash = await hashInsightText(clean);
    await supabaseAdmin.rpc("upsert_global_chat_insight", {
      p_text_hash: hash,
      p_summary: clean,
      p_category: "General Inquiry",
      p_channel: channel,
      p_is_friction: false,
    });
  } catch (error) {
    console.error("[stream-send] insight soft-failed:", error);
  }
}

export async function handleAuthenticatedAiSend(req: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({
      data: { user: null },
    }));

    // Auth is preferred but not required — homepage CTO guests may stream anonymously.
    const userId = user?.id || null;

    const body = (await req.json()) as {
      messages?: CoreMessage[];
      walkId?: string;
      conversationId?: string;
    };

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const walkId = safeString(body?.walkId);
    const conversationId = safeString(body?.conversationId);
    const insightChannel = walkId ? "ACTIVE_WALK" : "HOMEPAGE_LEAD";

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    const lastUserText = messageContent(lastUserMessage);

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

    const result = streamText({
      model: anthropic("claude-3-5-sonnet-latest"),
      messages,
      system: `You are the Chief Treat Officer for SitGuru. Keep responses professional, helpful, brief, and warm.

BUSINESS CONTEXT & KNOWLEDGE BASE:
- SitGuru connects pet parents with professional pet care providers called "Gurus".
- If a user is looking for Pet Care, ask them specifically what type they need: Drop-in Visits, Dog Walks, or Overnight stays.
- If they are a future pet parent looking for care, proactively guide them to find and browse available "Gurus" on our platform.
- If a user wants to join the pack, screen for their specific interest: Are they looking to be a Sitter, a Dog Walker, or a Trainer? Direct them to our registration/onboarding flows.
- If an issue cannot be resolved or they ask to contact us directly, provide the email pack@sitguru.com.
${walkId ? `\nACTIVE WALK CONTEXT:\n- Current walk ID: ${walkId}. Prefer walk-aware guidance when relevant.\n` : ""}
CONSTRAINTS:
- Keep answers short and direct.
- Do not use overly informal filler words or slang.

${HOMEPAGE_CTO_VOICE_RULES}`,
      onFinish: async ({ text }) => {
        try {
          const assistantText = String(text || "").trim();
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

          if (lastUserText) {
            await recordChatInsight(lastUserText, insightChannel);
          }
        } catch (dbError) {
          console.error("Failed to save data asynchronously:", dbError);
        }
      },
    });

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
