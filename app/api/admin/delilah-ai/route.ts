/**
 * Delilah Admin AI — ambassador / influencer social tracking assistant.
 * Streams Claude via Vercel AI SDK with fetchLiveSocialFollowers tool calling.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import { getAdminIdentity } from "@/lib/admin/access";
import { buildDelilahSystemPrompt } from "@/lib/chat/delilah-system-prompt";
import { fetchLiveSocialFollowersTool } from "@/lib/chat/fetch-live-social-followers-tool";
import {
  getSitGuruAiModel,
  isSitGuruAiConfigured,
} from "@/lib/messaging/ai-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function messageContent(message: CoreMessage | undefined) {
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

function fallbackReport(question: string) {
  return [
    `**Delilah here — Ambassador tracking on duty.**`,
    ``,
    `I couldn't reach the live model just now for: _${question || "ambassador sync"}_.`,
    `Ask again in a moment, or open /admin/ambassadors while I warm up the kennel.`,
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const actor = await getAdminIdentity();
    if (!actor?.canAccessAdmin) {
      return Response.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      messages?: CoreMessage[];
      ambassadorId?: string;
      handle?: string;
    };

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      return Response.json(
        { error: "messages are required." },
        { status: 400 },
      );
    }

    const lastUserText = messageContent(messages[messages.length - 1]);
    const targetHint = [
      asString(body.ambassadorId)
        ? `ambassadorId=${asString(body.ambassadorId)}`
        : "",
      asString(body.handle) ? `handle=${asString(body.handle)}` : "",
      lastUserText ? `lastQuestion=${lastUserText.slice(0, 240)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const system = buildDelilahSystemPrompt({
      nowIso: new Date().toISOString(),
      actorEmail: actor.email,
      actorRole: actor.role,
      targetHint: targetHint || undefined,
    });

    if (!isSitGuruAiConfigured()) {
      return simulationDataStreamResponse(fallbackReport(lastUserText));
    }

    try {
      const result = streamText({
        model: anthropic(getSitGuruAiModel()),
        system,
        messages: messages.slice(-16),
        temperature: 0.45,
        maxTokens: 1800,
        tools: {
          fetchLiveSocialFollowers: fetchLiveSocialFollowersTool,
        },
        maxSteps: 4,
      });

      return result.toDataStreamResponse({
        getErrorMessage: (error) => {
          console.error("[delilah-ai] stream error:", error);
          return "Delilah hit a snag fetching ambassador socials. Try again in a moment.";
        },
      });
    } catch (error) {
      console.error("[delilah-ai] model failure:", error);
      return simulationDataStreamResponse(fallbackReport(lastUserText));
    }
  } catch (error) {
    console.error("[delilah-ai] route failure:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to run Delilah ambassador assistant.",
      },
      { status: 500 },
    );
  }
}
