/**
 * View / create / forget companion memories for the authenticated user.
 */

import {
  forgetMemories,
  listAllMemoriesForUser,
  upsertMemory,
} from "@/lib/companions/memories";
import { resolveCompanionActor } from "@/lib/companions/identity";
import {
  isCompanionId,
  type CompanionId,
  type CompanionMemoryCategory,
} from "@/lib/companions/types";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
} from "@/lib/supabase/request-auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORIES = new Set([
  "preference",
  "care",
  "location",
  "schedule",
  "communication",
  "other",
]);

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
    const includeForgotten = url.searchParams.get("includeForgotten") === "1";
    const memories = await listAllMemoriesForUser(actor.userId, {
      includeForgotten,
      limit: 100,
    });

    return Response.json({ ok: true, memories }, { headers: cors });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load memories.",
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

    const body = (await req.json().catch(() => ({}))) as {
      key?: string;
      value?: string;
      category?: string;
      companionId?: string | null;
      scope?: "shared" | "companion";
      action?: "save" | "forget";
      memoryId?: string;
      query?: string;
    };

    if (body.action === "forget") {
      const result = await forgetMemories({
        userId: actor.userId,
        memoryId: body.memoryId || null,
        key: body.key || null,
        query: body.query || null,
        companionId:
          body.companionId && isCompanionId(body.companionId)
            ? (body.companionId as CompanionId)
            : null,
      });
      return Response.json({ ok: true, ...result }, { headers: cors });
    }

    const category = CATEGORIES.has(String(body.category || ""))
      ? (body.category as CompanionMemoryCategory)
      : "preference";
    const companionId =
      body.companionId && isCompanionId(body.companionId)
        ? (body.companionId as CompanionId)
        : null;

    const memory = await upsertMemory({
      userId: actor.userId,
      key: String(body.key || "preference"),
      value: String(body.value || ""),
      category,
      companionId,
      scope: body.scope || (companionId ? "companion" : "shared"),
      source: "explicit_user",
    });

    return Response.json({ ok: true, memory }, { headers: cors });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update memory.",
      },
      { status: 400, headers: cors },
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const memoryId = url.searchParams.get("id");
    const key = url.searchParams.get("key");
    const all = url.searchParams.get("all") === "1";

    const result = await forgetMemories({
      userId: actor.userId,
      memoryId: memoryId || null,
      key: all ? null : key,
      query: all ? null : key,
    });

    return Response.json({ ok: true, ...result }, { headers: cors });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to forget memory.",
      },
      { status: 400, headers: cors },
    );
  }
}
