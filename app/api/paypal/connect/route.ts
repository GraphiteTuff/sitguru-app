import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getPayPalConfig,
  PayPalApiError,
  paypalRequest,
} from "@/lib/paypal/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GuruPayPalConnectRecord = {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  name: string | null;
};

type PayPalMerchantAccountRecord = {
  user_id: string;
  environment: "sandbox" | "live";
  tracking_id: string;
  paypal_merchant_id: string | null;
  status:
    | "not_started"
    | "referral_created"
    | "pending"
    | "connected"
    | "limited"
    | "disconnected"
    | "error";
  payments_receivable: boolean;
  primary_email_confirmed: boolean;
  onboarding_action_url: string | null;
};

type PayPalReferralLink = {
  href?: string;
  rel?: string;
  method?: string;
};

type PayPalPartnerReferralResponse = {
  partner_referral_id?: string;
  links?: PayPalReferralLink[];
};

type PayPalFeature =
  | "PAYMENT"
  | "REFUND"
  | "PARTNER_FEE"
  | "DELAY_FUNDS_DISBURSEMENT";

type OnboardingResult = {
  error: string | null;
  status: number;
  url: string | null;
  environment: "sandbox" | "live" | null;
  trackingId: string | null;
  alreadyConnected: boolean;
  paypalMerchantId: string | null;
};

function getAppUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  return appUrl.startsWith("http")
    ? appUrl.replace(/\/$/, "")
    : `https://${appUrl.replace(/\/$/, "")}`;
}

function getGuruDashboardUrl(
  status: "connected" | "error" | "cancelled",
): string {
  return `${getAppUrl()}/guru/dashboard?paypal=${status}`;
}

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function getRequestedPayPalFeatures(): PayPalFeature[] {
  const features: PayPalFeature[] = [
    "PAYMENT",
    "REFUND",
    "PARTNER_FEE",
  ];

  /*
   * Only request delayed disbursement after PayPal confirms that this
   * capability is enabled for SitGuru's platform account.
   */
  if (
    isEnabled(
      process.env.PAYPAL_DELAY_FUNDS_DISBURSEMENT_ENABLED,
    )
  ) {
    features.push("DELAY_FUNDS_DISBURSEMENT");
  }

  return features;
}

function getActionUrl(
  response: PayPalPartnerReferralResponse,
): string | null {
  const actionLink = response.links?.find(
    (link) => link.rel === "action_url",
  );

  return actionLink?.href?.trim() || null;
}

function getSelfUrl(
  response: PayPalPartnerReferralResponse,
): string | null {
  const selfLink = response.links?.find(
    (link) => link.rel === "self",
  );

  return selfLink?.href?.trim() || null;
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof PayPalApiError) {
    return error.message || "PayPal rejected the onboarding request.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to start PayPal onboarding.";
}

function getStoredErrorCode(error: unknown): string {
  if (error instanceof PayPalApiError) {
    return error.debugId
      ? `PAYPAL_${error.status}_${error.debugId}`
      : `PAYPAL_${error.status}`;
  }

  return "PAYPAL_ONBOARDING_ERROR";
}

async function saveOnboardingError(
  userId: string,
  environment: "sandbox" | "live",
  error: unknown,
): Promise<void> {
  const errorMessage = getSafeErrorMessage(error).slice(0, 1500);
  const errorCode = getStoredErrorCode(error).slice(0, 255);

  const { error: updateError } = await supabaseAdmin
    .from("paypal_merchant_accounts")
    .update({
      status: "error",
      last_error_code: errorCode,
      last_error_message: errorMessage,
      last_synced_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("environment", environment);

  if (updateError) {
    console.error(
      "Unable to save PayPal onboarding error:",
      updateError,
    );
  }
}

async function createOrResumePayPalOnboarding(): Promise<OnboardingResult> {
  const appUrl = getAppUrl();
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Unauthorized.",
      status: 401,
      url: null,
      environment: null,
      trackingId: null,
      alreadyConnected: false,
      paypalMerchantId: null,
    };
  }

  const { data: guruData, error: guruError } =
    await supabaseAdmin
      .from("gurus")
      .select(
        [
          "id",
          "user_id",
          "email",
          "full_name",
          "display_name",
          "name",
        ].join(","),
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (guruError) {
    console.error("PayPal Guru lookup error:", guruError);

    return {
      error: "Could not load Guru profile.",
      status: 500,
      url: null,
      environment: null,
      trackingId: null,
      alreadyConnected: false,
      paypalMerchantId: null,
    };
  }

  const guru = guruData as GuruPayPalConnectRecord | null;

  if (!guru) {
    return {
      error: "Guru profile not found.",
      status: 404,
      url: null,
      environment: null,
      trackingId: null,
      alreadyConnected: false,
      paypalMerchantId: null,
    };
  }

  const paypalConfig = getPayPalConfig();
  const environment = paypalConfig.environment;

  const { data: existingAccountData, error: existingAccountError } =
    await supabaseAdmin
      .from("paypal_merchant_accounts")
      .select(
        [
          "user_id",
          "environment",
          "tracking_id",
          "paypal_merchant_id",
          "status",
          "payments_receivable",
          "primary_email_confirmed",
          "onboarding_action_url",
        ].join(","),
      )
      .eq("user_id", user.id)
      .eq("environment", environment)
      .maybeSingle();

  if (existingAccountError) {
    console.error(
      "PayPal merchant account lookup error:",
      existingAccountError,
    );

    return {
      error: "Could not load PayPal connection status.",
      status: 500,
      url: null,
      environment,
      trackingId: null,
      alreadyConnected: false,
      paypalMerchantId: null,
    };
  }

  const existingAccount =
    existingAccountData as PayPalMerchantAccountRecord | null;

  const isAlreadyConnected =
    existingAccount?.status === "connected" &&
    existingAccount.payments_receivable === true &&
    existingAccount.primary_email_confirmed === true &&
    Boolean(existingAccount.paypal_merchant_id);

  if (isAlreadyConnected) {
    return {
      error: null,
      status: 200,
      url: getGuruDashboardUrl("connected"),
      environment,
      trackingId: existingAccount.tracking_id,
      alreadyConnected: true,
      paypalMerchantId: existingAccount.paypal_merchant_id,
    };
  }

  /*
   * Create a new tracking ID for every onboarding attempt.
   *
   * PayPal's onboarding action URL expires after it is used. Creating a
   * fresh Partner Referral ensures the Guru receives a usable URL when
   * restarting an incomplete or expired onboarding flow.
   */
  const trackingId = [
    "sitguru",
    environment,
    user.id,
    randomUUID(),
  ].join("-");

  const merchantEmail = guru.email || user.email || null;
  const now = new Date().toISOString();

  const { error: pendingRecordError } = await supabaseAdmin
    .from("paypal_merchant_accounts")
    .upsert(
      {
        user_id: user.id,
        environment,
        tracking_id: trackingId,
        merchant_email: merchantEmail,
        status: "pending",
        onboarding_action_url: null,
        last_error_code: null,
        last_error_message: null,
        onboarding_started_at: now,
        last_synced_at: now,
      },
      {
        onConflict: "user_id,environment",
      },
    );

  if (pendingRecordError) {
    console.error(
      "Error creating PayPal onboarding record:",
      pendingRecordError,
    );

    return {
      error: "Could not prepare the PayPal connection.",
      status: 500,
      url: null,
      environment,
      trackingId: null,
      alreadyConnected: false,
      paypalMerchantId: null,
    };
  }

  const referralPayload = {
    tracking_id: trackingId,
    ...(merchantEmail
      ? {
          email: merchantEmail,
        }
      : {}),
    preferred_language_code: "en-US",
    partner_config_override: {
      return_url: `${appUrl}/api/paypal/connect/return`,
      return_url_description:
        "Return to SitGuru after connecting your PayPal account.",
      show_add_credit_card: true,
    },
    operations: [
      {
        operation: "API_INTEGRATION",
        api_integration_preference: {
          rest_api_integration: {
            integration_method: "PAYPAL",
            integration_type: "THIRD_PARTY",
            third_party_details: {
              features: getRequestedPayPalFeatures(),
            },
          },
        },
      },
    ],
    products: ["PPCP"],
    legal_consents: [
      {
        type: "SHARE_DATA_CONSENT",
        granted: true,
      },
    ],
  };

  try {
    const referralResponse =
      await paypalRequest<PayPalPartnerReferralResponse>(
        "/v2/customer/partner-referrals",
        {
          method: "POST",
          requestId: randomUUID(),
          body: referralPayload,
        },
      );

    const actionUrl = getActionUrl(referralResponse);

    if (!actionUrl) {
      throw new Error(
        "PayPal did not return a seller onboarding URL.",
      );
    }

    const { error: saveReferralError } = await supabaseAdmin
      .from("paypal_merchant_accounts")
      .update({
        status: "referral_created",
        onboarding_action_url: actionUrl,
        merchant_details: {
          partner_referral_id:
            referralResponse.partner_referral_id || null,
          referral_self_url: getSelfUrl(referralResponse),
          requested_product: "PPCP",
          requested_features: getRequestedPayPalFeatures(),
          referral_response: referralResponse,
        },
        last_error_code: null,
        last_error_message: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("environment", environment)
      .eq("tracking_id", trackingId);

    if (saveReferralError) {
      console.error(
        "Error saving PayPal Partner Referral:",
        saveReferralError,
      );

      return {
        error: "Could not save the PayPal onboarding session.",
        status: 500,
        url: null,
        environment,
        trackingId,
        alreadyConnected: false,
        paypalMerchantId: null,
      };
    }

    return {
      error: null,
      status: 200,
      url: actionUrl,
      environment,
      trackingId,
      alreadyConnected: false,
      paypalMerchantId: null,
    };
  } catch (error) {
    if (error instanceof PayPalApiError) {
      console.error("PayPal Partner Referral API error:", {
        status: error.status,
        debugId: error.debugId,
        message: error.message,
        responseBody: error.responseBody,
      });
    } else {
      console.error("PayPal onboarding error:", error);
    }

    await saveOnboardingError(user.id, environment, error);

    return {
      error: getSafeErrorMessage(error),
      status: error instanceof PayPalApiError ? 502 : 500,
      url: null,
      environment,
      trackingId,
      alreadyConnected: false,
      paypalMerchantId: null,
    };
  }
}

export async function GET() {
  try {
    const result = await createOrResumePayPalOnboarding();

    if (result.error || !result.url) {
      return NextResponse.redirect(getGuruDashboardUrl("error"));
    }

    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error("PayPal Connect GET route error:", error);

    return NextResponse.redirect(getGuruDashboardUrl("error"));
  }
}

export async function POST() {
  try {
    const result = await createOrResumePayPalOnboarding();

    if (result.error || !result.url) {
      return NextResponse.json(
        {
          ok: false,
          error:
            result.error ||
            "Failed to start PayPal onboarding.",
        },
        {
          status: result.status,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      url: result.url,
      environment: result.environment,
      tracking_id: result.trackingId,
      already_connected: result.alreadyConnected,
      paypal_merchant_id: result.paypalMerchantId,
    });
  } catch (error) {
    console.error("PayPal Connect POST route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to start PayPal onboarding.",
      },
      {
        status: 500,
      },
    );
  }
}