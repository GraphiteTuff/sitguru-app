/**
 * Resolve a SitGuru profile / conversation path for a test phone number.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/lookup-phone-for-chat-test.ts 2534552377
 */

async function normalizePhone(raw: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) return { digits, e164: `+1${digits}`, last10: digits };
  if (digits.length === 11 && digits.startsWith("1")) {
    return { digits, e164: `+${digits}`, last10: digits.slice(1) };
  }
  return { digits, e164: digits ? `+${digits}` : "", last10: digits.slice(-10) };
}

async function main() {
  const raw = process.argv[2] || "2534552377";
  const phone = await normalizePhone(raw);
  const { createSupabaseAdminClient } = await import("../lib/supabase/admin");
  const supabase = createSupabaseAdminClient();

  console.log("Looking up phone:", phone);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, first_name, last_name, role, account_type, phone, phone_number, mobile_phone, cell_phone",
    )
    .or(
      [
        `phone.ilike.%${phone.last10}%`,
        `phone_number.ilike.%${phone.last10}%`,
        `mobile_phone.ilike.%${phone.last10}%`,
        `cell_phone.ilike.%${phone.last10}%`,
      ].join(","),
    )
    .limit(20);

  if (error) {
    console.error("Profile lookup failed:", error.message);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        matchCount: (profiles || []).length,
        profiles: profiles || [],
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
