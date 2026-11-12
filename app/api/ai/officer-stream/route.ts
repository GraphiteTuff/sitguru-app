/**
 * Generic Pet Officer stream endpoint — Taco (Ambassador) + Scout (Guru).
 *
 * Rogue's admin route (`/api/admin/rogue-ai`) is intentionally untouched.
 * This handler only serves guest officers with session-scoped snapshots.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, type CoreMessage } from "ai";
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
  getOfficerFaqCatalog,
  resolveOfficerInstantFaqAnswer,
} from "@/lib/ai/officer-marketing-faqs";
import {
  buildCommunityEventsFaqSnapshot,
  parseCommunityEventSlugFromPath,
  resolveDelilahInstantFaqAnswer,
} from "@/lib/ai/community-events-faqs";
import { compileDelilahEventsSnapshot } from "@/lib/ai/delilah-events-snapshot";
import { getCompanionPolicyAnswer } from "@/lib/ai/companion-response-policy";
import { buildRetrievalPromptBlock } from "@/lib/ai/site-knowledge-index";
import {
  getSitGuruAiModel,
  isSitGuruAiConfigured,
} from "@/lib/messaging/ai-model";
import { personableFactHint } from "@/lib/ai/companion-answer-protocol";
import { shouldHoldForCompanion } from "@/lib/messaging/chat-library";
import { rememberModelAnswer, settleCompanionTurn } from "@/lib/messaging/chat-archive";
import { lookupGurusTool } from "@/lib/chat/rogue-guru-tool";
import {
  buildCompanionAuthPromptBlock,
  primaryCompanionRole,
  stripDisallowedCompanionCtas,
  type CompanionViewerContext,
} from "@/lib/chat/companion-auth";
import { resolveCompanionViewer } from "@/lib/chat/companion-auth-server";
import {
  inferLookupParamsFromChat,
  looksLikeGuruDirectoryQuery,
} from "@/lib/gurus/guru-chat-snapshot";
import {
  buildCareMatchingAsk,
  isCurrentTurnCareIntent,
  joinRecentUserTexts,
  needsCareMatchingAsk,
} from "@/lib/chat/care-matching-intake";
import {
  applySessionMetaIntent,
  emptyCompanionSessionState,
  mergeSessionStateFromTurn,
  parseSessionMetaIntent,
  sessionStatePromptBlock,
  type CompanionSessionState,
} from "@/lib/companions/session-state";
import {
  formatEventQueryForReply,
  queryLivePetEvents,
} from "@/lib/companions/events-tools";
import {
  enrichCompanionTurn,
  persistAssistantCompanionMessage,
} from "@/lib/companions/enrich-turn";
import {
  logCompanionTurn,
  newCompanionRequestId,
} from "@/lib/companions/turn-telemetry";

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
  if (officer === "delilah") {
    const soft = resolveDelilahInstantFaqAnswer(question);
    if (soft) return soft;
    return [
      `**${profile.displayName} here — so happy to help!**`,
      ``,
      `I couldn't reach the live model kennel just now — tap a FAQ chip or ask about upcoming events, hosting, or RSVPs, and I'll answer from SitGuru's Pet Events copy.`,
    ].join("\n");
  }

  if (surface === "public") {
    const instant = resolveOfficerInstantFaqAnswer({
      officer,
      question,
      surface: "public",
    });
    if (instant) return instant;
    return [
      `**${profile.displayName} here.**`,
      ``,
      `I couldn't reach the live model kennel just now — tap a FAQ chip or ask about signing up, and I'll answer from SitGuru's public marketing copy.`,
    ].join("\n");
  }

  const dashboardInstant = resolveOfficerInstantFaqAnswer({
    officer,
    question,
    surface: "dashboard",
  });
  if (dashboardInstant) return dashboardInstant;

  return [
    `**${profile.displayName} here — ${profile.title}.**`,
    ``,
    `I couldn't reach the live model kennel just now, so here's your personal snapshot for: _${question || "sync"}_.`,
    ``,
    snapshotMarkdown.slice(0, 6000) || "_No live snapshot rows available._",
  ].join("\n");
}

function officerFaqSnapshot(
  officer: "taco" | "scout",
  surface: OfficerSurface,
) {
  if (officer === "scout") {
    return buildMarketingFaqSnapshot({
      officerLabel:
        surface === "public"
          ? "Scout · Guru Matching Officer"
          : "Scout · Guru Logistics Captain + Matching FAQ",
      faqs: getOfficerFaqCatalog({ officer: "scout", surface }),
      signupPath: "/become-a-guru",
    });
  }
  return buildMarketingFaqSnapshot({
    officerLabel:
      surface === "public"
        ? "Taco · Ambassador Advocate"
        : "Taco · Ambassador Advocate + Growth FAQ",
    faqs: getOfficerFaqCatalog({ officer: "taco", surface }),
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
      community_event_slug?: string;
      community_event_id?: string;
      community_event_title?: string;
      community_event_city?: string;
      community_event_state?: string;
    };

    const officerRaw = asString(body?.officer || body?.officerId).toLowerCase();
    if (!isGuestOfficerId(officerRaw)) {
      return Response.json(
        {
          error:
            "officer must be 'taco', 'scout', or 'delilah'. Rogue remains on /api/admin/rogue-ai.",
        },
        { status: 400 },
      );
    }
    const officer: GuestOfficerId = officerRaw;
    let surface = normalizeOfficerSurface(body?.surface || body?.mode);
    // Delilah is public Pet Events only — never require a dashboard session.
    if (officer === "delilah") {
      surface = "public";
    }
    const pagePath =
      asString(body?.pagePath) ||
      asString(body?.page_path) ||
      (officer === "scout"
        ? "/become-a-guru"
        : officer === "delilah"
          ? "/events"
          : "/ambassadors");
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
      if (officer === "delilah") {
        // Defensive — Delilah is forced public above.
        surface = "public";
      } else {
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
      }
    } else if (session?.id) {
      actorLabel = `Signed-in guest${session.email ? ` · ${session.email}` : ""}`;
    }

    const viewer = await resolveCompanionViewer(
      session?.id
        ? {
            id: session.id,
            user_metadata: null,
          }
        : null,
      bodyGuruName || undefined,
      surface !== "public"
        ? officer === "scout"
          ? "Guru"
          : officer === "taco"
            ? "Ambassador"
            : undefined
        : undefined,
    );
    if (viewer.isAuthenticated && viewer.firstName) {
      actorLabel = `${viewer.firstName} · ${primaryCompanionRole(viewer.roles)}${
        session?.email ? ` · ${session.email}` : ""
      }`;
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
    const requestId = newCompanionRequestId();
    const turnStarted = Date.now();

    // Durable memory / authenticated context (soft-fail for guests).
    let enriched: Awaited<ReturnType<typeof enrichCompanionTurn>> | null = null;
    try {
      enriched = await enrichCompanionTurn({
        req,
        body: body as Record<string, unknown>,
        lastUserText,
        companionFallback: officer as "scout" | "taco" | "delilah",
        requireDashboardAccess: surface !== "public",
      });
      if (enriched.directReply) {
        await persistAssistantCompanionMessage({
          conversation: enriched.conversation,
          actor: enriched.actor,
          companionId: enriched.companionId,
          text: enriched.directReply,
        });
        return simulationDataStreamResponse(
          stripDisallowedCompanionCtas(enriched.directReply, viewer),
        );
      }
    } catch (error) {
      console.warn(
        "[officer-stream] enrichCompanionTurn soft-failed:",
        error instanceof Error ? error.message : error,
      );
    }

    // Deterministic policy answers (fees, PetPerks, human/AI identity) win
    // before any sticky intake or soft-escalation path.
    const policyAnswer = getCompanionPolicyAnswer(
      officer as "scout" | "taco" | "delilah",
      lastUserText,
    );
    if (policyAnswer) {
      if (enriched) {
        await persistAssistantCompanionMessage({
          conversation: enriched.conversation,
          actor: enriched.actor,
          companionId: enriched.companionId,
          text: policyAnswer,
        });
      }
      logCompanionTurn({
        requestId,
        companion: companionKey,
        intent: "policy",
        sources: ["companion-response-policy"],
        tool: null,
        toolOk: null,
        guardrail: "policy",
        latencyMs: Date.now() - turnStarted,
        failureType: null,
        stateFields: [],
      });
      // Keep verified canonical paths (/programs/ambassadors/apply, /petperks, etc.).
      return simulationDataStreamResponse(policyAnswer);
    }

    // Session recall / summarise / correct / start-over (current-turn first).
    let sessionState: CompanionSessionState = emptyCompanionSessionState();
    if (viewer.firstName) sessionState.name = viewer.firstName;
    for (const message of messages) {
      if (message.role !== "user") continue;
      sessionState = mergeSessionStateFromTurn(
        sessionState,
        messageContent(message),
      );
    }
    const sessionIntent = parseSessionMetaIntent(lastUserText);
    if (sessionIntent) {
      const applied = applySessionMetaIntent(sessionState, sessionIntent);
      return simulationDataStreamResponse(
        stripDisallowedCompanionCtas(applied.reply, viewer),
      );
    }
    sessionState = mergeSessionStateFromTurn(sessionState, lastUserText);

    // Delilah: live county/date query tool instead of truncated digest alone.
    if (
      officer === "delilah" &&
      /\b(events?|rsvp|what('s| is) (happening|on)|near me|this weekend|november|december|january|february|philadelphia|philly|manayunk)\b/i.test(
        lastUserText,
      )
    ) {
      const cityGuess =
        sessionState.city ||
        lastUserText.match(/\bin\s+([A-Za-z][A-Za-z .'-]{2,40})(?:\s|,|$)/i)?.[1] ||
        null;
      const liveEvents = await queryLivePetEvents({
        city: cityGuess,
        state: sessionState.state || "PA",
        county: /\bphiladelphia|philly|manayunk\b/i.test(lastUserText)
          ? "Philadelphia County"
          : null,
        limit: 25,
      }).catch(() => null);
      if (liveEvents) {
        return simulationDataStreamResponse(
          stripDisallowedCompanionCtas(
            formatEventQueryForReply(liveEvents),
            viewer,
          ),
        );
      }
    }

    const careThread = joinRecentUserTexts(messages, lastUserText);
    // Classify the CURRENT turn first. Prior care requests may supply ZIP/city
    // context, but cannot hijack a fresh standalone FAQ ("Free to apply?").
    const isCurrentCareIntent =
      officer === "scout" &&
      surface === "public" &&
      isCurrentTurnCareIntent(lastUserText);
    const lookupHint = inferLookupParamsFromChat(careThread);

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

    // FAQ before sticky matching (Muse): answer known Scout/Taco/Delilah facts first.
    const previewFaqRaw =
      officer === "delilah"
        ? resolveDelilahInstantFaqAnswer(lastUserText)
        : resolveOfficerInstantFaqAnswer({
            officer: officer as "scout" | "taco",
            question: lastUserText,
            surface,
          });
    const previewFaq = previewFaqRaw
      ? stripDisallowedCompanionCtas(previewFaqRaw, viewer)
      : null;

    const scoutMatchingAsk =
      !previewFaq && isCurrentCareIntent
        ? buildCareMatchingAsk(careThread, viewer.firstName)
        : null;
    const scoutNeedsDirectory =
      !previewFaq &&
      isCurrentCareIntent &&
      !scoutMatchingAsk &&
      (looksLikeGuruDirectoryQuery(careThread) ||
        Boolean(lookupHint?.zip || lookupHint?.city || lookupHint?.state));

    if (scoutMatchingAsk) {
      return simulationDataStreamResponse(
        stripDisallowedCompanionCtas(scoutMatchingAsk, viewer),
      );
    }

    const blockFaqForMatching =
      !previewFaq && isCurrentCareIntent && needsCareMatchingAsk(careThread);
    const instantFaqRaw =
      officer === "delilah"
        ? previewFaqRaw
        : scoutNeedsDirectory || blockFaqForMatching
          ? null
          : previewFaqRaw;
    const instantFaq = instantFaqRaw
      ? stripDisallowedCompanionCtas(instantFaqRaw, viewer)
      : null;
    const assist = await settleCompanionTurn({
      question: lastUserText,
      staticFaq: instantFaq,
      companion: companionKey,
      pagePath,
      actorUserId: session?.id || null,
      actorName: viewer.firstName || bodyGuruName || "",
      actorRole: actorLabel,
      holdForCompanion:
        Boolean(scoutNeedsDirectory || blockFaqForMatching || scoutMatchingAsk) ||
        shouldHoldForCompanion(lastUserText),
    });
    if (assist.takeOver) {
      const takeoverReply = stripDisallowedCompanionCtas(assist.reply, viewer);
      if (!/live teammate|sent it to a live/i.test(takeoverReply)) {
        return simulationDataStreamResponse(takeoverReply);
      }
    }
    // Public surface: FAQ database for the model. Dashboard: live snapshot + FAQ layer.
    let snapshotMarkdown: string;
    if (officer === "delilah") {
      const mentionedPlace = inferLookupParamsFromChat(careThread);
      const focus = {
        slug:
          asString(body?.community_event_slug) ||
          parseCommunityEventSlugFromPath(pagePath) ||
          undefined,
        eventId: asString(body?.community_event_id) || undefined,
        title: asString(body?.community_event_title) || undefined,
        city: asString(body?.community_event_city) || mentionedPlace?.city || undefined,
        state: asString(body?.community_event_state) || mentionedPlace?.state || undefined,
      };
      const faqLayer = buildCommunityEventsFaqSnapshot(focus);
      const live = await compileDelilahEventsSnapshot({
        city: focus.city,
        state: focus.state,
        focus,
        // Full live catalog for model context — matching queries use events-tools.
        limit: 200,
      }).catch(() => null);
      snapshotMarkdown = live?.markdownContext
        ? `${faqLayer}\n\n${live.markdownContext}`
        : faqLayer;
    } else {
      const faqLayer = officerFaqSnapshot(officer, surface);
      if (surface === "public") {
        snapshotMarkdown = faqLayer;
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

        snapshotMarkdown = `${snapshotMarkdown}\n\n${faqLayer}`;
      }
    }

    const nowIso = new Date().toISOString();
    const preferredName = viewer.firstName || bodyGuruName || undefined;
    const system = [
      buildOfficerSystemPrompt({
        officerId: officer,
        nowIso,
        actorLabel,
        snapshotMarkdown,
        preset: preset || undefined,
        surface,
        viewer,
        pagePath,
      }),
      sessionStatePromptBlock(sessionState),
      enriched?.knowledgeBlock || "",
      enriched?.contextBlock || "",
      buildRetrievalPromptBlock(lastUserText),
      instantFaq ? personableFactHint(instantFaq, preferredName) : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!isSitGuruAiConfigured()) {
      return simulationDataStreamResponse(
        stripDisallowedCompanionCtas(
          fallbackReport(officer, snapshotMarkdown, lastUserText, surface),
          viewer,
        ),
      );
    }

    const companionTools = {
      lookupGurus: lookupGurusTool,
      ...(enriched?.tools || {}),
    };

    try {
      if (officer === "scout" && scoutNeedsDirectory) {
        const generated = await generateText({
          model: anthropic(getSitGuruAiModel()),
          system,
          messages: messages.slice(-16),
          temperature: 0.45,
          maxTokens: 2800,
          maxSteps: 4,
          tools: companionTools,
        });
        let assistantText = String(generated.text || "").trim();
        const markers: string[] = [];
        const seen = new Set<string>();
        const steps = [
          {
            toolResults: (generated.toolResults || []) as Array<{
              toolName?: string;
              result?: unknown;
            }>,
          },
          ...((generated.steps || []) as Array<{
            toolResults?: Array<{ toolName?: string; result?: unknown }>;
          }>),
        ];
        for (const step of steps) {
          for (const toolResult of step.toolResults || []) {
            if (toolResult.toolName !== "lookupGurus") continue;
            const raw =
              typeof toolResult.result === "string"
                ? toolResult.result
                : JSON.stringify(toolResult.result ?? "");
            const matches: string[] = [];
            const pattern =
              /(?:`{1,3})?\[\[\s*guru_card\s*:\s*([\s\S]*?)\]\](?:`{1,3})?/gi;
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(raw)) !== null) {
              matches.push(`[[guru_card:${String(match[1] || "").trim()}]]`);
            }
            for (const marker of matches) {
              if (seen.has(marker)) continue;
              seen.add(marker);
              markers.push(marker);
            }
          }
        }
        const missing = markers.filter((marker) => !assistantText.includes(marker));
        if (missing.length) {
          assistantText = `${assistantText} ${missing.join(" ")}`.trim();
        }
        if (assistantText) {
          return simulationDataStreamResponse(
            stripDisallowedCompanionCtas(assistantText, viewer),
          );
        }
      }

      const result = streamText({
        model: anthropic(getSitGuruAiModel()),
        system,
        messages: messages.slice(-16),
        temperature: 0.45,
        maxTokens: 1800,
        onFinish: ({ text }) => {
          if (instantFaq) return;
          void rememberModelAnswer({
            question: lastUserText,
            answer: String(text || ""),
            companion: companionKey,
            pagePath,
            actorUserId: session?.id || null,
            actorName: viewer.firstName || bodyGuruName || "",
          });
        },
        tools: companionTools,
        maxSteps: 4 as const,
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
        stripDisallowedCompanionCtas(
          fallbackReport(officer, snapshotMarkdown, lastUserText, surface),
          viewer,
        ),
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
