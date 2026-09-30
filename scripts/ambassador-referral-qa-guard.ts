/**
 * Decides whether the Ambassador referral harness may touch a database.
 * Production, dummy credentials, and live Stripe are refused.
 */

export const PRODUCTION_SUPABASE_PROJECT_REFS = ["mmtjhxnzuglbyumbsjhs"] as const;

/** Approved application hosts. Production sitguru.com is never in this list. */
export const APPROVED_QA_HOSTS = ["localhost", "127.0.0.1", "::1", "staging.sitguru.com"] as const;

const ALLOWED_QA_ENVS = new Set(["staging", "development", "test"]);

export type QaEnvironmentInput = {
  qaEnv?: string | null;
  supabaseUrl?: string | null;
  anonKey?: string | null;
  serviceRoleKey?: string | null;
  baseUrl?: string | null;
  stripeSecretKey?: string | null;
  emailDomain?: string | null;
};

export type QaEnvironmentDecision = {
  ok: boolean;
  reasons: string[];
  payments: "stripe_test" | "skipped";
  summary: string[];
};

function text(value: string | null | undefined) {
  return String(value || "").trim();
}

function hostOf(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function supabaseProjectRef(url: string) {
  const host = hostOf(url);
  const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/);
  return match?.[1] || host || "unknown";
}

function approvedApplicationHost(hostname: string) {
  if ((APPROVED_QA_HOSTS as readonly string[]).includes(hostname)) return true;
  if (hostname.endsWith(".staging.sitguru.com")) return true;
  if (
    hostname.endsWith(".vercel.app") &&
    hostname.includes("sitguru") &&
    (hostname.includes("staging") || hostname.includes("preview"))
  ) {
    return true;
  }
  return false;
}

export function assessAmbassadorReferralQaEnvironment(
  input: QaEnvironmentInput,
): QaEnvironmentDecision {
  const reasons: string[] = [];
  const qaEnv = text(input.qaEnv).toLowerCase();
  const supabaseUrl = text(input.supabaseUrl);
  const anonKey = text(input.anonKey);
  const serviceRoleKey = text(input.serviceRoleKey);
  const baseUrl = text(input.baseUrl);
  const stripeSecretKey = text(input.stripeSecretKey);
  const emailDomain = text(input.emailDomain) || "example.com";

  if (!ALLOWED_QA_ENVS.has(qaEnv)) {
    reasons.push(
      "SITGURU_QA_ENV must be staging, development, or test.",
    );
  }

  if (!supabaseUrl) {
    reasons.push("Supabase URL is missing.");
  } else if (
    PRODUCTION_SUPABASE_PROJECT_REFS.some((ref) => supabaseUrl.includes(ref))
  ) {
    reasons.push("Supabase URL is the production project.");
  }

  if (!anonKey || anonKey.toLowerCase().includes("dummy")) {
    reasons.push("A staging anon key is missing.");
  }

  if (
    !serviceRoleKey ||
    serviceRoleKey.toLowerCase().includes("dummy") ||
    serviceRoleKey.length < 40
  ) {
    reasons.push("A staging service role key is missing.");
  }

  const baseHost = hostOf(baseUrl);
  if (!baseUrl || !baseHost) {
    reasons.push("SITGURU_QA_BASE_URL must be an http(s) staging or local URL.");
  } else if (
    baseHost === "sitguru.com" ||
    baseHost === "www.sitguru.com" ||
    PRODUCTION_SUPABASE_PROJECT_REFS.some((ref) => baseHost.includes(ref))
  ) {
    reasons.push("SITGURU_QA_BASE_URL points at production SitGuru.");
  } else if (!approvedApplicationHost(baseHost)) {
    reasons.push(
      "SITGURU_QA_BASE_URL is not an approved host. Use localhost, staging.sitguru.com, or a SitGuru staging/preview Vercel host.",
    );
  }

  const emailAllowed =
    emailDomain === "example.com" ||
    emailDomain.endsWith(".test") ||
    emailDomain.includes("staging");
  if (emailDomain.includes("@") || !emailAllowed) {
    reasons.push(
      "SITGURU_QA_EMAIL_DOMAIN must be example.com, a .test domain, or a staging domain.",
    );
  }

  let payments: QaEnvironmentDecision["payments"] = "skipped";
  if (stripeSecretKey.toLowerCase().startsWith("sk_live")) {
    reasons.push("Stripe is in live mode.");
  } else if (stripeSecretKey.toLowerCase().startsWith("sk_test")) {
    payments = "stripe_test";
  }

  const stripeLabel =
    payments === "stripe_test" ? "TEST" : stripeSecretKey ? "REFUSED" : "NOT CONFIGURED";
  const summary = [
    `Environment: ${reasons.length === 0 ? qaEnv.toUpperCase() : "REFUSED"}`,
    `Application: ${baseHost || "missing"}`,
    `Supabase: ${supabaseUrl ? supabaseProjectRef(supabaseUrl) : "missing"}`,
    `Stripe: ${stripeLabel}`,
  ];

  return { ok: reasons.length === 0, reasons, payments, summary };
}
