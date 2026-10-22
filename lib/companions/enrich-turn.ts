/**
 * Shared companion turn enrichment used by Rogue + officer streams.
 * Identity, context, memory intents, conversation persistence.
 */

import {
  assertCompanionDashboardAccess,
  companionAudienceLabel,
  parseCompanionFromBody,
  resolveCompanionActor,
  type CompanionActor,
} from "@/lib/companions/identity";
import {
  appendCompanionMessage,
  ensureCompanionConversation,
  getOwnedConversation,
  type CompanionConversationRow,
} from "@/lib/companions/conversations";
import {
  forgetMemories,
  listActiveMemories,
  upsertMemory,
} from "@/lib/companions/memories";
import {
  formatMemoriesForUserReply,
  parseMemoryIntent,
} from "@/lib/companions/memory-intents";
import {
  buildSharedSitGuruKnowledge,
  companionDisplayName,
} from "@/lib/companions/knowledge";
import {
  buildCompanionUserContext,
  resolveCareLocationHint,
  type CompanionUserContext,
} from "@/lib/companions/user-context";
import { buildCompanionTools } from "@/lib/companions/application-tools";
import type { CompanionId } from "@/lib/companions/types";

export type EnrichedCompanionTurn = {
  actor: CompanionActor;
  companionId: CompanionId;
  context: CompanionUserContext;
  conversation: CompanionConversationRow | null;
  audienceLabel: string;
  knowledgeBlock: string;
  contextBlock: string;
  locationHint: ReturnType<typeof resolveCareLocationHint>;
  tools: ReturnType<typeof buildCompanionTools>;
  /** When set, skip the model and return this assistant text. */
  directReply: string | null;
  memoryHandled: boolean;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function enrichCompanionTurn(opts: {
  req: Request;
  body: Record<string, unknown>;
  lastUserText: string;
  companionFallback?: CompanionId;
  /** When true, enforce dashboard role gates for Scout/Taco. */
  requireDashboardAccess?: boolean;
}): Promise<EnrichedCompanionTurn> {
  const companionId = parseCompanionFromBody({
    companion: opts.body.companion ?? opts.companionFallback,
    officer: opts.body.officer,
    officerId: opts.body.officerId,
  });

  const actor = await resolveCompanionActor(opts.req);

  if (opts.requireDashboardAccess && actor.userId) {
    const access = assertCompanionDashboardAccess(companionId, actor);
    if (!access.ok) {
      throw Object.assign(new Error(access.error), { status: access.status });
    }
  }

  const context = await buildCompanionUserContext({ actor, companionId });
  const audienceLabel = companionAudienceLabel(actor);
  const knowledgeBlock = buildSharedSitGuruKnowledge({
    companionId,
    lastUserText: opts.lastUserText,
  });

  let conversation: CompanionConversationRow | null = null;
  const requestedConversationId = asString(opts.body.conversationId);
  const clientMessageId =
    asString(opts.body.clientMessageId) ||
    asString(opts.body.client_message_id) ||
    null;

  if (actor.userId) {
    if (requestedConversationId) {
      conversation = await getOwnedConversation({
        conversationId: requestedConversationId,
        userId: actor.userId,
      });
      // Reject cross-account conversation IDs silently by starting a new owned thread.
      if (!conversation) {
        conversation = await ensureCompanionConversation({
          userId: actor.userId,
          companionId,
          workspaceRole: actor.primaryRole,
        });
      } else if (conversation.companion_id !== companionId) {
        // Switching companions must not reuse another companion's transcript.
        conversation = await ensureCompanionConversation({
          userId: actor.userId,
          companionId,
          workspaceRole: actor.primaryRole,
        });
      }
    } else {
      conversation = await ensureCompanionConversation({
        userId: actor.userId,
        companionId,
        workspaceRole: actor.primaryRole,
      });
    }

    if (conversation && opts.lastUserText) {
      try {
        await appendCompanionMessage({
          conversationId: conversation.id,
          userId: actor.userId,
          companionId,
          role: "user",
          content: opts.lastUserText,
          clientMessageId,
          metadata: { pagePath: asString(opts.body.pagePath) || null },
        });
      } catch (error) {
        console.warn(
          "[enrich-turn] user message persist soft-failed:",
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  const locationHint = resolveCareLocationHint({
    userText: opts.lastUserText,
    location: context.location,
    memories: context.memories,
  });

  let directReply: string | null = null;
  let memoryHandled = false;
  const intent = parseMemoryIntent(opts.lastUserText);
  const name = companionDisplayName(companionId);

  if (intent && actor.userId) {
    memoryHandled = true;
    try {
      if (intent.type === "list") {
        const memories = await listActiveMemories({
          userId: actor.userId,
          companionId,
        });
        directReply = formatMemoriesForUserReply(memories, name);
      } else if (intent.type === "forget") {
        const result = await forgetMemories({
          userId: actor.userId,
          key: intent.key,
          query: intent.query,
          companionId,
        });
        directReply =
          result.forgotten > 0
            ? `Got it — I forgot ${result.forgotten === 1 ? "that preference" : `${result.forgotten} preferences`}. I won't use ${result.forgotten === 1 ? "it" : "them"} in future replies. You can review the rest under Account → Companion memories.`
            : `I couldn't find a matching saved preference to forget. Say "What do you remember about me?" to see what's stored, or manage them under Account → Companion memories.`;
      } else if (intent.type === "save" || intent.type === "update") {
        await upsertMemory({
          userId: actor.userId,
          companionId: null,
          scope: "shared",
          category: intent.category,
          key: intent.key,
          value: intent.value,
          source:
            intent.type === "update" ? "user_correction" : "explicit_user",
          sourceConversationId: conversation?.id || null,
        });
        // Refresh context memories for any follow-on model call (none when direct).
        context.memories = await listActiveMemories({
          userId: actor.userId,
          companionId,
        });
        directReply =
          intent.type === "update"
            ? `Updated — I'll remember: **${intent.value}**. Say "Forget that preference" anytime, or manage it under Account → Companion memories.`
            : `Saved — I'll remember: **${intent.value}**. This stays available across your SitGuru companions when relevant. Say "Forget that preference" anytime.`;
      }
    } catch (error) {
      directReply =
        error instanceof Error
          ? error.message
          : "I couldn't update that memory just now. Try again from Account → Companion memories.";
    }
  } else if (intent && !actor.userId) {
    memoryHandled = true;
    directReply =
      "Sign in to save preferences across sessions. Guests get helpful answers, but lasting memory stays with your SitGuru account.";
  }

  // Prefer saved location in the context block when the user asks near-me.
  let contextBlock = context.promptBlock;
  if (locationHint) {
    contextBlock += `\n\n# CARE SEARCH LOCATION HINT\nUse this authorized location for Guru search this turn (source=${locationHint.source}): ${[
      locationHint.city,
      locationHint.state,
      locationHint.zip,
    ]
      .filter(Boolean)
      .join(", ")}. Call lookupGurusNearMe with useSavedLocation=true when city/ZIP are missing from the message.`;
  }

  const tools = buildCompanionTools({ actor, context });

  return {
    actor,
    companionId,
    context,
    conversation,
    audienceLabel,
    knowledgeBlock,
    contextBlock,
    locationHint,
    tools,
    directReply,
    memoryHandled,
  };
}

export async function persistAssistantCompanionMessage(opts: {
  conversation: CompanionConversationRow | null;
  actor: CompanionActor;
  companionId: CompanionId;
  text: string;
  clientMessageId?: string | null;
}): Promise<void> {
  if (!opts.conversation || !opts.actor.userId) return;
  const text = String(opts.text || "").trim();
  if (!text) return;
  try {
    await appendCompanionMessage({
      conversationId: opts.conversation.id,
      userId: opts.actor.userId,
      companionId: opts.companionId,
      role: "assistant",
      content: text,
      clientMessageId: opts.clientMessageId || null,
    });
  } catch (error) {
    console.warn(
      "[enrich-turn] assistant message persist soft-failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

/** Prefer server-derived first name over client-supplied labels. */
export function resolvePreferredFirstName(
  actor: CompanionActor,
  clientFirstName?: string | null,
): string {
  if (actor.firstName) return actor.firstName;
  const client = asString(clientFirstName);
  return client;
}
