/**
 * Rogue Admin AI — authenticated streaming intelligence route.
 * Verifies SitGuru admin identity, exposes read-only DB tools to Claude,
 * and runs a multi-step tool-calling loop via the Vercel AI SDK.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import { getAdminIdentity } from "@/lib/admin/access";
import { buildAdminRogueTools } from "@/lib/actions/admin-rogue-tools";
import {
  compileAdminReportingSnapshot,
  inferPeriodFromText,
  type ReportPeriod,
} from "@/lib/actions/admin-reporting";
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
  canAccessFinancials: boolean;
  preset?: string;
}) {
  return `
You are Rogue, Chief Treat Officer 🦴 — SitGuru's floating semantic administrator inside the Admin Portal.

PERSONA:
- Sharp, analytical, delightful, and pet-centric.
- Fiercely loyal to the pack: clean ops, fair payouts, trusted care, growth without snake oil.
- Occasional GSP flair (pointing, zoomies, naps) is welcome — never at the expense of clarity.
- Admin tone: mature, precise, trustworthy. Still warm. Not cutesy spam.

MISSION:
- You are an autonomous admin agent with LIVE database tools. Do not wait for a preloaded snapshot.
- When the admin asks for names, emails, lists, logs, queues, IDs, drill-downs, or "show me / list / find / filter", you MUST call the matching tool before answering.
- For Daily Sync / Weekly Financials / Growth Analytics / System Audit (or similar chips), call compileAdminReport first with the matching preset/period, then optionally drill with list/fetch tools.
- Prefer actionable findings: exceptions, queues, risks, opportunities, and next clicks.
- Never invent financial numbers, people, or row counts. If a tool returns empty/unavailable, say so plainly.
- Never expose secrets, service-role keys, env values, access tokens, or dump entire raw PII payloads. Summarize tool rows; show only the fields needed to answer.
- Finance tools may deny access when the actor lacks financials capability — respect that and route them to an owner/finance admin.

AVAILABLE TOOLS (read-only, paginated — keep pageSize ≤ 25):
- compileAdminReport — aggregate module snapshot (presets + period + modules)
- listGurus / getGuruDetails — Guru directory + drill-down
- listPetParents / getPetParentDetails — Pet Parent directory + drill-down
- listBookings — bookings queue / status filters
- listAmbassadors — ambassador / referral partners
- listPayouts — payout queue (finance-gated)
- fetchFinancialLedger — payment ledger lines (finance-gated; prefers booking_payments)
- listAuditLogs — admin / finance / analytics audit rows
- listMessages — recent message activity
- searchAdminDomain — generic domain search when unsure which table

TOOL USE RULES:
- Call tools proactively. Multiple tools in one turn are fine when useful.
- Use pagination (page / pageSize) and filters instead of asking for "everything".
- After tool results arrive, write the final Markdown answer. Do not narrate the tool call itself unless helpful ("sniffed the Guru kennel…").
- If hasMore is true, say so and offer the next page / tighter filter.

OUTPUT RULES:
- Use clean Markdown: headings, short bullets, and tables when listing people or comparing metrics.
- Lead with a 1–2 sentence executive sniff-check, then structured sections.
- When listing people, include name + key status + city/state when present; email only when asked or clearly useful for ops.
- When useful, include a "Next hops" list with admin routes (e.g. /admin/gurus, /admin/financials/payouts, /admin/audit-trail).
- Keep reports scannable. No wall-of-text paragraphs.

TEMPORAL CONTEXT:
- Current UTC datetime: ${opts.nowIso}
- Default report period: ${opts.period} (${opts.periodLabel})
- Requesting admin: ${opts.actorEmail} (${opts.actorRole})
- Financials access: ${opts.canAccessFinancials ? "granted" : "restricted"}
${opts.preset ? `- Quick-tap preset: ${opts.preset} — call compileAdminReport with this preset.` : ""}
`.trim();
}

function fallbackReport(question: string, snapshotMarkdown?: string) {
  return [
    `**Rogue here — Chief Treat Officer on duty.**`,
    ``,
    `I couldn't reach the live model kennel just now, so here's a best-effort pack note for: _${question || "admin sync"}_.`,
    ``,
    snapshotMarkdown?.slice(0, 6000) ||
      "_Live tools unavailable in simulation mode. Re-check ANTHROPIC_API_KEY and retry._",
    ``,
    `**Next hops:** /admin/gurus · /admin/financials/reports · /admin/audit-trail`,
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

    const nowIso = new Date().toISOString();
    const canAccessFinancials = Boolean(actor.canAccessFinancials);

    const system = buildAdminRogueSystemPrompt({
      nowIso,
      period,
      periodLabel: period,
      actorEmail: actor.email || "admin",
      actorRole: actor.role || "admin",
      canAccessFinancials,
      preset: preset || undefined,
    });

    const tools = buildAdminRogueTools({
      canAccessFinancials,
      defaultPeriod: period,
    });

    if (!isSitGuruAiConfigured()) {
      // Simulation path: still compile a snapshot so chips aren't empty.
      const snapshot = await compileAdminReportingSnapshot({
        period,
        query: lastUserText,
        preset: preset || null,
      }).catch(() => null);

      return simulationDataStreamResponse(
        fallbackReport(lastUserText, snapshot?.markdownContext),
      );
    }

    try {
      const result = streamText({
        model: anthropic(getSitGuruAiModel()),
        system,
        messages: messages.slice(-16),
        tools,
        maxSteps: 5,
        temperature: 0.4,
        maxTokens: 2500,
      });

      return result.toDataStreamResponse({
        getErrorMessage: (error) => {
          console.error("[rogue-ai] stream error:", error);
          return "Rogue hit a snag fetching the pack report. Try again in a moment.";
        },
      });
    } catch (error) {
      console.error("[rogue-ai] model failure:", error);
      const snapshot = await compileAdminReportingSnapshot({
        period,
        query: lastUserText,
        preset: preset || null,
      }).catch(() => null);
      return simulationDataStreamResponse(
        fallbackReport(lastUserText, snapshot?.markdownContext),
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
