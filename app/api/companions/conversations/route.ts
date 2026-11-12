/**
 * List / ensure companion conversations for the authenticated user.
 */

import {
  ensureCompanionConversation,
  isCompanionPersistenceEnabled,
  listOwnedConversations,
  listOwnedMessages,
} from "@/lib/companions/conversations";
import { resolveCompanionActor } from "@/lib/companions/identity";
import {
  isCompanionId,
  normalizeCompanionId,
  type CompanionId,
} from "@/lib/companions/types";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
} from "@/lib/supabase/request-auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function GET(req: NextRequest) {
  const cors = mobileCorsHeaders(req);
  try {
    const actor = await resolveCompanionActor(req);
    if (!actor.userId) {
      return Response.json(
        { error: "Sign in required." },
        { status: 401, headers: cors },
      );
    }

    const url = new URL(req.url);
    const companionRaw = url.searchParams.get("companion");
    const companionId =
      companionRaw && isCompanionId(companionRaw.toLowerCase())
        ? (companionRaw.toLowerCase() as CompanionId)
        : null;
    const conversationId = url.searchParams.get("id");
    const includeMessages = url.searchParams.get("messages") === "1";

    if (conversationId) {
      const messages = includeMessages
        ? await listOwnedMessages({
            conversationId,
            userId: actor.userId,
            limit: 80,
          })
        : [];
      const conversations = await listOwnedConversations({
        userId: actor.userId,
        companionId,
        limit: 50,
      });
      const conversation = conversations.find((row) => row.id === conversationId);
      if (!conversation) {
        return Response.json(
          { error: "Conversation not found." },
          { status: 404, headers: cors },
        );
      }
      return Response.json(
        { ok: true, conversation, messages },
        { headers: cors },
      );
    }

    const conversations = await listOwnedConversations({
      userId: actor.userId,
      companionId,
    });

    return Response.json({ ok: true, conversations }, { headers: cors });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load conversations.",
      },
      { status: 500, headers: cors },
    );
  }
}

export async function POST(req: NextRequest) {
  const cors = mobileCorsHeaders(req);
  try {
    const actor = await resolveCompanionActor(req);
    if (!actor.userId) {
      return Response.json(
        { error: "Sign in required." },
        { status: 401, headers: cors },
      );
    }

    if (!isCompanionPersistenceEnabled()) {
      return Response.json(
        {
          error:
            "Companion conversation persistence is temporarily disabled. Chat still works; history will not be saved.",
          persistenceEnabled: false,
        },
        { status: 503, headers: cors },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      companion?: string;
      includeMessages?: boolean;
    };
    const companionId = normalizeCompanionId(body.companion, "rogue");
    const conversation = await ensureCompanionConversation({
      userId: actor.userId,
      companionId,
      workspaceRole: actor.primaryRole,
    });

    if (!conversation) {
      return Response.json(
        {
          error:
            "Companion conversations are not available yet (migration pending).",
          persistenceEnabled: false,
        },
        { status: 503, headers: cors },
      );
    }

    const messages = body.includeMessages
      ? await listOwnedMessages({
          conversationId: conversation.id,
          userId: actor.userId,
          limit: 80,
        })
      : [];

    return Response.json(
      { ok: true, conversation, messages },
      { headers: cors },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open conversation.",
      },
      { status: 500, headers: cors },
    );
  }
}
