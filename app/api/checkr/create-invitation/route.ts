import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendSitGuruEmail } from "@/lib/email/resend";

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

type TrustSafetyPurchase = {
  id: string;
  guru_id: string | null;
  user_id: string | null;
  email: string | null;
  plan_key: string;
  plan_name: string;
  payment_model: string;
  payment_status: string;
  repayment_status: string;
  management_approval_required: boolean;
  management_approval_status: string;
  booking_deduction_required: boolean;
  booking_deduction_agreement_accepted: boolean;
  amount_paid_cents: number;
  due_today_cents: number;
  remaining_balance_cents: number;
  checkr_invite_allowed: boolean;
  checkr_invite_blocked_reason: string | null;
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

type CheckrGuidanceEmailDetails = {
  guruId: string;
  userId: string | null;
  email: string;
  firstName: string;
  displayName: string;
  invitationId: string;
  candidateId: string;
  invitationUrl: string | null;
  packageSlug: string;
  paymentOption: string | null;
  planName: string | null;
};

function getCheckrApiKey() {
  const apiKey = process.env.CHECKR_API_KEY;

  if (!apiKey) {
    throw new Error("Missing CHECKR_API_KEY environment variable.");
  }

  return apiKey;
}

function getPlanLabelFromPaymentOption(paymentOption?: string | null) {
  if (paymentOption === "pay_full_today") return "Paw in Full";
  if (paymentOption === "pay_15_three_monthly") return "Pawstep Plan";
  if (paymentOption === "pay_15_booking_deductions") return "Book & Bark Plan";

  return "Trust & Safety Screening";
}

function getPlanLabel(params: {
  purchase?: TrustSafetyPurchase | null;
  paymentOption?: string | null;
}) {
  return (
    params.purchase?.plan_name ||
    getPlanLabelFromPaymentOption(params.paymentOption)
  );
}

async function getIsAdminUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Could not check Admin role for Checkr invite:", error);
    return false;
  }

  const role = String(data?.role || "").toLowerCase();

  return role === "admin" || role === "super_admin" || role === "owner";
}

async function getLatestTrustSafetyPurchase(guruId: string) {
  const { data, error } = await supabaseAdmin
    .from("guru_trust_safety_plan_purchases")
    .select(
      [
        "id",
        "guru_id",
        "user_id",
        "email",
        "plan_key",
        "plan_name",
        "payment_model",
        "payment_status",
        "repayment_status",
        "management_approval_required",
        "management_approval_status",
        "booking_deduction_required",
        "booking_deduction_agreement_accepted",
        "amount_paid_cents",
        "due_today_cents",
        "remaining_balance_cents",
        "checkr_invite_allowed",
        "checkr_invite_blocked_reason",
      ].join(","),
    )
    .eq("guru_id", guruId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Could not load Trust & Safety purchase:", error);
    throw new Error("Could not verify Trust & Safety plan readiness.");
  }

  return data as TrustSafetyPurchase | null;
}

function isLegacyScreeningPaymentAllowed(guru: GuruForCheckrInvite) {
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

function getLegacyScreeningPaymentBlockMessage(guru: GuruForCheckrInvite) {
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

function getTrustSafetyBlockMessage(params: {
  guru: GuruForCheckrInvite;
  purchase: TrustSafetyPurchase | null;
}) {
  const { guru, purchase } = params;

  if (!purchase) {
    return getLegacyScreeningPaymentBlockMessage(guru);
  }

  if (purchase.checkr_invite_blocked_reason) {
    return purchase.checkr_invite_blocked_reason;
  }

  if (
    purchase.management_approval_required &&
    purchase.management_approval_status !== "approved"
  ) {
    return `${purchase.plan_name} requires management approval before Checkr can start.`;
  }

  if (purchase.amount_paid_cents < purchase.due_today_cents) {
    return `${purchase.plan_name} requires the initial payment to clear before Checkr can start.`;
  }

  if (
    purchase.booking_deduction_required &&
    !purchase.booking_deduction_agreement_accepted
  ) {
    return `${purchase.plan_name} requires the booking deduction agreement before Checkr can start.`;
  }

  return `${purchase.plan_name} is not financially cleared for Checkr yet.`;
}

function isTrustSafetyReadyForCheckr(params: {
  guru: GuruForCheckrInvite;
  purchase: TrustSafetyPurchase | null;
}) {
  const { guru, purchase } = params;

  if (purchase) {
    return Boolean(purchase.checkr_invite_allowed);
  }

  return isLegacyScreeningPaymentAllowed(guru);
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getConfiguredSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "";

  if (!configuredUrl) return "";

  return configuredUrl.startsWith("http")
    ? configuredUrl.replace(/\/$/, "")
    : `https://${configuredUrl.replace(/\/$/, "")}`;
}

function getGuruDashboardUrl() {
  const siteUrl = getConfiguredSiteUrl();

  if (!siteUrl) {
    return "/guru/dashboard/background-check";
  }

  return `${siteUrl}/guru/dashboard/background-check`;
}

function getEmailLogoUrl() {
  const configuredLogo =
    typeof process.env.SITGURU_EMAIL_LOGO_URL === "string"
      ? process.env.SITGURU_EMAIL_LOGO_URL.trim()
      : "";

  if (configuredLogo) {
    return configuredLogo;
  }

  const siteUrl = getConfiguredSiteUrl();

  if (!siteUrl) {
    return "";
  }

  return `${siteUrl}/sitguru-logo.png`;
}

function getGuruDisplayName(guru: GuruForCheckrInvite) {
  return (
    guru.name ||
    guru.full_name ||
    guru.display_name ||
    guru.email?.split("@")[0] ||
    "Guru"
  );
}

function getFirstName(value?: string | null) {
  return String(value || "Guru").trim().split(/\s+/)[0] || "Guru";
}

function getPackageDisplayName(packageSlug: string) {
  return packageSlug
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCheckrGuidanceEmailText(details: CheckrGuidanceEmailDetails) {
  const dashboardUrl = getGuruDashboardUrl();
  const planLabel =
    details.planName || getPlanLabelFromPaymentOption(details.paymentOption);
  const packageName = getPackageDisplayName(details.packageSlug);

  return `Hi ${details.firstName},

Your SitGuru Trust & Safety Screening invitation is ready.

Your selected screening plan:
${planLabel}

Screening package:
${packageName}

What happens next:
You may receive a separate email directly from Checkr with a secure link to start your background check. That email is expected and is part of SitGuru’s Trust & Safety Screening process.

Start or continue your Checkr screening:
${details.invitationUrl || "Return to your SitGuru Guru Dashboard to continue."}

Monitor your status in SitGuru:
${dashboardUrl}

Important:
Please complete the Checkr screening as soon as possible. Booking eligibility may depend on your Trust & Safety Screening status, Stripe payout setup, and Admin approval.

If you do not see the Checkr email, check your spam, junk, Other, or promotions folders. You can also return to your SitGuru Guru Dashboard and continue from there.

— The SitGuru Team`;
}

function buildCheckrGuidanceEmailHtml(details: CheckrGuidanceEmailDetails) {
  const dashboardUrl = getGuruDashboardUrl();
  const logoUrl = getEmailLogoUrl();
  const planLabel =
    details.planName || getPlanLabelFromPaymentOption(details.paymentOption);
  const packageName = getPackageDisplayName(details.packageSlug);
  const safeFirstName = escapeHtml(details.firstName);
  const safePlanLabel = escapeHtml(planLabel);
  const safePackageName = escapeHtml(packageName);
  const safeInvitationUrl = details.invitationUrl
    ? escapeHtml(details.invitationUrl)
    : "";
  const safeDashboardUrl = escapeHtml(dashboardUrl);

  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(
        logoUrl,
      )}" width="148" alt="SitGuru" style="display:block;width:148px;max-width:148px;height:auto;border:0;outline:none;text-decoration:none;margin:0 0 14px;" />`
    : `<div style="font-size:28px;font-weight:900;color:#07132f;letter-spacing:-0.04em;margin:0 0 14px;">SitGuru</div>`;

  const checkrButtonHtml = safeInvitationUrl
    ? `
      <a href="${safeInvitationUrl}" style="display:inline-block;border-radius:16px;background:#07132f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;padding:14px 22px;margin:0 10px 10px 0;">
        Start Checkr Screening
      </a>
    `
    : "";

  return `
  <div style="margin:0;padding:0;background:#f3fbf8;font-family:Arial,Helvetica,sans-serif;color:#07132f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3fbf8;margin:0;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #d7f5e7;border-radius:24px;overflow:hidden;box-shadow:0 14px 40px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:28px 28px 22px;background:linear-gradient(135deg,#d9fff3,#d8eefc);">
                ${logoHtml}
                <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;font-weight:900;color:#047857;">
                  SitGuru Trust &amp; Safety
                </div>
                <h1 style="margin:12px 0 0;font-size:30px;line-height:1.15;color:#07132f;">
                  Your Checkr invitation is ready 🐾
                </h1>
                <p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#334155;font-weight:600;">
                  Hi ${safeFirstName}, your SitGuru Trust &amp; Safety Screening invitation has been created.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;margin:0 0 22px;">
                  <tr>
                    <td style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:900;color:#64748b;">Selected screening plan</div>
                      <div style="font-size:20px;font-weight:900;color:#07132f;margin-top:4px;">${safePlanLabel}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;font-weight:900;color:#64748b;">Screening package</div>
                      <div style="font-size:20px;font-weight:900;color:#047857;margin-top:4px;">${safePackageName}</div>
                    </td>
                  </tr>
                </table>

                <div style="padding:16px 18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;margin-bottom:22px;">
                  <p style="margin:0;font-size:15px;line-height:1.65;color:#1e3a8a;font-weight:700;">
                    You may receive a separate email directly from <strong>Checkr</strong> with a secure link to start your background check. That email is expected and is part of SitGuru’s Trust &amp; Safety Screening process.
                  </p>
                </div>

                <h2 style="margin:0 0 10px;font-size:20px;color:#07132f;">Next step</h2>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#334155;">
                  Please complete your Checkr screening as soon as possible. Booking eligibility may depend on your Trust &amp; Safety Screening status, Stripe payout setup, and Admin approval.
                </p>

                <div style="margin:0 0 22px;">
                  ${checkrButtonHtml}
                  <a href="${safeDashboardUrl}" style="display:inline-block;border-radius:16px;background:#10b981;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;padding:14px 22px;margin:0 0 10px 0;">
                    Monitor in SitGuru
                  </a>
                </div>

                <div style="padding:16px 18px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:18px;margin-bottom:22px;">
                  <p style="margin:0;font-size:15px;line-height:1.65;color:#065f46;font-weight:700;">
                    If you do not see the Checkr email, check your spam, junk, Other, or promotions folders. You can also return to your SitGuru Guru Dashboard and continue from there.
                  </p>
                </div>

                <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;">
                  SitGuru may contact you by email or through SitGuru Messages if anything else is needed.
                </p>

                <p style="margin:22px 0 0;font-size:15px;font-weight:800;color:#07132f;">
                  — The SitGuru Team
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  This email confirms that SitGuru created your secure Checkr screening invitation. Checkr may send a separate screening email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}

async function hasCheckrGuidanceEmailAlreadyBeenSent(params: {
  guruId: string;
  invitationId: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("email_events")
    .select("id,status,metadata")
    .eq("event_type", "trust_safety_screening_checkr_guidance")
    .eq("guru_id", params.guruId)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    console.error("Could not check existing Checkr guidance email:", error);
    return false;
  }

  const rows = (data || []) as Array<{
    id?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;

  return rows.some(
    (row) => row.metadata?.checkr_invitation_id === params.invitationId,
  );
}

async function logCheckrGuidanceEmail(params: {
  userId: string | null;
  guruId: string;
  email: string;
  providerMessageId: string | null;
  status: "sent" | "failed" | "skipped";
  metadata: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("email_events").insert({
    user_id: params.userId,
    guru_id: params.guruId,
    email: params.email,
    event_type: "trust_safety_screening_checkr_guidance",
    provider_message_id: params.providerMessageId,
    stripe_session_id: null,
    status: params.status,
    metadata: params.metadata,
  });

  if (error) {
    console.error("Could not log Checkr guidance email:", error);
  }
}

async function sendCheckrGuidanceEmail(details: CheckrGuidanceEmailDetails) {
  if (!details.email) return;

  const alreadySent = await hasCheckrGuidanceEmailAlreadyBeenSent({
    guruId: details.guruId,
    invitationId: details.invitationId,
  });

  if (alreadySent) {
    console.log(
      "Skipping duplicate SitGuru Checkr guidance email for invitation:",
      details.invitationId,
    );
    return;
  }

  const subject = "Your SitGuru Checkr screening invitation is ready 🐾";

  try {
    const result = await sendSitGuruEmail({
      to: details.email,
      subject,
      html: buildCheckrGuidanceEmailHtml(details),
      text: buildCheckrGuidanceEmailText(details),
    });

    await logCheckrGuidanceEmail({
      userId: details.userId,
      guruId: details.guruId,
      email: details.email,
      providerMessageId: result.id,
      status: "sent",
      metadata: {
        checkr_invitation_id: details.invitationId,
        checkr_candidate_id: details.candidateId,
        checkr_invitation_url: details.invitationUrl,
        package_slug: details.packageSlug,
        payment_option: details.paymentOption,
        plan_name: details.planName,
        dashboard_url: getGuruDashboardUrl(),
        email_logo_url: getEmailLogoUrl(),
      },
    });

    console.log("📧 SitGuru Checkr guidance email sent:", details.email);
  } catch (error) {
    console.error("Failed to send SitGuru Checkr guidance email:", error);

    await logCheckrGuidanceEmail({
      userId: details.userId,
      guruId: details.guruId,
      email: details.email,
      providerMessageId: null,
      status: "failed",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        checkr_invitation_id: details.invitationId,
        checkr_candidate_id: details.candidateId,
        checkr_invitation_url: details.invitationUrl,
        package_slug: details.packageSlug,
        payment_option: details.paymentOption,
        plan_name: details.planName,
        dashboard_url: getGuruDashboardUrl(),
        email_logo_url: getEmailLogoUrl(),
      },
    });
  }
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

    const isAdminUser = await getIsAdminUser(user.id);

    if (guru.user_id && guru.user_id !== user.id && !isAdminUser) {
      return NextResponse.json(
        { error: "You can only start screening for your own Guru profile." },
        { status: 403 },
      );
    }

    const trustSafetyPurchase = await getLatestTrustSafetyPurchase(guru.id);

    if (
      !isTrustSafetyReadyForCheckr({
        guru,
        purchase: trustSafetyPurchase,
      })
    ) {
      return NextResponse.json(
        {
          error: getTrustSafetyBlockMessage({
            guru,
            purchase: trustSafetyPurchase,
          }),
          plan_name: getPlanLabel({
            purchase: trustSafetyPurchase,
            paymentOption: guru.background_check_fee_payment_option,
          }),
          management_approval_status:
            trustSafetyPurchase?.management_approval_status || null,
          payment_status: trustSafetyPurchase?.payment_status || null,
          checkr_invite_allowed:
            trustSafetyPurchase?.checkr_invite_allowed || false,
          checkr_invite_blocked_reason:
            trustSafetyPurchase?.checkr_invite_blocked_reason || null,
        },
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

    const displayName = getGuruDisplayName(guru);
    const planName = getPlanLabel({
      purchase: trustSafetyPurchase,
      paymentOption: guru.background_check_fee_payment_option,
    });

    if (guru.checkr_invitation_id && guru.checkr_invitation_url) {
      await sendCheckrGuidanceEmail({
        guruId: guru.id,
        userId: guru.user_id,
        email: guru.email,
        firstName: getFirstName(displayName),
        displayName,
        invitationId: guru.checkr_invitation_id,
        candidateId: guru.checkr_candidate_id || "",
        invitationUrl: guru.checkr_invitation_url,
        packageSlug,
        paymentOption: guru.background_check_fee_payment_option,
        planName,
      });

      return NextResponse.json({
        success: true,
        status: guru.background_check_status || "invited",
        guruId: guru.id,
        candidateId: guru.checkr_candidate_id,
        invitationId: guru.checkr_invitation_id,
        reportId: null,
        invitationUrl: guru.checkr_invitation_url,
        invitation_url: guru.checkr_invitation_url,
        trust_safety_purchase_id: trustSafetyPurchase?.id || null,
        plan_name: planName,
        message:
          "Your secure screening invitation already exists. Continuing your existing screening form.",
      });
    }

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
      console.error(
        "Trust & Safety Screening upsert error:",
        backgroundCheckError,
      );

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

    if (trustSafetyPurchase?.id) {
      await supabaseAdmin.from("trust_safety_financial_events").insert({
        purchase_id: trustSafetyPurchase.id,
        guru_id: guru.id,
        user_id: guru.user_id,
        event_type: "ledger_adjustment",
        category: "trust_safety",
        source: "sitguru",
        status: "posted",
        plan_key: trustSafetyPurchase.plan_key,
        plan_name: trustSafetyPurchase.plan_name,
        gross_amount_cents: 0,
        fee_amount_cents: 0,
        net_amount_cents: 0,
        currency: "usd",
        description: "Checkr invitation created after Trust & Safety financial clearance.",
        metadata: {
          checkr_candidate_id: candidateId,
          checkr_invitation_id: invitationId,
          checkr_report_id: reportId,
          checkr_invitation_url: invitationUrl,
          package_slug: packageSlug,
          created_by_user_id: user.id,
          created_by_admin: isAdminUser,
        },
        occurred_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    await sendCheckrGuidanceEmail({
      guruId: guru.id,
      userId: guru.user_id,
      email: guru.email,
      firstName: getFirstName(displayName),
      displayName,
      invitationId,
      candidateId,
      invitationUrl,
      packageSlug,
      paymentOption: guru.background_check_fee_payment_option,
      planName,
    });

    return NextResponse.json({
      success: true,
      status: "invited",
      guruId: guru.id,
      candidateId,
      invitationId,
      reportId,
      invitationUrl,
      invitation_url: invitationUrl,
      trust_safety_purchase_id: trustSafetyPurchase?.id || null,
      plan_name: planName,
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