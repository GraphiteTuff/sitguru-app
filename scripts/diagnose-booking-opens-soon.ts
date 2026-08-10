/**
 * Find real gurus where admin marks them bookable, but frontend shows
 * "Booking opens soon" / "Bookings opening soon".
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/diagnose-booking-opens-soon.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

type GuruRow = Record<string, unknown>;

function loadEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);
  try {
    const raw = readFileSync(filePath, "utf8");
    let loaded = 0;
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      // Always prefer file values for this diagnostic.
      process.env[key] = value;
      loaded += 1;
    }
    console.error(`[env] loaded ${loaded} keys from ${fileName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "read failed";
    console.error(`[env] could not read ${fileName}: ${message}`);
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function requireEnv(name: string) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(
      `Missing ${name} (present=${Object.prototype.hasOwnProperty.call(process.env, name)}, len=${String(process.env[name] || "").length})`,
    );
  }
  return value;
}

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: unknown) {
  return asString(value).toLowerCase();
}

function asBool(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    const n = value.trim().toLowerCase();
    if (["true", "t", "1", "yes"].includes(n)) return true;
    if (["false", "f", "0", "no"].includes(n)) return false;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return null;
}

function getName(row: GuruRow) {
  return (
    asString(row.display_name) ||
    asString(row.full_name) ||
    asString(row.name) ||
    "Unknown"
  );
}

function getEmail(row: GuruRow) {
  return normalize(row.email);
}

function isTestOrDummy(row: GuruRow) {
  const email = getEmail(row);
  const name = normalize(getName(row));
  const flags = [
    row.is_test_account,
    row.is_test,
    row.is_dummy,
    row.test_account,
    row.is_spam,
    row.is_archived,
  ];

  if (flags.some((f) => asBool(f) === true)) return true;

  if (
    email.endsWith("@example.com") ||
    email.endsWith("@test.com") ||
    email.includes("sitguru.local") ||
    email.includes("placeholder") ||
    email.includes("+test") ||
    email.includes("dummy")
  ) {
    return true;
  }

  const adminStatus = normalize(row.admin_status);
  const qualityStatus = normalize(row.profile_quality_status);
  if (
    adminStatus === "placeholder" ||
    qualityStatus.includes("placeholder") ||
    qualityStatus.includes("demo") ||
    qualityStatus.includes("seed")
  ) {
    return true;
  }

  if (/\b(test|dummy|demo|fake|sample|spam)\b/i.test(name)) return true;
  if (/(^|[+@._-])(test|demo|fake|sample|spam|dummy)([+@._-]|$)/i.test(email)) {
    return true;
  }

  return false;
}

/** Admin panel treats these as bookable/active. */
function isAdminBookable(row: GuruRow) {
  const applicationStatus = normalize(row.application_status);
  const status = normalize(row.status);

  return (
    asBool(row.is_bookable) === true ||
    applicationStatus === "bookable" ||
    status === "bookable"
  );
}

/**
 * Mirrors app/api/gurus/public-search/route.ts isBookableSearchGuru()
 * (simplified: assumes publicly visible already).
 */
function isBookableOnSearch(row: GuruRow) {
  const status = normalize(row.status);
  const applicationStatus = normalize(row.application_status);
  const bookingStatus = normalize(row.booking_status);
  const adminStatus = normalize(row.admin_status);
  const qualityStatus = normalize(row.profile_quality_status);

  if (bookingStatus === "listed_only" || bookingStatus === "not_listed") {
    return false;
  }
  if (adminStatus === "placeholder" || qualityStatus === "placeholder") {
    return false;
  }
  if (asBool(row.is_bookable) === false) return false;
  if (asBool(row.is_accepting_bookings) === false) return false;
  if (asBool(row.accepting_bookings) === false) return false;

  return (
    asBool(row.is_bookable) === true ||
    asBool(row.is_accepting_bookings) === true ||
    asBool(row.accepting_bookings) === true ||
    bookingStatus === "bookable" ||
    bookingStatus === "requestable" ||
    applicationStatus === "bookable" ||
    status === "bookable" ||
    (adminStatus === "approved" && qualityStatus === "bookable")
  );
}

/** Mirrors app/guru/[slug]/page.tsx isBookable() — AND of many fields. */
function isBookableOnProfile(row: GuruRow) {
  const bookingStatus = normalize(row.booking_status);
  const adminStatus = normalize(row.admin_status);
  const publicStatus = normalize(row.public_status);
  const qualityStatus = normalize(row.profile_quality_status);
  const applicationStatus = normalize(row.application_status);
  const status = normalize(row.status);
  const email = asString(row.email);
  const hasServiceArea = Boolean(
    (asString(row.service_city) || asString(row.city)) &&
      (asString(row.service_state) || asString(row.state)) &&
      (asString(row.zip_code) || asString(row.postal_code) || asString(row.service_zip)),
  );

  return Boolean(
    asBool(row.is_public) === true &&
      asBool(row.is_active) === true &&
      asBool(row.is_public_visible) === true &&
      asBool(row.is_bookable) === true &&
      asBool(row.is_accepting_bookings) === true &&
      asBool(row.accepting_bookings) === true &&
      bookingStatus === "bookable" &&
      adminStatus === "approved" &&
      publicStatus === "public" &&
      qualityStatus === "bookable" &&
      applicationStatus === "bookable" &&
      status === "active" &&
      Boolean(email) &&
      hasServiceArea,
  );
}

function missingProfileFields(row: GuruRow) {
  const missing: string[] = [];
  const checks: Array<[string, boolean]> = [
    ["is_public=true", asBool(row.is_public) === true],
    ["is_active=true", asBool(row.is_active) === true],
    ["is_public_visible=true", asBool(row.is_public_visible) === true],
    ["is_bookable=true", asBool(row.is_bookable) === true],
    ["is_accepting_bookings=true", asBool(row.is_accepting_bookings) === true],
    ["accepting_bookings=true", asBool(row.accepting_bookings) === true],
    ["booking_status=bookable", normalize(row.booking_status) === "bookable"],
    ["admin_status=approved", normalize(row.admin_status) === "approved"],
    ["public_status=public", normalize(row.public_status) === "public"],
    [
      "profile_quality_status=bookable",
      normalize(row.profile_quality_status) === "bookable",
    ],
    [
      "application_status=bookable",
      normalize(row.application_status) === "bookable",
    ],
    ["status=active", normalize(row.status) === "active"],
    ["email present", Boolean(asString(row.email))],
    [
      "service area (city+state+zip)",
      Boolean(
        (asString(row.service_city) || asString(row.city)) &&
          (asString(row.service_state) || asString(row.state)) &&
          (asString(row.zip_code) ||
            asString(row.postal_code) ||
            asString(row.service_zip)),
      ),
    ],
  ];

  for (const [label, ok] of checks) {
    if (!ok) missing.push(label);
  }
  return missing;
}

function searchBlockReason(row: GuruRow) {
  const bookingStatus = normalize(row.booking_status);
  if (bookingStatus === "listed_only") {
    return "booking_status=listed_only (blocks before is_bookable check)";
  }
  if (bookingStatus === "not_listed") {
    return "booking_status=not_listed (blocks before is_bookable check)";
  }
  if (asBool(row.is_bookable) === false) return "is_bookable=false";
  if (asBool(row.is_accepting_bookings) === false) {
    return "is_accepting_bookings=false";
  }
  if (asBool(row.accepting_bookings) === false) {
    return "accepting_bookings=false";
  }
  return "no positive bookable signal after filters";
}

async function fetchAll(
  admin: ReturnType<typeof createClient>,
  table: string,
  columns: string,
) {
  const pageSize = 1000;
  const rows: GuruRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
    const batch = (data || []) as GuruRow[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const columns = [
    "id",
    "user_id",
    "profile_id",
    "email",
    "display_name",
    "full_name",
    "name",
    "slug",
    "status",
    "application_status",
    "booking_status",
    "admin_status",
    "public_status",
    "profile_quality_status",
    "is_public",
    "is_public_visible",
    "is_active",
    "is_bookable",
    "is_accepting_bookings",
    "accepting_bookings",
    "is_test_account",
    "city",
    "state",
    "zip_code",
    "postal_code",
    "service_city",
    "service_state",
    "service_zip",
  ].join(",");

  let gurus: GuruRow[] = [];
  try {
    gurus = await fetchAll(admin, "gurus", columns);
  } catch (error) {
    console.error("Failed loading gurus:", error);
    process.exit(1);
  }

  // Optional: merge email from profiles when guru.email is empty
  const profileIds = Array.from(
    new Set(
      gurus
        .map((g) => asString(g.profile_id) || asString(g.user_id))
        .filter(Boolean),
    ),
  );

  const profileEmailById = new Map<string, string>();
  const profileTestById = new Map<string, boolean>();

  for (let i = 0; i < profileIds.length; i += 200) {
    const chunk = profileIds.slice(i, i + 200);
    const { data } = await admin
      .from("profiles")
      .select("id,email,is_test_account,full_name,display_name")
      .in("id", chunk);
    for (const p of data || []) {
      const id = asString((p as GuruRow).id);
      profileEmailById.set(id, asString((p as GuruRow).email));
      profileTestById.set(id, asBool((p as GuruRow).is_test_account) === true);
    }
  }

  const enriched = gurus.map((g) => {
    const pid = asString(g.profile_id) || asString(g.user_id);
    const email = asString(g.email) || profileEmailById.get(pid) || "";
    return {
      ...g,
      email,
      _profile_is_test: profileTestById.get(pid) === true,
    };
  });

  const adminBookable = enriched.filter((g) => isAdminBookable(g));
  const realAdminBookable = adminBookable.filter(
    (g) => !isTestOrDummy(g) && !(g as { _profile_is_test?: boolean })._profile_is_test,
  );

  const affectedSearch = realAdminBookable.filter((g) => !isBookableOnSearch(g));
  const affectedProfile = realAdminBookable.filter((g) => !isBookableOnProfile(g));
  // Union: shows opens-soon somewhere while admin says bookable
  const affectedEither = realAdminBookable.filter(
    (g) => !isBookableOnSearch(g) || !isBookableOnProfile(g),
  );

  const reasonCounts = new Map<string, number>();
  for (const g of affectedSearch) {
    const reason = searchBlockReason(g);
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  }

  const profileMissingCounts = new Map<string, number>();
  for (const g of affectedProfile) {
    for (const m of missingProfileFields(g)) {
      profileMissingCounts.set(m, (profileMissingCounts.get(m) || 0) + 1);
    }
  }

  const bookingStatusCounts = new Map<string, number>();
  for (const g of affectedEither) {
    const key = normalize(g.booking_status) || "(null/empty)";
    bookingStatusCounts.set(key, (bookingStatusCounts.get(key) || 0) + 1);
  }

  console.log("=== Booking Opens Soon Diagnostic ===");
  console.log(`Total gurus rows: ${gurus.length}`);
  console.log(`Admin-bookable (incl test): ${adminBookable.length}`);
  console.log(`Admin-bookable (real only): ${realAdminBookable.length}`);
  console.log(
    `Real admin-bookable but NOT bookable on SEARCH (shows Booking opens soon): ${affectedSearch.length}`,
  );
  console.log(
    `Real admin-bookable but NOT bookable on PROFILE (shows Bookings opening soon): ${affectedProfile.length}`,
  );
  console.log(
    `Real affected on either surface: ${affectedEither.length}`,
  );
  console.log("");
  console.log("--- Search block reason breakdown ---");
  for (const [reason, count] of [...reasonCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${count}\t${reason}`);
  }
  console.log("");
  console.log("--- Profile missing-field frequency (affected profile) ---");
  for (const [field, count] of [...profileMissingCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${count}\t${field}`);
  }
  console.log("");
  console.log("--- booking_status among affected ---");
  for (const [status, count] of [...bookingStatusCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${count}\t${status}`);
  }

  const examples = affectedSearch.length
    ? affectedSearch
    : affectedProfile;
  console.log("");
  console.log("--- Examples (up to 10) ---");
  for (const g of examples.slice(0, 10)) {
    console.log(
      JSON.stringify(
        {
          id: asString(g.id),
          user_id: asString(g.user_id),
          name: getName(g),
          email: getEmail(g),
          is_bookable: g.is_bookable,
          application_status: g.application_status,
          status: g.status,
          booking_status: g.booking_status,
          admin_status: g.admin_status,
          public_status: g.public_status,
          profile_quality_status: g.profile_quality_status,
          is_accepting_bookings: g.is_accepting_bookings,
          accepting_bookings: g.accepting_bookings,
          is_public: g.is_public,
          is_public_visible: g.is_public_visible,
          is_active: g.is_active,
          search_block: searchBlockReason(g),
          profile_missing: missingProfileFields(g),
        },
        null,
        2,
      ),
    );
  }

  // Machine-readable summary for the report
  console.log("");
  console.log(
    JSON.stringify({
      total_gurus: gurus.length,
      admin_bookable_real: realAdminBookable.length,
      affected_search: affectedSearch.length,
      affected_profile: affectedProfile.length,
      affected_either: affectedEither.length,
      top_search_reason: [...reasonCounts.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0] || null,
      example_ids: examples.slice(0, 3).map((g) => ({
        id: asString(g.id),
        name: getName(g),
      })),
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
