import "server-only";

/**
 * SitGuru PayPal Multiparty server client.
 *
 * SECURITY:
 * - This file must only be imported by server components, server actions,
 *   route handlers, or other server-only modules.
 * - Never expose the PayPal client secret to the browser.
 * - Never use PAYPAL_*_CLIENT_SECRET in a NEXT_PUBLIC_* variable.
 */

export type PayPalEnvironment = "sandbox" | "live";

type PayPalHttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type PayPalRequestOptions = {
  method?: PayPalHttpMethod;
  body?: unknown;
  sellerMerchantId?: string;
  requestId?: string;
  preferRepresentation?: boolean;
  headers?: Record<string, string>;
};

export type PayPalConfig = {
  environment: PayPalEnvironment;
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  partnerAttributionId: string;
  partnerMerchantId: string | null;
  webhookId: string | null;
};

type CachedAccessToken = {
  cacheKey: string;
  accessToken: string;
  expiresAt: number;
};

type PayPalAccessTokenResponse = {
  scope?: string;
  access_token: string;
  token_type: string;
  app_id?: string;
  expires_in: number;
  nonce?: string;
};

type PayPalErrorResponse = {
  name?: string;
  message?: string;
  debug_id?: string;
  details?: Array<{
    issue?: string;
    description?: string;
    field?: string;
    value?: string;
    location?: string;
  }>;
  links?: Array<{
    href?: string;
    rel?: string;
    method?: string;
  }>;
};

let cachedAccessToken: CachedAccessToken | null = null;

export class PayPalApiError extends Error {
  readonly status: number;
  readonly debugId: string | null;
  readonly responseBody: unknown;

  constructor(
    message: string,
    status: number,
    debugId: string | null,
    responseBody: unknown,
  ) {
    super(message);
    this.name = "PayPalApiError";
    this.status = status;
    this.debugId = debugId;
    this.responseBody = responseBody;
  }
}

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required PayPal environment variable: ${name}`,
    );
  }

  return value;
}

function getOptionalEnvironmentVariable(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

function getPayPalEnvironment(): PayPalEnvironment {
  const configuredEnvironment =
    process.env.PAYPAL_ENV?.trim().toLowerCase() || "sandbox";

  if (
    configuredEnvironment !== "sandbox" &&
    configuredEnvironment !== "live"
  ) {
    throw new Error(
      'PAYPAL_ENV must be either "sandbox" or "live".',
    );
  }

  return configuredEnvironment;
}

export function getPayPalConfig(): PayPalConfig {
  const environment = getPayPalEnvironment();

  if (environment === "live") {
    return {
      environment,
      apiBaseUrl: "https://api-m.paypal.com",
      clientId: getRequiredEnvironmentVariable(
        "PAYPAL_LIVE_CLIENT_ID",
      ),
      clientSecret: getRequiredEnvironmentVariable(
        "PAYPAL_LIVE_CLIENT_SECRET",
      ),
      partnerAttributionId: getRequiredEnvironmentVariable(
        "PAYPAL_LIVE_PARTNER_ATTRIBUTION_ID",
      ),
      partnerMerchantId: getOptionalEnvironmentVariable(
        "PAYPAL_LIVE_PARTNER_MERCHANT_ID",
      ),
      webhookId: getOptionalEnvironmentVariable(
        "PAYPAL_LIVE_WEBHOOK_ID",
      ),
    };
  }

  return {
    environment,
    apiBaseUrl: "https://api-m.sandbox.paypal.com",
    clientId: getRequiredEnvironmentVariable(
      "PAYPAL_SANDBOX_CLIENT_ID",
    ),
    clientSecret: getRequiredEnvironmentVariable(
      "PAYPAL_SANDBOX_CLIENT_SECRET",
    ),
    partnerAttributionId: getRequiredEnvironmentVariable(
      "PAYPAL_SANDBOX_PARTNER_ATTRIBUTION_ID",
    ),
    partnerMerchantId: getOptionalEnvironmentVariable(
      "PAYPAL_SANDBOX_PARTNER_MERCHANT_ID",
    ),
    webhookId: getOptionalEnvironmentVariable(
      "PAYPAL_SANDBOX_WEBHOOK_ID",
    ),
  };
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Creates the PayPal-Auth-Assertion header used when SitGuru makes
 * an API request on behalf of an onboarded Guru.
 */
export function createPayPalAuthAssertion(
  sellerMerchantId: string,
): string {
  const normalizedSellerMerchantId = sellerMerchantId.trim();

  if (!normalizedSellerMerchantId) {
    throw new Error(
      "A PayPal seller merchant ID is required to create an auth assertion.",
    );
  }

  const { clientId } = getPayPalConfig();

  const header = encodeBase64Url(
    JSON.stringify({
      alg: "none",
    }),
  );

  const payload = encodeBase64Url(
    JSON.stringify({
      iss: clientId,
      payer_id: normalizedSellerMerchantId,
    }),
  );

  return `${header}.${payload}.`;
}

async function parseResponseBody(
  response: Response,
): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function getPayPalErrorMessage(
  status: number,
  responseBody: unknown,
): string {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    const errorBody = responseBody as PayPalErrorResponse;

    const detailDescription = errorBody.details?.find(
      (detail) => detail.description,
    )?.description;

    return (
      detailDescription ||
      errorBody.message ||
      errorBody.name ||
      `PayPal API request failed with status ${status}.`
    );
  }

  if (typeof responseBody === "string" && responseBody.trim()) {
    return responseBody;
  }

  return `PayPal API request failed with status ${status}.`;
}

function getPayPalDebugId(
  response: Response,
  responseBody: unknown,
): string | null {
  const headerDebugId = response.headers.get("paypal-debug-id");

  if (headerDebugId) {
    return headerDebugId;
  }

  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    const errorBody = responseBody as PayPalErrorResponse;
    return errorBody.debug_id || null;
  }

  return null;
}

export async function getPayPalAccessToken(): Promise<string> {
  const config = getPayPalConfig();
  const cacheKey = `${config.environment}:${config.clientId}`;
  const now = Date.now();

  if (
    cachedAccessToken &&
    cachedAccessToken.cacheKey === cacheKey &&
    cachedAccessToken.expiresAt > now
  ) {
    return cachedAccessToken.accessToken;
  }

  const basicAuthentication = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
    "utf8",
  ).toString("base64");

  const response = await fetch(
    `${config.apiBaseUrl}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en_US",
        Authorization: `Basic ${basicAuthentication}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    },
  );

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new PayPalApiError(
      getPayPalErrorMessage(response.status, responseBody),
      response.status,
      getPayPalDebugId(response, responseBody),
      responseBody,
    );
  }

  const tokenResponse =
    responseBody as PayPalAccessTokenResponse;

  if (!tokenResponse.access_token || !tokenResponse.expires_in) {
    throw new Error(
      "PayPal returned an invalid access-token response.",
    );
  }

  /*
   * Expire the local cache one minute before PayPal's actual expiration
   * so a token is not reused while it is close to expiring.
   */
  const safeLifetimeSeconds = Math.max(
    tokenResponse.expires_in - 60,
    30,
  );

  cachedAccessToken = {
    cacheKey,
    accessToken: tokenResponse.access_token,
    expiresAt: now + safeLifetimeSeconds * 1000,
  };

  return tokenResponse.access_token;
}

/**
 * Makes an authenticated request to a PayPal REST endpoint.
 *
 * Example:
 *
 * const response = await paypalRequest<MyResponse>(
 *   "/v2/customer/partner-referrals",
 *   {
 *     method: "POST",
 *     body: payload,
 *     requestId: crypto.randomUUID(),
 *   },
 * );
 */
export async function paypalRequest<TResponse>(
  path: string,
  options: PayPalRequestOptions = {},
): Promise<TResponse> {
  const config = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const method = options.method || "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "PayPal-Partner-Attribution-Id":
      config.partnerAttributionId,
    ...options.headers,
  };

  if (options.sellerMerchantId) {
    headers["PayPal-Auth-Assertion"] =
      createPayPalAuthAssertion(options.sellerMerchantId);
  }

  if (options.requestId) {
    headers["PayPal-Request-Id"] = options.requestId;
  }

  if (options.preferRepresentation !== false) {
    headers.Prefer = "return=representation";
  }

  const response = await fetch(
    `${config.apiBaseUrl}${normalizedPath}`,
    {
      method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
      cache: "no-store",
    },
  );

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new PayPalApiError(
      getPayPalErrorMessage(response.status, responseBody),
      response.status,
      getPayPalDebugId(response, responseBody),
      responseBody,
    );
  }

  return responseBody as TResponse;
}

export function clearPayPalAccessTokenCache(): void {
  cachedAccessToken = null;
}