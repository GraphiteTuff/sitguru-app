import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

function json(
  req: NextRequest,
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: mobileCorsHeaders(req),
  });
}

export async function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

/**
 * Persist Expo push tokens for mobile clients (Bearer or cookie session).
 * Writes auth user_metadata, profiles.expo_push_token when present,
 * and a push_subscriptions row using an Expo endpoint marker.
 */
export async function POST(req: NextRequest) {
  const resolved = await resolveRequestUser(req);

  if (!resolved) {
    return json(req, { error: "Unauthorized" }, 401);
  }

  let payload: {
    expoPushToken?: unknown;
    platform?: unknown;
  };

  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return json(req, { error: "Invalid JSON body." }, 400);
  }

  const token =
    typeof payload.expoPushToken === "string"
      ? payload.expoPushToken.trim()
      : "";
  const platform =
    typeof payload.platform === "string"
      ? payload.platform.trim().slice(0, 32)
      : "unknown";

  if (!token || token.length < 20 || token.length > 4096) {
    return json(req, { error: "A valid Expo push token is required." }, 400);
  }

  if (!token.startsWith("ExponentPushToken") && !token.startsWith("ExpoPushToken")) {
    return json(
      req,
      { error: "Token must be an Expo push credential." },
      400,
    );
  }

  const admin = createSupabaseAdminClient();
  const userId = resolved.user.id;
  const updatedAt = new Date().toISOString();

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(resolved.user.user_metadata ?? {}),
      expo_push_token: token,
      expo_push_platform: platform,
      expo_push_updated_at: updatedAt,
    },
  });

  if (authError) {
    return json(req, { error: authError.message }, 500);
  }

  // Best-effort profile column write (column may not exist in every env yet).
  const profileUpdate = await admin
    .from("profiles")
    .update({
      expo_push_token: token,
      expo_push_platform: platform,
      expo_push_updated_at: updatedAt,
    })
    .eq("id", userId);

  const profileSaved = !profileUpdate.error;

  // Discoverable row for future Expo push dispatch (Web Push table reuse).
  const endpoint = `expo:${token}`;
  const subscriptionUpsert = await admin.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      p256dh: "expo",
      auth: platform || "expo",
      user_agent: `sitguru-mobile/${platform}`,
      updated_at: updatedAt,
    },
    { onConflict: "endpoint" },
  );

  return json(req, {
    ok: true,
    profileSaved,
    subscriptionSaved: !subscriptionUpsert.error,
    authSource: resolved.authSource,
  });
}
