import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKR_API_BASE = "https://api.checkr.com/v1";

type CreateInvitationBody = {
  guruId?: string;
};

type GuruForCheckrInvite = {
  id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  checkr_candidate_id: string | null;
  checkr_invitation_id: string | null;
  checkr_invitation_url: string | null;
  background_check_status: string | null;
  background_check_fee_status: string | null;
  background_check_fee_paid_at: string | null;
  background_check_fee_payment_option: string | null;
};

type CheckrCandidate = {
  id: string;
  object?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  custom_id?: string;
};

type CheckrInvitation = {
  id: string;
  object?: string;
  uri?: string;
  invitation_url?: string;
  status?: string;
  candidate_id?: string;
  report_id?: string;
};

function getCheckrApiKey() {
  const apiKey = process.env.CHECKR_API_KEY;

  if (!apiKey) {
    throw new Error("Missing CHECKR_API_KEY environment variable.");
  }

  return apiKey;
}

function isScreeningPaymentAllowed(guru: GuruForCheckrInvite) {
  const feeStatus = String(guru.background_check_fee_status || "")
    .trim()
    .toLowerCase();

  return (
    feeStatus === "paid" ||
    feeStatus === "partially_paid" ||
    feeStatus === "waived" ||
    Boolean(guru.background_check_fee_paid_at)
  );
}

function getScreeningPaymentBlockMessage(guru: GuruForCheckrInvite) {
  const feeStatus = String(guru.background_check_fee_status || "unpaid")
    .trim()
    .toLowerCase();

  if (feeStatus === "checkout_started" || feeStatus === "pending") {
    return "Your Trust & Safety Screening payment is still pending. Please complete Stripe Checkout or refresh your status before starting the secure screening form.";
  }

  if (feeStatus === "refunded") {
    return "Your Trust & Safety Screening payment was refunded. Please choose a new screening plan before starting the secure screening form.";
  }

  return "Please choose and start a Trust & Safety Screening payment plan before starting the secure screening form.";
}

async function checkrRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: Record<string, unknown>;
  } = {},
): Promise<T> {
  const apiKey = getCheckrApiKey();
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const response = await fetch(`${CHECKR_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    console.error("Checkr API error:", {
      path,
      status: response.status,
      data,
    });

    throw new Error(
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error)
        : "Checkr API request failed.",
    );
  }

  return data as T;
}

async function createCheckrCandidate(params: {
  guruId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}) {
  return checkrRequest<CheckrCandidate>("/candidates", {
    method: "POST",
    body: {
      email: params.email,
      first_name: params.firstName || undefined,
      last_name: params.lastName || undefined,
      phone: params.phone || undefined,
      custom_id: params.guruId,
    },
  });
}

async function createCheckrInvitation(params: {
  candidateId: string;
  packageSlug: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}) {
  return checkrRequest<CheckrInvitation>("/invitations", {
    method: "POST",
    body: {
      candidate_id: params.candidateId,
      package: params.packageSlug,
      work_locations: [
        {
          country: params.country || "US",
          state: params.state || "FL",
          city: params.city || undefined,
        },
      ],
    },
  });
}

function extractInvitationUrl(invitation: CheckrInvitation) {
  return invitation.invitation_url || invitation.uri || null;
}

function splitName(name?: string | null) {
  if (!name) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  const parts = name.trim().split(/\s+/);

  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to start your secure screening." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as CreateInvitationBody;
    const guruId = String(body.guruId || "").trim();

    if (!guruId) {
      return NextResponse.json({ error: "Missing guruId." }, { status: 400 });
    }

    const packageSlug = process.env.CHECKR_PACKAGE_SLUG;

    if (!packageSlug) {
      return NextResponse.json(
        { error: "Missing CHECKR_PACKAGE_SLUG environment variable." },
        { status: 500 },
      );
    }

    const { data: guruData, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select(
        [
          "id",
          "user_id",
          "email",
          "name",
          "full_name",
          "display_name",
          "phone",
          "city",
          "state",
          "checkr_candidate_id",
          "checkr_invitation_id",
          "checkr_invitation_url",
          "background_check_status",
          "background_check_fee_status",
          "background_check_fee_paid_at",
          "background_check_fee_payment_option",
        ].join(","),
      )
      .eq("id", guruId)
      .single();

    const guru = guruData as GuruForCheckrInvite | null;

    if (guruError || !guru) {
      console.error("Guru lookup error:", guruError);

      return NextResponse.json({ error: "Guru not found." }, { status: 404 });
    }

    if (guru.user_id && guru.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only start screening for your own Guru profile." },
        { status: 403 },
      );
    }

    if (!isScreeningPaymentAllowed(guru)) {
      return NextResponse.json(
        { error: getScreeningPaymentBlockMessage(guru) },
        { status: 402 },
      );
    }

    if (!guru.email) {
      return NextResponse.json(
        {
          error:
            "Your Guru profile must have an email before starting the secure screening form.",
        },
        { status: 400 },
      );
    }

    if (guru.checkr_invitation_id && guru.checkr_invitation_url) {
      return NextResponse.json({
        success: true,
        status: guru.background_check_status || "invited",
        guruId: guru.id,
        candidateId: guru.checkr_candidate_id,
        invitationId: guru.checkr_invitation_id,
        reportId: null,
        invitationUrl: guru.checkr_invitation_url,
        invitation_url: guru.checkr_invitation_url,
        message:
          "Your secure screening invitation already exists. Continuing your existing screening form.",
      });
    }

    const displayName =
      guru.name || guru.full_name || guru.display_name || guru.email;

    const { firstName, lastName } = splitName(displayName);

    const candidateId =
      guru.checkr_candidate_id ||
      (
        await createCheckrCandidate({
          guruId: guru.id,
          email: guru.email,
          firstName,
          lastName,
          phone: guru.phone,
        })
      ).id;

    const invitation = await createCheckrInvitation({
      candidateId,
      packageSlug,
      city: guru.city,
      state: guru.state,
      country: "US",
    });

    const invitationUrl = extractInvitationUrl(invitation);
    const invitationId = invitation.id;
    const reportId = invitation.report_id ?? null;
    const now = new Date().toISOString();

    const { error: backgroundCheckError } = await supabaseAdmin
      .from("guru_background_checks")
      .upsert(
        {
          guru_id: guru.id,
          checkr_candidate_id: candidateId,
          checkr_invitation_id: invitationId,
          checkr_report_id: reportId,
          status: "invited",
          package_slug: packageSlug,
          invitation_url: invitationUrl,
          started_at: now,
          last_webhook_at: now,
          raw_checkr_payload: invitation,
        },
        {
          onConflict: "guru_id",
        },
      );

    if (backgroundCheckError) {
      console.error("Trust & Safety Screening upsert error:", backgroundCheckError);

      return NextResponse.json(
        { error: "Failed to save secure screening invitation." },
        { status: 500 },
      );
    }

    const { error: guruUpdateError } = await supabaseAdmin
      .from("gurus")
      .update({
        checkr_candidate_id: candidateId,
        checkr_invitation_id: invitationId,
        checkr_invitation_url: invitationUrl,
        checkr_package_slug: packageSlug,
        checkr_report_id: reportId,
        background_check_status: "invited",
        checkr_last_webhook_at: now,
        updated_at: now,
      })
      .eq("id", guru.id);

    if (guruUpdateError) {
      console.error("Guru secure screening update error:", guruUpdateError);

      return NextResponse.json(
        { error: "Failed to update Guru Trust & Safety Screening status." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      status: "invited",
      guruId: guru.id,
      candidateId,
      invitationId,
      reportId,
      invitationUrl,
      invitation_url: invitationUrl,
    });
  } catch (error) {
    console.error("Create secure screening invitation route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create secure screening invitation.",
      },
      { status: 500 },
    );
  }
}