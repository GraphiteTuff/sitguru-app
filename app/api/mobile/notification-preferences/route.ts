import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

type PreferencePayload = {
  liveWalkUpdates?: unknown;
  chatMediaActivity?: unknown;
  financialTransactions?: unknown;
  live_walk_updates?: unknown;
  chat_media_activity?: unknown;
  financial_transactions?: unknown;
};

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

function asBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return fallback;
}

function normalizePreferences(
  payload: PreferencePayload | null,
  current?: Record<string, unknown> | null,
) {
  const liveWalkUpdates = asBoolean(
    payload?.liveWalkUpdates ??
      payload?.live_walk_updates ??
      current?.live_walk_updates ??
      current?.pawreport_alerts,
    true,
  );
  const chatMediaActivity = asBoolean(
    payload?.chatMediaActivity ??
      payload?.chat_media_activity ??
      current?.chat_media_activity ??
      current?.message_alerts,
    true,
  );
  const financialTransactions = asBoolean(
    payload?.financialTransactions ??
      payload?.financial_transactions ??
      current?.financial_transactions ??
      current?.payment_alerts,
    true,
  );

  return {
    live_walk_updates: liveWalkUpdates,
    chat_media_activity: chatMediaActivity,
    financial_transactions: financialTransactions,
    pawreport_alerts: liveWalkUpdates,
    message_alerts: chatMediaActivity,
    payment_alerts: financialTransactions,
    booking_alerts: liveWalkUpdates,
    referral_alerts: financialTransactions,
  };
}

export async function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

/**
 * Read / write granular push notification preference matrix.
 * Auth via Bearer or cookie (resolveRequestUser).
 */
export async function GET(req: NextRequest) {
  const resolved = await resolveRequestUser(req);
  if (!resolved) {
    return json(req, { error: "Unauthorized" }, 401);
  }

  const admin = createSupabaseAdminClient();
  const userId = resolved.user.id;

  const meta =
    (resolved.user.user_metadata?.notification_preferences as
      | Record<string, unknown>
      | undefined) ?? null;

  let row: Record<string, unknown> | null = meta;

  for (const table of [
    "notification_preferences",
    "user_notification_preferences",
  ] as const) {
    const result = await admin
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!result.error && result.data) {
      row = result.data as Record<string, unknown>;
      break;
    }
  }

  const preferences = normalizePreferences(null, row);

  return json(req, {
    ok: true,
    preferences: {
      liveWalkUpdates: preferences.live_walk_updates,
      chatMediaActivity: preferences.chat_media_activity,
      financialTransactions: preferences.financial_transactions,
    },
    authSource: resolved.authSource,
  });
}

export async function POST(req: NextRequest) {
  const resolved = await resolveRequestUser(req);
  if (!resolved) {
    return json(req, { error: "Unauthorized" }, 401);
  }

  let payload: PreferencePayload;
  try {
    payload = (await req.json()) as PreferencePayload;
  } catch {
    return json(req, { error: "Invalid JSON body." }, 400);
  }

  const admin = createSupabaseAdminClient();
  const userId = resolved.user.id;
  const updatedAt = new Date().toISOString();
  const preferences = normalizePreferences(payload);
  const publicShape = {
    liveWalkUpdates: preferences.live_walk_updates,
    chatMediaActivity: preferences.chat_media_activity,
    financialTransactions: preferences.financial_transactions,
  };

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(resolved.user.user_metadata ?? {}),
      notification_preferences: publicShape,
      notification_preferences_updated_at: updatedAt,
    },
  });

  if (authError) {
    return json(req, { error: authError.message }, 500);
  }

  // Best-effort profile jsonb / columns.
  await admin
    .from("profiles")
    .update({
      notification_preferences: publicShape,
      notification_preferences_updated_at: updatedAt,
      updated_at: updatedAt,
    })
    .eq("id", userId);

  let tableSaved: string | null = null;
  for (const table of [
    "notification_preferences",
    "user_notification_preferences",
  ] as const) {
    const upsert = await admin.from(table).upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: updatedAt,
      },
      { onConflict: "user_id" },
    );

    if (!upsert.error) {
      tableSaved = table;
      break;
    }

    const insert = await admin.from(table).insert({
      user_id: userId,
      ...preferences,
      created_at: updatedAt,
      updated_at: updatedAt,
    });

    if (!insert.error) {
      tableSaved = table;
      break;
    }
  }

  return json(req, {
    ok: true,
    preferences: publicShape,
    tableSaved,
    authSource: resolved.authSource,
  });
}
