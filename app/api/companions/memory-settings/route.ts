/**
 * Companion memory privacy settings for the authenticated user.
 */

import {
  getMemorySettings,
  setMemoryEnabled,
} from "@/lib/companions/memories";
import { resolveCompanionActor } from "@/lib/companions/identity";
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

    const settings = await getMemorySettings(actor.userId);
    return Response.json({ ok: true, settings }, { headers: cors });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load memory settings.",
      },
      { status: 500, headers: cors },
    );
  }
}

export async function PATCH(req: NextRequest) {
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
      memoryEnabled?: boolean;
      memory_enabled?: boolean;
    };

    const enabled =
      typeof body.memoryEnabled === "boolean"
        ? body.memoryEnabled
        : typeof body.memory_enabled === "boolean"
          ? body.memory_enabled
          : null;

    if (enabled === null) {
      return Response.json(
        { error: "memoryEnabled boolean is required." },
        { status: 400, headers: cors },
      );
    }

    const settings = await setMemoryEnabled(actor.userId, enabled);
    return Response.json({ ok: true, settings }, { headers: cors });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update memory settings.",
      },
      { status: 400, headers: cors },
    );
  }
}
