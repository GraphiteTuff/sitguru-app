// lib/messaging/ai-engine.ts
/**
 * SitGuru AI concierge — Anthropic Claude with help-catalog system prompt.
 * Supports non-streaming completion + SSE token streaming.
 */

import Anthropic from "@anthropic-ai/sdk";
import { buildSitGuruAiSystemPrompt } from "@/lib/messaging/help-context";

export type AiChatTurn = {
  role: "user" | "assistant" | "system";
  content: string;
};

const DEFAULT_MODEL = "claude-3-5-sonnet-latest";

function getAnthropicClient() {
  const apiKey = String(process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function getSitGuruAiModel() {
  return (
    String(process.env.ANTHROPIC_MODEL || "").trim() ||
    String(process.env.SITGURU_AI_MODEL || "").trim() ||
    DEFAULT_MODEL
  );
}

export function isSitGuruAiConfigured() {
  return Boolean(String(process.env.ANTHROPIC_API_KEY || "").trim());
}

function toClaudeMessages(history: AiChatTurn[] | undefined, userMessage: string) {
  const prior = (history || [])
    .filter((t) => t.role === "user" || t.role === "assistant")
    .slice(-12)
    .map((t) => ({
      role: t.role as "user" | "assistant",
      content: t.content,
    }));

  // Claude requires alternating user/assistant; merge consecutive same-role turns
  const merged: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const turn of [...prior, { role: "user" as const, content: userMessage }]) {
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) {
      last.content = `${last.content}\n\n${turn.content}`;
    } else {
      merged.push({ ...turn });
    }
  }

  if (merged[0]?.role !== "user") {
    merged.unshift({ role: "user", content: "(conversation continued)" });
  }

  return merged;
}

export async function completeSitGuruAiReply(params: {
  userMessage: string;
  history?: AiChatTurn[];
  audienceHint?: string;
  bookingId?: string | null;
}): Promise<{ ok: true; text: string; model: string } | { ok: false; error: string }> {
  const client = getAnthropicClient();
  if (!client) {
    return {
      ok: false,
      error: "SitGuru AI is not configured (missing ANTHROPIC_API_KEY).",
    };
  }

  const model = getSitGuruAiModel();
  const system = buildSitGuruAiSystemPrompt({
    audienceHint: params.audienceHint,
    bookingId: params.bookingId,
  });

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      temperature: 0.55,
      system,
      messages: toClaudeMessages(params.history, params.userMessage),
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    if (!text) {
      return { ok: false, error: "SitGuru AI returned an empty reply." };
    }

    return { ok: true, text, model };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SitGuru AI completion failed.";
    console.error("[sitguru-ai/claude]", message);
    return { ok: false, error: message };
  }
}

/**
 * Stream Claude tokens. Yields text deltas; throws on hard failures.
 */
export async function* streamSitGuruAiReply(params: {
  userMessage: string;
  history?: AiChatTurn[];
  audienceHint?: string;
  bookingId?: string | null;
}): AsyncGenerator<
  { type: "delta"; text: string } | { type: "done"; text: string; model: string },
  void,
  unknown
> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error("SitGuru AI is not configured (missing ANTHROPIC_API_KEY).");
  }

  const model = getSitGuruAiModel();
  const system = buildSitGuruAiSystemPrompt({
    audienceHint: params.audienceHint,
    bookingId: params.bookingId,
  });

  const stream = client.messages.stream({
    model,
    max_tokens: 1024,
    temperature: 0.55,
    system,
    messages: toClaudeMessages(params.history, params.userMessage),
  });

  let full = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const chunk = event.delta.text;
      full += chunk;
      yield { type: "delta", text: chunk };
    }
  }

  const finalMessage = await stream.finalMessage();
  const finalText =
    finalMessage.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim() || full.trim();

  yield { type: "done", text: finalText, model };
}
