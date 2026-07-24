import { NextRequest, NextResponse } from "next/server";
import {
  getPayPalConfig,
  PayPalApiError,
  paypalRequest,
} from "@/lib/paypal/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PayPalEnvironment = "sandbox" | "live";

type PayPalConnectionStatus =
  | "connected"
  | "pending"
  | "limited"
  | "error";

type PayPalMerchantAccountRecord = {
  user_id: string;
  environment: PayPalEnvironment;
  tracking_id: string;
  paypal_merchant_id: string | null;
  merchant_email: string | null;
  status: string;
};

type PayPalOAuthThirdParty = {
  partner_client_id?: string;
  merchant_client_id?: string;
  scopes?: string[];
  [key: string]: unknown;
};

type PayPalOAuthIntegration = {
  integration_type?: string;
  integration_method?: string;
  oauth_third_party?: PayPalOAuthThirdParty[];
  [key: string]: unknown;
};

type PayPalProduct = {
  name?: string;
  status?: string;
  vetting_status?: string;
  capabilities?: string[];
  [key: string]: unknown;
};

type PayPalCapability = {
  name?: string;
  status?: string;
  limits?: unknown;
  [key: string]: unknown;
};

type PayPalMerchantIntegration = {
  merchant_id?: string;
  tracking_id?: string;
  legal_name?: string;
  primary_email?: string;
  primary_currency?: string;
  country?: string;
  payments_receivable?: boolean;
  primary_email_confirmed?: boolean;
  products?: PayPalProduct[];
  capabilities?: PayPalCapability[];
  oauth_integrations?: PayPalOAuthIntegration[];
  [key: string]: unknown;
};

type PayPalMerchantIntegrationCollection = {
  merchant_integrations?: PayPalMerchantIntegration[];
  integrations?: PayPalMerchantIntegration[];
  [key: string]: unknown;
};

function getAppUrl(request: NextRequest): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    request.nextUrl.origin;

  return configuredUrl.startsWith("http")
    ? configuredUrl.replace(/\/$/, "")
    : `https://${configuredUrl.replace(/\/$/, "")}`;
}

function normalizeString(
  value: string | null | undefined,
): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUppercase(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeString(value);

  return normalized ? normalized.toUpperCase() : null;
}

function parseBooleanParameter(
  value: string | null,
): boolean | null {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function getOAuthThirdPartyPermissions(
  merchantDetails: PayPalMerchantIntegration,
): PayPalOAuthThirdParty[] {
  const permissions: PayPalOAuthThirdParty[] = [];

  for (const integration of merchantDetails.oauth_integrations ?? []) {
    if (!Array.isArray(integration.oauth_third_party)) {
      continue;
    }

    for (const thirdPartyRecord of integration.oauth_third_party) {
      if (
        thirdPartyRecord &&
        typeof thirdPartyRecord === "object"
      ) {
        permissions.push(thirdPartyRecord);
      }
    }
  }

  return permissions;
}

function getOAuthScopes(
  permissions: PayPalOAuthThirdParty[],
): string[] {
  const scopes = new Set<string>();

  for (const permission of permissions) {
    for (const scope of permission.scopes ?? []) {
      const normalizedScope = normalizeString(scope);

      if (normalizedScope) {
        scopes.add(normalizedScope);
      }
    }
  }

  return Array.from(scopes);
}

function getPpcpProduct(
  merchantDetails: PayPalMerchantIntegration,
): PayPalProduct | null {
  return (
    merchantDetails.products?.find((product) => {
      const productName = normalizeUppercase(product.name);

      return (
        productName === "PPCP" ||
        productName === "PPCP_CUSTOM" ||
        productName === "PPCP_STANDARD"
      );
    }) ?? null
  );
}

function getCapabilityStatus(
  merchantDetails: PayPalMerchantIntegration,
  capabilityName: string,
): string | null {
  const normalizedName = capabilityName
    .trim()
    .toUpperCase();

  const capability = merchantDetails.capabilities?.find(
    (candidate) =>
      normalizeUppercase(candidate.name) === normalizedName,
  );

  return normalizeUppercase(capability?.status);
}

function normalizeCapabilities(
  merchantDetails: PayPalMerchantIntegration,
): Record<string, unknown> {
  const normalizedCapabilities: Record<string, unknown> = {};

  for (const capability of merchantDetails.capabilities ?? []) {
    const capabilityName = normalizeUppercase(
      capability.name,
    );

    if (!capabilityName) {
      continue;
    }

    normalizedCapabilities[capabilityName] = {
      status: normalizeUppercase(capability.status),
      limits: capability.limits ?? null,
      source: "merchant_integration",
    };
  }

  for (const product of merchantDetails.products ?? []) {
    const productName =
      normalizeUppercase(product.name) || "UNKNOWN_PRODUCT";

    for (const capabilityValue of product.capabilities ?? []) {
      const capabilityName =
        normalizeUppercase(capabilityValue);

      if (!capabilityName) {
        continue;
      }

      if (!normalizedCapabilities[capabilityName]) {
        normalizedCapabilities[capabilityName] = {
          status: null,
          limits: null,
          source: productName,
        };
      }
    }
  }

  return normalizedCapabilities;
}

function getMerchantIntegrationFromResponse(
  response: unknown,
): PayPalMerchantIntegration | null {
  if (Array.isArray(response)) {
    const integration = response.find(isRecord);

    return integration
      ? (integration as PayPalMerchantIntegration)
      : null;
  }

  if (!isRecord(response)) {
    return null;
  }

  if (
    typeof response.merchant_id === "string" ||
    typeof response.tracking_id === "string"
  ) {
    return response as PayPalMerchantIntegration;
  }

  const collection =
    response as PayPalMerchantIntegrationCollection;

  const candidates = [
    ...(Array.isArray(collection.merchant_integrations)
      ? collection.merchant_integrations
      : []),
    ...(Array.isArray(collection.integrations)
      ? collection.integrations
      : []),
  ];

  return candidates[0] ?? null;
}

function determineConnectionStatus(params: {
  paymentsReceivable: boolean;
  primaryEmailConfirmed: boolean;
  permissionsPresent: boolean;
  ppcpProduct: PayPalProduct | null;
  vettingStatus: string | null;
}): PayPalConnectionStatus {
  const {
    paymentsReceivable,
    primaryEmailConfirmed,
    permissionsPresent,
    ppcpProduct,
    vettingStatus,
  } = params;

  if (
    vettingStatus === "DENIED" ||
    vettingStatus === "DECLINED"
  ) {
    return "limited";
  }

  if (vettingStatus === "SUBSCRIBED_WITH_LIMIT") {
    return "limited";
  }

  const baseRequirementsComplete =
    paymentsReceivable &&
    primaryEmailConfirmed &&
    permissionsPresent;

  const productStatus = normalizeUppercase(
    ppcpProduct?.status,
  );

  const productProvisioned =
    Boolean(ppcpProduct) &&
    (vettingStatus === "SUBSCRIBED" ||
      productStatus === "ACTIVE");

  if (baseRequirementsComplete && productProvisioned) {
    return "connected";
  }

  return "pending";
}

function createDashboardRedirectUrl(params: {
  appUrl: string;
  status:
    | "connected"
    | "needs_attention"
    | "missing_profile"
    | "missing_connection"
    | "invalid_return"
    | "return_failed";
  environment?: PayPalEnvironment;
  paymentsReceivable?: boolean;
  primaryEmailConfirmed?: boolean;
  permissionsPresent?: boolean;
  vettingStatus?: string | null;
  customCardStatus?: string | null;
}): URL {
  const searchParams = new URLSearchParams();

  searchParams.set("paypal", params.status);

  if (params.environment) {
    searchParams.set(
      "paypal_environment",
      params.environment,
    );
  }

  if (typeof params.paymentsReceivable === "boolean") {
    searchParams.set(
      "paypal_payments_receivable",
      params.paymentsReceivable ? "true" : "false",
    );
  }

  if (typeof params.primaryEmailConfirmed === "boolean") {
    searchParams.set(
      "paypal_email_confirmed",
      params.primaryEmailConfirmed ? "true" : "false",
    );
  }

  if (typeof params.permissionsPresent === "boolean") {
    searchParams.set(
      "paypal_permissions_granted",
      params.permissionsPresent ? "true" : "false",
    );
  }

  if (params.vettingStatus) {
    searchParams.set(
      "paypal_vetting_status",
      params.vettingStatus,
    );
  }

  if (params.customCardStatus) {
    searchParams.set(
      "paypal_card_processing_status",
      params.customCardStatus,
    );
  }

  return new URL(
    `/guru/dashboard?${searchParams.toString()}`,
    params.appUrl,
  );
}

async function findMerchantIdByTrackingId(params: {
  partnerMerchantId: string;
  trackingId: string;
}): Promise<string | null> {
  const response = await paypalRequest<unknown>(
    `/v1/customer/partners/${encodeURIComponent(
      params.partnerMerchantId,
    )}/merchant-integrations?tracking_id=${encodeURIComponent(
      params.trackingId,
    )}`,
    {
      method: "GET",
    },
  );

  const merchantIntegration =
    getMerchantIntegrationFromResponse(response);

  return (
    normalizeString(merchantIntegration?.merchant_id) ||
    null
  );
}

async function getMerchantIntegrationStatus(params: {
  partnerMerchantId: string;
  sellerMerchantId: string;
}): Promise<PayPalMerchantIntegration> {
  return paypalRequest<PayPalMerchantIntegration>(
    `/v1/customer/partners/${encodeURIComponent(
      params.partnerMerchantId,
    )}/merchant-integrations/${encodeURIComponent(
      params.sellerMerchantId,
    )}`,
    {
      method: "GET",
      sellerMerchantId: params.sellerMerchantId,
    },
  );
}

async function saveReturnError(params: {
  userId: string;
  environment: PayPalEnvironment;
  code: string;
  message: string;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("paypal_merchant_accounts")
    .update({
      status: "error",
      last_error_code: params.code.slice(0, 255),
      last_error_message: params.message.slice(0, 1500),
      last_synced_at: new Date().toISOString(),
    })
    .eq("user_id", params.userId)
    .eq("environment", params.environment);

  if (error) {
    console.error(
      "Unable to save PayPal return-route error:",
      error,
    );
  }
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request);

  let authenticatedUserId: string | null = null;
  let activeEnvironment: PayPalEnvironment | null = null;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL(
          "/guru/login?error=Please log in again",
          appUrl,
        ),
      );
    }

    authenticatedUserId = user.id;

    const { data: guruData, error: guruError } =
      await supabaseAdmin
        .from("gurus")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (guruError) {
      console.error(
        "PayPal return Guru lookup error:",
        guruError,
      );

      return NextResponse.redirect(
        createDashboardRedirectUrl({
          appUrl,
          status: "missing_profile",
        }),
      );
    }

    if (!guruData) {
      return NextResponse.redirect(
        createDashboardRedirectUrl({
          appUrl,
          status: "missing_profile",
        }),
      );
    }

    const paypalConfig = getPayPalConfig();
    const environment = paypalConfig.environment;

    activeEnvironment = environment;

    const partnerMerchantId = normalizeString(
      paypalConfig.partnerMerchantId,
    );

    if (!partnerMerchantId) {
      throw new Error(
        environment === "live"
          ? "Missing PAYPAL_LIVE_PARTNER_MERCHANT_ID."
          : "Missing PAYPAL_SANDBOX_PARTNER_MERCHANT_ID.",
      );
    }

    const { data: accountData, error: accountError } =
      await supabaseAdmin
        .from("paypal_merchant_accounts")
        .select(
          [
            "user_id",
            "environment",
            "tracking_id",
            "paypal_merchant_id",
            "merchant_email",
            "status",
          ].join(","),
        )
        .eq("user_id", user.id)
        .eq("environment", environment)
        .maybeSingle();

    if (accountError) {
      console.error(
        "PayPal merchant account lookup error:",
        accountError,
      );

      return NextResponse.redirect(
        createDashboardRedirectUrl({
          appUrl,
          status: "return_failed",
          environment,
        }),
      );
    }

    const account =
      accountData as PayPalMerchantAccountRecord | null;

    if (!account) {
      return NextResponse.redirect(
        createDashboardRedirectUrl({
          appUrl,
          status: "missing_connection",
          environment,
        }),
      );
    }

    const returnedTrackingId = normalizeString(
      request.nextUrl.searchParams.get("merchantId"),
    );

    const expectedTrackingId = normalizeString(
      account.tracking_id,
    );

    if (
      returnedTrackingId &&
      returnedTrackingId !== expectedTrackingId
    ) {
      await saveReturnError({
        userId: user.id,
        environment,
        code: "PAYPAL_TRACKING_ID_MISMATCH",
        message:
          "The PayPal return tracking ID did not match the active SitGuru onboarding session.",
      });

      return NextResponse.redirect(
        createDashboardRedirectUrl({
          appUrl,
          status: "invalid_return",
          environment,
        }),
      );
    }

    let sellerMerchantId =
      normalizeString(
        request.nextUrl.searchParams.get(
          "merchantIdInPayPal",
        ),
      ) ||
      normalizeString(account.paypal_merchant_id);

    if (!sellerMerchantId) {
      sellerMerchantId =
        (await findMerchantIdByTrackingId({
          partnerMerchantId,
          trackingId: expectedTrackingId,
        })) || "";
    }

    if (!sellerMerchantId) {
      await saveReturnError({
        userId: user.id,
        environment,
        code: "PAYPAL_MERCHANT_ID_MISSING",
        message:
          "PayPal did not return or resolve the seller merchant ID.",
      });

      return NextResponse.redirect(
        createDashboardRedirectUrl({
          appUrl,
          status: "needs_attention",
          environment,
        }),
      );
    }

    const merchantDetails =
      await getMerchantIntegrationStatus({
        partnerMerchantId,
        sellerMerchantId,
      });

    const verifiedMerchantId = normalizeString(
      merchantDetails.merchant_id,
    );

    const verifiedTrackingId = normalizeString(
      merchantDetails.tracking_id,
    );

    if (
      verifiedMerchantId &&
      verifiedMerchantId !== sellerMerchantId
    ) {
      throw new Error(
        "PayPal returned a different seller merchant ID than expected.",
      );
    }

    if (
      verifiedTrackingId &&
      verifiedTrackingId !== expectedTrackingId
    ) {
      throw new Error(
        "PayPal returned a different tracking ID than expected.",
      );
    }

    const paymentsReceivable =
      merchantDetails.payments_receivable === true;

    const primaryEmailConfirmed =
      merchantDetails.primary_email_confirmed === true;

    const oauthThirdPartyPermissions =
      getOAuthThirdPartyPermissions(merchantDetails);

    const oauthScopes = getOAuthScopes(
      oauthThirdPartyPermissions,
    );

    const permissionsPresent =
      oauthThirdPartyPermissions.length > 0 &&
      oauthScopes.length > 0;

    const ppcpProduct = getPpcpProduct(merchantDetails);

    const returnedRiskStatus = normalizeUppercase(
      request.nextUrl.searchParams.get("riskStatus"),
    );

    const vettingStatus =
      normalizeUppercase(ppcpProduct?.vetting_status) ||
      returnedRiskStatus;

    const customCardStatus = getCapabilityStatus(
      merchantDetails,
      "CUSTOM_CARD_PROCESSING",
    );

    const connectionStatus = determineConnectionStatus({
      paymentsReceivable,
      primaryEmailConfirmed,
      permissionsPresent,
      ppcpProduct,
      vettingStatus,
    });

    const connected =
      connectionStatus === "connected";

    const returnedPermissionsGranted =
      parseBooleanParameter(
        request.nextUrl.searchParams.get(
          "permissionsGranted",
        ),
      );

    const returnedConsentStatus =
      parseBooleanParameter(
        request.nextUrl.searchParams.get(
          "consentStatus",
        ),
      );

    const returnedEmailConfirmed =
      parseBooleanParameter(
        request.nextUrl.searchParams.get(
          "isEmailConfirmed",
        ),
      );

    const now = new Date().toISOString();

    const merchantEmail =
      normalizeString(merchantDetails.primary_email) ||
      normalizeString(account.merchant_email) ||
      null;

    const { error: updateError } = await supabaseAdmin
      .from("paypal_merchant_accounts")
      .update({
        paypal_merchant_id: sellerMerchantId,
        merchant_email: merchantEmail,
        status: connectionStatus,
        onboarding_action_url: null,
        payments_receivable: paymentsReceivable,
        primary_email_confirmed: primaryEmailConfirmed,
        oauth_third_party_permissions:
          oauthThirdPartyPermissions,
        products: merchantDetails.products ?? [],
        capabilities:
          normalizeCapabilities(merchantDetails),
        vetting_status: vettingStatus,
        partner_consent_status:
          returnedConsentStatus === null
            ? permissionsPresent
              ? "true"
              : null
            : returnedConsentStatus
              ? "true"
              : "false",
        merchant_details: {
          ...merchantDetails,
          sitguru_verification: {
            environment,
            verified_at: now,
            oauth_scopes: oauthScopes,
            permissions_present: permissionsPresent,
            custom_card_processing_status:
              customCardStatus,
            return_parameters: {
              permissions_granted:
                returnedPermissionsGranted,
              consent_status: returnedConsentStatus,
              email_confirmed:
                returnedEmailConfirmed,
              account_status: normalizeUppercase(
                request.nextUrl.searchParams.get(
                  "accountStatus",
                ),
              ),
              product_intent_id: normalizeString(
                request.nextUrl.searchParams.get(
                  "productIntentId",
                ),
              ),
              risk_status: returnedRiskStatus,
              return_message: normalizeString(
                request.nextUrl.searchParams.get(
                  "returnMessage",
                ),
              ),
            },
          },
        },
        last_error_code: null,
        last_error_message: null,
        onboarding_completed_at: connected ? now : null,
        last_synced_at: now,
      })
      .eq("user_id", user.id)
      .eq("environment", environment)
      .eq("tracking_id", expectedTrackingId);

    if (updateError) {
      console.error(
        "Error saving PayPal merchant status:",
        updateError,
      );

      throw new Error(
        "Could not save the verified PayPal merchant status.",
      );
    }

    return NextResponse.redirect(
      createDashboardRedirectUrl({
        appUrl,
        status: connected
          ? "connected"
          : "needs_attention",
        environment,
        paymentsReceivable,
        primaryEmailConfirmed,
        permissionsPresent,
        vettingStatus,
        customCardStatus,
      }),
    );
  } catch (error) {
    if (error instanceof PayPalApiError) {
      console.error("PayPal return API error:", {
        status: error.status,
        debugId: error.debugId,
        message: error.message,
        responseBody: error.responseBody,
      });
    } else {
      console.error(
        "PayPal return route error:",
        error,
      );
    }

    if (authenticatedUserId && activeEnvironment) {
      const errorCode =
        error instanceof PayPalApiError
          ? error.debugId
            ? `PAYPAL_${error.status}_${error.debugId}`
            : `PAYPAL_${error.status}`
          : "PAYPAL_RETURN_ERROR";

      const errorMessage =
        error instanceof Error
          ? error.message
          : "PayPal onboarding verification failed.";

      await saveReturnError({
        userId: authenticatedUserId,
        environment: activeEnvironment,
        code: errorCode,
        message: errorMessage,
      });
    }

    return NextResponse.redirect(
      createDashboardRedirectUrl({
        appUrl,
        status: "return_failed",
        environment: activeEnvironment ?? undefined,
      }),
    );
  }
}