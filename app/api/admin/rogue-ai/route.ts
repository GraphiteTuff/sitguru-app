/**
 * Rogue Admin AI — authenticated streaming intelligence route.
 * Verifies SitGuru admin identity, compiles read-only reporting snapshots,
 * and streams Claude responses via the Vercel AI SDK data stream protocol.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  compileAdminReportingSnapshot,
  inferPeriodFromText,
  type ReportPeriod,
} from "@/lib/actions/admin-reporting";
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

function buildAdminRogueSystemPrompt(opts: {
  nowIso: string;
  period: ReportPeriod;
  periodLabel: string;
  actorEmail: string;
  actorRole: string;
  snapshotMarkdown: string;
  preset?: string;
}) {
  return `
You are Rogue, Chief Treat Officer 🦴 — SitGuru's floating semantic administrator inside the Admin Portal.

PERSONA:
- Sharp, analytical, delightful, and pet-centric.
- You are fiercely loyal to the pack and obsessed with clean ops, fair payouts, trusted care, and growth that doesn't smell like snake oil.
- Occasional GSP flair is welcome (pointing, zoomies, naps) — but never at the expense of clarity.
- Admin tone: mature, precise, trustworthy. Still warm. Not cutesy spam.

MISSION:
- Scan the injected ADMIN DATA SNAPSHOT and answer the admin's question.
- Compile daily / weekly / monthly / yearly style reports when asked.
- Prefer actionable findings: exceptions, queues, risks, opportunities, and next clicks.
- Never invent financial numbers. If a module is unavailable or zero, say so plainly.
- Never expose secrets, service-role keys, env values, or raw PII dumps beyond what the snapshot already summarizes.

LIVE SOCIAL FOLLOWERS (MANDATORY WHEN RELEVANT):
- You CAN fetch live brand social follower updates. Do NOT say "Social media data isn't in my kennel" or that social metrics are unavailable.
- When the admin asks about new followers today, Instagram / Facebook / TikTok / X growth, or @SitGuruOfficial pack totals, call fetchLiveSocialFollowers with scope: "admin".
- Example: fetchLiveSocialFollowers({ "scope": "admin", "platform": "all" })
- For a single network: fetchLiveSocialFollowers({ "scope": "admin", "platform": "instagram" })
- Individual ambassador / influencer handles belong to Delilah (scope: "ambassador"). If asked about a specific influencer, say Delilah owns that sniff — or call scope "ambassador" with their handle if the admin explicitly wants you to pull it.
- Never invent follower counts — only report tool results (live or cached).

OUTPUT RULES:
- Use clean Markdown: headings, short bullets, and tables when comparing metrics.
- Lead with a 1–2 sentence executive sniff-check, then structured sections.
- When useful, include a "Next hops" list with admin routes (e.g. /admin/financials/payouts).
- Keep reports scannable. No wall-of-text paragraphs.

TEMPORAL CONTEXT:
- Current UTC datetime: ${opts.nowIso}
- Active report period: ${opts.period} (${opts.periodLabel})
- Requesting admin: ${opts.actorEmail} (${opts.actorRole})
${opts.preset ? `- Quick-tap preset: ${opts.preset}` : ""}

ADMIN DATA SNAPSHOT (read-only, defensive aggregates):
${opts.snapshotMarkdown}
`.trim();
}

function fallbackReport(snapshotMarkdown: string, question: string) {
  return [
    `**Rogue here — Chief Treat Officer on duty.**`,
    ``,
    `I couldn't reach the live model kennel just now, so here's a raw snapshot pack for: _${question || "admin sync"}_.`,
    ``,
    snapshotMarkdown.slice(0, 6000) || "_No snapshot rows available._",
    ``,
    `**Next hops:** /admin/financials/reports · /admin/analytics · /admin/audit-trail`,
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
      preset?: string;
      period?: ReportPeriod | string;
      reportPeriod?: ReportPeriod | string;
    };

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      return Response.json(
        { error: "messages are required." },
        { status: 400 },
      );
    }

    const lastUserText = messageContent(messages[messages.length - 1]);
    const preset = asString(body.preset);
    const periodHint = asString(body.period || body.reportPeriod);
    const period: ReportPeriod =
      periodHint === "daily" ||
      periodHint === "weekly" ||
      periodHint === "monthly" ||
      periodHint === "yearly"
        ? periodHint
        : inferPeriodFromText(`${preset} ${lastUserText}`);

    const snapshot = await compileAdminReportingSnapshot({
      period,
      query: lastUserText,
      preset: preset || null,
    }).catch(() => null);

    const snapshotMarkdown =
      snapshot?.markdownContext ||
      "# SitGuru Admin Snapshot\n- No live module data available.";

    const nowIso = new Date().toISOString();
    const system = buildAdminRogueSystemPrompt({
      nowIso,
      period: snapshot?.period || period,
      periodLabel: snapshot?.periodLabel || period,
      actorEmail: actor.email,
      actorRole: actor.role,
      snapshotMarkdown,
      preset: preset || undefined,
    });

    if (!isSitGuruAiConfigured()) {
      return simulationDataStreamResponse(
        fallbackReport(snapshotMarkdown, lastUserText),
      );
    }

    try {
      const result = streamText({
        model: anthropic(getSitGuruAiModel()),
        system,
        messages: messages.slice(-16),
        temperature: 0.4,
        maxTokens: 2500,
        tools: {
          fetchLiveSocialFollowers: fetchLiveSocialFollowersTool,
        },
        maxSteps: 4,
      });

      return result.toDataStreamResponse({
        getErrorMessage: (error) => {
          console.error("[rogue-ai] stream error:", error);
          return "Rogue hit a snag fetching the pack report. Try again in a moment.";
        },
      });
    } catch (error) {
      console.error("[rogue-ai] model failure:", error);
      return simulationDataStreamResponse(
        fallbackReport(snapshotMarkdown, lastUserText),
      );
    }
  } catch (error) {
    console.error("[rogue-ai] route failure:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to run Rogue admin assistant.",
      },
      { status: 500 },
    );
  }
}
