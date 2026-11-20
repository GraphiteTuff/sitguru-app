import { isReservedReferralCode, normalizeReferralCode } from "@/lib/ambassador/creator-referral";

/**
 * True only when the code is on the public Ambassador card or, before that
 * view exists, an active public referral_codes row. Never uses the service role.
 * A miss does not clear an existing cookie.
 */
export async function publicReferralIsActive(code: string) {
  const normalized = normalizeReferralCode(code);
  if (!normalized || isReservedReferralCode(normalized)) return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !apiKey) return false;

  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  try {
    const viewResponse = await fetch(
      `${supabaseUrl}/rest/v1/ambassador_public_referrals?referral_code=ilike.${encodeURIComponent(normalized)}&select=referral_code&limit=1`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(2500) },
    );

    if (viewResponse.ok) {
      const rows = (await viewResponse.json()) as unknown;
      return Array.isArray(rows) && rows.length > 0;
    }

    const failure = await viewResponse.text();
    const viewMissing = /ambassador_public_referrals|schema cache|does not exist|PGRST205/i.test(
      failure,
    );
    if (!viewMissing) return false;

    const codeResponse = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?or=(code.ilike.${encodeURIComponent(normalized)},slug.ilike.${encodeURIComponent(normalized)})&status=eq.active&select=code&limit=1`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(2500) },
    );
    if (!codeResponse.ok) return false;
    const rows = (await codeResponse.json()) as unknown;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}
