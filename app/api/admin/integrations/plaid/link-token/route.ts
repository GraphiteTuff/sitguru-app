import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

const FINANCE_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return false;
}

function getEnvAdminEmails() {
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasFinancialRole(role: string) {
  return FINANCE_ROLES.includes(role.trim().toLowerCase());
}

function getPlaidEnv() {
  const env = String(process.env.PLAID_ENV || "sandbox").toLowerCase();

  if (env === "production") return PlaidEnvironments.production;
  if (env === "development") return PlaidEnvironments.development;

  return PlaidEnvironments.sandbox;
}

function getPlaidProducts() {
  return String(process.env.PLAID_PRODUCTS || "transactions,auth,balance")
    .split(",")
    .map((product) => product.trim().toLowerCase())
    .filter(Boolean);
}

function getPlaidCountryCodes() {
  return String(process.env.PLAID_COUNTRY_CODES || "US")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean);
}

function getBaseUrl(request: Request) {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITGURU_APP_URL ||
    process.env.VERCEL_URL;

  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Plaid link-token query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Plaid link-token query skipped for ${label}:`, error);
    return [];
  }
}

async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const userEmail = (user.email || "").toLowerCase();
  const envAdminEmails = getEnvAdminEmails();

  const profileChecks = await Promise.all([
    safeRows<AnyRow>(
      supabase
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_plaid_link_access",
    ),
    safeRows<AnyRow>(
      supabase
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_plaid_link_access",
    ),
    safeRows<AnyRow>(
      supabase
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_plaid_link_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials:
      active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed),
  };
}

function getPlaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;

  if (!clientId || !secret) {
    throw new Error(
      "Missing PLAID_CLIENT_ID or PLAID_SECRET environment variable.",
    );
  }

  const configuration = new Configuration({
    basePath: getPlaidEnv(),
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  return new PlaidApi(configuration);
}

async function createFinancialIntegrationEvent({
  userId,
  title,
  message,
  status,
  metadata,
}: {
  userId: string;
  title: string;
  message: string;
  status: "info" | "success" | "warning" | "error";
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();

  try {
    await supabase.from("financial_integration_events").insert({
      provider: "plaid",
      event_type: "link_token_create",
      event_status: status,
      title,
      message,
      created_by: userId,
      metadata: metadata || {},
    });
  } catch (error) {
    console.warn("Plaid link token event log skipped:", error);
  }
}

export async function POST(request: Request) {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to connect bank accounts." },
      { status: 403 },
    );
  }

  try {
    const plaid = getPlaidClient();
    const baseUrl = getBaseUrl(request);
    const redirectUri = process.env.PLAID_REDIRECT_URI || undefined;
    const webhookUrl =
      process.env.PLAID_WEBHOOK_URL ||
      `${baseUrl}/api/admin/integrations/plaid/webhook`;

    const products = getPlaidProducts();
    const countryCodes = getPlaidCountryCodes();

    const response = await plaid.linkTokenCreate({
      user: {
        client_user_id: actor.id,
      },
      client_name: process.env.PLAID_CLIENT_NAME || "SitGuru",
      products: products as never,
      country_codes: countryCodes as never,
      language: "en",
      webhook: webhookUrl,
      redirect_uri: redirectUri,
    });

    await createFinancialIntegrationEvent({
      userId: actor.id,
      title: "Plaid Link token created",
      message:
        "A Plaid Link token was created so an admin can connect Navy Federal checking/savings.",
      status: "success",
      metadata: {
        plaidEnvironment: process.env.PLAID_ENV || "sandbox",
        products,
        countryCodes,
        webhookUrl,
        hasRedirectUri: Boolean(redirectUri),
      },
    });

    return NextResponse.json({
      ok: true,
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
      requestId: response.data.request_id,
      plaidEnvironment: process.env.PLAID_ENV || "sandbox",
      products,
      countryCodes,
    });
  } catch (error) {
    console.error("Plaid link token error:", error);

    await createFinancialIntegrationEvent({
      userId: actor.id,
      title: "Plaid Link token failed",
      message:
        error instanceof Error
          ? error.message
          : "Unable to create Plaid Link token.",
      status: "error",
    });

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create Plaid Link token.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
