import { createClient } from "@supabase/supabase-js";

/**
 * Merge duplicate Guru accounts for Angel Costner.
 *
 * Canonical keep: stronger/complete account (acostner07@gmail.com / 100%)
 * Display name: "Angel Costner" (proper casing — never lowercase)
 * Retire: imout13.ac@gmail.com duplicate via account_merge_aliases
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/merge-angel-costner-gurus.ts
 */

const CANONICAL_EMAIL = "acostner07@gmail.com";
const DUPLICATE_EMAIL = "imout13.ac@gmail.com";
const SHARED_PHONE_DIGITS = "7167158691";
const DISPLAY_NAME = "Angel Costner";
const FIRST_NAME = "Angel";
const LAST_NAME = "Costner";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function digits(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function phoneMatches(value: unknown) {
  const raw = digits(value);
  const normalized =
    raw.length === 11 && raw.startsWith("1") ? raw.slice(1) : raw;
  return normalized === SHARED_PHONE_DIGITS || raw.endsWith(SHARED_PHONE_DIGITS);
}

async function findProfileByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
) {
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .ilike("email", email)
    .limit(5);

  if (error) throw new Error(`profiles lookup failed for ${email}: ${error.message}`);
  return (data || []) as Array<Record<string, unknown>>;
}

async function findGurusForUser(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data, error } = await admin
    .from("gurus")
    .select("*")
    .or(`id.eq.${userId},user_id.eq.${userId},profile_id.eq.${userId}`);

  if (error) throw new Error(`gurus lookup failed: ${error.message}`);
  return (data || []) as Array<Record<string, unknown>>;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();

  const [canonicalProfiles, duplicateProfiles] = await Promise.all([
    findProfileByEmail(admin, CANONICAL_EMAIL),
    findProfileByEmail(admin, DUPLICATE_EMAIL),
  ]);

  // Also search by shared phone if email miss
  const { data: phoneProfiles } = await admin
    .from("profiles")
    .select("*")
    .or(
      `phone.ilike.%7167158691%,phone.ilike.%716-715-8691%,phone.ilike.%+17167158691%`,
    )
    .limit(20);

  const byPhone = ((phoneProfiles || []) as Array<Record<string, unknown>>).filter(
    (row) => phoneMatches(row.phone),
  );

  console.log("Canonical email profiles:", canonicalProfiles.length);
  console.log("Duplicate email profiles:", duplicateProfiles.length);
  console.log("Phone-matched profiles:", byPhone.length);

  let canonical =
    canonicalProfiles[0] ||
    byPhone.find((row) =>
      String(row.email || "")
        .toLowerCase()
        .includes("acostner07"),
    );
  let duplicate =
    duplicateProfiles[0] ||
    byPhone.find((row) =>
      String(row.email || "")
        .toLowerCase()
        .includes("imout13"),
    );

  // Prefer the higher-completion / public-ready row as canonical when emails swap
  if (!canonical || !duplicate) {
    const costners = byPhone.filter((row) =>
      String(row.full_name || row.display_name || "")
        .toLowerCase()
        .includes("costner"),
    );
    console.log(
      "Costner phone candidates:",
      costners.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.full_name || r.display_name,
      })),
    );
    if (!canonical && costners.length) {
      canonical = costners.sort((a, b) =>
        String(a.email).localeCompare(String(b.email)),
      )[0];
    }
    if (!duplicate && costners.length > 1) {
      duplicate = costners.find((r) => String(r.id) !== String(canonical?.id));
    }
  }

  if (!canonical?.id || !duplicate?.id) {
    throw new Error(
      "Could not resolve both Angel Costner profiles. Check emails/phone in production.",
    );
  }

  if (String(canonical.id) === String(duplicate.id)) {
    throw new Error("Canonical and duplicate resolved to the same user id.");
  }

  const canonicalId = String(canonical.id);
  const duplicateId = String(duplicate.id);

  console.log("Keeping canonical:", {
    id: canonicalId,
    email: canonical.email,
    name: canonical.full_name || canonical.display_name,
  });
  console.log("Retiring duplicate:", {
    id: duplicateId,
    email: duplicate.email,
    name: duplicate.full_name || duplicate.display_name,
  });

  // 1) Normalize canonical display to proper casing
  const profilePatch = {
    full_name: DISPLAY_NAME,
    display_name: DISPLAY_NAME,
    first_name: FIRST_NAME,
    last_name: LAST_NAME,
    updated_at: now,
  };

  const { error: profileError } = await admin
    .from("profiles")
    .update(profilePatch)
    .eq("id", canonicalId);

  if (profileError) {
    throw new Error(`Failed updating canonical profile name: ${profileError.message}`);
  }

  // 2) Update guru row(s) for canonical
  const canonicalGurus = await findGurusForUser(admin, canonicalId);
  for (const guru of canonicalGurus) {
    const guruId = String(guru.id);
    const { error: guruError } = await admin
      .from("gurus")
      .update({
        full_name: DISPLAY_NAME,
        display_name: DISPLAY_NAME,
        first_name: FIRST_NAME,
        last_name: LAST_NAME,
        name: DISPLAY_NAME,
        updated_at: now,
      })
      .eq("id", guruId);

    if (guruError) {
      console.warn(`Guru update warning for ${guruId}:`, guruError.message);
      // Retry with fewer columns
      await admin
        .from("gurus")
        .update({
          full_name: DISPLAY_NAME,
          display_name: DISPLAY_NAME,
          updated_at: now,
        })
        .eq("id", guruId);
    }
  }

  // 3) Soft-hide duplicate guru rows (do not delete bookings/history)
  const duplicateGurus = await findGurusForUser(admin, duplicateId);
  for (const guru of duplicateGurus) {
    const guruId = String(guru.id);
    await admin
      .from("gurus")
      .update({
        is_public: false,
        is_public_visible: false,
        is_accepting_bookings: false,
        accepting_bookings: false,
        public_status: "hidden",
        status: "merged_duplicate",
        application_status: "merged_duplicate",
        updated_at: now,
        notes: [
          String(guru.notes || "").trim(),
          `Merged into canonical Angel Costner ${canonicalId} on ${now}`,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .eq("id", guruId);
  }

  // 4) Mark duplicate profile as merged alias (keep auth user for history)
  await admin
    .from("profiles")
    .update({
      account_status: "merged_duplicate",
      full_name: DISPLAY_NAME,
      display_name: `${DISPLAY_NAME} (merged)`,
      updated_at: now,
    })
    .eq("id", duplicateId);

  // 5) Write account_merge_aliases so admin queue hides the duplicate
  const aliasPayload = {
    duplicate_user_id: duplicateId,
    canonical_user_id: canonicalId,
    status: "active",
    reason: "shared_phone_shared_real_name_angel_costner",
    merged_at: now,
    created_at: now,
    updated_at: now,
  };

  const { error: aliasError } = await admin
    .from("account_merge_aliases")
    .upsert(aliasPayload, { onConflict: "duplicate_user_id" });

  if (aliasError) {
    // Table may not have unique constraint / extra columns — try insert
    const { error: insertError } = await admin
      .from("account_merge_aliases")
      .insert({
        duplicate_user_id: duplicateId,
        canonical_user_id: canonicalId,
        status: "active",
      });

    if (insertError) {
      throw new Error(
        `account_merge_aliases write failed: ${aliasError.message} / ${insertError.message}`,
      );
    }
  }

  // Verify
  const { data: verifyCanonical } = await admin
    .from("profiles")
    .select("id, email, full_name, display_name")
    .eq("id", canonicalId)
    .maybeSingle();

  const { data: verifyAlias } = await admin
    .from("account_merge_aliases")
    .select("duplicate_user_id, canonical_user_id, status")
    .eq("duplicate_user_id", duplicateId)
    .maybeSingle();

  console.log("Merge complete.");
  console.log("Canonical listing name:", verifyCanonical);
  console.log("Alias row:", verifyAlias);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
