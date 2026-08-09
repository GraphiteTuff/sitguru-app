/**
 * Generic Pet Officer stream endpoint — Taco (Ambassador) + Scout (Guru).
 *
 * Rogue's admin route (`/api/admin/rogue-ai`) is intentionally untouched.
 * This handler only serves guest officers with session-scoped snapshots.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, getBearerToken } from "@/lib/supabase/admin";
import {
  buildOfficerSystemPrompt,
  getOfficerPrompt,
  isGuestOfficerId,
  normalizeOfficerSurface,
  type GuestOfficerId,
  type OfficerSurface,
} from "@/lib/ai/officer-prompts";
import {
  compileTacoSnapshot,
  compileScoutSnapshot,
} from "@/lib/actions/officer-tools";
import {
  buildMarketingFaqSnapshot,
  isAmbassadorRoleExplainQuery,
  matchMarketingFaq,
  SCOUT_PUBLIC_MARKETING_FAQS,
  TACO_PUBLIC_MARKETING_FAQS,
  TACO_WHAT_AMBASSADORS_DO_ANSWER,
} from "@/lib/ai/officer-marketing-faqs";
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

async function resolveSessionUser(req: Request) {
  const bearer = getBearerToken(req);
  if (bearer) {
    const { data, error } = await supabaseAdmin.auth.getUser(bearer);
    if (!error && data?.user?.id) {
      return {
        id: data.user.id,
        email: asString(data.user.email),
        accessToken: bearer,
      };
    }
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      return {
        id: user.id,
        email: asString(user.email),
        accessToken: null as string | null,
      };
    }
  } catch {
    // Cookie session unavailable.
  }

  return null;
}

async function assertOfficerAccess(
  officer: GuestOfficerId,
  userId: string,
): Promise<{ ok: true; actorLabel: string; providerId?: string | null } | { ok: false; status: number; error: string }> {
  if (officer === "taco") {
    const [{ data: profile }, { data: ambassador }, { data: ledger }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("role,account_type,full_name,email")
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("ambassadors")
          .select("id,full_name,email,status,dashboard_enabled")
          .eq("user_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("ambassador_profiles")
          .select("id,display_name,referral_code_slug")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    const role = asString(
      (profile as { role?: string } | null)?.role,
    ).toLowerCase();
    const accountType = asString(
      (profile as { account_type?: string } | null)?.account_type,
    ).toLowerCase();
    const hasAmbassadorRow = Boolean(
      (ambassador as { id?: string } | null)?.id ||
        (ledger as { id?: string } | null)?.id,
    );
    const allowed =
      hasAmbassadorRow ||
      role === "ambassador" ||
      role === "admin" ||
      role === "super_admin" ||
      accountType.includes("ambassador");

    if (!allowed) {
      return {
        ok: false,
        status: 403,
        error: "Ambassador access required for Taco.",
      };
    }

    const name =
      asString((ambassador as { full_name?: string } | null)?.full_name) ||
      asString((ledger as { display_name?: string } | null)?.display_name) ||
      asString((profile as { full_name?: string } | null)?.full_name) ||
      asString((profile as { email?: string } | null)?.email) ||
      userId;

    return { ok: true, actorLabel: `${name} (ambassador)` };
  }

  // Scout — Guru provider
  const [{ data: profile }, { data: guru }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("role,account_type,full_name,email")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("gurus")
      .select("id,user_id,full_name,display_name,email")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const role = asString(
    (profile as { role?: string } | null)?.role,
  ).toLowerCase();
  const accountType = asString(
    (profile as { account_type?: string } | null)?.account_type,
  ).toLowerCase();
  const providerId = asString((guru as { id?: string } | null)?.id) || null;
  const allowed =
    Boolean(providerId) ||
    role === "guru" ||
    role === "provider" ||
    role === "admin" ||
    role === "super_admin" ||
    accountType.includes("guru") ||
    accountType.includes("provider");

  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: "Guru provider access required for Scout.",
    };
  }

  const name =
    asString((guru as { display_name?: string } | null)?.display_name) ||
    asString((guru as { full_name?: string } | null)?.full_name) ||
    asString((profile as { full_name?: string } | null)?.full_name) ||
    asString((profile as { email?: string } | null)?.email) ||
    userId;

  return {
    ok: true,
    actorLabel: `${name} (guru)`,
    providerId,
  };
}

function fallbackReport(
  officer: GuestOfficerId,
  snapshotMarkdown: string,
  question: string,
  surface: OfficerSurface = "dashboard",
) {
  const profile = getOfficerPrompt(officer);
  if (surface === "public") {
    const faqs =
      officer === "scout"
        ? SCOUT_PUBLIC_MARKETING_FAQS
        : TACO_PUBLIC_MARKETING_FAQS;
    const hit = matchMarketingFaq(faqs, question);
    if (hit?.answer) {
      return hit.answer;
    }
    return [
      `**${profile.displayName} here.**`,
      ``,
      `I couldn't reach the live model kennel just now — tap a FAQ chip or ask about signing up, and I'll answer from SitGuru's public marketing copy.`,
    ].join("\n");
  }

  return [
    `**${profile.displayName} here — ${profile.title}.**`,
    ``,
    `I couldn't reach the live model kennel just now, so here's your personal snapshot for: _${question || "sync"}_.`,
    ``,
    snapshotMarkdown.slice(0, 6000) || "_No snapshot rows available._",
  ].join("\n");
}

function publicMarketingSnapshot(officer: GuestOfficerId) {
  if (officer === "scout") {
    return buildMarketingFaqSnapshot({
      officerLabel: "Scout · Guru Matching Officer",
      faqs: SCOUT_PUBLIC_MARKETING_FAQS,
      signupPath: "/become-a-guru",
    });
  }
  return buildMarketingFaqSnapshot({
    officerLabel: "Taco · Ambassador Advocate",
    faqs: TACO_PUBLIC_MARKETING_FAQS,
    signupPath: "/programs/ambassadors/apply",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      messages?: CoreMessage[];
      officer?: string;
      officerId?: string;
      preset?: string;
      accessToken?: string | null;
      providerId?: string | null;
      guruName?: string | null;
      guruEmail?: string | null;
      surface?: string;
      mode?: string;
      companion?: string;
      pagePath?: string;
      page_path?: string;
    };

    const officerRaw = asString(body?.officer || body?.officerId).toLowerCase();
    if (!isGuestOfficerId(officerRaw)) {
      return Response.json(
        {
          error:
            "officer must be 'taco' or 'scout'. Rogue remains on /api/admin/rogue-ai.",
        },
        { status: 400 },
      );
    }
    const officer: GuestOfficerId = officerRaw;
    let surface = normalizeOfficerSurface(body?.surface || body?.mode);
    const pagePath =
      asString(body?.pagePath) ||
      asString(body?.page_path) ||
      (officer === "scout" ? "/become-a-guru" : "/ambassadors");
    const companionKey = asString(body?.companion) || officer;
    const bodyGuruName = asString(body?.guruName);
    const bodyGuruEmail = asString(body?.guruEmail);

    // Prefer explicit body token (mobile / cross-origin) then Authorization header / cookies.
    // Defensive: never throw on missing/undefined session tokens for public guests.
    let session = await resolveSessionUser(req).catch(() => null);
    const bodyToken = asString(body?.accessToken);
    if ((!session || !session?.id) && bodyToken) {
      try {
        const { data, error } = await supabaseAdmin.auth.getUser(bodyToken);
        if (!error && data?.user?.id) {
          session = {
            id: data.user.id,
            email: asString(data.user.email),
            accessToken: bodyToken,
          };
        }
      } catch {
        // Invalid guest token — public surface continues without a session.
      }
    }

    // Role layouts also wrap login/onboarding — fall back to public FAQ mode
    // instead of crashing with a session-token 401 for unauthenticated guests.
    if (!session?.id && surface !== "public") {
      surface = "public";
    }

    let actorLabel = "Public guest (marketing)";
    let providerId: string | null = null;

    if (session?.id && surface !== "public") {
      const access = await assertOfficerAccess(officer, session.id);
      if (!access.ok) {
        return Response.json({ error: access.error }, { status: access.status });
      }
      const personalizedName =
        officer === "scout" && bodyGuruName ? bodyGuruName : null;
      actorLabel = personalizedName
        ? `${personalizedName} (guru)${
            bodyGuruEmail || session.email
              ? ` · ${bodyGuruEmail || session.email}`
              : ""
          }`
        : `${access.actorLabel}${session.email ? ` · ${session.email}` : ""}`;
      providerId = access.providerId ?? null;
    } else if (session?.id) {
      actorLabel = `Signed-in guest${session.email ? ` · ${session.email}` : ""}`;
    }

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (!messages.length) {
      return Response.json(
        { error: "messages are required." },
        { status: 400 },
      );
    }

    const lastUserText = messageContent(messages[messages.length - 1]);
    const preset = asString(body?.preset);

    if (lastUserText) {
      try {
        const { recordGlobalChatInsightAsync } = await import(
          "@/lib/chat/insights"
        );
        recordGlobalChatInsightAsync({
          text: lastUserText,
          channel: "HOMEPAGE_LEAD",
          companion: companionKey,
          pagePath,
        });
      } catch {
        /* soft-fail */
      }
    }

    // Taco: always embed the Ambassador promo video + role description for
    // "what do Ambassadors do?" style asks (public marketing or dashboard).
    if (officer === "taco" && isAmbassadorRoleExplainQuery(lastUserText)) {
      return simulationDataStreamResponse(TACO_WHAT_AMBASSADORS_DO_ANSWER);
    }

    // Public surface: exact marketing FAQ database. Dashboard: session snapshots.
    let snapshotMarkdown: string;
    if (surface === "public") {
      snapshotMarkdown = publicMarketingSnapshot(officer);
      const faqs =
        officer === "scout"
          ? SCOUT_PUBLIC_MARKETING_FAQS
          : TACO_PUBLIC_MARKETING_FAQS;
      const exactFaq = matchMarketingFaq(faqs, lastUserText);
      // Deterministic FAQ answers for chip taps — even when the model is configured.
      if (exactFaq?.answer) {
        return simulationDataStreamResponse(exactFaq.answer);
      }
    } else {
      const snapshot =
        officer === "taco"
          ? await compileTacoSnapshot(session!.id).catch(() => null)
          : await compileScoutSnapshot(
              session!.id,
              asString(body?.providerId) || providerId || null,
            ).catch(() => null);

      snapshotMarkdown =
        snapshot?.markdownContext ||
        `# ${getOfficerPrompt(officer).displayName} Snapshot\n- No live module data available.`;

      if (officer === "scout" && (bodyGuruName || bodyGuruEmail || providerId || asString(body?.providerId))) {
        snapshotMarkdown = [
          `# Scout · Personalized Guru Context`,
          bodyGuruName ? `- Guru name: ${bodyGuruName}` : null,
          bodyGuruEmail ? `- Guru email: ${bodyGuruEmail}` : null,
          asString(body?.providerId) || providerId
            ? `- Provider id: ${asString(body?.providerId) || providerId}`
            : null,
          ``,
          snapshotMarkdown,
        ]
          .filter((line) => line !== null)
          .join("\n");
      }
    }

    const nowIso = new Date().toISOString();
    const system = buildOfficerSystemPrompt({
      officerId: officer,
      nowIso,
      actorLabel,
      snapshotMarkdown,
      preset: preset || undefined,
      surface,
    });

    if (!isSitGuruAiConfigured()) {
      return simulationDataStreamResponse(
        fallbackReport(officer, snapshotMarkdown, lastUserText, surface),
      );
    }

    try {
      const result = streamText({
        model: anthropic(getSitGuruAiModel()),
        system,
        messages: messages.slice(-16),
        temperature: 0.45,
        maxTokens: 1800,
      });

      return result.toDataStreamResponse({
        getErrorMessage: (error) => {
          console.error(`[officer-stream:${officer}] stream error:`, error);
          return `${getOfficerPrompt(officer).displayName} hit a snag. Try again in a moment.`;
        },
      });
    } catch (error) {
      console.error(`[officer-stream:${officer}] model failure:`, error);
      return simulationDataStreamResponse(
        fallbackReport(officer, snapshotMarkdown, lastUserText, surface),
      );
    }
  } catch (error) {
    console.error("[officer-stream] route failure:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to run Pet Officer assistant.",
      },
      { status: 500 },
    );
  }
}
