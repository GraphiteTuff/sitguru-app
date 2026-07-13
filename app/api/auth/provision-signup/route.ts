import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  enqueueProfileCompletionReminders,
  sendImmediateProfileCompletionNotice,
  type SupportedRole,
} from "@/lib/completion-reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccountIntent = "pet_parent" | "guru" | "ambassador" | "both";

type ProvisionSignupBody = {
  userId?: string;
  intent?: AccountIntent;
  fullName?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  serviceArea?: string;
  ambassadorReferralCode?: string;
  source?: string;
};

type ProvisionResult = {
  ok?: boolean;
  user_id?: string;
  intent?: string;
  profile_role?: string;
  roles?: string[];
  referral_code?: string;
  workspace_ready?: boolean;
  requires_email_verification?: boolean;
};

const SUPPORTED_INTENTS = new Set<AccountIntent>([
  "pet_parent",
  "guru",
  "ambassador",
  "both",
]);

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(message: string, status = 400, details?: unknown) {
  console.error("SIGNUP PROVISION ERROR:", {
    message,
    status,
    details,
  });

  return NextResponse.json(
    {
      ok: false,
      error: message,
    },
    { status },
  );
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function isRecentAuthUser(createdAt?: string | null) {
  if (!createdAt) return false;

  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;

  return Date.now() - created <= 20 * 60 * 1000;
}

function normalizeMetadataIntent(value: unknown): AccountIntent | "" {
  const normalized = cleanText(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "customer" || normalized === "petparent") {
    return "pet_parent";
  }

  if (normalized === "future_guru" || normalized === "pet_guru") {
    return "guru";
  }

  if (normalized === "partner") {
    return "ambassador";
  }

  if (SUPPORTED_INTENTS.has(normalized as AccountIntent)) {
    return normalized as AccountIntent;
  }

  return "";
}

function reminderRoleForIntent(intent: AccountIntent): SupportedRole {
  if (intent === "pet_parent") return "pet_parent";
  if (intent === "ambassador") return "ambassador";
  return "guru";
}

async function callProvisioningRpc(
  body: Required<Pick<ProvisionSignupBody, "userId" | "intent">> &
    ProvisionSignupBody,
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const { data, error } = await supabaseAdmin.rpc(
      "provision_sitguru_account",
      {
        p_user_id: body.userId,
        p_intent: body.intent,
        p_full_name: cleanText(body.fullName) || null,
        p_email: cleanText(body.email).toLowerCase() || null,
        p_phone: cleanText(body.phone) || null,
        p_zip_code: cleanText(body.zipCode) || null,
        p_service_area: cleanText(body.serviceArea) || null,
        p_ambassador_referral_code:
          cleanText(body.ambassadorReferralCode).toUpperCase() || null,
        p_source: cleanText(body.source) || "sitguru_signup_api",
      },
    );

    if (!error) {
      return data as ProvisionResult;
    }

    lastError = error;

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw lastError;
}

async function queueAndSendSignupNotice({
  userId,
  intent,
}: {
  userId: string;
  intent: AccountIntent;
}) {
  const role = reminderRoleForIntent(intent);

  try {
    const immediate = await sendImmediateProfileCompletionNotice({
      userId,
      role,
    });

    return {
      queued: true,
      immediateAttempted: true,
      immediate,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Profile-completion reminders could not be started.";

    console.warn("Signup completed but immediate reminder delivery failed:", error);

    try {
      await enqueueProfileCompletionReminders({
        userId,
        role,
        anchor: new Date(),
        source: "signup_provisioning_retry_queue",
      });

      return {
        queued: true,
        immediateAttempted: false,
        immediate: null,
        error: message,
      };
    } catch (queueError) {
      console.error("Signup reminder queue failed:", queueError);

      return {
        queued: false,
        immediateAttempted: false,
        immediate: null,
        error:
          queueError instanceof Error
            ? queueError.message
            : "Profile-completion reminder queue failed.",
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProvisionSignupBody;
    const userId = cleanText(body.userId);
    const requestedIntent = body.intent;

    if (!userId || !requestedIntent || !SUPPORTED_INTENTS.has(requestedIntent)) {
      return jsonError(
        "Required SitGuru signup information is missing or invalid.",
        400,
      );
    }

    const bearerToken = getBearerToken(request);
    let verifiedUserId = "";

    if (bearerToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);

      if (error || !data.user) {
        return jsonError(
          "The SitGuru signup session could not be verified.",
          401,
          error,
        );
      }

      verifiedUserId = data.user.id;
    }

    const { data: authResult, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authResult.user) {
      return jsonError(
        "SitGuru could not verify the newly created account.",
        401,
        authError,
      );
    }

    const authUser = authResult.user;
    const authEmail = cleanText(authUser.email).toLowerCase();
    const submittedEmail = cleanText(body.email).toLowerCase();
    const metadata = authUser.user_metadata || {};
    const metadataIntent = normalizeMetadataIntent(
      metadata.account_intent ||
        metadata.signup_intent ||
        metadata.signup_role ||
        metadata.role,
    );

    if (verifiedUserId) {
      if (verifiedUserId !== userId) {
        return jsonError(
          "The signup session did not match this SitGuru account.",
          403,
        );
      }
    } else {
      // Email confirmation can leave the browser without a session. Allow only a
      // recent account whose Auth email and signup metadata match this request.
      if (!isRecentAuthUser(authUser.created_at)) {
        return jsonError(
          "This signup verification window has expired. Please sign in and try again.",
          401,
        );
      }

      if (!submittedEmail || !authEmail || submittedEmail !== authEmail) {
        return jsonError(
          "The signup email did not match the SitGuru Auth account.",
          403,
        );
      }

      if (metadataIntent && metadataIntent !== requestedIntent) {
        return jsonError(
          "The requested workspace did not match the signup selection.",
          403,
        );
      }
    }

    const result = await callProvisioningRpc({
      ...body,
      userId,
      intent: requestedIntent,
    });

    if (!result?.ok) {
      return jsonError(
        "SitGuru could not verify the completed account setup.",
        500,
        result,
      );
    }

    if (requestedIntent === "ambassador" && result.workspace_ready !== true) {
      return jsonError(
        "SitGuru could not verify the Ambassador workspace.",
        500,
        result,
      );
    }

    // Notification failures never undo a successful signup. They are logged and
    // the hourly cron job retries pending reminder rows.
    const reminder = await queueAndSendSignupNotice({
      userId,
      intent: requestedIntent,
    });

    return NextResponse.json({
      ok: true,
      userId,
      intent: result.intent || requestedIntent,
      profileRole: result.profile_role || null,
      roles: result.roles || [],
      referralCode: result.referral_code || null,
      workspaceReady: result.workspace_ready === true,
      requiresEmailVerification:
        result.requires_email_verification === true,
      reminder,
      message:
        requestedIntent === "ambassador"
          ? "Your SitGuru Ambassador workspace is ready. Check your email for the next steps."
          : "Your SitGuru account and workspace are ready. Check your email for the next steps.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "SitGuru could not finish account setup.",
      500,
      error,
    );
  }
}