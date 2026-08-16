/**
 * Shared Claude stream for messaging / chat send routes.
 * Supports authenticated members and anonymous homepage CTO guests.
 * Edge-compatible: Web Crypto hashing + soft-fail DB side effects.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, type CoreMessage } from "ai";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { lookupGurusTool } from "@/lib/chat/rogue-guru-tool";
import { fetchLiveSocialFollowersTool } from "@/lib/chat/rogue-social-tool";
import {
  isReservedPreferredName,
  sanitizePreferredName,
} from "@/lib/chat/homepage-name";
import { buildHomepageSimulationReplyWithGurus } from "@/lib/chat/homepage-simulation-gurus";
import { buildRogueSystemPrompt } from "@/lib/chat/rogue-system-prompt";
import { normalizeRogueUserType } from "@/lib/chat/rogue-user-type";
import {
  matchMarketingFaq,
  ROGUE_PUBLIC_MARKETING_FAQS,
} from "@/lib/ai/officer-marketing-faqs";
import {
  extractGuruCardsFromText,
  inferLookupParamsFromChat,
} from "@/lib/gurus/guru-chat-snapshot";
import { getSitGuruAiModel } from "@/lib/messaging/ai-model";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Pull exact [[guru_card:...]] markers from lookupGurus tool digests. */
function collectGuruCardMarkersFromToolSteps(
  steps: Array<{
    toolResults?: Array<{ toolName?: string; result?: unknown }>;
  }>,
): string[] {
  const markers: string[] = [];
  const seen = new Set<string>();

  for (const step of steps || []) {
    for (const toolResult of step.toolResults || []) {
      if (toolResult.toolName !== "lookupGurus") continue;
      const raw =
        typeof toolResult.result === "string"
          ? toolResult.result
          : JSON.stringify(toolResult.result ?? "");
      const matches = raw.match(/\[\[\s*guru_card\s*:[^\]]+\]\]/gi) || [];
      for (const marker of matches) {
        if (seen.has(marker)) continue;
        seen.add(marker);
        markers.push(marker);
      }
    }
  }

  return markers;
}

/** If the model named Gurus but skipped markers, append the tool markers. */
function ensureGuruCardsInAssistantText(
  text: string,
  markers: string[],
): string {
  let out = String(text || "").trim();
  if (!markers.length) return out;

  const existing = extractGuruCardsFromText(out).cards;
  if (existing.length > 0) return out;

  out = `${out} ${markers.join(" ")}`.trim();
  if (!/\[\[\s*cta:parent\s*\]\]/i.test(out)) {
    out = `${out} [[cta:parent]]`;
  }
  return out;
}

function shouldForceGuruLookup(lastUserText: string) {
  const params = inferLookupParamsFromChat(lastUserText);
  if (!params) return false;
  return Boolean(
    params.city || params.state || params.zip || params.name || params.service,
  );
}

async function buildSimulationReply(opts: {
  clientFirstName?: string;
  lastUserText?: string;
}): Promise<string> {
  return buildHomepageSimulationReplyWithGurus(opts);
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
  meta?: { companion?: string | null; pagePath?: string | null },
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
      p_companion: meta?.companion || (channel === "ACTIVE_WALK" ? "rogue" : "rogue"),
      p_page_path:
        meta?.pagePath ||
        (channel === "ACTIVE_WALK" ? "/pawreport" : "/"),
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
      user_role?: string;
      user_type?: string;
      userRole?: string;
      channel?: string;
      companion?: string;
      pagePath?: string;
      page_path?: string;
    };

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const walkId = safeString(body?.walkId);
    const conversationId = safeString(body?.conversationId);
    const companionKey = safeString(body?.companion) || "rogue";
    const pagePath =
      safeString(body?.pagePath) ||
      safeString(body?.page_path) ||
      (walkId ? "/pawreport" : "/");
    const insightMeta = { companion: companionKey, pagePath };
    const clientFirstNameRaw = sanitizePreferredName(
      body?.client_first_name,
    ).slice(0, 40);
    const clientFirstName = isReservedPreferredName(clientFirstNameRaw)
      ? ""
      : clientFirstNameRaw;
    parsedClientFirstName = clientFirstName;
    const userTypeLabel = normalizeRogueUserType(
      body?.userRole || body?.user_type || body?.user_role || "Guest Pet Parent",
    );
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

    const simulationPayload = async () =>
      simulationDataStreamResponse(
        await buildSimulationReply({
          clientFirstName,
          lastUserText,
        }),
      );

    if (!String(process.env.ANTHROPIC_API_KEY || "").trim()) {
      console.warn(
        "[stream-send] ANTHROPIC_API_KEY is undefined — serving simulation fallback stream.",
      );
      return await simulationPayload();
    }

    // Always persist a HOMEPAGE_LEAD / ACTIVE_WALK transcript snapshot for CRM audit
    void recordChatInsight(
      formatTranscript(messages, clientFirstName),
      insightChannel,
      clientFirstName ? `Lead:${clientFirstName}` : "Homepage Chat Transcript",
      insightMeta,
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
      void recordChatInsight(lastUserText, insightChannel, "General Inquiry", insightMeta);
    }

    const exactParentFaq = matchMarketingFaq(
      ROGUE_PUBLIC_MARKETING_FAQS,
      lastUserText,
    );
    if (exactParentFaq?.answer) {
      return simulationDataStreamResponse(exactParentFaq.answer);
    }

    const systemPrompt = buildRogueSystemPrompt({
      clientFirstName,
      userRole: userTypeLabel,
      lastUserText,
      walkId: walkId || undefined,
    });

    let result;
    try {
      const sharedModelConfig = {
        model: anthropic(getSitGuruAiModel()),
        messages,
        system: systemPrompt,
        tools: {
          lookupGurus: lookupGurusTool,
          fetchLiveSocialFollowers: fetchLiveSocialFollowersTool,
        },
        maxSteps: 3 as const,
      };

      // Care searches: generate fully so we can append exact [[guru_card:]]
      // markers from the tool digest when the model omits/truncates them.
      if (shouldForceGuruLookup(lastUserText)) {
        const generated = await generateText({
          ...sharedModelConfig,
          maxTokens: 1400,
        });

        let assistantText = ensureGuruCardsInAssistantText(
          String(generated.text || "").trim(),
          collectGuruCardMarkersFromToolSteps([
            {
              toolResults: (generated.toolResults || []) as Array<{
                toolName?: string;
                result?: unknown;
              }>,
            },
            ...((generated.steps || []) as Array<{
              toolResults?: Array<{ toolName?: string; result?: unknown }>;
            }>),
          ]),
        );

        if (!assistantText) {
          assistantText = await buildSimulationReply({
            clientFirstName,
            lastUserText,
          });
        }

        void (async () => {
          try {
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
              insightMeta,
            );

            if (conversationId && userId && assistantText) {
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
        })();

        return simulationDataStreamResponse(assistantText);
      }

      result = streamText({
        ...sharedModelConfig,
        maxTokens: 1200,
        onFinish: async ({ text, steps }) => {
          try {
            const assistantText = ensureGuruCardsInAssistantText(
              String(text || "").trim(),
              collectGuruCardMarkersFromToolSteps(
                (steps || []) as Array<{
                  toolResults?: Array<{ toolName?: string; result?: unknown }>;
                }>,
              ),
            );
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
              insightMeta,
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
      return await simulationPayload();
    }
  } catch (error) {
    console.error(
      "[stream-send] handler execution failed — simulation fallback:",
      error instanceof Error ? error.message : error,
    );
    return simulationDataStreamResponse(
      await buildSimulationReply({
        clientFirstName: parsedClientFirstName,
        lastUserText: parsedLastUserText,
      }),
    );
  }
}
