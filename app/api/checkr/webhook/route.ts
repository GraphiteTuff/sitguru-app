import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckrWebhookPayload = {
  id?: string;
  object?: string;
  type?: string;
  created_at?: string;
  webhook_url?: string;
  data?: {
    object?: {
      id?: string;
      object?: string;
      status?: string | null;
      result?: string | null;
      candidate_id?: string;
      report_id?: string;
      invitation_url?: string;
      uri?: string;
      package?: string;
      includes_canceled?: boolean;
      [key: string]: unknown;
    };
  };
};

function isWebhookAuthorized(request: Request) {
  const webhookSecret = process.env.CHECKR_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return true;
  }

  const authorizationHeader = request.headers.get("authorization");
  const checkrSecretHeader =
    request.headers.get("x-checkr-webhook-secret") ||
    request.headers.get("x-webhook-secret");

  if (checkrSecretHeader === webhookSecret) {
    return true;
  }

  if (authorizationHeader === `Bearer ${webhookSecret}`) {
    return true;
  }

  return false;
}

function mapCheckrWebhookToSitGuruStatus(
  payload: CheckrWebhookPayload,
):
  | "not_started"
  | "invited"
  | "pending"
  | "clear"
  | "consider"
  | "suspended"
  | "canceled"
  | "failed" {
  const type = payload.type;
  const object = payload.data?.object;
  const status = object?.status;
  const result = object?.result;

  if (type === "invitation.created") return "invited";
  if (type === "invitation.completed") return "pending";
  if (type === "invitation.expired") return "canceled";
  if (type === "invitation.deleted") return "canceled";

  if (type === "report.suspended") return "suspended";
  if (type === "report.resumed") return "pending";
  if (type === "report.canceled") return "canceled";
  if (type === "report.engaged") return "clear";
  if (type === "report.pre_adverse_action") return "consider";
  if (type === "report.post_adverse_action") return "failed";
  if (type === "report.disputed") return "consider";

  if (type === "report.completed") {
    if (result === "clear") return "clear";
    if (result === "consider") return "consider";
    if (status === "canceled") return "canceled";

    return "pending";
  }

  if (status === "suspended") return "suspended";
  if (status === "canceled") return "canceled";
  if (status === "pending") return "pending";
  if (result === "clear") return "clear";
  if (result === "consider") return "consider";

  return "pending";
}

function extractWebhookObjectId(payload: CheckrWebhookPayload) {
  return payload.data?.object?.id ?? null;
}

function extractWebhookCandidateId(payload: CheckrWebhookPayload) {
  return payload.data?.object?.candidate_id ?? null;
}

function extractWebhookReportId(payload: CheckrWebhookPayload) {
  const object = payload.data?.object;

  if (!object) return null;

  if (object.object === "report") {
    return object.id ?? null;
  }

  return object.report_id ?? null;
}

export async function POST(request: Request) {
  try {
    if (!isWebhookAuthorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized webhook request." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as CheckrWebhookPayload;

    const sitGuruStatus = mapCheckrWebhookToSitGuruStatus(payload);
    const object = payload.data?.object;
    const objectId = extractWebhookObjectId(payload);
    const candidateId = extractWebhookCandidateId(payload);
    const reportId = extractWebhookReportId(payload);
    const now = new Date().toISOString();

    let guruId: string | null = null;

    if (candidateId) {
      const { data: guruByCandidate } = await supabaseAdmin
        .from("gurus")
        .select("id")
        .eq("checkr_candidate_id", candidateId)
        .maybeSingle();

      guruId = guruByCandidate?.id ?? null;
    }

    if (!guruId && reportId) {
      const { data: guruByReport } = await supabaseAdmin
        .from("gurus")
        .select("id")
        .eq("checkr_report_id", reportId)
        .maybeSingle();

      guruId = guruByReport?.id ?? null;
    }

    if (!guruId && objectId) {
      const { data: backgroundCheckByObject } = await supabaseAdmin
        .from("guru_background_checks")
        .select("guru_id")
        .or(
          [
            `checkr_invitation_id.eq.${objectId}`,
            `checkr_report_id.eq.${objectId}`,
            `checkr_candidate_id.eq.${objectId}`,
          ].join(","),
        )
        .maybeSingle();

      guruId = backgroundCheckByObject?.guru_id ?? null;
    }

    if (!guruId) {
      console.warn("Checkr webhook received but no Guru matched:", payload);

      return NextResponse.json({
        success: true,
        matched: false,
        message: "Webhook received but no matching Guru was found.",
      });
    }

    const completedAt =
      sitGuruStatus === "clear" ||
      sitGuruStatus === "consider" ||
      sitGuruStatus === "failed" ||
      sitGuruStatus === "canceled"
        ? now
        : null;

    const backgroundCheckPatch: Record<string, unknown> = {
      status: sitGuruStatus,
      last_webhook_at: now,
      raw_checkr_payload: payload,
    };

    if (candidateId) {
      backgroundCheckPatch.checkr_candidate_id = candidateId;
    }

    if (reportId) {
      backgroundCheckPatch.checkr_report_id = reportId;
    }

    if (completedAt) {
      backgroundCheckPatch.completed_at = completedAt;
    }

    const { error: backgroundCheckError } = await supabaseAdmin
      .from("guru_background_checks")
      .update(backgroundCheckPatch)
      .eq("guru_id", guruId);

    if (backgroundCheckError) {
      console.error(
        "Failed updating guru_background_checks from Checkr webhook:",
        backgroundCheckError,
      );

      return NextResponse.json(
        { error: "Failed to update background check record." },
        { status: 500 },
      );
    }

    const guruPatch: Record<string, unknown> = {
      background_check_status: sitGuruStatus,
      checkr_last_webhook_at: now,
    };

    if (candidateId) {
      guruPatch.checkr_candidate_id = candidateId;
    }

    if (reportId) {
      guruPatch.checkr_report_id = reportId;
    }

    if (completedAt) {
      guruPatch.background_check_completed_at = completedAt;
    }

    const { error: guruError } = await supabaseAdmin
      .from("gurus")
      .update(guruPatch)
      .eq("id", guruId);

    if (guruError) {
      console.error("Failed updating gurus from Checkr webhook:", guruError);

      return NextResponse.json(
        { error: "Failed to update Guru status." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      matched: true,
      guruId,
      status: sitGuruStatus,
      checkrEventType: payload.type,
      checkrObjectId: object?.id ?? null,
    });
  } catch (error) {
    console.error("Checkr webhook route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process Checkr webhook.",
      },
      { status: 500 },
    );
  }
}
