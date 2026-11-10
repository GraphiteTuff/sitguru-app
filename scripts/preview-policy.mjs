// Pure policy shared by Vercel's ignored-build step and its pre-build guard.
// Vercel: exit 0 skips a build; exit 1 allows it. Never reuse for production.
export function previewEnvironmentError(env) {
  if (env.VERCEL_ENV !== "preview") return "This configuration only supports Preview deployments.";
  if (env.VERCEL_GIT_COMMIT_REF !== "feature/sitguru3-manager-community") return "Preview is restricted to the SitGuru 3.0 feature branch.";
  if (env.SITGURU_ENABLE_SAFE_PREVIEW !== "true") return "Safe Preview has not been explicitly enabled.";
  if (env.SITGURU_ISOLATED_BACKEND !== "true") return "An isolated backend is required.";
  let url;
  try { url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || ""); } catch { return "An isolated Supabase URL is required."; }
  const ref = env.SITGURU_PREVIEW_SUPABASE_REF || "";
  if (!/^[a-z0-9]{20}$/.test(ref) || ref === "mmtjhxnzuglbyumbsjhs" || url.protocol !== "https:" || url.hostname !== `${ref}.supabase.co` || url.pathname !== "/" || url.username || url.password || url.search) {
    return "Supabase must match the explicitly selected non-production project.";
  }
  if (!(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || !env.SUPABASE_SERVICE_ROLE_KEY) return "Isolated Supabase public and service credentials are required.";
  if (Object.entries(env).some(([key,value]) => key !== 'NEXT_PUBLIC_SUPABASE_URL' && typeof value === 'string' && value.includes('mmtjhxnzuglbyumbsjhs.supabase.co'))) return "Remove production Supabase aliases from Preview.";
  // Existing integrations stay intact. Preview receives no outbound credentials.
  const credential = Object.entries(env).find(([key, value]) => value && (
    /^(RESEND_|SENDGRID_|TWILIO_|MICROSOFT_|MS_GRAPH_|AZURE_|STRIPE_|PAYPAL_|PLAID_|SMTP_|OUTLOOK_|TEAMS_WEBHOOK|SLACK_WEBHOOK|QUICKBOOKS_|WAVE_|ACCOUNTING_|GOOGLE_|GEOCOD|MAPBOX_|NEXT_PUBLIC_GOOGLE_|NEXT_PUBLIC_MAPBOX_|NEXT_PUBLIC_STRIPE_|NEXT_PUBLIC_PAYPAL_)/.test(key) ||
    /^(SITGURU_).*(WEBHOOK|TOKEN|SECRET)/.test(key) ||
    /^(DATABASE_URL|DIRECT_URL|SUPABASE_DB_URL|CRON_SECRET|SUPABASE_ACCESS_TOKEN)$/.test(key) ||
    /(?:API_KEY|AUTH_TOKEN|CLIENT_SECRET|REFRESH_TOKEN|ACCESS_TOKEN|PRIVATE_KEY|SECRET_KEY|SMTP_PASSWORD)$/.test(key)
  ));
  if (credential) return "Remove outbound integration credentials from the isolated Preview project.";
  return null;
}

// Production retains its credentials and cron configuration. Feature builds
// must independently pass the isolated Preview policy, including forced builds.
export function deploymentEnvironmentError(env) {
  if (env.VERCEL_GIT_COMMIT_REF === "sitguru-main" && env.VERCEL_ENV === "production") return null;
  if (env.VERCEL_GIT_COMMIT_REF === "feature/sitguru3-manager-community") return previewEnvironmentError(env);
  return "Only the production source branch or an isolated feature Preview can build.";
}
