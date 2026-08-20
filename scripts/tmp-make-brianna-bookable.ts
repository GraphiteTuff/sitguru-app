/**
 * Make Brianna Martin bookable + visible on Find Care map/search.
 * Usage: npx tsx scripts/tmp-make-brianna-bookable.ts
 */
import { createClient } from "@supabase/supabase-js";

function cleanEnv(value: string | undefined) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

const url =
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL) ||
  "https://mmtjhxnzuglbyumbsjhs.supabase.co";
const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
if (!key) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
console.log("Using URL host", new URL(url).host, "key len", key.length);

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL = "bri.martin322@gmail.com";
const CITY = "Houston";
const STATE = "TX";
const ZIP = "77068";
const SERVICE_AREA = "Houston, TX, US 77068";
const LAT = 30.0062;
const LNG = -95.4879;
const now = new Date().toISOString();

const DEFAULT_SERVICES = [
  "Dog Walking",
  "Drop-In Visits",
  "Pet Sitting",
];

const DEFAULT_BIO =
  "Friendly Houston-area Pet Guru ready to care for local pets with reliable walks, drop-ins, and sitting support.";

async function softUpdate(table: string, id: string, payload: Record<string, unknown>) {
  const { error } = await sb.from(table).update(payload).eq("id", id);
  if (!error) {
    console.log(`Updated ${table}`, id, Object.keys(payload).join(","));
    return true;
  }

  // Drop unknown columns and retry key fields.
  console.warn(`${table} full update failed:`, error.message);
  const essential: Record<string, unknown> = {};
  for (const keyName of [
    "is_bookable",
    "is_public",
    "is_public_visible",
    "is_active",
    "status",
    "booking_status",
    "admin_status",
    "public_status",
    "application_status",
    "service_city",
    "service_state",
    "service_zip",
    "service_area",
    "service_latitude",
    "service_longitude",
    "city",
    "state",
    "zip_code",
    "services",
    "bio",
    "hourly_rate",
    "updated_at",
  ]) {
    if (keyName in payload) essential[keyName] = payload[keyName];
  }

  // Try one field at a time for resilience.
  for (const [k, v] of Object.entries(payload)) {
    const { error: oneErr } = await sb.from(table).update({ [k]: v }).eq("id", id);
    if (oneErr) {
      console.warn(`  skip ${table}.${k}:`, oneErr.message);
    } else {
      console.log(`  set ${table}.${k}`);
    }
  }
  return false;
}

async function main() {
  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select(
      "id,email,full_name,role,bio,about,avatar_url,service_city,service_zip,service_latitude,service_longitude,is_bookable,is_public_visible",
    )
    .ilike("email", EMAIL)
    .maybeSingle();

  if (profileErr || !profile?.id) {
    console.error("Profile not found", profileErr?.message);
    process.exit(1);
  }

  console.log("Profile", profile.id, profile.full_name, profile.role);

  const { data: gurus } = await sb
    .from("gurus")
    .select("*")
    .or(`user_id.eq.${profile.id},email.ilike.${EMAIL}`);

  if (!gurus?.length) {
    console.error("No gurus row");
    process.exit(1);
  }

  for (const guru of gurus) {
    console.log("Guru before flags", {
      id: guru.id,
      is_bookable: guru.is_bookable,
      booking_status: guru.booking_status,
      status: guru.status,
      services: guru.services,
      hourly_rate: guru.hourly_rate,
      rate: guru.rate,
      bio: String(guru.bio || "").slice(0, 40),
      lat: guru.service_latitude,
      lng: guru.service_longitude,
    });

    const existingServices = Array.isArray(guru.services)
      ? guru.services
      : Array.isArray(guru.service_types)
        ? guru.service_types
        : Array.isArray(guru.services_offered)
          ? guru.services_offered
          : [];

    const services =
      existingServices.length > 0 ? existingServices : DEFAULT_SERVICES;

    const bio =
      String(guru.bio || guru.about || profile.bio || profile.about || "").trim() ||
      DEFAULT_BIO;

    const hourlyRate =
      Number(guru.hourly_rate || guru.rate || guru.base_rate || guru.dog_walking_rate) ||
      25;

    const guruPayload: Record<string, unknown> = {
      status: "active",
      application_status: "bookable",
      approval_status: "approved",
      admin_status: "approved",
      public_status: "public",
      profile_quality_status: "bookable",
      booking_status: "bookable",
      is_bookable: true,
      is_public: true,
      is_public_visible: true,
      is_active: true,
      is_accepting_bookings: true,
      accepting_bookings: true,
      has_availability: true,
      availability_enabled: true,
      approved: true,
      admin_approved: true,
      is_approved: true,
      bookable_at: now,
      approved_at: now,
      city: CITY,
      state: STATE,
      zip_code: ZIP,
      service_city: CITY,
      service_state: STATE,
      service_zip: ZIP,
      service_zip_code: ZIP,
      service_area: SERVICE_AREA,
      service_latitude: LAT,
      service_longitude: LNG,
      map_latitude: LAT,
      map_longitude: LNG,
      latitude: LAT,
      longitude: LNG,
      lat: LAT,
      lng: LNG,
      services,
      service_types: services,
      services_offered: services,
      bio,
      about: bio,
      hourly_rate: hourlyRate,
      rate: hourlyRate,
      base_rate: hourlyRate,
      dog_walking_rate: hourlyRate,
      drop_in_rate: hourlyRate,
      rates: {
        dog_walking: hourlyRate,
        drop_in: hourlyRate,
        pet_sitting: hourlyRate,
      },
      updated_at: now,
    };

    await softUpdate("gurus", guru.id, guruPayload);
  }

  await softUpdate("profiles", profile.id, {
    role: "guru",
    is_bookable: true,
    is_public: true,
    is_public_visible: true,
    is_active: true,
    admin_status: "approved",
    approval_status: "bookable",
    city: CITY,
    state: STATE,
    zip_code: ZIP,
    service_city: CITY,
    service_state: STATE,
    service_zip: ZIP,
    service_zip_code: ZIP,
    service_area: SERVICE_AREA,
    service_latitude: LAT,
    service_longitude: LNG,
    bio: String(profile.bio || "").trim() || DEFAULT_BIO,
    updated_at: now,
  });

  const { data: verifyGuru } = await sb
    .from("gurus")
    .select(
      "id,full_name,email,is_bookable,is_public_visible,booking_status,status,admin_status,public_status,services,hourly_rate,bio,service_city,service_zip,service_latitude,service_longitude",
    )
    .eq("user_id", profile.id)
    .maybeSingle();

  console.log("VERIFY", JSON.stringify(verifyGuru, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
