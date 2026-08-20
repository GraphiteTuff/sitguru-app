import { createClient } from "@supabase/supabase-js";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
  "https://mmtjhxnzuglbyumbsjhs.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL = "bri.martin322@gmail.com";

async function main() {
  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .ilike("email", EMAIL)
    .maybeSingle();

  console.log("PROFILE keys sample:", profile ? Object.keys(profile).sort() : null);
  console.log(
    "PROFILE core:",
    profile && {
      id: profile.id,
      role: profile.role,
      admin_status: profile.admin_status,
      bio: (profile.bio || profile.about || "").slice?.(0, 80) || profile.bio,
      avatar_url: profile.avatar_url || profile.profile_photo_url,
      service_city: profile.service_city,
      service_zip: profile.service_zip,
      service_latitude: profile.service_latitude,
      service_longitude: profile.service_longitude,
    },
  );

  const { data: gurus } = await sb
    .from("gurus")
    .select("*")
    .or(`user_id.eq.${profile?.id},email.ilike.${EMAIL}`);

  for (const g of gurus || []) {
    console.log("GURU id", g.id);
    console.log(
      "GURU flags:",
      JSON.stringify(
        {
          status: g.status,
          admin_status: g.admin_status,
          application_status: g.application_status,
          approval_status: g.approval_status,
          admin_approved: g.admin_approved,
          is_approved: g.is_approved,
          approved: g.approved,
          is_bookable: g.is_bookable,
          booking_status: g.booking_status,
          is_public_visible: g.is_public_visible,
          public_visible: g.public_visible,
          is_listed: g.is_listed,
          accepting_bookings: g.accepting_bookings,
          is_accepting_bookings: g.is_accepting_bookings,
          has_availability: g.has_availability,
          availability_enabled: g.availability_enabled,
          availability: g.availability,
          services: g.services,
          service_types: g.service_types,
          services_offered: g.services_offered,
          hourly_rate: g.hourly_rate,
          rate: g.rate,
          rates: g.rates,
          price: g.price,
          base_rate: g.base_rate,
          dog_walking_rate: g.dog_walking_rate,
          bio: String(g.bio || g.about || "").slice(0, 100),
          avatar_url: g.avatar_url || g.profile_photo_url || g.photo_url,
          service_latitude: g.service_latitude,
          service_longitude: g.service_longitude,
          service_city: g.service_city,
          service_zip: g.service_zip,
          city: g.city,
          zip_code: g.zip_code,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
